/**
 * territorial.ts — Benin administrative division API client.
 *
 * Calls: https://api-decoupage-benin.onrender.com
 * Source: github.com/minkudi/api-decoupage-territorial-benin
 *
 * ⚠ Render free tier: ~50s cold start on first call.
 *   The DossierForm shows a loading state while waiting.
 *
 * Hierarchy: Département → Commune → Arrondissement → Quartier/Village
 * IDs are numeric, endpoints are nested.
 */

const BASE = 'https://api-decoupage-benin.onrender.com'

export type TerritorialUnit = {
    id: number
    label: string
}

// ── Response shapes (from the API) ──────────────────────────────────
// The API doesn't have formal docs beyond the README, so these
// are inferred from the Swagger and typical responses.
type DeptResponse = { id_dep: number; name: string }
type CommuneResponse = { id_com: number; name: string }
type ArrondResponse = { id_arrond: number; name: string }
type QuartierResponse = { id_quart: number; name: string }

async function apiFetch<T>(path: string): Promise<T[]> {
    const res = await fetch(`${BASE}${path}`)
    if (!res.ok) throw new Error(`API territorial ${res.status}: ${path}`)
    const data = await res.json()
    // The API may return an array directly or wrap it in a data field.
    return Array.isArray(data) ? data : (data.data ?? data.departements ?? data.communes ?? data.arrondissements ?? data.quartiers ?? [])
}

// ── Public API ──────────────────────────────────────────────────────

export async function fetchDepartements(): Promise<TerritorialUnit[]> {
    // The README only shows /departements/:id but the API likely
    // has a list endpoint. Try /departements first; if it fails,
    // fall back to a hardcoded list of the 12 known departments.
    try {
        const data = await apiFetch<DeptResponse>('/departements')
        if (data.length > 0) {
            return data.map((d) => ({
                id: d.id_dep ?? (d as any).id,
                label: (d as any).name ?? (d as any).nom ?? (d as any).labelDep ?? String(d),
            }))
        }
    } catch {
        // API unreachable (cold start, CORS, etc.) — use fallback
    }

    // Fallback: the 12 Benin departments with their canonical IDs.
    return DEPT_FALLBACK
}

export async function fetchCommunes(deptId: number): Promise<TerritorialUnit[]> {
    try {
        const data = await apiFetch<CommuneResponse>(`/departements/${deptId}/communes`)
        return data.map((c) => ({
            id: c.id_com ?? (c as any).id,
            label: (c as any).name ?? (c as any).nom ?? (c as any).labelCom ?? String(c),
        }))
    } catch {
        return []
    }
}

export async function fetchArrondissements(
    deptId: number,
    communeId: number,
): Promise<TerritorialUnit[]> {
    try {
        const data = await apiFetch<ArrondResponse>(
            `/departements/${deptId}/communes/${communeId}/arrondissements`,
        )
        return data.map((a) => ({
            id: a.id_arrond ?? (a as any).id,
            label: (a as any).name ?? (a as any).nom ?? (a as any).labelArrond ?? String(a),
        }))
    } catch {
        return []
    }
}

export async function fetchQuartiers(
    deptId: number,
    communeId: number,
    arrondId: number,
): Promise<TerritorialUnit[]> {
    try {
        const data = await apiFetch<QuartierResponse>(
            `/departements/${deptId}/communes/${communeId}/arrondissements/${arrondId}/quartiers`,
        )
        return data.map((q) => ({
            id: q.id_quart ?? (q as any).id,
            label: (q as any).name ?? (q as any).nom ?? (q as any).labelQuart ?? String(q),
        }))
    } catch {
        return []
    }
}

// ── Fallback department list ────────────────────────────────────────
const DEPT_FALLBACK: TerritorialUnit[] = [
    { id: 1, label: 'Alibori' },
    { id: 2, label: 'Atacora' },
    { id: 3, label: 'Atlantique' },
    { id: 4, label: 'Borgou' },
    { id: 5, label: 'Collines' },
    { id: 6, label: 'Couffo' },
    { id: 7, label: 'Donga' },
    { id: 8, label: 'Littoral' },
    { id: 9, label: 'Mono' },
    { id: 10, label: 'Ouémé' },
    { id: 11, label: 'Plateau' },
    { id: 12, label: 'Zou' },
]