import type { ComposicaoEquipe, Dados, EventoEquipe, IntegranteComposicaoEquipe, MovimentacaoIntegrante } from '../types'
import { dataISOValida, somarDias } from './datas.ts'

export interface AtualizacaoEquipe { equipeId: string; pessoaIds: string[] }
type NovoId = () => string

export function registrarComposicao(dados: Dados, composicao: ComposicaoEquipe, pessoaIds: string[], novoId: NovoId = () => crypto.randomUUID()): Dados {
  const composicoes = dados.composicoesEquipe ?? []
  const integrantes = dados.integrantesComposicao ?? []
  if (!dataISOValida(composicao.inicio) || !dados.equipes.some((e) => e.id === composicao.equipeId) ||
    !pessoaIds.length || new Set(pessoaIds).size !== pessoaIds.length || pessoaIds.some((id) => !dados.pessoas.some((p) => p.id === id))) throw new Error('Dados da equipe ou dos integrantes inválidos.')
  const membrosAntigos = integrantes.filter((i) => i.composicaoId === composicao.id)
  if (composicoes.some((c) => c.id === composicao.id)) {
    const atual = composicoes.find((c) => c.id === composicao.id)!
    if (atual.equipeId !== composicao.equipeId || atual.inicio !== composicao.inicio || atual.fim !== composicao.fim) throw new Error('A correção deve preservar a equipe e a vigência da versão.')
    return { ...dados, composicoesEquipe: composicoes.map((c) => c.id === composicao.id ? composicao : c),
      integrantesComposicao: [...integrantes.filter((i) => i.composicaoId !== composicao.id),
        ...pessoaIds.map((pessoaId) => membrosAntigos.find((m) => m.pessoaId === pessoaId) ?? ({ id: novoId(), composicaoId: composicao.id, pessoaId }))] }
  }
  if (composicoes.some((c) => c.equipeId === composicao.equipeId && c.inicio === composicao.inicio)) throw new Error('Já existe uma composição com essa data de início. Use “Corrigir composição” na linha correspondente.')
  const posteriores = composicoes.filter((c) => c.equipeId === composicao.equipeId && c.inicio > composicao.inicio).sort((a, b) => a.inicio.localeCompare(b.inicio))
  const anteriores = composicoes.filter((c) => c.equipeId === composicao.equipeId && c.inicio < composicao.inicio && (!c.fim || c.fim >= composicao.inicio)).sort((a, b) => b.inicio.localeCompare(a.inicio))
  const nova = { ...composicao, fim: posteriores.length ? somarDias(posteriores[0].inicio, -1) : null }
  let composicoesAtualizadas = composicoes.map((c) => c.id === anteriores[0]?.id ? { ...c, fim: somarDias(composicao.inicio, -1) } : c)
  let integrantesAtualizados = [...integrantes]
  const equipeDestino = dados.equipes.find((e) => e.id === composicao.equipeId)
  const transferenciasPorEquipe = new Map<string, Set<string>>()
  for (const pessoaId of pessoaIds) {
    const origem = composicoes
      .filter((c) => c.equipeId !== composicao.equipeId && c.inicio <= composicao.inicio && (!c.fim || c.fim >= composicao.inicio) &&
        dados.equipes.find((e) => e.id === c.equipeId)?.disciplinaId === equipeDestino?.disciplinaId &&
        integrantes.some((i) => i.composicaoId === c.id && i.pessoaId === pessoaId))
      .sort((a, b) => b.inicio.localeCompare(a.inicio))[0]
    if (origem) transferenciasPorEquipe.set(origem.equipeId, new Set([...(transferenciasPorEquipe.get(origem.equipeId) ?? []), pessoaId]))
  }
  for (const [equipeOrigemId, pessoasTransferidas] of transferenciasPorEquipe) {
    const origem = composicoes.filter((c) => c.equipeId === equipeOrigemId && c.inicio <= composicao.inicio && (!c.fim || c.fim >= composicao.inicio)).sort((a, b) => b.inicio.localeCompare(a.inicio))[0]
    if (!origem) continue
    const roster = integrantes.filter((i) => i.composicaoId === origem.id && !pessoasTransferidas.has(i.pessoaId)).map((i) => i.pessoaId)
    if (origem.inicio === composicao.inicio) {
      integrantesAtualizados = [...integrantesAtualizados.filter((i) => i.composicaoId !== origem.id), ...roster.map((pessoaId) => ({ id: novoId(), composicaoId: origem.id, pessoaId }))]
    } else {
      composicoesAtualizadas = composicoesAtualizadas.map((c) => c.id === origem.id ? { ...c, fim: somarDias(composicao.inicio, -1) } : c)
      const proxima = composicoes.filter((c) => c.equipeId === equipeOrigemId && c.inicio > composicao.inicio).sort((a, b) => a.inicio.localeCompare(b.inicio))[0]
      const id = novoId()
      composicoesAtualizadas.push({ id, equipeId: equipeOrigemId, inicio: composicao.inicio, fim: proxima ? somarDias(proxima.inicio, -1) : null, origem: 'manual' })
      integrantesAtualizados.push(...roster.map((pessoaId) => ({ id: novoId(), composicaoId: id, pessoaId })))
    }
  }
  const novos: IntegranteComposicaoEquipe[] = pessoaIds.map((pessoaId) => ({ id: novoId(), composicaoId: composicao.id, pessoaId }))
  return { ...dados, composicoesEquipe: [...composicoesAtualizadas, nova], integrantesComposicao: [...integrantesAtualizados, ...novos] }
}

