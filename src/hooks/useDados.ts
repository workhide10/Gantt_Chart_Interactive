import { useEffect } from 'react'
import type { Atividade, Dados, MarcoProjeto } from '../types'
import { dadosIniciais } from '../data/inicial'
import { migrarDados } from '../lib/migracoes'
import { validarDados } from '../lib/validacao'
import { ajustarPeriodoAtividade, registrarAtividade, registrarMarco, removerAtividade, removerMarco } from '../lib/registros'
import { useLocalStorage } from './useLocalStorage'

export function useDados() {
  const [dados, setDados, armazenamento] = useLocalStorage<Dados>('gantt-equipes:v1', dadosIniciais, validarDados)

  useEffect(() => {
    setDados((atuais) => migrarDados(atuais, dadosIniciais))
  }, [dados, setDados])

  const substituirDados = (novos: Dados) => {
    armazenamento.liberarGravacao()
    setDados(migrarDados(novos, dadosIniciais))
  }

  return {
    dados, setDados, armazenamento,
    substituirDados,
    restaurarDados: () => substituirDados(dadosIniciais),
    salvarAtividade: (atividade: Atividade) => setDados((atuais) => registrarAtividade(atuais, atividade)),
    redimensionarAtividade: (atividade: Atividade) => setDados((atuais) => ajustarPeriodoAtividade(atuais, atividade)),
    excluirAtividade: (id: string) => setDados((atuais) => removerAtividade(atuais, id)),
    salvarMarco: (marco: MarcoProjeto) => setDados((atuais) => registrarMarco(atuais, marco)),
    excluirMarco: (id: string) => setDados((atuais) => removerMarco(atuais, id)),
  }
}
