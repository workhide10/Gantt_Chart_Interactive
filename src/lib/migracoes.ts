import type { ComposicaoEquipe, Dados, IntegranteComposicaoEquipe } from '../types'
import { somarDias } from './datas.ts'

// Função pura e idempotente: preserva o formato dos backups e os registros legados.
export function migrarDados(dados: Dados, referencia: Dados): Dados {
  const fonteReferencia = 'alocacao-equipes-2026'
  const fonteComposicoes = 'formacao-equipe-global-v2'
  const fonteNomesArq = 'equipes-arq-numeradas-v1'
  const fontes = dados.fontesImportadas ?? []
  const importarReferencia = !fontes.includes(fonteReferencia)
  const renomearEquipesArq = !fontes.includes(fonteNomesArq)
  const migrarGlobal = !fontes.includes(fonteComposicoes)
  // Evita reconstruir conjuntos e varrer os cadastros inteiros em cada alteração normal.
  const migracaoNecessaria = !Array.isArray(dados.marcos) || !Array.isArray(dados.vinculosEquipe) ||
    dados.pessoas.some((pessoa) => pessoa.equipeId !== undefined) || importarReferencia || migrarGlobal || renomearEquipesArq
  if (!migracaoNecessaria) return dados
  const vinculosOriginais = Array.isArray(dados.vinculosEquipe) ? dados.vinculosEquipe : []
  const vinculosExistentes = vinculosOriginais.map((v) => ({ ...v, projetoId: v.projetoId ?? null }))
  const referencias = importarReferencia ? (referencia.vinculosEquipe ?? []) : []
  const chavesVigencia = new Set(vinculosExistentes.map((v) => `${v.pessoaId}|${v.equipeId}|${v.projetoId}|${v.inicio}|${v.fim}`))
  const referenciasNovas = referencias.filter((v) => !chavesVigencia.has(`${v.pessoaId}|${v.equipeId}|${v.projetoId}|${v.inicio}|${v.fim}`))
  const vinculosTodos = [...vinculosExistentes, ...referenciasNovas]
  const paresPessoaEquipe = new Set(vinculosTodos.map((v) => `${v.pessoaId}|${v.equipeId}`))
  const legados = dados.pessoas.flatMap((pessoa) => !pessoa.equipeId || paresPessoaEquipe.has(`${pessoa.id}|${pessoa.equipeId}`) ? [] : [{
    id: `legado-${pessoa.id}`, pessoaId: pessoa.id, equipeId: pessoa.equipeId, projetoId: null,
    inicio: null, fim: null, origem: 'legado' as const,
  }])
  const vinculosComLegados = [...vinculosTodos, ...legados]
  const pessoasDisponiveis = [...dados.pessoas, ...referencia.pessoas.filter((p) => !dados.pessoas.some((existente) => existente.id === p.id))]

  let composicoes: ComposicaoEquipe[] = Array.isArray(dados.composicoesEquipe) ? dados.composicoesEquipe : []
  let integrantes: IntegranteComposicaoEquipe[] = Array.isArray(dados.integrantesComposicao) ? dados.integrantesComposicao : []
  const idsMigrados = new Set<string>()
  if (migrarGlobal) {
    type RegistroOrigem = { id: string; equipeId: string; inicio: string; fim: string | null; pessoaId: string; origem?: 'manual' | 'legado' | 'planilha' }
    const registros: RegistroOrigem[] = []
    const elegiveis = vinculosComLegados.filter((v) => v.projetoId && v.inicio &&
      dados.escolas.some((p) => p.id === v.projetoId) && dados.equipes.some((e) => e.id === v.equipeId) &&
      pessoasDisponiveis.some((p) => p.id === v.pessoaId) && (!v.fim || v.fim >= v.inicio!))
    for (const v of elegiveis) { registros.push({ id: v.id, equipeId: v.equipeId, inicio: v.inicio!, fim: v.fim, pessoaId: v.pessoaId, origem: v.origem }); idsMigrados.add(v.id) }

    // Backups feitos pela versão anterior guardam projetoId na composição; ao consolidar,
    // o projeto é descartado e os membros passam a compor a cronologia global da equipe.
    const compsAntigas = (dados.composicoesEquipe ?? []) as (ComposicaoEquipe & { projetoId?: string })[]
    for (const c of compsAntigas) for (const m of (dados.integrantesComposicao ?? []).filter((x) => x.composicaoId === c.id)) {
      if (dados.equipes.some((e) => e.id === c.equipeId) && pessoasDisponiveis.some((p) => p.id === m.pessoaId)) registros.push({ id: `${c.id}-${m.pessoaId}`, equipeId: c.equipeId, inicio: c.inicio, fim: c.fim, pessoaId: m.pessoaId, origem: c.origem })
    }
    const porEquipe = new Map<string, RegistroOrigem[]>()
    for (const r of registros) porEquipe.set(r.equipeId, [...(porEquipe.get(r.equipeId) ?? []), r])
    composicoes = []; integrantes = []
    for (const [equipeId, lista] of porEquipe) {
      const porData = new Map<string, RegistroOrigem[]>()
      for (const r of lista) porData.set(r.inicio, [...(porData.get(r.inicio) ?? []), r])
      const snapshots = [...porData].sort(([a], [b]) => a.localeCompare(b)).map(([inicio, rs]) => ({ inicio, pessoas: [...new Set(rs.map((r) => r.pessoaId))].sort(), planilha: rs.every((r) => r.origem === 'planilha') }))
      const assinaturas = new Set(snapshots.map((s) => s.pessoas.join('|')))
      // A planilha é um retrato estático: quando a equipe tem uma única composição conhecida,
      // ela vira uma formação-base aberta desde a primeira data observada.
      const baseline = assinaturas.size === 1 && lista.every((r) => r.origem === 'planilha')
      const versoes = baseline ? [{ inicio: snapshots[0].inicio, pessoas: snapshots[0].pessoas, fim: null as string | null, planilha: true }] : snapshots.map((s, i) => ({ ...s, fim: snapshots[i + 1]?.inicio ? somarDias(snapshots[i + 1].inicio, -1) : null }))
      for (const [i, v] of versoes.entries()) {
        const id = `comp-global-${equipeId}-${v.inicio}-${i}`
        composicoes.push({ id, equipeId, inicio: v.inicio, fim: v.fim, origem: v.planilha ? 'planilha' : 'manual' })
        for (const pessoaId of v.pessoas) integrantes.push({ id: `${id}-${pessoaId}`, composicaoId: id, pessoaId })
      }
    }
  }

  return {
    ...dados,
    equipes: renomearEquipesArq
      ? dados.equipes.map((equipe, indice, lista) => equipe.disciplinaId === 'dis-arq'
        ? { ...equipe, nome: `ARQ-${lista.slice(0, indice + 1).filter((item) => item.disciplinaId === 'dis-arq').length}` }
        : equipe)
      : dados.equipes,
    pessoas: [...dados.pessoas, ...referencia.pessoas.filter((p) => !dados.pessoas.some((existente) => existente.id === p.id))]
      .map(({ id, nome, funcao }) => ({ id, nome, funcao })),
    marcos: Array.isArray(dados.marcos) ? dados.marcos : [],
    vinculosEquipe: migrarGlobal ? vinculosComLegados.filter((v) => !idsMigrados.has(v.id)) : vinculosComLegados,
    composicoesEquipe: composicoes,
    integrantesComposicao: integrantes,
    fontesImportadas: [...new Set([...fontes, ...(importarReferencia ? [fonteReferencia] : []), ...(migrarGlobal ? [fonteComposicoes] : []), ...(renomearEquipesArq ? [fonteNomesArq] : [])])],
  }
}
