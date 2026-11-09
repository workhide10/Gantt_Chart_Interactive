import type { Atividade, Dados, MarcoProjeto } from '../types'
import { dataISOValida } from './datas.ts'

function substituirOuAdicionar<T extends { id: string }>(itens: T[], item: T): T[] {
  return itens.some((atual) => atual.id === item.id)
    ? itens.map((atual) => atual.id === item.id ? item : atual)
    : [...itens, item]
}

export function registrarAtividade(dados: Dados, atividade: Atividade): Dados {
  if (!dados.escolas.some((p) => p.id === atividade.escolaId) || !dados.equipes.some((e) => e.id === atividade.equipeId) ||
    !dataISOValida(atividade.inicio) || !dataISOValida(atividade.fim) || atividade.fim < atividade.inicio) {
    throw new Error('Projeto, equipe ou período da atividade inválido.')
  }
  return { ...dados, atividades: substituirOuAdicionar(dados.atividades, atividade) }
}

export function removerAtividade(dados: Dados, id: string): Dados {
  return { ...dados, atividades: dados.atividades.filter((a) => a.id !== id) }
}

export function ajustarPeriodoAtividade(dados: Dados, atividade: Atividade): Dados {
  const atual = dados.atividades.find((a) => a.id === atividade.id)
  // O redimensionamento altera somente as datas; preserva edições recentes nos demais campos.
  return atual ? registrarAtividade(dados, { ...atual, inicio: atividade.inicio, fim: atividade.fim }) : dados
}

export function registrarMarco(dados: Dados, marco: MarcoProjeto): Dados {
  if (!dados.escolas.some((p) => p.id === marco.escolaId) || !dataISOValida(marco.data) || !marco.titulo.trim()) {
    throw new Error('Projeto, título ou data do marco inválido.')
  }
  return { ...dados, marcos: substituirOuAdicionar(dados.marcos ?? [], marco) }
}

export function removerMarco(dados: Dados, id: string): Dados {
  return { ...dados, marcos: (dados.marcos ?? []).filter((m) => m.id !== id) }
}

export function motivoBloqueioExclusao(dados: Dados, tipo: 'projeto' | 'disciplina' | 'equipe' | 'pessoa', id: string): string | null {
  const movimentos = dados.movimentacoesEquipe ?? []
  const composicoes = dados.composicoesEquipe ?? []
  const integrantes = dados.integrantesComposicao ?? []
  const emUso = tipo === 'projeto'
    ? dados.atividades.some((a) => a.escolaId === id) || (dados.marcos ?? []).some((m) => m.escolaId === id)
    : tipo === 'disciplina'
      ? dados.equipes.some((e) => e.disciplinaId === id) || (dados.eventosEquipe ?? []).some((e) => e.disciplinaId === id)
      : tipo === 'equipe'
        ? dados.atividades.some((a) => a.equipeId === id) || composicoes.some((c) => c.equipeId === id) || movimentos.some((m) => m.equipeOrigemId === id || m.equipeDestinoId === id)
        : integrantes.some((i) => i.pessoaId === id) || movimentos.some((m) => m.pessoaId === id)
  return emUso ? 'Este registro está associado a atividades, marcos ou ao histórico das equipes e não pode ser excluído.' : null
}
