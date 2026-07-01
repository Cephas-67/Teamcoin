import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, TriangleAlert, X } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'

export function LogoutModal() {
    const { logout } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleLogout = async () => {
        setLoading(true)
        await logout()
        navigate('/', { replace: true })
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <button
                    type="button"
                    aria-label="Se déconnecter"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-neutral-900/60 outline-none transition-colors hover:bg-black/5 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Déconnexion</span>
                </button>
            </Dialog.Trigger>

            <AnimatePresence>
                {open && (
                    <Dialog.Portal forceMount>
                        {/* Overlay */}
                        <Dialog.Overlay asChild forceMount>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                            />
                        </Dialog.Overlay>

                        {/* Flex centering wrapper — no CSS transform to fight framer-motion */}
                        <Dialog.Content asChild forceMount>
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 16 }}
                                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                    className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl outline-none dark:bg-neutral-900 sm:p-8"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {/* Close */}
                                    <Dialog.Close asChild>
                                        <button
                                            type="button"
                                            aria-label="Fermer"
                                            className="absolute right-4 top-4 rounded-lg p-1.5 text-neutral-900/40 outline-none transition-colors hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:text-white/40 dark:hover:text-white"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </Dialog.Close>

                                    {/* Danger icon */}
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gandehou-red/10">
                                        <TriangleAlert className="h-7 w-7 text-gandehou-red" />
                                    </div>

                                    <Dialog.Title className="mt-5 text-center text-lg font-semibold text-neutral-900 dark:text-white">
                                        Se déconnecter ?
                                    </Dialog.Title>

                                    <Dialog.Description className="mt-2 text-center text-sm text-neutral-900/60 dark:text-white/60">
                                        Vous serez redirigé vers la page d'accueil. Vos données de
                                        session seront supprimées de cet appareil.
                                    </Dialog.Description>

                                    {/* Actions */}
                                    <div className="mt-7 flex flex-col-reverse gap-3">
                                        <Dialog.Close asChild>
                                            <button
                                                type="button"
                                                className="flex-1 rounded-2xl border border-black/10 px-5 py-3 text-sm font-medium outline-none transition-colors hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-gandehou-green dark:border-white/10 dark:hover:bg-white/10"
                                            >
                                                Annuler
                                            </button>
                                        </Dialog.Close>

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            disabled={loading}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gandehou-red px-5 py-3 text-sm font-medium text-white outline-none transition-colors hover:bg-gandehou-red/90 focus-visible:ring-4 focus-visible:ring-gandehou-red/30 disabled:opacity-60"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            {loading ? 'Déconnexion…' : 'Se déconnecter'}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </Dialog.Content>
                    </Dialog.Portal>
                )}
            </AnimatePresence>
        </Dialog.Root>
    )
}