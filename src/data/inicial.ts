import type { Dados } from '../types'
import seed from './seed.json'
import feriadosJson from './feriados.json'

// Dados importados da planilha "CRONOGRAMA GANTT - ALOCAÇÃO DE EQUIPES".
export const dadosIniciais = { ...seed, marcos: [] } as Dados
export const feriados: string[] = feriadosJson
