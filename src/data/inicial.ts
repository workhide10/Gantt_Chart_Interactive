import type { Dados, VinculoPessoaEquipe } from '../types'
import seed from './seed.json'
import feriadosJson from './feriados.json'
import vinculosReferenciaJson from './vinculos-referencia.json'

// Dados importados da planilha original e relações pessoa–projeto–equipe com vigência.
const dadosOrigem = seed as Dados
export const dadosIniciais: Dados = {
  ...dadosOrigem,
  pessoas: dadosOrigem.pessoas.map(({ id, nome, funcao }) => ({ id, nome, funcao })),
  marcos: [],
  vinculosEquipe: vinculosReferenciaJson as VinculoPessoaEquipe[],
  fontesImportadas: ['alocacao-equipes-2026'],
}
export const feriados: string[] = feriadosJson
