import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import QRCode from 'qrcode'
import {
    ArrowLeft, Check, CheckCircle2, Download, Loader2, MessageCircle,
    ShieldCheck, X,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { StatusChip } from '@/components/StatusChip'
import { AudioRecorder } from '@/components/AudioRecorder'
import { FingerprintCapture, type CapturedSignature } from '@/components/FingerprintCapture'
import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS } from '@/lib/types'
import { generateAttestationPdf } from '@/lib/attestationPdf'
import { useAuth } from '@/auth/AuthProvider'
import logo from '@/assets/logo.svg'
import { cn } from '@/lib/cn'

type Dossier = {
    id: string
    statut: 'brouillon' | 'atteste_cq' | 'valide_mairie'
    vendeur_nom: string; vendeur_cip: string
    acheteur_nom: string; acheteur_cip: string; acheteur_nationalite: string
    departement: string | null; commune: string | null
    arrondissement: string | null; quartier: string | null
    superficie_m2: number | null
    zone: 'urbaine' | 'rurale' | null
    origine_droit: string | null
    voisin_nord: string | null; voisin_sud: string | null
    voisin_est: string | null; voisin_ouest: string | null
    created_at: string
}

const DEMO_OTP = '040305'

type FlowStep = 'review' | 'capture' | 'confirmed'

