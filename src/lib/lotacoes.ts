import type { ComposicaoEquipe, Dados, IntegranteComposicaoEquipe, Lotacao, MovimentacaoIntegrante, EventoEquipe } from '../types'

export function projetarComposicoes(dados: Dados): { composicoes: ComposicaoEquipe[]; integrantes: IntegranteComposicaoEquipe[] } {
  const lotacoes = dados.lotacoes
  if (!lotacoes) return { composicoes: dados.composicoesEquipe ?? [], integrantes: dados.integrantesComposicao ?? [] }
  const grupos: { id: string; equipeId: string; inicio: string; fim: string | null; pessoas: string[] }[] = []
  for (const equipeId of new Set(lotacoes.map((l) => l.equipeId))) {
    const daEquipe = lotacoes.filter((l) => l.equipeId === equipeId)
    const limites = new Set(daEquipe.flatMap((l) => [l.inicio, ...(l.fim ? [(() => { const d = new Date(`${l.fim}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10) })()] : [])]))
    const datas = [...limites].sort()
    let assinaturaAnterior = ''
    for (const [i, inicio] of datas.entries()) {
      const pessoas = [...new Set(daEquipe.filter((l) => l.inicio <= inicio && (!l.fim || l.fim >= inicio)).map((l) => l.pessoaId))].sort()
      const assinatura = pessoas.join('|')
      if (!pessoas.length) { assinaturaAnterior = ''; continue }
      if (assinatura === assinaturaAnterior) continue
      assinaturaAnterior = assinatura
      const id = `lot-view-${equipeId}-${inicio}`
      const proximaMudanca = datas.slice(i + 1).find((d) => {
        const roster = daEquipe.filter((l) => l.inicio <= d && (!l.fim || l.fim >= d)).map((l) => l.pessoaId).sort().join('|')
        return roster !== assinatura
      })
      const fim = proximaMudanca ? (() => { const d = new Date(`${proximaMudanca}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10) })() : null
      grupos.push({ id, equipeId, inicio, fim, pessoas })
    }
  }
  const composicoes = grupos.map(({ id, equipeId, inicio, fim }) => ({ id, equipeId, inicio, fim, origem: 'manual' as const }))
  const integrantes = grupos.flatMap((g) => g.pessoas.map((pessoaId) => ({ id: `m-${g.id}-${pessoaId}`, composicaoId: g.id, pessoaId })))
  return { composicoes, integrantes }
}

export function integrantesNaData(dados: Dados, equipeId: string, data: string): string[] {
  if (dados.lotacoes) return [...new Set(dados.lotacoes.filter((l) => l.equipeId === equipeId && l.inicio <= data && (!l.fim || l.fim >= data)).map((l) => l.pessoaId))]
  const { composicoes, integrantes } = projetarComposicoes(dados)
  const c = composicoes.filter((x) => x.equipeId === equipeId && x.inicio <= data && (!x.fim || x.fim >= data)).sort((a, b) => b.inicio.localeCompare(a.inicio))[0]
  return c ? integrantes.filter((i) => i.composicaoId === c.id).map((i) => i.pessoaId) : []
}

export interface EventoLotacao { data: string; equipeId: string; movimentos: MovimentacaoIntegrante[]; evento: EventoEquipe }

export function eventosLotacao(dados: Dados): EventoLotacao[] {
  if (!dados.lotacoes) return []
  const eventos = new Map<string, EventoLotacao>()
  for (const l of dados.lotacoes) {
    const inicio = dados.equipes.find((e) => e.id === l.equipeId)?.disciplinaId ?? ''
    const chaveInicio = `${l.inicio}|${l.equipeId}`
    if (!eventos.has(chaveInicio)) eventos.set(chaveInicio, { data: l.inicio, equipeId: l.equipeId, movimentos: [], evento: { id: chaveInicio, disciplinaId: inicio, data: l.inicio } })
    if (l.fim) {
      const data = new Date(`${l.fim}T00:00:00Z`); data.setUTCDate(data.getUTCDate() + 1)
      const dataISO = data.toISOString().slice(0, 10), chave = `${dataISO}|${l.equipeId}`
      if (!eventos.has(chave)) eventos.set(chave, { data: dataISO, equipeId: l.equipeId, movimentos: [], evento: { id: chave, disciplinaId: inicio, data: dataISO } })
      if (dados.lotacoes.some((x) => x.pessoaId === l.pessoaId && x.equipeId === l.equipeId && x.inicio === dataISO)) continue
      const destino = dados.lotacoes.find((x) => x.pessoaId === l.pessoaId && x.inicio === dataISO && x.equipeId !== l.equipeId)
      const movimento: MovimentacaoIntegrante = { id: `${l.id}-${dataISO}`, eventoId: chave, pessoaId: l.pessoaId, equipeOrigemId: l.equipeId, equipeDestinoId: destino?.equipeId ?? null, motivo: l.motivoFim }
      eventos.get(chave)!.movimentos.push(movimento)
    }
  }
  return [...eventos.values()].filter((e) => e.movimentos.length > 0)
}

export function consolidarLotacoes(lotacoes: Lotacao[]): Lotacao[] {
  return [...lotacoes].sort((a, b) => a.pessoaId.localeCompare(b.pessoaId) || a.inicio.localeCompare(b.inicio))
}
