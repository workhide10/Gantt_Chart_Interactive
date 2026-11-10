import { useEffect, useState } from 'react'

// Arquivos incompatíveis são preservados para recuperação, sem sobrescrita automática.
export function useLocalStorage<T>(chave: string, inicial: T, validar?: (valor: unknown) => valor is T) {
  const [leitura] = useState(() => {
    let original: string | null = null
    try {
      original = localStorage.getItem(chave)
      if (original === null) return { valor: inicial, original, erro: '', bloqueado: false }
      const salvo: unknown = JSON.parse(original)
      if (validar && !validar(salvo)) throw new Error('Dados incompatíveis')
      return { valor: salvo as T, original, erro: '', bloqueado: false }
    } catch {
      return { valor: inicial, original, erro: 'Não foi possível carregar os dados salvos. O conteúdo original foi preservado; importe um backup válido ou restaure os dados de referência para voltar a salvar.', bloqueado: true }
    }
  })
  const [valor, setValor] = useState<T>(leitura.valor)
  const [bloqueado, setBloqueado] = useState(leitura.bloqueado)
  const [erro, setErro] = useState(leitura.erro)

  useEffect(() => {
    if (bloqueado) return
    try {
      localStorage.setItem(chave, JSON.stringify(valor))
      setErro('')
    } catch {
      setErro('As alterações estão apenas nesta sessão: o navegador não permitiu gravá-las. Exporte um backup antes de fechar a página.')
    }
  }, [chave, valor, bloqueado])

  const liberarGravacao = () => { setBloqueado(false); setErro('') }
  return [valor, setValor, { erro, bloqueado, original: leitura.original, liberarGravacao }] as const
}