export default function DossierReview() {
    const { id } = useParams<{ id: string }>()
    const { chef } = useAuth()

    const [dossier, setDossier] = useState<Dossier | null>(null)
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [flowStep, setFlowStep] = useState<FlowStep>('review')

    // OTP modal
    const [modalOpen, setModalOpen] = useState(false)
    const [otp, setOtp] = useState('')
    const [otpError, setOtpError] = useState('')
    const [confirming, setConfirming] = useState(false)

    // Capture step
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [signature, setSignature] = useState<CapturedSignature | null>(null)
    const [submitting, setSubmitting] = useState(false)

    // Attestation
    const [qrDataUrl, setQrDataUrl] = useState('')
    const [attestationNum, setAttestationNum] = useState('')
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
    const [pdfFilename, setPdfFilename] = useState('')
    const [pdfPublicUrl, setPdfPublicUrl] = useState('')
    const [generatingPdf, setGeneratingPdf] = useState(false)

    useEffect(() => {
        if (!id) return
        supabase.from('dossiers').select('*').eq('id', id).single()
            .then(({ data, error }) => {
                if (error || !data) { setFetchError(error?.message ?? 'Dossier introuvable.'); setLoading(false); return }
                const d = data as Dossier
                setDossier(d)
                if (d.statut === 'atteste_cq') {
                    buildAttestation(d) // ← FIX: pass Dossier, not string
                }
                setLoading(false)
            })
    }, [id])

    const buildAttestation = async (d: Dossier) => {
        const num = `ATT-CQ-${d.id.slice(0, 8).toUpperCase()}`
        const link = `${window.location.origin}/verifier/${d.id}`

        setAttestationNum(num)
        setFlowStep('confirmed') // ← FIX: was setConfirmed(true) which doesn't exist
        setGeneratingPdf(true)

        // QR for the screen (non-blocking)
        QRCode.toDataURL(link, { width: 220, margin: 1 })
            .then(setQrDataUrl)
            .catch(() => { })

        // PDF generation
        try {
            const { blob, sha256, filename } = await generateAttestationPdf({
                dossier: d as unknown as import('@/lib/types').Dossier,
                attestationNum: num,
                cqSignerLabel: chef?.email ?? chef?.phone,
                verifyUrl: link,
            })
            setPdfBlob(blob)
            setPdfFilename(filename)

            const path = `${d.id}/${filename}`
            const { error: upErr } = await supabase.storage
                .from(STORAGE_BUCKETS.PROVISOIRES)
                .upload(path, blob, { contentType: 'application/pdf', upsert: true })

            if (!upErr) {
                const { data: pub } = supabase.storage
                    .from(STORAGE_BUCKETS.PROVISOIRES)
                    .getPublicUrl(path)
                setPdfPublicUrl(pub.publicUrl)

                await supabase.from('documents').upsert({
                    dossier_id: d.id,
                    type: 'attestation_provisoire',
                    storage_bucket: STORAGE_BUCKETS.PROVISOIRES,
                    storage_path: path,
                    sha256,
                    pdf_sha256: sha256,
                    ots_status: 'pending',
                    qr_code_url: link,
                }, { onConflict: 'dossier_id,type' })
            } else {
                console.warn('[Gandehou] Upload PDF échoué — téléchargement local seul.', upErr.message)
            }
        } catch (e) {
            console.error('[Gandehou] Génération PDF échouée', e)
        } finally {
            setGeneratingPdf(false)
        }
    }

    const handleDownload = () => {
        if (!pdfBlob) return
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = pdfFilename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    const handleWhatsApp = async () => {
        if (!dossier) return
        const shareLink = `${window.location.origin}/verifier/${dossier.id}`
        const introTxt = `Bonjour, voici l'attestation de voisinage Gandehou pour le dossier ${attestationNum}.`

        // Native file share on mobile
        if (pdfBlob && typeof navigator !== 'undefined' && 'canShare' in navigator) {
            const file = new File([pdfBlob], pdfFilename, { type: 'application/pdf' })
            const shareData = { files: [file], title: attestationNum, text: introTxt }
            if ((navigator as any).canShare?.(shareData)) {
                try {
                    await (navigator as unknown as { share: (d: unknown) => Promise<void> }).share(shareData)
                    return
                } catch { /* user cancelled — fall through to wa.me */ }
            }
        }

        // Fallback: wa.me with download link
        const downloadPart = pdfPublicUrl ? `\nTélécharger le PDF : ${pdfPublicUrl}` : ''
        const waMsg = `${introTxt}${downloadPart}\nVérifier en ligne : ${shareLink}`
        window.open(`https://wa.me/?text=${encodeURIComponent(waMsg)}`, '_blank', 'noopener,noreferrer')
    }

    const handleOtpConfirm = async () => {
        if (otp.length < 6) return setOtpError('Entrez le code à 6 chiffres.')
        if (otp !== DEMO_OTP) { setOtpError('Code incorrect. (démo : 040305)'); setOtp(''); return }
        setOtpError('')
        setConfirming(true)

        const { error } = await supabase.from('dossiers').update({ statut: 'atteste_cq' }).eq('id', id!)
        if (error) { setOtpError(error.message); setConfirming(false); return }

        setModalOpen(false)
        setConfirming(false)
        setFlowStep('capture') // → audio + fingerprint step
    }

    useEffect(() => {
        if (otp.length === 6 && modalOpen) handleOtpConfirm()
    }, [otp])

    const handleFinalSubmit = async () => {
        if (!dossier) return
        setSubmitting(true)
        // TODO(api): replace with createDocumentBundle from @/services
        await buildAttestation({ ...dossier, statut: 'atteste_cq' }) // ← FIX: pass Dossier, not string
        setSubmitting(false)
    }

    if (loading) return <FullPageLoader />
    if (fetchError || !dossier) return <FullPageError msg={fetchError} />

    // ── Attestation share screen ─────────────────────────────────────
    if (flowStep === 'confirmed') {
        return (
            <div className="min-h-screen bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
                <PageHeader backTo="/cq/dashboard" />
                <main className="mx-auto max-w-sm px-6 pb-20 pt-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gandehou-green/15">
                        <CheckCircle2 className="h-8 w-8 text-gandehou-green" />
                    </div>
                    <h1 className="mt-5 text-2xl font-semibold">Attestation émise</h1>
                    <p className="mt-2 text-sm text-neutral-900/60 dark:text-white/60">
                        Le bon voisinage a été confirmé{audioBlob ? ", l'audio de consentement enregistré" : ''}{signature ? ' et la signature biométrique capturée' : ''}.
                    </p>

                    <div className="mt-8 rounded-2xl border border-gandehou-green/30 bg-gandehou-green/10 p-6">
                        <div className="flex items-center justify-center gap-2 text-sm font-medium text-gandehou-green">
                            <ShieldCheck className="h-4 w-4" />{attestationNum}
                        </div>
                        <StatusChip status="atteste_cq" className="mx-auto mt-3" />

                        {/* PDF generation loading state */}
                        {generatingPdf && (
                            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-neutral-900/60 dark:text-white/60">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Génération du PDF…
                            </div>
                        )}

                        {qrDataUrl && !generatingPdf ? (
                            <img src={qrDataUrl} alt="QR code" className="mx-auto mt-5 h-[140px] w-[140px] rounded-xl" />
                        ) : !generatingPdf ? (
                            <div className="mx-auto mt-5 flex h-[140px] w-[140px] items-center justify-center rounded-xl bg-black/5 text-xs dark:bg-white/5">QR indisponible</div>
                        ) : null}

                        <p className="mt-3 text-xs text-neutral-900/50 dark:text-white/50">
                            Document provisoire — sans valeur de titre de propriété.
                        </p>
                    </div>

                    {/* ← FIX: use handleWhatsApp (native share + fallback) instead of hardcoded wa.me */}
                    <button
                        type="button"
                        onClick={handleWhatsApp}
                        disabled={generatingPdf}
                        className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gandehou-green px-6 py-4 text-lg font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40 disabled:opacity-60"
                    >
                        <MessageCircle className="h-6 w-6" />
                        Envoyer par WhatsApp
                    </button>

                    {/* ← FIX: download button was missing despite handleDownload being defined */}
                    {pdfBlob && (
                        <button
                            type="button"
                            onClick={handleDownload}
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 px-6 py-3 font-medium outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:border-white/10 dark:hover:bg-white/10"
                        >
                            <Download className="h-5 w-5" />
                            Télécharger le PDF
                        </button>
                    )}

                    <Link to="/cq/dashboard" className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-black/10 px-6 py-3 font-medium outline-none transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
                        Retour au tableau de bord
                    </Link>
                </main>
            </div>
        )
    }

    // ── Capture step (audio + fingerprint) ───────────────────────────
    if (flowStep === 'capture') {
        return (
            <div className="min-h-screen bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
                <PageHeader backTo="/cq/dashboard" />
                <main className="mx-auto w-full max-w-lg px-4 pb-20 pt-8">
                    <h1 className="mb-2 text-center text-2xl font-semibold">Enregistrement & signature</h1>
                    <p className="mx-auto mb-8 max-w-sm text-center text-sm text-neutral-900/60 dark:text-white/60">
                        Enregistrez le consentement vocal et capturez l'empreinte biométrique avant de sceller l'attestation.
                    </p>
                    <div className="space-y-5">
                        <AudioRecorder onRecorded={setAudioBlob} />
                        <FingerprintCapture signataireNom={dossier.vendeur_nom} onCaptured={setSignature} />
                    </div>
                    <div className="mt-8 flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={handleFinalSubmit}
                            disabled={submitting}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gandehou-green py-4 text-lg font-semibold text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40 disabled:opacity-60"
                        >
                            {submitting ? <><Loader2 className="h-5 w-5 animate-spin" />Scellement en cours…</> : <><ShieldCheck className="h-5 w-5" />Sceller l'attestation</>}
                        </button>
                        {!audioBlob && !signature && (
                            <p className="text-center text-xs text-neutral-900/40 dark:text-white/40">
                                Audio et empreinte sont recommandés mais pas obligatoires.
                            </p>
                        )}
                    </div>
                </main>
            </div>
        )
    }

    // ── Parcelle review screen ───────────────────────────────────────
    const loc = [dossier.quartier, dossier.arrondissement, dossier.commune, dossier.departement].filter(Boolean).join(' · ')

    return (
        <div className="min-h-screen bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
            <PageHeader backTo="/cq/dashboard" />
            <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-2">
                <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-xs text-neutral-900/40 dark:text-white/40">{dossier.id.slice(0, 8).toUpperCase()}</span>
                    <StatusChip status="brouillon" />
                </div>
                <div className="space-y-4">
                    <Section title="Vendeur">
                        <Row label="Noms et prénoms" value={dossier.vendeur_nom} />
                        <Row label="CIP / Passeport" value={dossier.vendeur_cip} />
                    </Section>
                    <Section title="Acheteur">
                        <Row label="Noms et prénoms" value={dossier.acheteur_nom} />
                        <Row label="Nationalité" value={dossier.acheteur_nationalite} />
                        <Row label="CIP / Passeport" value={dossier.acheteur_cip} />
                    </Section>
                    <Section title="Parcelle">
                        {loc && <Row label="Localisation" value={loc} />}
                        {dossier.superficie_m2 && <Row label="Superficie" value={`${dossier.superficie_m2.toLocaleString('fr-FR')} m²`} />}
                        {dossier.zone && <Row label="Zone" value={dossier.zone} className="capitalize" />}
                        {dossier.origine_droit && <Row label="Origine du droit" value={dossier.origine_droit.replace(/_/g, ' ')} />}
                    </Section>
                    <Section title="Voisinage déclaré" accent>
                        <div className="grid grid-cols-2 gap-3">
                            {[{ dir: 'Nord', val: dossier.voisin_nord }, { dir: 'Sud', val: dossier.voisin_sud }, { dir: 'Est', val: dossier.voisin_est }, { dir: 'Ouest', val: dossier.voisin_ouest }].map(({ dir, val }) => (
                                <div key={dir} className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="text-xs font-medium text-neutral-900/50 dark:text-white/50">{dir}</p>
                                    <p className="mt-0.5 text-sm font-medium">{val ?? '—'}</p>
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>

                {/* Fixed bottom CTA */}
                <div className="fixed bottom-0 left-0 right-0 border-t border-black/10 bg-gandehou-paper px-4 py-4 dark:border-white/10 dark:bg-neutral-950">
                    <div className="mx-auto max-w-xl">
                        <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
                            <Dialog.Trigger asChild>
                                <button type="button" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gandehou-green py-4 text-lg font-semibold text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40">
                                    <Check className="h-5 w-5" />Confirmer le bon voisinage
                                </button>
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                                <Dialog.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-gandehou-paper px-6 pb-10 pt-6 shadow-xl outline-none dark:bg-neutral-900 sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
                                    <div className="mb-1 flex items-start justify-between">
                                        <Dialog.Title className="text-xl font-semibold">Signature OTP</Dialog.Title>
                                        <Dialog.Close asChild>
                                            <button type="button" aria-label="Fermer" className="rounded-lg p-1 text-neutral-900/50 outline-none hover:text-neutral-900 dark:text-white/50 dark:hover:text-white"><X className="h-5 w-5" /></button>
                                        </Dialog.Close>
                                    </div>
                                    <Dialog.Description className="mb-6 text-sm text-neutral-900/60 dark:text-white/60">
                                        Code à 6 chiffres envoyé par SMS (MTN / Moov).
                                        <span className="ml-1 font-medium text-gandehou-green">(Démo : 040305)</span>
                                    </Dialog.Description>
                                    <OTPInput value={otp} onChange={(v) => { setOtp(v); if (otpError) setOtpError('') }} />
                                    {otpError && <p role="alert" className="mt-4 text-center text-sm text-gandehou-red">{otpError}</p>}
                                    {confirming && <div className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-900/60 dark:text-white/60"><Loader2 className="h-4 w-4 animate-spin" />Enregistrement…</div>}
                                    <button type="button" onClick={handleOtpConfirm} disabled={otp.length < 6 || confirming}
                                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gandehou-green py-3 font-semibold text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40 disabled:opacity-50">
                                        {confirming ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}Valider
                                    </button>
                                    <p className="mt-4 text-center text-xs text-neutral-900/45 dark:text-white/45">
                                        Votre signature confirme les noms de voisinage. L'attestation est provisoire.
                                    </p>
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                    </div>
                </div>
            </main>
        </div>
    )
}

/* ── Shared sub-components ──────────────────────────────────────────── */
function PageHeader({ backTo }: { backTo: string }) {
    return (
        <header className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
            <Link to="/" aria-label="Gandehou — Accueil"><img src={logo} alt="Gandehou" className="h-8 w-auto" /></Link>
            <div className="flex items-center gap-3">
                <Link to={backTo} className="flex items-center gap-2 text-sm font-medium text-neutral-900/60 outline-none transition-colors hover:text-neutral-900 dark:text-white/60 dark:hover:text-white"><ArrowLeft className="h-4 w-4" />Retour</Link>
                <ThemeToggle />
            </div>
        </header>
    )
}
function FullPageLoader() {
    return <div className="flex min-h-screen items-center justify-center bg-gandehou-paper dark:bg-neutral-950"><Loader2 className="h-8 w-8 animate-spin text-gandehou-green" /></div>
}
function FullPageError({ msg }: { msg: string }) {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gandehou-paper px-6 text-center dark:bg-neutral-950"><p className="text-gandehou-red">{msg || 'Introuvable.'}</p><Link to="/cq/dashboard" className="text-sm text-gandehou-green underline">Retour</Link></div>
}
function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
    return (
        <div className={cn('rounded-2xl border p-4', accent ? 'border-gandehou-yellow/40 bg-gandehou-yellow/10 dark:bg-gandehou-yellow/5' : 'border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.03]')}>
            <p className={cn('mb-3 text-xs font-semibold uppercase tracking-wider', accent ? 'text-amber-700 dark:text-gandehou-yellow' : 'text-neutral-900/50 dark:text-white/50')}>{title}</p>
            <div className="space-y-2">{children}</div>
        </div>
    )
}
function Row({ label, value, className }: { label: string; value: string; className?: string }) {
    return <div className="flex items-start justify-between gap-4 text-sm"><span className="shrink-0 text-neutral-900/55 dark:text-white/55">{label}</span><span className={cn('text-right font-medium', className)}>{value}</span></div>
}
function OTPInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const inputs = useRef<Array<HTMLInputElement | null>>([])
    useEffect(() => { inputs.current[0]?.focus() }, [])
    const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value; if (!/^\d*$/.test(v)) return
        const arr = value.split(''); arr[i] = v.slice(-1); onChange(arr.join('').slice(0, 6))
        if (v && i < 5) inputs.current[i + 1]?.focus()
    }
    const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Backspace' && !value[i] && i > 0) inputs.current[i - 1]?.focus() }
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => { e.preventDefault(); const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); onChange(p); inputs.current[Math.min(p.length, 5)]?.focus() }
    return (
        <div className="flex items-center justify-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <input key={i} ref={(el) => { inputs.current[i] = el }} type="text" inputMode="numeric" maxLength={1} value={value[i] ?? ''}
                    onChange={(e) => handleChange(i, e)} onKeyDown={(e) => handleKey(i, e)} onPaste={i === 0 ? handlePaste : undefined} aria-label={`Chiffre ${i + 1}`}
                    className="h-14 w-11 rounded-xl border border-black/10 bg-white text-center text-xl font-bold text-black outline-none transition focus:border-gandehou-green focus:ring-4 focus:ring-gandehou-green/20 dark:border-white/15 dark:bg-white/5 dark:text-white" />
            ))}
        </div>
    )
}