import type { Atividade, Dados, Pessoa } from '../types'

export interface IntegranteNoPeriodo {
  pessoa: Pessoa | undefined
  inicio: string
  fim: string
}

export function integrantesNaAtividade(dados: Dados, atividade: Atividade): IntegranteNoPeriodo[] {
  const composicoesDaEquipe = (dados.composicoesEquipe ?? []).filter((c) => c.equipeId === atividade.equipeId)
  const composicoesAtivas = composicoesDaEquipe.filter((c) =>
    c.inicio <= atividade.fim && (!c.fim || c.fim >= atividade.inicio),
  )

  if (composicoesDaEquipe.length > 0) {
    return composicoesAtivas.flatMap((composicao) => {
      const inicio = composicao.inicio > atividade.inicio ? composicao.inicio : atividade.inicio
      const fim = composicao.fim && composicao.fim < atividade.fim ? composicao.fim : atividade.fim
      if (inicio > fim) return []
      return (dados.integrantesComposicao ?? [])
        .filter((membro) => membro.composicaoId === composicao.id)
        .map((membro) => ({ pessoa: dados.pessoas.find((p) => p.id === membro.pessoaId), inicio, fim }))
    })
  }

  return []
}
