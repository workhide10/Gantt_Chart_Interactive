import { useEffect, useState } from 'react'

// Funciona igual ao useState, mas guarda o valor no localStorage do navegador.
// Assim os dados continuam lá depois de fechar e abrir a página.
export function useLocalStorage<T>(chave: string, inicial: T) {
  const [valor, setValor] = useState<T>(() => {
    try {
      const salvo = localStorage.getItem(chave)
      return salvo ? (JSON.parse(salvo) as T) : inicial
    } catch {
      return inicial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(valor))
    } catch {
      // armazenamento cheio ou bloqueado: o app continua funcionando, só não salva
    }
  }, [chave, valor])

  return [valor, setValor] as const
}
