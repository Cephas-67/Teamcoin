import { Component, type ErrorInfo, type ReactNode } from 'react'

// Fallback pour capter les erreurs de rendu qui font apparaitre une page blanche.
// Affiche le message d'erreur au lieu de rendre un ecran vide en prod.

type State = { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  reset = () => this.setState({ hasError: false, error: null })

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gandehou-paper px-6 text-center dark:bg-neutral-950 dark:text-white">
        <div className="max-w-md rounded-2xl border border-gandehou-red/30 bg-gandehou-red/10 p-6">
          <p className="text-lg font-semibold text-gandehou-red">Une erreur est survenue</p>
          <p className="mt-2 text-sm text-neutral-900/70 dark:text-white/70">
            {this.state.error?.message ?? 'Erreur inconnue'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={this.reset}
            className="rounded-xl border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Réessayer
          </button>
          <button
            type="button"
            onClick={() => window.location.assign('/dashboard')}
            className="rounded-xl bg-gandehou-green px-4 py-2 text-sm font-medium text-white hover:bg-gandehou-green/90"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    )
  }
}
