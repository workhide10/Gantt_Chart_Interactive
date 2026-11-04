import type { Atividade } from '../types'
import { sobrepoe } from './datas'

export interface Posicionada {
  atividade: Atividade
  faixa: number // 0 = primeira linha, 1 = segunda... (barras que se sobrepõem ficam empilhadas)
  conflito: boolean // true se sobrepõe outra atividade do mesmo grupo
}

// Distribui as atividades em "faixas" para barras que se sobrepõem não ficarem uma em cima da outra.
export function empacotar(atividades: Atividade[]): { itens: Posicionada[]; faixas: number } {
  const ordenadas = [...atividades].sort((a, b) => a.inicio.localeCompare(b.inicio))
  const fimDaFaixa: string[] = []
  const itens: Posicionada[] = ordenadas.map((atividade) => {
    let faixa = fimDaFaixa.findIndex((fim) => fim < atividade.inicio)
    if (faixa === -1) faixa = fimDaFaixa.length
    fimDaFaixa[faixa] = atividade.fim
    const conflito = ordenadas.some((o) => o.id !== atividade.id && sobrepoe(o, atividade))
    return { atividade, faixa, conflito }
  })
  return { itens, faixas: Math.max(1, fimDaFaixa.length) }
}
