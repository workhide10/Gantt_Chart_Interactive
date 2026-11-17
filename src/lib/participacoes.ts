import type { Dados } from '../types'

// Retorna todas as equipes da pessoa na data, independentemente do filtro da tela.
export function equipesDaPessoaNaData(dados: Dados, pessoaId: string, data: string): string[] {
  const composicoes = (dados.composicoesEquipe ?? []).filter((c) => c.inicio <= data && (!c.fim || c.fim >= data))
  const ids = new Set((dados.integrantesComposicao ?? []).filter((i) => i.pessoaId === pessoaId).map((i) => i.composicaoId))
  return [...new Set(composicoes.filter((c) => ids.has(c.id)).map((c) => dados.equipes.find((e) => e.id === c.equipeId)?.nome).filter((n): n is string => Boolean(n)))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

