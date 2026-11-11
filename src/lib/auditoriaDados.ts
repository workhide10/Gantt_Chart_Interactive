import type { Dados } from '../types'
import { diasUteisCalendario, somarDias } from './datas.ts'

export function auditarDados(dados: Dados): string[] {
  const achados: string[] = []
  const lotacoes = dados.lotacoes ?? []
  let diasSemLotacao = 0
  for (const a of dados.atividades.filter((x) => (x.situacao ?? 'realizada') === 'realizada')) {
    for (let dia = a.inicio; dia <= a.fim; dia = somarDias(dia, 1)) {
      if (diasUteisCalendario(dia, dia, dados.calendario ?? []) && !lotacoes.some((l) => l.equipeId === a.equipeId && l.inicio <= dia && (!l.fim || l.fim >= dia))) diasSemLotacao++
    }
  }
  if (diasSemLotacao) achados.push(`${diasSemLotacao} dia(s)-equipe de atividade sem nenhuma lotação de integrante`)
  let lotacoesSobrepostas = 0
  for (const pessoaId of new Set(lotacoes.map((l) => l.pessoaId))) {
    const itens = lotacoes.filter((l) => l.pessoaId === pessoaId).sort((a, b) => a.inicio.localeCompare(b.inicio))
    for (let i = 1; i < itens.length; i++) if (!itens[i - 1].fim || itens[i - 1].fim! >= itens[i].inicio) lotacoesSobrepostas++
  }
  if (lotacoesSobrepostas) achados.push(`${lotacoesSobrepostas} sobreposição(ões) entre lotações da mesma pessoa`)
  const conflitos = dados.atividades.filter((a) => (a.situacao ?? 'realizada') === 'realizada').reduce((total, a, i, lista) => total + lista.slice(i + 1).filter((b) => b.equipeId === a.equipeId && a.inicio <= b.fim && b.inicio <= a.fim).length, 0)
  if (conflitos) achados.push(`${conflitos} par(es) de atividades realizadas com períodos sobrepostos na mesma equipe`)
  const anos = new Set(dados.atividades.map((a) => a.inicio.slice(0, 4)))
  for (const ano of anos) if (!(dados.calendario ?? []).some((d) => d.data.startsWith(ano))) achados.push(`calendário sem datas cadastradas para ${ano}`)
  return achados
}
