import { useMemo, useState } from 'react'
import type { Dados, Filtros } from '../types'
import { feriados } from '../data/inicial'
import { analisarAtividades, type IntervaloAnalise } from '../lib/analises'
import { formatarBR, hojeISO, somarDias } from '../lib/datas'
import { GraficoDisciplinas, GraficoDuracoes, GraficoEvolucao } from './GraficosAnalises'
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
  const [metrica, setMetrica] = useState<'conclusoes' | 'dias'>('conclusoes')
  const [todasEquipes, setTodasEquipes] = useState(false)
  const selecionarEquipe = (id: string) => {
    const equipe = dados.equipes.find((e) => e.id === id)
    onFiltrosChange({ ...filtros, equipeId: id, disciplinaId: equipe?.disciplinaId ?? '' })
  }
  const equipeMaisConflitos = [...analise.equipes].sort((a, b) => b.conflitos - a.conflitos)[0]
  const equipeMaiorCarga = analise.equipes[0]
  const conclusoes = analise.meses.reduce((s, m) => s + m.conclusoes, 0)
  const hoje = hojeISO()

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
        <div className="indicador"><span>Dias úteis alocados</span><b>{analise.dias.toLocaleString('pt-BR')}</b><small>Soma dos dias das atividades no recorte</small></div>
        <div className={`indicador${analise.conflitos ? ' indicador-atencao' : ''}`}><span>Sobreposições de equipe</span><b>{analise.conflitos}</b><small>Pares de atividades com datas em comum</small></div>
        <div className="indicador"><span>Duração mediana</span><b>{analise.mediana === null ? '—' : analise.mediana.toLocaleString('pt-BR')}<em>{analise.mediana !== null && ' dias'}</em></b><small>Dias úteis • duração integral das atividades</small></div>
      </div>
      {analise.atividades.length === 0 ? <div className="dashboard-vazio"><span aria-hidden="true">◇</span><h3>Nenhuma atividade neste recorte</h3><p>Ajuste os filtros de projeto, disciplina, equipe ou período para explorar o histórico.</p><button onClick={() => { onPeriodoChange({ inicio: '', fim: '' }); onFiltrosChange({ escolaId: '', disciplinaId: '', equipeId: '' }) }}>Limpar todos os filtros</button></div> : <>
        <div className="dashboard-grade">
          <article className="painel-grafico painel-evolucao">
            <div className="painel-cabecalho"><div><h3>Ritmo de execução</h3><p>{metrica === 'conclusoes' ? 'Atividades por mês de término registrado.' : 'Dias úteis das atividades distribuídos pelos meses do período.'}</p></div><div className="seg" aria-label="Métrica da evolução"><button className={metrica === 'conclusoes' ? 'ativo' : ''} aria-pressed={metrica === 'conclusoes'} onClick={() => setMetrica('conclusoes')}>Conclusões</button><button className={metrica === 'dias' ? 'ativo' : ''} aria-pressed={metrica === 'dias'} onClick={() => setMetrica('dias')}>Dias alocados</button></div></div>
            <GraficoEvolucao meses={analise.meses} metrica={metrica} />
          </article>
          <article className="painel-grafico painel-disciplinas">
            <div className="painel-cabecalho"><div><h3>Distribuição por disciplina</h3><p>Participação nos dias úteis alocados. Clique para filtrar.</p></div></div>
            {analise.dias > 0 ? <GraficoDisciplinas disciplinas={analise.disciplinas} onSelecionar={(id) => onFiltrosChange({ ...filtros, disciplinaId: id, equipeId: '' })} /> : <p className="vazio">As atividades selecionadas não cobrem dias úteis.</p>}
          </article>
          <article className="painel-grafico painel-equipes">
            <div className="painel-cabecalho"><div><h3>Carga por equipe</h3><p>Dias úteis alocados no período. Clique em uma equipe para explorar.</p></div><span className="selo-painel">{analise.equipes.length} equipes</span></div>
            <div className="ranking-equipes">{(todasEquipes ? analise.equipes : analise.equipes.slice(0, 8)).map((e) => <button className="ranking-linha" key={e.id} onClick={() => selecionarEquipe(e.id)} aria-label={`Filtrar equipe ${e.nome}, ${e.dias} dias úteis, ${e.conflitos} sobreposições`}>
              <span className="ranking-nome">{e.nome}</span><span className="ranking-trilho"><i style={{ width: `${e.dias / Math.max(1, equipeMaiorCarga?.dias ?? 0) * 100}%` }} /></span><strong>{e.dias}</strong>{e.conflitos > 0 ? <span className="selo-conflito" title="Pares de atividades sobrepostas">{e.conflitos} sobrep.</span> : <span className="ranking-sem-conflito">—</span>}
            </button>)}</div>
            {analise.equipes.length > 8 && <button className="botao-discreto" onClick={() => setTodasEquipes(!todasEquipes)}>{todasEquipes ? 'Mostrar as 8 primeiras' : `Ver todas as ${analise.equipes.length} equipes`}</button>}
            <p className="nota-grafico">Atividades simultâneas somam dias separadamente. Este indicador mede alocação registrada, sem presumir a capacidade da equipe.</p>
          </article>
          <article className="painel-grafico painel-duracoes">
            <div className="painel-cabecalho"><div><h3>Perfil de duração</h3><p>Quantidade de atividades por faixa de dias úteis.</p></div></div>
            <GraficoDuracoes faixas={analise.faixas} />
            <p className="nota-grafico">Duração integral das atividades que coincidem com o período. Fins de semana e feriados não contam.</p>
          </article>
        </div>
        <div className="dashboard-leituras">
          <div><span className="leitura-marcador" aria-hidden="true">↗</span><div><strong>Concentração de trabalho</strong><p>{equipeMaiorCarga?.nome ?? '—'} reúne {analise.dias ? Math.round((equipeMaiorCarga?.dias ?? 0) / analise.dias * 100) : 0}% dos dias úteis alocados deste recorte.</p></div></div>
          <div><span className="leitura-marcador leitura-atencao" aria-hidden="true">◇</span><div><strong>{analise.conflitos ? 'Revisar simultaneidade' : 'Distribuição sem sobreposições'}</strong><p>{analise.conflitos ? `${equipeMaisConflitos.nome} tem ${equipeMaisConflitos.conflitos} par(es) de atividades sobrepostas. Verifique a disponibilidade antes de repetir essa alocação.` : 'Nenhum par de atividades da mesma equipe compartilha datas neste recorte.'}</p>{analise.conflitos > 0 && <button className="botao-discreto" onClick={() => selecionarEquipe(equipeMaisConflitos.id)}>Explorar equipe</button>}</div></div>
        </div>
      </>}
      <ExecucaoProjetos dados={dados} escolaId={filtros.escolaId} onSelecionar={(id) => onFiltrosChange({ ...filtros, escolaId: id })} />
      <p className="dashboard-metodologia">Leitura dos indicadores: as datas são registros de execução. A base não possui um prazo planejado separado; por isso, pausas e sobreposições ajudam a investigar o histórico, mas não comprovam atraso contratual. Dias úteis alocados não representam horas ou produtividade.</p>
    </>}
  </section>
}
