/**
 * DossierReview — /cq/dossier/:id
 *
 * Le CQ visualise le dossier soumis par le citoyen, puis clique sur
 * "Attester le dossier" pour :
 *   - passer le statut → 'atteste_cq'
 *   - generer le PDF officiel (attestation de comparution + QR + metadata)
 *   - l'uploader sur Supabase Storage
 *   - insererer une ligne 'documents' (ots_status pending)
 *
 * Pas d'OTP. La signature du CQ est materialisee cote PDF (metadata
 * SignatureCQ dans les Keywords) — l'identite du CQ vient de la session
 * authentifiee.
 */

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import {
    ArrowLeft, CheckCircle2, Download, Loader2, MessageCircle,
    ShieldCheck,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { StatusChip } from '@/components/StatusChip'
import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS } from '@/lib/types'
import { generateAttestationPdf } from '@/lib/attestationPdf'
import { anchorDocument } from '@/services/anchor'
import { combinedHashCascade } from '@gandehou/ledger'
import { useAuth } from '@/auth/AuthProvider'
import logo from '@/public/logo.svg'
import { cn } from '@/lib/cn'

type Dossier = {
    id: string
    statut: 'brouillon' | 'soumis' | 'atteste_cq' | 'valide_mairie' | 'litige'
    vendeur_nom: string
    vendeur_id_type: 'cip' | 'passeport' | null
    vendeur_id_value: string | null
    vendeur_phone: string | null
    // Captures citoyen · copiees dans documents a l'attestation
    vendeur_audio_path: string | null; vendeur_audio_sha256: string | null
    vendeur_pubkey_hash: string | null; vendeur_credential_id: string | null; vendeur_signataire_nom: string | null
    vendeur_piece_id_path: string | null; vendeur_piece_id_sha256: string | null
    acheteur_nom: string
    acheteur_id_type: 'cip' | 'passeport' | null
    acheteur_id_value: string | null
    acheteur_phone: string | null
    acheteur_nationalite: string | null
    acheteur_audio_path: string | null; acheteur_audio_sha256: string | null
    acheteur_pubkey_hash: string | null; acheteur_credential_id: string | null; acheteur_signataire_nom: string | null
    acheteur_piece_id_path: string | null; acheteur_piece_id_sha256: string | null
    departement: string | null; commune: string | null
    arrondissement: string | null; quartier: string | null
    superficie_m2: number | null
    zone: 'urbaine' | 'rurale' | null
    origine_droit: string | null
    origine_reference: string | null
    voisin_nord: string | null; voisin_sud: string | null
    voisin_est: string | null; voisin_ouest: string | null
    created_at: string
}

type FlowStep = 'review' | 'confirmed'

