import type { Atividade, Dados, Filtros } from '../types'
import { dataISOValida, diasCorridos, difDias, somarDias } from './datas.ts'
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
    inicio: somarDias(periodos[i].fim, 1), fim: somarDias(p.inicio, -1), dias: diasCorridos(somarDias(periodos[i].fim, 1), somarDias(p.inicio, -1)),
  })).filter((pausa) => pausa.dias > 0)
  const inicio = periodos[0]?.inicio ?? ''
  const fim = periodos[periodos.length - 1]?.fim ?? ''
  const diasAtivos = periodos.reduce((total, p) => total + diasCorridos(p.inicio, p.fim), 0)
  const diasJanela = inicio ? diasCorridos(inicio, fim) : 0
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

export function analisarAtividades(dados: Dados, filtros: Filtros, periodo: IntervaloAnalise) {
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
  const porDisciplina = new Map<string, Atividade[]>()
  const disciplinaPorEquipe = new Map(dados.equipes.map((e) => [e.id, e.disciplinaId]))
  for (const a of delimitadas) {
    const lista = porEquipe.get(a.equipeId) ?? []
    lista.push(a)
    porEquipe.set(a.equipeId, lista)
    const disciplinaId = disciplinaPorEquipe.get(a.equipeId)
    if (disciplinaId) {
      const atividadesDisciplina = porDisciplina.get(disciplinaId) ?? []
      atividadesDisciplina.push(a)
      porDisciplina.set(disciplinaId, atividadesDisciplina)
    }
  }
  const equipes = dados.equipes.flatMap((equipe) => {
    const lista = porEquipe.get(equipe.id)
    if (!lista?.length) return []
    return [{ id: equipe.id, nome: equipe.nome, disciplinaId: equipe.disciplinaId, atividades: lista.length,
      dias: analisarExecucao(lista).diasAtivos, conflitos: contarSobreposicoes(lista) }]
  }).sort((a, b) => b.dias - a.dias || a.nome.localeCompare(b.nome, 'pt-BR'))
  const disciplinas = dados.disciplinas.flatMap((d, indiceCor) => {
    const lista = equipes.filter((e) => e.disciplinaId === d.id)
    return lista.length ? [{ id: d.id, nome: d.sigla, indiceCor, dias: analisarExecucao(porDisciplina.get(d.id) ?? []).diasAtivos, atividades: lista.reduce((s, e) => s + e.atividades, 0) }] : []
  }).sort((a, b) => b.dias - a.dias || a.nome.localeCompare(b.nome, 'pt-BR'))
  const primeiro = delimitadas.reduce((min, a) => !min || a.inicio < min ? a.inicio : min, '')
  const ultimo = delimitadas.reduce((max, a) => a.fim > max ? a.fim : max, '')
  const inicio = periodo.inicio || primeiro
  const fim = periodo.fim || ultimo
  const execucaoGeral = analisarExecucao(delimitadas)
  const conclusoesPorMes = new Map<string, number>()
  for (const atividade of atividades) {
    if ((periodo.inicio && atividade.fim < periodo.inicio) || (periodo.fim && atividade.fim > periodo.fim)) continue
    const mes = atividade.fim.slice(0, 7)
    conclusoesPorMes.set(mes, (conclusoesPorMes.get(mes) ?? 0) + 1)
  }
  const meses: { mes: string; conclusoes: number; dias: number }[] = []
  if (atividades.length && inicio && fim) {
    let mes = `${inicio.slice(0, 7)}-01`
    while (mes <= fim) {
      const ano = Number(mes.slice(0, 4)), numero = Number(mes.slice(5, 7))
      const proximo = `${numero === 12 ? ano + 1 : ano}-${String(numero === 12 ? 1 : numero + 1).padStart(2, '0')}-01`
      const fimMes = somarDias(proximo, -1)
      meses.push({ mes,
        conclusoes: conclusoesPorMes.get(mes.slice(0, 7)) ?? 0,
        dias: execucaoGeral.periodos.reduce((total, intervalo) => {
          const de = intervalo.inicio > mes ? intervalo.inicio : mes
          const ate = intervalo.fim < fimMes ? intervalo.fim : fimMes
          return total + (de <= ate ? diasCorridos(de, ate) : 0)
        }, 0),
      })
      mes = proximo
    }
  }
  // Durações integrais para comparar o tamanho das atividades, sem encurtá-las pelo filtro.
  const duracoes = atividades.map((a) => diasCorridos(a.inicio, a.fim)).sort((a, b) => a - b)
  const faixas = [
    { nome: 'Até 5 dias', min: 0, max: 5 }, { nome: '6 a 10 dias', min: 6, max: 10 },
    { nome: '11 a 20 dias', min: 11, max: 20 }, { nome: 'Mais de 20', min: 21, max: Infinity },
  ].map((f) => ({ nome: f.nome, quantidade: duracoes.filter((d) => d >= f.min && d <= f.max).length }))
  const meio = Math.floor(duracoes.length / 2)
  const mediana = duracoes.length ? (duracoes.length % 2 ? duracoes[meio] : (duracoes[meio - 1] + duracoes[meio]) / 2) : null
  const dias = execucaoGeral.diasAtivos
  return { periodoInvalido, atividades, inicio, fim, meses, equipes, disciplinas, faixas, mediana, dias,
    projetos: new Set(atividades.map((a) => a.escolaId)).size, conflitos: equipes.reduce((s, e) => s + e.conflitos, 0) }
}

