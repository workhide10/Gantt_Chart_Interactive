import type { Atividade, Dados, Filtros } from '../types'
import { dataISOValida, diasUteis, difDias, somarDias } from './datas.ts'
import { filtrarAtividades } from './filtrar.ts'
import { contarSobreposicoes } from './gantt.ts'

export interface IntervaloAnalise { inicio: string; fim: string }
interface Periodo { inicio: string; fim: string }

export function analisarExecucao(atividades: Periodo[]) {
  const ordenadas = [...atividades].sort((a, b) => a.inicio.localeCompare(b.inicio) || a.fim.localeCompare(b.fim))
  const periodos: Periodo[] = []
  for (const atividade of ordenadas) {
    const anterior = periodos[periodos.length - 1]
    if (anterior && difDias(anterior.fim, atividade.inicio) <= 1) {
      if (atividade.fim > anterior.fim) anterior.fim = atividade.fim
    } else periodos.push({ inicio: atividade.inicio, fim: atividade.fim })
  }
  const pausas = periodos.slice(1).map((p, i) => ({
    inicio: somarDias(periodos[i].fim, 1), fim: somarDias(p.inicio, -1), dias: difDias(periodos[i].fim, p.inicio) - 1,
  }))
  const inicio = periodos[0]?.inicio ?? ''
  const fim = periodos[periodos.length - 1]?.fim ?? ''
  const diasAtivos = periodos.reduce((total, p) => total + difDias(p.inicio, p.fim) + 1, 0)
  const diasJanela = inicio ? difDias(inicio, fim) + 1 : 0
  return { inicio, fim, periodos, pausas, diasAtivos, diasJanela, diasPausados: diasJanela - diasAtivos }
}

// Esta visão conserva a execução completa do projeto, independentemente da disciplina e do recorte de datas.
export function analisarExecucaoProjetos(dados: Dados, escolaId: string) {
  const porProjeto = new Map<string, Atividade[]>()
  for (const a of dados.atividades) {
    if (escolaId && a.escolaId !== escolaId) continue
    const lista = porProjeto.get(a.escolaId) ?? []
    lista.push(a)
    porProjeto.set(a.escolaId, lista)
  }
  const projetos = new Map(dados.escolas.map((p) => [p.id, p]))
  return [...porProjeto].map(([id, atividades]) => {
    const projeto = projetos.get(id)
    return { id, codigo: projeto?.codigo ?? 'Projeto removido', nome: projeto?.nome ?? '', cor: projeto?.cor ?? '#94a3b8', ...analisarExecucao(atividades) }
  }).sort((a, b) => b.diasAtivos - a.diasAtivos || a.codigo.localeCompare(b.codigo, 'pt-BR'))
}

export function analisarAtividades(dados: Dados, filtros: Filtros, periodo: IntervaloAnalise, feriados: string[]) {
  const periodoInvalido = Boolean((periodo.inicio && !dataISOValida(periodo.inicio)) || (periodo.fim && !dataISOValida(periodo.fim)) ||
    (periodo.inicio && periodo.fim && periodo.inicio > periodo.fim))
  const atividades = periodoInvalido ? [] : filtrarAtividades(dados, filtros).filter((a) =>
    (!periodo.inicio || a.fim >= periodo.inicio) && (!periodo.fim || a.inicio <= periodo.fim),
  )
  const delimitadas = atividades.map((a) => ({ ...a,
    inicio: periodo.inicio && periodo.inicio > a.inicio ? periodo.inicio : a.inicio,
    fim: periodo.fim && periodo.fim < a.fim ? periodo.fim : a.fim,
  }))
  const porEquipe = new Map<string, Atividade[]>()
  for (const a of delimitadas) {
    const lista = porEquipe.get(a.equipeId) ?? []
    lista.push(a)
    porEquipe.set(a.equipeId, lista)
  }
  const equipes = dados.equipes.flatMap((equipe) => {
    const lista = porEquipe.get(equipe.id)
    if (!lista?.length) return []
    return [{ id: equipe.id, nome: equipe.nome, disciplinaId: equipe.disciplinaId, atividades: lista.length,
      dias: lista.reduce((s, a) => s + diasUteis(a.inicio, a.fim, feriados), 0), conflitos: contarSobreposicoes(lista) }]
  }).sort((a, b) => b.dias - a.dias || a.nome.localeCompare(b.nome, 'pt-BR'))
  const disciplinas = dados.disciplinas.flatMap((d, indiceCor) => {
    const lista = equipes.filter((e) => e.disciplinaId === d.id)
    return lista.length ? [{ id: d.id, nome: d.sigla, indiceCor, dias: lista.reduce((s, e) => s + e.dias, 0), atividades: lista.reduce((s, e) => s + e.atividades, 0) }] : []
  }).sort((a, b) => b.dias - a.dias || a.nome.localeCompare(b.nome, 'pt-BR'))
  const primeiro = delimitadas.reduce((min, a) => !min || a.inicio < min ? a.inicio : min, '')
  const ultimo = delimitadas.reduce((max, a) => a.fim > max ? a.fim : max, '')
  const inicio = periodo.inicio || primeiro
  const fim = periodo.fim || ultimo
  const meses: { mes: string; conclusoes: number; dias: number }[] = []
  if (atividades.length && inicio && fim) {
    let mes = `${inicio.slice(0, 7)}-01`
    while (mes <= fim) {
      const ano = Number(mes.slice(0, 4)), numero = Number(mes.slice(5, 7))
      const proximo = `${numero === 12 ? ano + 1 : ano}-${String(numero === 12 ? 1 : numero + 1).padStart(2, '0')}-01`
      const fimMes = somarDias(proximo, -1)
      meses.push({ mes,
        conclusoes: atividades.filter((a) => a.fim >= mes && a.fim <= fimMes && (!periodo.inicio || a.fim >= periodo.inicio) && (!periodo.fim || a.fim <= periodo.fim)).length,
        dias: delimitadas.reduce((s, a) => {
          const de = a.inicio > mes ? a.inicio : mes, ate = a.fim < fimMes ? a.fim : fimMes
          return s + (de <= ate ? diasUteis(de, ate, feriados) : 0)
        }, 0),
      })
      mes = proximo
    }
  }
  // Durações integrais para comparar o tamanho das atividades, sem encurtá-las pelo filtro.
  const duracoes = atividades.map((a) => diasUteis(a.inicio, a.fim, feriados)).sort((a, b) => a - b)
  const faixas = [
    { nome: 'Até 5 dias', min: 0, max: 5 }, { nome: '6 a 10 dias', min: 6, max: 10 },
    { nome: '11 a 20 dias', min: 11, max: 20 }, { nome: 'Mais de 20', min: 21, max: Infinity },
  ].map((f) => ({ nome: f.nome, quantidade: duracoes.filter((d) => d >= f.min && d <= f.max).length }))
  const meio = Math.floor(duracoes.length / 2)
  const mediana = duracoes.length ? (duracoes.length % 2 ? duracoes[meio] : (duracoes[meio - 1] + duracoes[meio]) / 2) : null
  const dias = equipes.reduce((s, e) => s + e.dias, 0)
  return { periodoInvalido, atividades, inicio, fim, meses, equipes, disciplinas, faixas, mediana, dias,
    projetos: new Set(atividades.map((a) => a.escolaId)).size, conflitos: equipes.reduce((s, e) => s + e.conflitos, 0) }
}
