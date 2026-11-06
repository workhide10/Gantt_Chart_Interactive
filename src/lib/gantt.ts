import type { Atividade } from '../types'

export interface Posicionada {
  atividade: Atividade
  faixa: number
  conflito: boolean
}

// Min-heap simples: libera faixas em O(log n) sem procurar linearmente a cada barra.
function inserirData(heap: { fim: string; faixa: number }[], item: { fim: string; faixa: number }) {
  let i = heap.push(item) - 1
  while (i > 0) {
    const pai = (i - 1) >> 1
    if (heap[pai].fim < item.fim || (heap[pai].fim === item.fim && heap[pai].faixa <= item.faixa)) break
    heap[i] = heap[pai]; i = pai
  }
  heap[i] = item
}

function removerData(heap: { fim: string; faixa: number }[]) {
  const primeiro = heap[0]
  const ultimo = heap.pop()!
  if (heap.length) {
    let i = 0
    while (true) {
      const esq = i * 2 + 1
      if (esq >= heap.length) break
      const dir = esq + 1
      const filho = dir < heap.length && (heap[dir].fim < heap[esq].fim || (heap[dir].fim === heap[esq].fim && heap[dir].faixa < heap[esq].faixa)) ? dir : esq
      if (heap[filho].fim > ultimo.fim || (heap[filho].fim === ultimo.fim && heap[filho].faixa >= ultimo.faixa)) break
      heap[i] = heap[filho]; i = filho
    }
    heap[i] = ultimo
  }
  return primeiro
}

function inserirNumero(heap: number[], valor: number) {
  let i = heap.push(valor) - 1
  while (i > 0) {
    const pai = (i - 1) >> 1
    if (heap[pai] <= valor) break
    heap[i] = heap[pai]; i = pai
  }
  heap[i] = valor
}

function removerNumero(heap: number[]) {
  const primeiro = heap[0]
  const ultimo = heap.pop()!
  if (heap.length) {
    let i = 0
    while (true) {
      const esq = i * 2 + 1
      if (esq >= heap.length) break
      const dir = esq + 1
      const filho = dir < heap.length && heap[dir] < heap[esq] ? dir : esq
      if (heap[filho] >= ultimo) break
      heap[i] = heap[filho]; i = filho
    }
    heap[i] = ultimo
  }
  return primeiro
}

// Empacota atividades com heaps: custo O(n log n), mantendo a mesma regra de
// intervalo inclusivo (uma faixa só é liberada quando fim < próximo início).
export function empacotar(atividades: Atividade[]): { itens: Posicionada[]; faixas: number } {
  const ordenadas = [...atividades].sort((a, b) => a.inicio.localeCompare(b.inicio))
  const ocupadas: { fim: string; faixa: number }[] = []
  const livres: number[] = []
  const faixasPorIndice: number[] = []
  let totalFaixas = 0

  for (let i = 0; i < ordenadas.length; i++) {
    const atividade = ordenadas[i]
    while (ocupadas.length && ocupadas[0].fim < atividade.inicio) inserirNumero(livres, removerData(ocupadas).faixa)
    const faixa = livres.length ? removerNumero(livres) : totalFaixas++
    faixasPorIndice[i] = faixa
    inserirData(ocupadas, { fim: atividade.fim, faixa })
  }

  let maiorFimAnterior = ''
  const conflitoAntes: boolean[] = []
  for (let i = 0; i < ordenadas.length; i++) {
    conflitoAntes[i] = i > 0 && maiorFimAnterior >= ordenadas[i].inicio
    if (ordenadas[i].fim > maiorFimAnterior) maiorFimAnterior = ordenadas[i].fim
  }
  return {
    itens: ordenadas.map((atividade, i) => ({
      atividade,
      faixa: faixasPorIndice[i],
      conflito: conflitoAntes[i] || (i + 1 < ordenadas.length && ordenadas[i + 1].inicio <= atividade.fim),
    })),
    faixas: Math.max(1, totalFaixas),
  }
}

// Conta pares de atividades sobrepostas em O(n log n), com o mesmo critério inclusivo.
export function contarSobreposicoes(atividades: Atividade[]): number {
  const ordenadas = [...atividades].sort((a, b) => a.inicio.localeCompare(b.inicio))
  const finais: { fim: string; faixa: number }[] = []
  let total = 0
  for (const atividade of ordenadas) {
    while (finais.length && finais[0].fim < atividade.inicio) removerData(finais)
    total += finais.length
    inserirData(finais, { fim: atividade.fim, faixa: 0 })
  }
  return total
}
