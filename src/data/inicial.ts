import type { Dados, VinculoPessoaEquipe } from '../types'
import seed from './seed.json'
import feriadosJson from './feriados.json'
import vinculosReferenciaJson from './vinculos-referencia.json'

// Base vazia para novos registros, sem importar dados de referência.
const dadosOrigem = seed as Dados
export const dadosIniciais: Dados = {
  ...dadosOrigem,
  pessoas: dadosOrigem.pessoas.map(({ id, nome, funcao }) => ({ id, nome, funcao })),
  marcos: [],
  vinculosEquipe: vinculosReferenciaJson as VinculoPessoaEquipe[],
  fontesImportadas: ['alocacao-equipes-2026', 'formacao-equipe-global-v2', 'equipes-arq-numeradas-v1'],
}
export const feriados: string[] = feriadosJson