export default function DossierReview() {
    const { id } = useParams<{ id: string }>()
    const { chef } = useAuth()

    const [dossier, setDossier] = useState<Dossier | null>(null)
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState('')
    const [flowStep, setFlowStep] = useState<FlowStep>('review')

    const [attesting, setAttesting] = useState(false)
    const [attestError, setAttestError] = useState('')

    // URLs pour l'affichage des captures citoyen (photos pieces + audios)
    const [vendeurPieceUrl, setVendeurPieceUrl] = useState('')
    const [acheteurPieceUrl, setAcheteurPieceUrl] = useState('')
    const [vendeurAudioUrl, setVendeurAudioUrl] = useState('')
    const [acheteurAudioUrl, setAcheteurAudioUrl] = useState('')
    const [planTerrainUrl, setPlanTerrainUrl] = useState('')
    // Blob URL du PDF · cree UNE FOIS quand le blob est dispo, revoke a l'unmount.
    // Sans ce useEffect, l'iframe se rechargeait a chaque re-render.
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState('')

    // Attestation state (post-signature)
    const [qrDataUrl, setQrDataUrl] = useState('')
    const [attestationNum, setAttestationNum] = useState('')
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
    const [pdfFilename, setPdfFilename] = useState('')
    const [pdfPublicUrl, setPdfPublicUrl] = useState('')
    const [generatingPdf, setGeneratingPdf] = useState(false)
    // Ancrage OTS · silencieux en arriere-plan, on n'affiche plus rien a l'ecran
    const [, setAnchorHash] = useState('')

    useEffect(() => {
        if (!id) return
        supabase.from('dossiers').select('*').eq('id', id).single()
            .then(({ data, error }) => {
                if (error || !data) {
                    setFetchError(error?.message ?? 'Dossier introuvable.')
                    setLoading(false); return
                }
                const d = data as Dossier
                setDossier(d)
                loadCaptureUrls(d)
                if (d.statut === 'atteste_cq') buildAttestation(d)
                setLoading(false)
            })
    }, [id])

    // Cree la Blob URL une fois quand le PDF est pret, la revoke a l'unmount.
    useEffect(() => {
        if (!pdfBlob) return
        const url = URL.createObjectURL(pdfBlob)
        setPdfPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [pdfBlob])

    // Recupere les URLs signees (bucket prive) et publiques pour affichage
    const loadCaptureUrls = async (d: Dossier) => {
        const dAny = d as unknown as {
            vendeur_piece_id_path?: string | null
            acheteur_piece_id_path?: string | null
            vendeur_audio_path?: string | null
            acheteur_audio_path?: string | null
        }
        if (dAny.vendeur_piece_id_path) {
            const { data } = await supabase.storage
                .from('pieces-identite')
                .createSignedUrl(dAny.vendeur_piece_id_path, 300)
            if (data?.signedUrl) setVendeurPieceUrl(data.signedUrl)
        }
        if ((dAny as { plan_terrain_path?: string | null }).plan_terrain_path) {
            const { data } = await supabase.storage
                .from('pieces-identite')
                .createSignedUrl((dAny as { plan_terrain_path: string }).plan_terrain_path, 300)
            if (data?.signedUrl) setPlanTerrainUrl(data.signedUrl)
        }
        if (dAny.acheteur_piece_id_path) {
            const { data } = await supabase.storage
                .from('pieces-identite')
                .createSignedUrl(dAny.acheteur_piece_id_path, 300)
            if (data?.signedUrl) setAcheteurPieceUrl(data.signedUrl)
        }
        if (dAny.vendeur_audio_path) {
            const { data } = supabase.storage
                .from('documents-audio')
                .getPublicUrl(dAny.vendeur_audio_path)
            setVendeurAudioUrl(data.publicUrl)
        }
        if (dAny.acheteur_audio_path) {
            const { data } = supabase.storage
                .from('documents-audio')
                .getPublicUrl(dAny.acheteur_audio_path)
            setAcheteurAudioUrl(data.publicUrl)
        }
    }

    // Charge le profil du CQ (pour le libelle signataire dans le PDF)
    const [cqProfile, setCqProfile] = useState<{ full_name: string | null; email: string | null } | null>(null)
    useEffect(() => {
        if (!chef?.id) return
        supabase.from('profiles').select('full_name,email').eq('id', chef.id).maybeSingle()
            .then(({ data }) => setCqProfile(data as any ?? null))
    }, [chef?.id])

    const buildAttestation = async (d: Dossier) => {
        const num = `ATT-CQ-${d.id.slice(0, 8).toUpperCase()}`
        const link = `${window.location.origin}/verifier/${d.id}`

        setAttestationNum(num)
        setFlowStep('confirmed')
        setGeneratingPdf(true)

        QRCode.toDataURL(link, { width: 220, margin: 1 })
            .then(setQrDataUrl)
            .catch(() => { /* non-bloquant */ })

        try {
            const { blob, sha256, filename } = await generateAttestationPdf({
                dossier: d as unknown as import('@/lib/types').Dossier,
                attestationNum: num,
                cqSignerLabel: cqProfile?.full_name ?? cqProfile?.email ?? chef?.email ?? chef?.phone,
                cqSignerId: chef?.id,
                verifyUrl: link,
            })
            // Affichage instantane : blob pret → iframe visible immediatement.
            setPdfBlob(blob)
            setPdfFilename(filename)
            setGeneratingPdf(false)

            // Fire-and-forget : upload Storage + upsert documents + ancrage en
            // arriere-plan. L'utilisateur voit deja son PDF pendant ce temps.
            const path = `${d.id}/${filename}`
            ;(async () => {
                try {
                    const { error: upErr } = await supabase.storage
                        .from(STORAGE_BUCKETS.PROVISOIRES)
                        .upload(path, blob, { contentType: 'application/pdf', upsert: true })
                    if (upErr) return console.warn('[Gandehou] Upload PDF echoue', upErr.message)

                    const { data: pub } = supabase.storage
                        .from(STORAGE_BUCKETS.PROVISOIRES)
                        .getPublicUrl(path)
                    setPdfPublicUrl(pub.publicUrl)

                    const combinedSha256 = await combinedHashCascade({
                        pdf: sha256,
                        vendeurAudio: d.vendeur_audio_sha256,
                        vendeurSig: d.vendeur_pubkey_hash,
                        acheteurAudio: d.acheteur_audio_sha256,
                        acheteurSig: d.acheteur_pubkey_hash,
                    })

                    const { data: docRow, error: docErr } = await supabase
                        .from('documents')
                        .upsert({
                            dossier_id: d.id,
                            type: 'attestation_provisoire',
                            storage_bucket: STORAGE_BUCKETS.PROVISOIRES,
                            storage_path: path,
                            sha256: combinedSha256,
                            pdf_sha256: sha256,
                            ots_status: 'pending',
                            qr_code_url: link,
                            vendeur_audio_path: d.vendeur_audio_path,
                            vendeur_audio_sha256: d.vendeur_audio_sha256,
                            vendeur_pubkey_hash: d.vendeur_pubkey_hash,
                            vendeur_credential_id: d.vendeur_credential_id,
                            vendeur_signataire_nom: d.vendeur_signataire_nom,
                            acheteur_audio_path: d.acheteur_audio_path,
                            acheteur_audio_sha256: d.acheteur_audio_sha256,
                            acheteur_pubkey_hash: d.acheteur_pubkey_hash,
                            acheteur_credential_id: d.acheteur_credential_id,
                            acheteur_signataire_nom: d.acheteur_signataire_nom,
                        }, { onConflict: 'dossier_id,type' })
                        .select('id')
                        .single()

                    if (!docErr && docRow?.id) {
                        try {
                            const result = await anchorDocument(docRow.id)
                            if (result.ok && 'hash' in result) setAnchorHash(result.hash)
                        } catch { /* ancrage silencieux · retentable via dashboard */ }
                    }
                } catch (e) {
                    console.warn('[Gandehou] Persistance en arriere-plan echouee', e)
                }
            })()
        } catch (e) {
            console.error('[Gandehou] Generation PDF echouee', e)
            setGeneratingPdf(false)
        }
    }

    const handleAttester = async () => {
        if (!dossier) return
        setAttesting(true)
        setAttestError('')
        const { error } = await supabase
            .from('dossiers')
            .update({ statut: 'atteste_cq' })
            .eq('id', dossier.id)
        if (error) {
            setAttestError(error.message)
            setAttesting(false)
            return
        }
        await buildAttestation({ ...dossier, statut: 'atteste_cq' })
        setAttesting(false)
    }

    // Suspendre : renvoie le dossier au citoyen pour correction (statut='brouillon')
    const handleSuspendre = async () => {
        if (!dossier) return
        if (!confirm('Suspendre ce dossier ? Le citoyen devra le corriger avant de le resoumettre.')) return
        setAttesting(true); setAttestError('')
        const { error } = await supabase.from('dossiers').update({ statut: 'brouillon' }).eq('id', dossier.id)
        setAttesting(false)
        if (error) return setAttestError(error.message)
        window.location.href = '/cq/dashboard'
    }

    // Rejeter : marque le dossier en litige (definitif)
    const handleRejeter = async () => {
        if (!dossier) return
        if (!confirm('Rejeter definitivement ce dossier ? Cette action ne pourra pas etre annulee.')) return
        setAttesting(true); setAttestError('')
        const { error } = await supabase.from('dossiers').update({ statut: 'litige' }).eq('id', dossier.id)
        setAttesting(false)
        if (error) return setAttestError(error.message)
        window.location.href = '/cq/dashboard'
    }

    const handleDownload = () => {
        if (!pdfBlob) return
        const url = URL.createObjectURL(pdfBlob)
        const a = document.createElement('a')
        a.href = url; a.download = pdfFilename
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    const handleWhatsApp = async () => {
        if (!dossier) return
        const shareLink = `${window.location.origin}/verifier/${dossier.id}`
        const introTxt = `Bonjour, voici l'attestation de voisinage Gandehou pour le dossier ${attestationNum}.`

        if (pdfBlob && typeof navigator !== 'undefined' && 'canShare' in navigator) {
            const file = new File([pdfBlob], pdfFilename, { type: 'application/pdf' })
            const shareData = { files: [file], title: attestationNum, text: introTxt }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((navigator as any).canShare?.(shareData)) {
                try {
                    await (navigator as unknown as { share: (d: unknown) => Promise<void> }).share(shareData)
                    return
                } catch { /* annule par utilisateur */ }
            }
        }

        const downloadPart = pdfPublicUrl ? `\nTelecharger : ${pdfPublicUrl}` : ''
        const waMsg = `${introTxt}${downloadPart}\nVerifier en ligne : ${shareLink}`
        // WA_TARGET : numéro de démo. Format international sans '+' ni espaces.
        const WA_TARGET = '2290147799236'
        window.open(`https://wa.me/${WA_TARGET}?text=${encodeURIComponent(waMsg)}`, '_blank', 'noopener,noreferrer')
    }

    if (loading) return <FullPageLoader />
    if (fetchError || !dossier) return <FullPageError msg={fetchError} />

    // ── Ecran d'attestation emise ────────────────────────────────────
    if (flowStep === 'confirmed') {
        return (
            <div className="min-h-screen bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
                <PageHeader backTo="/cq/dashboard" />
                <main className="mx-auto max-w-2xl px-4 pb-20 pt-8">
                    <div className="text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gandehou-green/15">
                            <CheckCircle2 className="h-8 w-8 text-gandehou-green" />
                        </div>
                        <h1 className="mt-5 text-2xl font-semibold">Attestation émise</h1>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-gandehou-green/10 px-4 py-1.5 text-sm font-medium text-gandehou-green">
                            <ShieldCheck className="h-4 w-4" />{attestationNum}
                        </div>
                    </div>

                    {/* Apercu PDF direct · le QR est deja integre dans le doc */}
                    <div className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10">
                        {generatingPdf || !pdfPreviewUrl ? (
                            <div className="flex h-[500px] items-center justify-center gap-2 text-sm text-neutral-900/60 dark:text-white/60">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Génération du document officiel…
                            </div>
                        ) : (
                            <iframe
                                src={pdfPreviewUrl}
                                title={`Attestation ${attestationNum}`}
                                className="h-[600px] w-full"
                            />
                        )}
                    </div>

                    <p className="mt-3 text-center text-xs text-neutral-900/50 dark:text-white/50">
                        Document provisoire — sans valeur de titre de propriété.
                    </p>

                    <button
                        type="button"
                        onClick={handleWhatsApp}
                        disabled={generatingPdf}
                        className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gandehou-green px-6 py-4 text-lg font-medium text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40 disabled:opacity-60"
                    >
                        <MessageCircle className="h-6 w-6" />
                        Envoyer par WhatsApp
                    </button>

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

                    <Link
                        to="/cq/dashboard"
                        className="mt-3 inline-flex w-full items-center justify-center rounded-2xl px-6 py-3 text-sm font-medium text-neutral-900/60 outline-none transition-colors hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:text-white/60 dark:hover:text-white"
                    >
                        Retour au tableau de bord
                    </Link>
                </main>
            </div>
        )
    }

    // ── Ecran de revue du dossier ────────────────────────────────────
    const loc = [dossier.quartier, dossier.arrondissement, dossier.commune, dossier.departement]
        .filter(Boolean).join(' · ')

    return (
        <div className="min-h-screen bg-gandehou-paper text-neutral-900 dark:bg-neutral-950 dark:text-white">
            <PageHeader backTo="/cq/dashboard" />
            <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-2">
                <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-xs text-neutral-900/40 dark:text-white/40">
                        {dossier.id.slice(0, 8).toUpperCase()}
                    </span>
                    <StatusChip status={dossier.statut === 'soumis' ? 'soumis' : 'brouillon'} />
                </div>

                <div className="space-y-4">
                    <Section title="Vendeur">
                        <Row label="Noms et prénoms" value={dossier.vendeur_nom} />
                        {dossier.vendeur_id_value && (
                            <Row
                                label={dossier.vendeur_id_type === 'passeport' ? 'Passeport' : 'CIP'}
                                value={dossier.vendeur_id_value}
                            />
                        )}
                        {dossier.vendeur_phone && <Row label="Téléphone" value={dossier.vendeur_phone} />}
                        {vendeurPieceUrl && (
                            <div className="mt-3">
                                <p className="mb-1.5 text-xs font-medium text-neutral-900/55 dark:text-white/55">Pièce d'identité</p>
                                <a href={vendeurPieceUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={vendeurPieceUrl}
                                        alt="Pièce d'identité vendeur"
                                        className="max-h-48 w-full rounded-xl border border-black/10 object-cover dark:border-white/10"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                    />
                                </a>
                            </div>
                        )}
                        {vendeurAudioUrl && (
                            <div className="mt-3">
                                <p className="mb-1.5 text-xs font-medium text-neutral-900/55 dark:text-white/55">Consentement vocal</p>
                                <audio controls src={vendeurAudioUrl} className="w-full" />
                            </div>
                        )}
                    </Section>

                    <Section title="Acheteur">
                        <Row label="Noms et prénoms" value={dossier.acheteur_nom} />
                        {dossier.acheteur_nationalite && <Row label="Nationalité" value={dossier.acheteur_nationalite} />}
                        {dossier.acheteur_id_value && (
                            <Row
                                label={dossier.acheteur_id_type === 'passeport' ? 'Passeport' : 'CIP'}
                                value={dossier.acheteur_id_value}
                            />
                        )}
                        {dossier.acheteur_phone && <Row label="Téléphone" value={dossier.acheteur_phone} />}
                        {acheteurPieceUrl && (
                            <div className="mt-3">
                                <p className="mb-1.5 text-xs font-medium text-neutral-900/55 dark:text-white/55">Pièce d'identité</p>
                                <a href={acheteurPieceUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={acheteurPieceUrl}
                                        alt="Pièce d'identité acheteur"
                                        className="max-h-48 w-full rounded-xl border border-black/10 object-cover dark:border-white/10"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                    />
                                </a>
                            </div>
                        )}
                        {acheteurAudioUrl && (
                            <div className="mt-3">
                                <p className="mb-1.5 text-xs font-medium text-neutral-900/55 dark:text-white/55">Consentement vocal</p>
                                <audio controls src={acheteurAudioUrl} className="w-full" />
                            </div>
                        )}
                    </Section>

                    <Section title="Parcelle">
                        {loc && <Row label="Localisation" value={loc} />}
                        {dossier.superficie_m2 && <Row label="Superficie" value={`${dossier.superficie_m2.toLocaleString('fr-FR')} m²`} />}
                        {dossier.zone && <Row label="Zone" value={dossier.zone} className="capitalize" />}
                        {dossier.origine_droit && <Row label="Origine du droit" value={dossier.origine_droit.replace(/_/g, ' ')} />}
                        {planTerrainUrl && (
                            <div className="mt-3">
                                <p className="mb-1.5 text-xs font-medium text-neutral-900/55 dark:text-white/55">Plan du terrain (géomètre)</p>
                                <a href={planTerrainUrl} target="_blank" rel="noopener noreferrer">
                                    <img
                                        src={planTerrainUrl}
                                        alt="Plan du terrain"
                                        className="max-h-64 w-full rounded-xl border border-black/10 object-contain bg-white dark:border-white/10"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                    />
                                </a>
                            </div>
                        )}
                    </Section>

                    <Section title="Voisinage déclaré" accent>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { dir: 'Nord', val: dossier.voisin_nord },
                                { dir: 'Sud', val: dossier.voisin_sud },
                                { dir: 'Est', val: dossier.voisin_est },
                                { dir: 'Ouest', val: dossier.voisin_ouest },
                            ].map(({ dir, val }) => (
                                <div key={dir} className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/[0.04]">
                                    <p className="text-xs font-medium text-neutral-900/50 dark:text-white/50">{dir}</p>
                                    <p className="mt-0.5 text-sm font-medium">{val ?? '—'}</p>
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>

                {attestError && (
                    <p role="alert" className="mt-4 rounded-xl border border-gandehou-red/30 bg-gandehou-red/10 px-4 py-3 text-sm text-gandehou-red">
                        {attestError}
                    </p>
                )}

                {/* Fixed bottom CTA · Valider / Suspendre / Rejeter */}
                <div className="fixed bottom-0 left-0 right-0 border-t border-black/10 bg-gandehou-paper px-4 py-4 dark:border-white/10 dark:bg-neutral-950">
                    <div className="mx-auto max-w-xl space-y-2">
                        <button
                            type="button"
                            onClick={handleAttester}
                            disabled={attesting}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gandehou-green py-4 text-lg font-semibold text-white outline-none transition-colors hover:bg-gandehou-green/90 focus-visible:ring-4 focus-visible:ring-gandehou-green/40 disabled:opacity-60"
                        >
                            {attesting ? (
                                <><Loader2 className="h-5 w-5 animate-spin" />En cours…</>
                            ) : (
                                <><ShieldCheck className="h-5 w-5" />Valider le dossier</>
                            )}
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleSuspendre}
                                disabled={attesting}
                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gandehou-yellow/40 bg-gandehou-yellow/10 py-3 text-sm font-medium text-amber-700 outline-none transition-colors hover:bg-gandehou-yellow/20 focus-visible:ring-2 focus-visible:ring-gandehou-yellow disabled:opacity-60 dark:text-gandehou-yellow"
                            >
                                Suspendre
                            </button>
                            <button
                                type="button"
                                onClick={handleRejeter}
                                disabled={attesting}
                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gandehou-red/40 bg-gandehou-red/10 py-3 text-sm font-medium text-gandehou-red outline-none transition-colors hover:bg-gandehou-red/20 focus-visible:ring-2 focus-visible:ring-gandehou-red disabled:opacity-60"
                            >
                                Rejeter
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

/* ── Sous-composants ────────────────────────────────────────────────── */
function PageHeader({ backTo }: { backTo: string }) {
    return (
        <header className="flex items-center justify-between border-b border-black/10 px-5 py-4 dark:border-white/10">
            <Link to="/" aria-label="Gandehou — Accueil">
                <img src={logo} alt="Gandehou" className="h-8 w-auto" />
            </Link>
            <div className="flex items-center gap-3">
                <Link to={backTo} className="flex items-center gap-2 text-sm font-medium text-neutral-900/60 outline-none transition-colors hover:text-neutral-900 dark:text-white/60 dark:hover:text-white">
                    <ArrowLeft className="h-4 w-4" />Retour
                </Link>
                <ThemeToggle />
            </div>
        </header>
    )
}
function FullPageLoader() {
    return <div className="flex min-h-screen items-center justify-center bg-gandehou-paper dark:bg-neutral-950"><Loader2 className="h-8 w-8 animate-spin text-gandehou-green" /></div>
}
function FullPageError({ msg }: { msg: string }) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gandehou-paper px-6 text-center dark:bg-neutral-950">
            <p className="text-gandehou-red">{msg || 'Introuvable.'}</p>
            <Link to="/cq/dashboard" className="text-sm text-gandehou-green underline">Retour</Link>
        </div>
    )
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
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <span className="shrink-0 text-neutral-900/55 dark:text-white/55">{label}</span>
            <span className={cn('text-right font-medium', className)}>{value}</span>
        </div>
    )
}
