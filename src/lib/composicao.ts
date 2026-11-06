import type { Atividade, ComposicaoEquipe, Dados, Pessoa } from '../types'

export interface IntegranteNoPeriodo {
  pessoa: Pessoa | undefined
  inicio: string
  fim: string
}

export interface IndiceComposicoes {
  porEquipe: Map<string, ComposicaoEquipe[]>
  pessoaPorId: Map<string, Pessoa>
  pessoaIdsPorComposicao: Map<string, string[]>
}

export function criarIndiceComposicoes(dados: Dados): IndiceComposicoes {
  const porEquipe: IndiceComposicoes['porEquipe'] = new Map()
  for (const composicao of dados.composicoesEquipe ?? []) {
    const lista = porEquipe.get(composicao.equipeId) ?? []
    lista.push(composicao)
    porEquipe.set(composicao.equipeId, lista)
  }
  for (const lista of porEquipe.values()) lista.sort((a, b) => a.inicio.localeCompare(b.inicio))
  const pessoaIdsPorComposicao = new Map<string, string[]>()
  for (const membro of dados.integrantesComposicao ?? []) {
    const lista = pessoaIdsPorComposicao.get(membro.composicaoId) ?? []
    lista.push(membro.pessoaId)
    pessoaIdsPorComposicao.set(membro.composicaoId, lista)
  }
  return { porEquipe, pessoaPorId: new Map(dados.pessoas.map((pessoa) => [pessoa.id, pessoa])), pessoaIdsPorComposicao }
}

export function integrantesNaAtividade(dados: Dados, atividade: Atividade, indice = criarIndiceComposicoes(dados)): IntegranteNoPeriodo[] {
  const composicoesDaEquipe = indice.porEquipe.get(atividade.equipeId) ?? []
  const composicoesAtivas = composicoesDaEquipe.filter((c) =>
    c.inicio <= atividade.fim && (!c.fim || c.fim >= atividade.inicio),
  )

  if (composicoesDaEquipe.length > 0) {
    return composicoesAtivas.flatMap((composicao) => {
      const inicio = composicao.inicio > atividade.inicio ? composicao.inicio : atividade.inicio
      const fim = composicao.fim && composicao.fim < atividade.fim ? composicao.fim : atividade.fim
      if (inicio > fim) return []
      return (indice.pessoaIdsPorComposicao.get(composicao.id) ?? [])
        .map((pessoaId) => ({ pessoa: indice.pessoaPorId.get(pessoaId), inicio, fim }))
    })
  }

  return []
}
