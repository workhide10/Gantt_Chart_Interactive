import type { Atividade, Dados, Filtros } from '../types'

export function filtrarAtividades(dados: Dados, f: Filtros): Atividade[] {
  const disciplinaPorEquipe = f.disciplinaId
    ? new Map(dados.equipes.map((equipe) => [equipe.id, equipe.disciplinaId]))
    : null
  return dados.atividades.filter((a) => {
    if (f.escolaId && a.escolaId !== f.escolaId) return false
    if (f.equipeId && a.equipeId !== f.equipeId) return false
    if (f.disciplinaId) {
      if (disciplinaPorEquipe?.get(a.equipeId) !== f.disciplinaId) return false
    }
    return true
  })
}
