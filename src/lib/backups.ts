import type { Dados } from '../types'
import { validarDados } from './validacao.ts'

export function lerBackup(conteudo: string): Dados {
  const dados: unknown = JSON.parse(conteudo)
  if (!validarDados(dados)) throw new Error('O arquivo contém campos, datas ou referências inválidas.')
  return { ...dados, marcos: dados.marcos ?? [], eventosEquipe: dados.eventosEquipe ?? [], movimentacoesEquipe: dados.movimentacoesEquipe ?? [] }
}

export function baixarArquivo(conteudo: string, nome: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
