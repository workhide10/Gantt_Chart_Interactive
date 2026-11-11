import { useMemo, useState } from 'react'
import type { Dados, Filtros } from '../types'
import { feriados } from '../data/inicial'
import { analisarAtividades, analisarExecucaoProjetos, projetosMensaisPorDisciplina, janelaGlobalAtividades, type IntervaloAnalise } from '../lib/analises'
import { formatarBR, hojeISO, somarDias } from '../lib/datas'
import { GraficoDisciplinas, GraficoProjetosDisciplina } from './GraficosAnalises'
import { ExecucaoProjetos } from './ExecucaoProjetos'

interface Props {
  dados: Dados
  filtros: Filtros
  periodo: IntervaloAnalise
  onPeriodoChange: (periodo: IntervaloAnalise) => void
  onFiltrosChange: (filtros: Filtros) => void
}

export function DashboardAnalises({ dados, filtros, periodo, onPeriodoChange, onFiltrosChange }: Props) {
  const analise = useMemo(() => analisarAtividades(dados, filtros, periodo, feriados), [dados, filtros, periodo])
  const janelaGlobal = useMemo(() => janelaGlobalAtividades(dados.atividades, feriados), [dados.atividades])
  const [todasEquipes, setTodasEquipes] = useState(false)
  const selecionarEquipe = (id: string) => {
    const equipe = dados.equipes.find((e) => e.id === id)
    onFiltrosChange({ ...filtros, equipeId: id, disciplinaId: equipe?.disciplinaId ?? '' })
  }
  const equipeMaisConflitos = [...analise.equipes].sort((a, b) => b.conflitos - a.conflitos)[0]
  const equipeMaiorCarga = analise.equipes[0]
  const conclusoes = analise.meses.reduce((s, m) => s + m.conclusoes, 0)
  const hoje = hojeISO()
  const [ano, setAno] = useState(Number(hoje.slice(0, 4)))
  const projetosCompletos = useMemo(() => analisarExecucaoProjetos(dados, filtros.escolaId, feriados), [dados, filtros.escolaId])
  const mediaProjetos = projetosCompletos.length ? projetosCompletos.reduce((s, p) => s + p.diasJanela, 0) / projetosCompletos.length : null
  const simultaneidade = useMemo(() => projetosMensaisPorDisciplina(analise.atividades.map((a) => ({ ...a, inicio: periodo.inicio && a.inicio < periodo.inicio ? periodo.inicio : a.inicio, fim: periodo.fim && a.fim > periodo.fim ? periodo.fim : a.fim })), dados.equipes, Number.isInteger(ano) && ano >= 1900 && ano <= 9999 ? ano : Number(hoje.slice(0, 4)), feriados), [analise.atividades, dados.equipes, periodo, ano, hoje])

  return <section className="dashboard" aria-labelledby="dashboard-titulo">
    <div className="dashboard-cabecalho">
      <div><span className="dashboard-sobretitulo">VISÃO GERENCIAL</span><h2 id="dashboard-titulo">Planejamento e prazos</h2><p>Entenda o ritmo de execução, a distribuição de trabalho e os pontos de atenção.</p></div>
      <span className="dashboard-periodo">{analise.inicio && analise.fim && !analise.periodoInvalido ? `${formatarBR(analise.inicio)} — ${formatarBR(analise.fim)}` : 'Histórico de atividades'}</span>
    </div>
    <div className="filtro-periodo dashboard-filtros">
      <div className="filtro-periodo-texto"><strong>Período de análise</strong><span>Atividades que coincidem com o intervalo selecionado.</span>
        <div className="atalhos-periodo">
          <button onClick={() => onPeriodoChange({ inicio: '', fim: '' })}>Todo o histórico</button>
          <button onClick={() => onPeriodoChange({ inicio: somarDias(hoje, -89), fim: hoje })}>Últimos 90 dias</button>
          <button onClick={() => onPeriodoChange({ inicio: `${hoje.slice(0, 4)}-01-01`, fim: hoje })}>Este ano</button>
        </div>
      </div>
      <label>De<input type="date" value={periodo.inicio} max={periodo.fim || undefined} onChange={(e) => onPeriodoChange({ ...periodo, inicio: e.target.value })} /></label>
      <label>Até<input type="date" value={periodo.fim} min={periodo.inicio || undefined} onChange={(e) => onPeriodoChange({ ...periodo, fim: e.target.value })} /></label>
    </div>
    {analise.periodoInvalido ? <p className="erro-periodo" role="alert">Informe um período válido, com a data inicial anterior ou igual à final.</p> : <>
      <div className="indicadores-dashboard">
        <div className="indicador"><span>Atividades no período</span><b>{analise.atividades.length.toLocaleString('pt-BR')}</b><small>{conclusoes} término(s) dentro do intervalo</small></div>
        <div className="indicador"><span>Projetos com atividades</span><b>{analise.projetos}</b><small>{analise.equipes.length} equipe(s) alocada(s)</small></div>
        <div className="indicador"><span>Dias úteis alocados</span><b>{analise.dias.toLocaleString('pt-BR')}</b><small>Dias distintos com registros no recorte</small></div>
        <div className={`indicador${analise.conflitos ? ' indicador-atencao' : ''}`}><span>Sobreposições de equipe</span><b>{analise.conflitos}</b><small>Pares com dias úteis em comum</small></div>
        <div className="indicador"><span>Duração mediana</span><b>{analise.mediana === null ? '—' : analise.mediana.toLocaleString('pt-BR')}<em>{analise.mediana !== null && ' dias'}</em></b><small>Dias úteis • duração integral das atividades</small></div>
      </div>
      {analise.atividades.length === 0 ? <div className="dashboard-vazio"><span aria-hidden="true">◇</span><h3>Nenhuma atividade neste recorte</h3><p>Ajuste os filtros de projeto, disciplina, equipe ou período para explorar o histórico.</p><button onClick={() => { onPeriodoChange({ inicio: '', fim: '' }); onFiltrosChange({ escolaId: '', disciplinaId: '', equipeId: '' }) }}>Limpar todos os filtros</button></div> : <>
        <div className="dashboard-grade">
          <article className="painel-grafico painel-evolucao">
            <div className="painel-cabecalho"><div><h3>Projetos por disciplina</h3><p>Projetos distintos com trabalho registrado em dias úteis por disciplina e mês, conforme os filtros e o período selecionado.</p></div><label>Ano <input type="number" min="1900" max="9999" value={ano} onChange={(e) => setAno(Number(e.target.value))} /></label></div>
            <GraficoProjetosDisciplina disciplinas={dados.disciplinas} projetosMensais={simultaneidade} onSelecionar={(id) => onFiltrosChange({ ...filtros, disciplinaId: id, equipeId: '' })} />
          </article>

          <article className="painel-grafico painel-equipes">
            <div className="painel-cabecalho"><div><h3>Carga por equipe</h3><p>Dias úteis alocados no período. Clique em uma equipe para explorar.</p></div><span className="selo-painel">{analise.equipes.length} equipes</span></div>
            <div className="ranking-equipes">{(todasEquipes ? analise.equipes : analise.equipes.slice(0, 8)).map((e) => <button className="ranking-linha" key={e.id} onClick={() => selecionarEquipe(e.id)} aria-label={`Filtrar equipe ${e.nome}, ${e.dias} dias úteis, ${e.conflitos} sobreposições`}>
              <span className="ranking-nome">{e.nome}</span><span className="ranking-trilho"><i style={{ width: `${e.dias / Math.max(1, equipeMaiorCarga?.dias ?? 0) * 100}%` }} /></span><strong>{e.dias}</strong>{e.conflitos > 0 ? <span className="selo-conflito" title="Pares de atividades com dias úteis sobrepostos">{e.conflitos} sobrep.</span> : <span className="ranking-sem-conflito">—</span>}
            </button>)}</div>
            {analise.equipes.length > 8 && <button className="botao-discreto" onClick={() => setTodasEquipes(!todasEquipes)}>{todasEquipes ? 'Mostrar as 8 primeiras' : `Ver todas as ${analise.equipes.length} equipes`}</button>}
            <p className="nota-grafico">Dias úteis distintos por equipe: registros simultâneos contam uma vez. A quantidade de projetos por disciplina aparece no gráfico acima.</p>
          </article>
          <article className="painel-grafico painel-disciplinas">
            <div className="painel-cabecalho"><div><h3>Tempo de execução por disciplina</h3><p>Dias úteis distintos de cada disciplina em relação à janela total da plataforma. Clique para filtrar.</p></div></div>
            {analise.dias > 0 ? <GraficoDisciplinas disciplinas={analise.disciplinas} janela={janelaGlobal} onSelecionar={(id) => onFiltrosChange({ ...filtros, disciplinaId: id, equipeId: '' })} /> : <p className="vazio">As atividades selecionadas não cobrem dias úteis.</p>}
          </article>
        </div>
        <div className="dashboard-leituras">
          <div><span className="leitura-marcador" aria-hidden="true">↗</span><div><strong>Concentração de trabalho</strong><p>{equipeMaiorCarga?.nome ?? '—'} tem {equipeMaiorCarga?.dias ?? 0} dias úteis distintos com registros neste recorte.</p></div></div>
          <div><span className="leitura-marcador leitura-atencao" aria-hidden="true">◇</span><div><strong>{analise.conflitos ? 'Revisar simultaneidade' : 'Distribuição sem sobreposições'}</strong><p>{analise.conflitos ? `${equipeMaisConflitos.nome} tem ${equipeMaisConflitos.conflitos} par(es) de atividades sobrepostas. Verifique a disponibilidade antes de repetir essa alocação.` : 'Nenhum par de atividades da mesma equipe compartilha dias úteis neste recorte.'}</p>{analise.conflitos > 0 && <button className="botao-discreto" onClick={() => selecionarEquipe(equipeMaisConflitos.id)}>Explorar equipe</button>}</div></div>
        </div>
      </>}
      <section className="painel-grafico"><h3>Duração dos projetos com registros</h3><p>{projetosCompletos.length} projeto(s) · duração média da janela: {mediaProjetos === null ? '—' : mediaProjetos.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + ' dias úteis'}.</p><p>A janela vai do primeiro ao último registro e inclui pausas úteis. Usa o histórico completo e respeita apenas o filtro de projeto; não indica conclusão nem prazo contratual.</p></section>
      <ExecucaoProjetos dados={dados} escolaId={filtros.escolaId} onSelecionar={(id) => onFiltrosChange({ ...filtros, escolaId: id })} />
      <p className="dashboard-metodologia">Leitura dos indicadores: os feriados considerados são somente os cadastrados no calendário de referência, atualmente parcial e limitado a 2026. As datas são registros de execução. A base não possui um prazo planejado separado; por isso, pausas e sobreposições ajudam a investigar o histórico, mas não comprovam atraso contratual. Os dias distintos são contados uma vez dentro de cada equipe, disciplina ou total; disciplinas diferentes podem compartilhar datas. Dias úteis não representam horas ou produtividade.</p>
    </>}
  </section>
}
