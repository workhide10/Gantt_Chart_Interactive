// Datas são guardadas como texto "AAAA-MM-DD". Isso evita problemas de fuso horário
// e deixa a comparação simples: "2026-05-01" < "2026-05-10" funciona como texto.

const DIA = 86_400_000

export const paraDate = (iso: string): Date => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d))
}

export const paraISO = (d: Date): string => d.toISOString().slice(0, 10)

export const somarDias = (iso: string, n: number): string =>
  paraISO(new Date(paraDate(iso).getTime() + n * DIA))

// Quantos dias de "a" até "b" (b - a).
export const difDias = (a: string, b: string): number =>
  Math.round((paraDate(b).getTime() - paraDate(a).getTime()) / DIA)

// Segunda-feira da semana de uma data.
export const segundaDe = (iso: string): string => {
  const diaSemana = paraDate(iso).getUTCDay() // 0=domingo
  return somarDias(iso, -((diaSemana + 6) % 7))
}

export const formatarBR = (iso: string): string => iso.split('-').reverse().join('/')

export const hojeISO = (): string => paraISO(new Date())

export const sobrepoe = (
  a: { inicio: string; fim: string },
  b: { inicio: string; fim: string },
): boolean => a.inicio <= b.fim && b.inicio <= a.fim

// Dias úteis (seg–sex, sem feriados) entre duas datas, inclusive.
export const diasUteis = (inicio: string, fim: string, feriados: string[]): number => {
  let total = 0
  for (let d = inicio; d <= fim; d = somarDias(d, 1)) {
    const dow = paraDate(d).getUTCDay()
    if (dow !== 0 && dow !== 6 && !feriados.includes(d)) total++
  }
  return total
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
export const nomeMes = (iso: string): string => `${MESES[paraDate(iso).getUTCMonth()]}/${iso.slice(2, 4)}`