export function registrarMovimentacao(dados: Dados, evento: EventoEquipe, movimentos: MovimentacaoIntegrante[], atualizacoes: AtualizacaoEquipe[], novoId: NovoId = () => crypto.randomUUID()): Dados {
  const equipesValidas = new Set(dados.equipes.filter((e) => e.disciplinaId === evento.disciplinaId).map((e) => e.id))
  const pessoasValidas = new Set(dados.pessoas.map((p) => p.id))
  const equipesAtualizadas = new Set(atualizacoes.map((a) => a.equipeId))
  if (!dataISOValida(evento.data) || !movimentos.length || (dados.eventosEquipe ?? []).some((e) => e.id === evento.id) ||
    equipesAtualizadas.size !== atualizacoes.length || new Set(movimentos.map((m) => m.pessoaId)).size !== movimentos.length ||
    movimentos.some((m) => m.eventoId !== evento.id || !pessoasValidas.has(m.pessoaId) || !equipesValidas.has(m.equipeOrigemId) ||
      !equipesAtualizadas.has(m.equipeOrigemId) || (m.equipeDestinoId !== null && (!equipesValidas.has(m.equipeDestinoId) || !equipesAtualizadas.has(m.equipeDestinoId) || m.equipeDestinoId === m.equipeOrigemId))) ||
    atualizacoes.some((a) => !equipesValidas.has(a.equipeId) || new Set(a.pessoaIds).size !== a.pessoaIds.length || a.pessoaIds.some((id) => !pessoasValidas.has(id)))) {
    throw new Error('A movimentação deve ter equipes da mesma disciplina, integrantes válidos e um evento único.')
  }
  const composicoes = dados.composicoesEquipe ?? []
  const integrantes = dados.integrantesComposicao ?? []
  let composicoesAtualizadas = [...composicoes]
  let integrantesAtualizados = [...integrantes]
  for (const atualizacao of atualizacoes) {
    const equipeComposicoes = composicoesAtualizadas.filter((c) => c.equipeId === atualizacao.equipeId)
    const existenteNaData = equipeComposicoes.find((c) => c.inicio === evento.data)
    const ativa = equipeComposicoes.filter((c) => c.inicio <= evento.data && (!c.fim || c.fim >= evento.data)).sort((a, b) => b.inicio.localeCompare(a.inicio))[0]
    if (existenteNaData) {
      if (ativa && ativa.id !== existenteNaData.id && ativa.inicio < evento.data) {
        composicoesAtualizadas = composicoesAtualizadas.map((c) => c.id === ativa.id ? { ...c, fim: somarDias(evento.data, -1) } : c)
      }
      integrantesAtualizados = [...integrantesAtualizados.filter((i) => i.composicaoId !== existenteNaData.id),
        ...atualizacao.pessoaIds.map((pessoaId) => ({ id: novoId(), composicaoId: existenteNaData.id, pessoaId }))]
      continue
    }
    if (ativa) composicoesAtualizadas = composicoesAtualizadas.map((c) => c.id === ativa.id ? { ...c, fim: somarDias(evento.data, -1) } : c)
    const proxima = equipeComposicoes.filter((c) => c.inicio > evento.data).sort((a, b) => a.inicio.localeCompare(b.inicio))[0]
    const composicaoId = novoId()
    composicoesAtualizadas.push({ id: composicaoId, equipeId: atualizacao.equipeId, inicio: evento.data, fim: proxima ? somarDias(proxima.inicio, -1) : null, origem: 'manual' })
    integrantesAtualizados.push(...atualizacao.pessoaIds.map((pessoaId) => ({ id: novoId(), composicaoId, pessoaId })))
  }
  return { ...dados, composicoesEquipe: composicoesAtualizadas, integrantesComposicao: integrantesAtualizados,
    eventosEquipe: [...(dados.eventosEquipe ?? []), evento], movimentacoesEquipe: [...(dados.movimentacoesEquipe ?? []), ...movimentos] }
}