// Pico diário de projetos distintos simultâneos, por equipe e mês.
export function simultaneidadeMensal(atividades: Atividade[], ano: number) {
  const resultado = new Map<string, number[]>()
  const porEquipe = new Map<string, Atividade[]>()
  for (const a of atividades) {
    const lista = porEquipe.get(a.equipeId) ?? []
    lista.push(a); porEquipe.set(a.equipeId, lista)
  }
  for (const [equipeId, lista] of porEquipe) {
    const picos = Array<number>(12).fill(0)
    const inicioAno = `${ano}-01-01`, fimAno = `${ano}-12-31`
    for (let dia = inicioAno; dia <= fimAno; dia = somarDias(dia, 1)) {
      const projetos = new Set(lista.filter((a) => a.inicio <= dia && a.fim >= dia).map((a) => a.escolaId))
      const mes = Number(dia.slice(5, 7)) - 1
      picos[mes] = Math.max(picos[mes], projetos.size)
    }
    if (picos.some(Boolean)) resultado.set(equipeId, picos)
  }
  return resultado
}

// Projetos distintos com pelo menos um dia registrado em cada mês por disciplina.
export function projetosMensaisPorDisciplina(atividades: Atividade[], equipes: Dados['equipes'], ano: number) {
  const disciplinaPorEquipe = new Map(equipes.map((e) => [e.id, e.disciplinaId]))
  const agrupados = new Map<string, Set<string>[]>()
  for (const atividade of atividades) {
    const disciplinaId = disciplinaPorEquipe.get(atividade.equipeId)
    if (!disciplinaId) continue
    for (let mes = 1; mes <= 12; mes++) {
      const mesReferencia = `${ano}-${String(mes).padStart(2, '0')}`
      if (atividade.inicio.slice(0, 7) > mesReferencia || atividade.fim.slice(0, 7) < mesReferencia) continue
      let meses = agrupados.get(disciplinaId)
      if (!meses) { meses = Array.from({ length: 12 }, () => new Set<string>()); agrupados.set(disciplinaId, meses) }
      meses[mes - 1].add(atividade.escolaId)
    }
  }
  return new Map([...agrupados].map(([id, meses]) => [id, meses.map((projetos) => projetos.size)]))
}

// Janela global fixa, independente dos filtros, usando os primeiros e últimos registros.
export function janelaGlobalAtividades(atividades: Atividade[]) {
  if (!atividades.length) return { inicio: '', fim: '', dias: 0 }
  const inicio = atividades.reduce((menor, a) => a.inicio < menor ? a.inicio : menor, atividades[0].inicio)
  const fim = atividades.reduce((maior, a) => a.fim > maior ? a.fim : maior, atividades[0].fim)
  return { inicio, fim, dias: diasCorridos(inicio, fim) }
}

// Janela completa do projeto selecionado ou de toda a plataforma.
export function janelaReferencia(dados: Dados, projetoId: string) {
  return janelaGlobalAtividades(projetoId ? dados.atividades.filter((a) => a.escolaId === projetoId) : dados.atividades)
}
