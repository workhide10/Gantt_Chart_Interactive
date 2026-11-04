import type { Atividade, Dados, Filtros } from '../types'

export function filtrarAtividades(dados: Dados, f: Filtros): Atividade[] {
  return dados.atividades.filter((a) => {
    if (f.escolaId && a.escolaId !== f.escolaId) return false
    if (f.equipeId && a.equipeId !== f.equipeId) return false
    if (f.disciplinaId) {
      const equipe = dados.equipes.find((e) => e.id === a.equipeId)
      if (equipe?.disciplinaId !== f.disciplinaId) return false
    }
    return true
  })
}
