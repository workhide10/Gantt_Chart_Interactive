import { createPortal } from 'react-dom'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import type { Atividade, ComposicaoEquipe, Dados, EventoEquipe, Filtros, MarcoProjeto } from '../types'
import { feriados } from '../data/inicial'
import { difDias, formatarBR, hojeISO, nomeMes, segundaDe, somarDias } from '../lib/datas'
import { empacotar } from '../lib/gantt'
import { filtrarAtividades } from '../lib/filtrar'
import { criarIndiceComposicoes, integrantesNaAtividade } from '../lib/composicao'

const LARGURA_ROTULO = 150
const ALTURA_BARRA = 22
const FOLGA = 3
const MARGEM = 6

type Agrupar = 'equipe' | 'escola'
type EscalaTemporal = 'semanas' | 'meses' | 'trimestres'
type Extremidade = 'inicio' | 'fim'

interface SessaoRedimensionamento {
  pointerId: number
  extremidade: Extremidade
  xInicial: number
  atividade: Atividade
  previa: Atividade
}

interface TooltipFlutuante {
  conteudo: ReactNode
  ancora: DOMRect
  left: number
  top: number
}

interface Linha {
  id: string
  rotulo: string
  cor?: string
  atividades: Atividade[]
  marcos?: MarcoProjeto[]
  composicoes?: ComposicaoEquipe[]
  eventosEquipe?: EventoEquipe[]
}

interface Props {
  dados: Dados
  filtros: Filtros
  marcos: MarcoProjeto[]
  onEditar: (a: Atividade) => void
  onNova: (preset: Partial<Atividade>) => void
  onEditarMarco: (marco: MarcoProjeto) => void
  onRedimensionar: (atividade: Atividade) => void
}

export function Gantt({ dados, filtros, marcos, onEditar, onNova, onEditarMarco, onRedimensionar }: Props) {
  const [agrupar, setAgrupar] = useState<Agrupar>('equipe')
  const [escala, setEscala] = useState<EscalaTemporal>('meses')
  const [escolasOcultas, setEscolasOcultas] = useState<Set<string>>(() => new Set())
  const ganttRef = useRef<HTMLDivElement>(null)
  const [larguraVisivel, setLarguraVisivel] = useState(0)
  const [redimensionamento, setRedimensionamento] = useState<SessaoRedimensionamento | null>(null)
  const redimensionamentoRef = useRef<SessaoRedimensionamento | null>(null)
  const [tooltip, setTooltip] = useState<TooltipFlutuante | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const ocultarTooltip = () => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    tooltipTimer.current = null
    setTooltip(null)
  }

  const agendarTooltip = (event: ReactMouseEvent<HTMLElement>, obterConteudo: ReactNode | (() => ReactNode)) => {
    if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
    const elemento = event.currentTarget
    tooltipTimer.current = setTimeout(() => {
      setTooltip({ conteudo: typeof obterConteudo === 'function' ? obterConteudo() : obterConteudo, ancora: elemento.getBoundingClientRect(), left: 12, top: 12 })
    }, 650)
  }

  useLayoutEffect(() => {
    if (!tooltip || !tooltipRef.current) return
    const caixa = tooltipRef.current.getBoundingClientRect()
    const margem = 10
    const larguraViewport = window.innerWidth
    const alturaViewport = window.innerHeight
    let left = tooltip.ancora.left + tooltip.ancora.width / 2 - caixa.width / 2
    if (left + caixa.width > larguraViewport - margem) left = tooltip.ancora.right - caixa.width
    left = Math.max(margem, Math.min(left, larguraViewport - caixa.width - margem))
    let top = tooltip.ancora.bottom + 8
    if (top + caixa.height > alturaViewport - margem) top = tooltip.ancora.top - caixa.height - 8
    top = Math.max(margem, Math.min(top, alturaViewport - caixa.height - margem))
    if (left !== tooltip.left || top !== tooltip.top) setTooltip((atual) => atual ? { ...atual, left, top } : atual)
  }, [tooltip?.ancora])

  useEffect(() => () => { if (tooltipTimer.current) clearTimeout(tooltipTimer.current) }, [])

  const visiveis = useMemo(() => filtrarAtividades(dados, filtros), [dados, filtros])
  const atividadesDoDiagrama = useMemo(() => filtros.escolaId
    ? visiveis
    : visiveis.filter((atividade) => !escolasOcultas.has(atividade.escolaId)), [escolasOcultas, filtros.escolaId, visiveis])
  const indiceComposicoes = useMemo(() => criarIndiceComposicoes(dados), [dados.composicoesEquipe, dados.integrantesComposicao, dados.pessoas])
  const atividadesPorEquipe = useMemo(() => {
    const mapa = new Map<string, Atividade[]>()
    for (const atividade of atividadesDoDiagrama) {
      const lista = mapa.get(atividade.equipeId) ?? []
      lista.push(atividade)
      mapa.set(atividade.equipeId, lista)
    }
    return mapa
  }, [atividadesDoDiagrama])
  const atividadesPorEscola = useMemo(() => {
    const mapa = new Map<string, Atividade[]>()
    for (const atividade of atividadesDoDiagrama) {
      const lista = mapa.get(atividade.escolaId) ?? []
      lista.push(atividade)
      mapa.set(atividade.escolaId, lista)
    }
    return mapa
  }, [atividadesDoDiagrama])
  const escolaPorId = useMemo(() => new Map(dados.escolas.map((item) => [item.id, item])), [dados.escolas])
  const equipePorId = useMemo(() => new Map(dados.equipes.map((item) => [item.id, item])), [dados.equipes])

  useEffect(() => {
    if (filtros.escolaId) setEscolasOcultas(new Set())
  }, [filtros.escolaId])

  const alternarEscola = (escolaId: string) => setEscolasOcultas((atuais) => {
    const novas = new Set(atuais)
    if (novas.has(escolaId)) novas.delete(escolaId)
    else novas.add(escolaId)
    return novas
  })

  // Período mostrado: da primeira à última atividade cadastrada (sempre em semanas completas).
  const { inicio, totalDias } = useMemo(() => {
    const datas = [...dados.atividades.flatMap((a) => [a.inicio, a.fim]), ...marcos.map((m) => m.data),
      ...(agrupar === 'equipe' ? [
        ...(dados.composicoesEquipe ?? []).flatMap((c) => [c.inicio, ...(c.fim ? [c.fim] : [])]),
        ...(dados.eventosEquipe ?? []).map((evento) => evento.data),
      ] : [])]
    const menor = datas.length ? datas.reduce((m, d) => d < m ? d : m, datas[0]) : hojeISO()
    const maior = datas.length ? datas.reduce((m, d) => d > m ? d : m, datas[0]) : somarDias(hojeISO(), 60)
    const ini = segundaDe(menor)
    const fim = somarDias(segundaDe(maior), 6)
    return { inicio: ini, totalDias: difDias(ini, fim) + 1 }
  }, [agrupar, dados.atividades, dados.composicoesEquipe, dados.eventosEquipe, marcos])

  useEffect(() => {
    const area = ganttRef.current
    if (!area) return
    const observarLargura = () => setLarguraVisivel(area.clientWidth)
    const observer = new ResizeObserver(observarLargura)
    observer.observe(area)
    observarLargura()
    return () => observer.disconnect()
  }, [])

  // Mantém mais espaço por dia nas três escalas; períodos curtos ainda se expandem para preencher a área.
  const escalaBase = escala === 'semanas' ? 18 : escala === 'meses' ? 7 : 4
  const pxDia = Math.max(escalaBase, larguraVisivel > 0 ? (larguraVisivel - LARGURA_ROTULO) / totalDias : escalaBase)
  const larguraTrilha = totalDias * pxDia

  const calcularPrevia = (sessao: SessaoRedimensionamento, x: number): Atividade => {
    const deslocamento = Math.round((x - sessao.xInicial) / pxDia)
    if (sessao.extremidade === 'inicio') {
      const inicioNovo = somarDias(sessao.atividade.inicio, deslocamento)
      return { ...sessao.atividade, inicio: inicioNovo > sessao.atividade.fim ? sessao.atividade.fim : inicioNovo }
    }
    const fimNovo = somarDias(sessao.atividade.fim, deslocamento)
    return { ...sessao.atividade, fim: fimNovo < sessao.atividade.inicio ? sessao.atividade.inicio : fimNovo }
  }

  const iniciarRedimensionamento = (e: ReactPointerEvent<HTMLButtonElement>, atividade: Atividade, extremidade: Extremidade) => {
    e.preventDefault()
    e.stopPropagation()
    const sessao: SessaoRedimensionamento = { pointerId: e.pointerId, extremidade, xInicial: e.clientX, atividade, previa: atividade }
    redimensionamentoRef.current = sessao
    setRedimensionamento(sessao)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const moverRedimensionamento = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const sessao = redimensionamentoRef.current
    if (!sessao || sessao.pointerId !== e.pointerId) return
    const proxima = { ...sessao, previa: calcularPrevia(sessao, e.clientX) }
    redimensionamentoRef.current = proxima
    setRedimensionamento(proxima)
  }

  const concluirRedimensionamento = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const sessao = redimensionamentoRef.current
    if (!sessao || sessao.pointerId !== e.pointerId) return
    const atividadeFinal = calcularPrevia(sessao, e.clientX)
    redimensionamentoRef.current = null
    setRedimensionamento(null)
    if (atividadeFinal.inicio !== sessao.atividade.inicio || atividadeFinal.fim !== sessao.atividade.fim) onRedimensionar(atividadeFinal)
  }

  const cancelarRedimensionamento = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (redimensionamentoRef.current?.pointerId === e.pointerId) {
      redimensionamentoRef.current = null
      setRedimensionamento(null)
    }
  }

  // Cada escala altera a largura diária e os rótulos do eixo, sem mudar as datas dos registros.
  const { periodosMaiores, periodosMenores } = useMemo(() => {
    type Segmento = { chave: string; rotulo: string; esq: number; larg: number }
    const agruparPeriodo = (unidade: 'mes' | 'ano' | 'trimestre'): Segmento[] => {
      const lista: Segmento[] = []
      for (let i = 0; i < totalDias; i++) {
        const dia = somarDias(inicio, i)
        const ano = dia.slice(0, 4)
        const mes = dia.slice(5, 7)
        const trimestre = Math.floor((Number(mes) - 1) / 3) + 1
        const chave = unidade === 'ano' ? ano : unidade === 'trimestre' ? `${ano}-T${trimestre}` : `${ano}-${mes}`
        const rotulo = unidade === 'ano' ? ano : unidade === 'trimestre' ? `${trimestre}º tri` : nomeMes(dia)
        const ultimo = lista[lista.length - 1]
        if (ultimo && ultimo.chave === chave) ultimo.larg += pxDia
        else lista.push({ chave, rotulo, esq: i * pxDia, larg: pxDia })
      }
      return lista
    }
    const maiores = agruparPeriodo(escala === 'semanas' ? 'mes' : 'ano')
    const menores: Segmento[] = escala === 'semanas'
      ? Array.from({ length: Math.ceil(totalDias / 7) }, (_, n) => {
          const i = n * 7
          return { chave: String(i), rotulo: formatarBR(somarDias(inicio, i)).slice(0, 5), esq: i * pxDia, larg: Math.min(7, totalDias - i) * pxDia }
        })
      : agruparPeriodo(escala === 'meses' ? 'mes' : 'trimestre')
    return { periodosMaiores: maiores, periodosMenores: menores }
  }, [escala, inicio, totalDias, pxDia])

  // Linhas conforme o agrupamento escolhido
  const linhas: Linha[] = useMemo(() => {
    const marcosProjeto = marcos.filter((m) => (!filtros.escolaId || m.escolaId === filtros.escolaId) && (filtros.escolaId || !escolasOcultas.has(m.escolaId)))
    if (agrupar === 'equipe') {
      const composicoesPorEquipe = new Map<string, ComposicaoEquipe[]>()
      for (const composicao of dados.composicoesEquipe ?? []) {
        const lista = composicoesPorEquipe.get(composicao.equipeId) ?? []
        lista.push(composicao)
        composicoesPorEquipe.set(composicao.equipeId, lista)
      }
      for (const lista of composicoesPorEquipe.values()) lista.sort((a, b) => a.inicio.localeCompare(b.inicio))
      const eventosPorEquipe = new Map<string, Set<string>>()
      const eventoPorId = new Map((dados.eventosEquipe ?? []).map((evento) => [evento.id, evento]))
      for (const movimento of dados.movimentacoesEquipe ?? []) {
        const evento = eventoPorId.get(movimento.eventoId)
        if (!evento) continue
        for (const equipeId of [movimento.equipeOrigemId, movimento.equipeDestinoId].filter(Boolean) as string[]) {
          const ids = eventosPorEquipe.get(equipeId) ?? new Set<string>()
          ids.add(evento.id)
          eventosPorEquipe.set(equipeId, ids)
        }
      }
      return dados.equipes
        .filter((e) => (!filtros.equipeId || e.id === filtros.equipeId) && (!filtros.disciplinaId || e.disciplinaId === filtros.disciplinaId))
        .map((e) => ({ id: e.id, rotulo: e.nome, atividades: atividadesPorEquipe.get(e.id) ?? [], composicoes: composicoesPorEquipe.get(e.id) ?? [], eventosEquipe: [...(eventosPorEquipe.get(e.id) ?? [])].map((id) => eventoPorId.get(id)!).filter(Boolean) }))
    }
    return dados.escolas
      .filter((s) => (!filtros.escolaId || s.id === filtros.escolaId) && (filtros.escolaId || !escolasOcultas.has(s.id)))
      .map((s) => ({ id: s.id, rotulo: `${s.codigo} – ${s.nome}`, cor: s.cor, atividades: atividadesPorEscola.get(s.id) ?? [], marcos: marcosProjeto.filter((m) => m.escolaId === s.id) }))
      .filter((l) => l.atividades.length > 0 || (l.marcos?.length ?? 0) > 0)
  }, [agrupar, dados.equipes, dados.escolas, dados.composicoesEquipe, dados.eventosEquipe, dados.movimentacoesEquipe, escolasOcultas, atividadesPorEquipe, atividadesPorEscola, filtros.equipeId, filtros.disciplinaId, filtros.escolaId, marcos])

  const escola = (id: string) => escolaPorId.get(id)
  const equipe = (id: string) => equipePorId.get(id)

  const hoje = hojeISO()
  const marcadores = (
    <>
      {feriados
        .filter((f) => f >= inicio && difDias(inicio, f) < totalDias)
        .map((f) => (
          <div key={f} className="feriado" title={`Feriado ${formatarBR(f)}`} style={{ left: difDias(inicio, f) * pxDia, width: pxDia }} />
        ))}
      {hoje >= inicio && difDias(inicio, hoje) < totalDias && (
        <div className="hoje" title="Hoje" style={{ left: difDias(inicio, hoje) * pxDia }} />
      )}
    </>
  )

  const escolasNaTela = [...new Set([...visiveis.map((a) => a.escolaId), ...marcos.filter((m) => !filtros.escolaId || m.escolaId === filtros.escolaId).map((m) => m.escolaId)])].map(escola).filter(Boolean)
  const diasDoEixo = escala === 'semanas'
    ? Array.from({ length: totalDias }, (_, dia) => somarDias(inicio, dia))
    : []

  return (
    <section>
      <div className="gantt-controles">
        <div className="seg">
          <button className={agrupar === 'equipe' ? 'ativo' : ''} onClick={() => setAgrupar('equipe')}>Por equipe</button>
          <button className={agrupar === 'escola' ? 'ativo' : ''} onClick={() => setAgrupar('escola')}>Por projeto</button>
        </div>
        <div className="seg escala-temporal" aria-label="Escala temporal do Gantt">
          <button onClick={() => {
            const area = ganttRef.current
            if (!area) return
            const posicaoHoje = difDias(inicio, hojeISO()) * pxDia
            area.scrollTo({ left: Math.max(0, posicaoHoje - (area.clientWidth - LARGURA_ROTULO) / 2), behavior: 'smooth' })
          }}>Hoje</button>
          <button className={escala === 'semanas' ? 'ativo' : ''} onClick={() => setEscala('semanas')}>Semanas</button>
          <button className={escala === 'meses' ? 'ativo' : ''} onClick={() => setEscala('meses')}>Meses</button>
          <button className={escala === 'trimestres' ? 'ativo' : ''} onClick={() => setEscala('trimestres')}>Trimestres</button>
        </div>
        <span className="dica">Clique no espaço livre para criar uma atividade na data escolhida. Clique em uma barra para editar ou arraste suas extremidades para ajustar o período. {agrupar === 'equipe' ? 'Os marcadores roxos indicam mudanças de composição.' : '◆ identifica um marco concluído.'}</span>
      </div>

      <div className="legenda">
        {escolasNaTela.map((s) => s && (
          <button key={s.id} type="button" className={`chip chip-escola${!filtros.escolaId && escolasOcultas.has(s.id) ? ' chip-escola-oculta' : ''}`} title={!filtros.escolaId ? `${s.nome} — clique para ${escolasOcultas.has(s.id) ? 'exibir' : 'ocultar'}` : s.nome} aria-pressed={!filtros.escolaId ? !escolasOcultas.has(s.id) : true} disabled={Boolean(filtros.escolaId)} onClick={() => alternarEscola(s.id)}>
            <i style={{ background: s.cor }} /> {s.codigo}
          </button>
        ))}
        {!filtros.escolaId && <span className="dica legenda-ajuda">Clique nas siglas para ocultar ou exibir projetos.</span>}
        {!filtros.escolaId && escolasOcultas.size > 0 && <button className="chip" onClick={() => setEscolasOcultas(new Set())}>Exibir todos os projetos</button>}
      </div>

      <div className="gantt-rolagem" ref={ganttRef} onScroll={ocultarTooltip}>
        <div className="gantt" style={{ width: LARGURA_ROTULO + larguraTrilha }}>
          <div className="gantt-cab">
            <div className="rotulo" style={{ width: LARGURA_ROTULO }}>{agrupar === 'equipe' ? 'Equipe' : 'Projeto'}</div>
            <div className="cab-trilha" style={{ width: larguraTrilha }}>
              <div className="cab-linha">
                {periodosMaiores.map((m) => (
                  <div key={m.esq} className="cab-mes" style={{ left: m.esq, width: m.larg }}>{m.rotulo}</div>
                ))}
              </div>
              <div className="cab-linha">
                {periodosMenores.map((s) => (
                  <div key={s.esq} className="cab-semana" style={{ left: s.esq, width: s.larg }}>{s.rotulo}</div>
                ))}
              </div>
              {escala === 'semanas' && (
                <div className="cab-linha cab-linha-dias">
                  {diasDoEixo.map((dia, indice) => {
                    const diaSemana = new Date(`${dia}T00:00:00Z`).getUTCDay()
                    const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
                    return <div key={dia} className="cab-dia" title={`${nomesDias[diaSemana]} ${formatarBR(dia)}`} style={{ left: indice * pxDia, width: pxDia }}>{dia.slice(8, 10)}</div>
                  })}
                </div>
              )}
            </div>
          </div>

          {linhas.map((linha) => {
            const { itens, faixas } = empacotar(linha.atividades)
            const altura = faixas * (ALTURA_BARRA + FOLGA) + MARGEM * 2
            return (
              <div key={linha.id} className="gantt-linha" style={{ height: altura }}>
                <div className="rotulo" style={{ width: LARGURA_ROTULO }} title={linha.rotulo}>
                  {linha.cor && <i className="bolinha" style={{ background: linha.cor }} />}
                  <span className="rotulo-equipe">{linha.rotulo}</span>
                </div>
                <div
                  className="trilha"
                  style={{ width: larguraTrilha }}
                  onClick={(e) => {
                    const x = e.clientX - e.currentTarget.getBoundingClientRect().left
                    const data = somarDias(inicio, Math.floor(x / pxDia))
                    onNova(
                      agrupar === 'equipe'
                        ? { equipeId: linha.id, inicio: data, fim: data }
                        : { escolaId: linha.id, inicio: data, fim: data },
                    )
                  }}
                >
                  {marcadores}
                  {agrupar === 'escola' && linha.marcos?.map((marco) => (
                    <button
                      key={marco.id}
                      type="button"
                      className="marco-gantt"
                      style={{ left: difDias(inicio, marco.data) * pxDia, top: 2 }}
                      aria-label={`Editar marco ${marco.titulo}, ${formatarBR(marco.data)}`}
                      onMouseEnter={(e) => agendarTooltip(e, <><strong>{marco.titulo}</strong><div>Data: {formatarBR(marco.data)}</div>{marco.observacao && <div>{marco.observacao}</div>}<small>Clique para editar o marco</small></>)}
                      onMouseLeave={ocultarTooltip}
                      onClick={(e) => { e.stopPropagation(); ocultarTooltip(); onEditarMarco(marco) }}
                    >◆</button>
                  ))}
                  {agrupar === 'equipe' && [...new Set([...(linha.composicoes?.slice(1).map((c) => c.inicio) ?? []), ...(linha.eventosEquipe?.map((e) => e.data) ?? [])])].map((data) => {
                    const composicao = linha.composicoes?.find((c) => c.inicio === data)
                    const indice = composicao ? linha.composicoes?.findIndex((c) => c.id === composicao.id) ?? -1 : -1
                    const anterior = indice > 0 ? linha.composicoes?.[indice - 1] : undefined
                    const antes = new Set((dados.integrantesComposicao ?? []).filter((m) => m.composicaoId === anterior?.id).map((m) => m.pessoaId))
                    const depois = new Set((dados.integrantesComposicao ?? []).filter((m) => m.composicaoId === composicao?.id).map((m) => m.pessoaId))
                    const entraram = [...depois].filter((id) => !antes.has(id)).map((id) => dados.pessoas.find((p) => p.id === id)?.nome ?? 'Pessoa removida')
                    const sairam = [...antes].filter((id) => !depois.has(id)).map((id) => dados.pessoas.find((p) => p.id === id)?.nome ?? 'Pessoa removida')
                    const eventos = (linha.eventosEquipe ?? []).filter((e) => e.data === data)
                    const movimentacoes = (dados.movimentacoesEquipe ?? []).filter((m) => eventos.some((e) => e.id === m.eventoId))
                    const detalhesEventos = movimentacoes.map((m) => {
                      const pessoa = dados.pessoas.find((p) => p.id === m.pessoaId)?.nome ?? 'Pessoa removida'
                      const origem = dados.equipes.find((e) => e.id === m.equipeOrigemId)?.nome ?? 'Equipe removida'
                      const destino = m.equipeDestinoId ? dados.equipes.find((e) => e.id === m.equipeDestinoId)?.nome ?? 'Equipe removida' : null
                      return destino ? `${pessoa}: ${origem} → ${destino}` : `${pessoa} saiu de ${origem}${m.motivo ? ` · Motivo: ${m.motivo}` : ''}`
                    })
                    const delta = [entraram.length ? `Entraram: ${entraram.join(', ')}` : '', sairam.length ? `Saíram: ${sairam.join(', ')}` : ''].filter(Boolean).join('\n')
                    const detalhe = [...detalhesEventos, ...(!detalhesEventos.length && delta ? [delta] : [])].join('\n') || 'Mudança de composição registrada.'
                    const linhasDetalhe = detalhe.split('\n')
                    return <span key={`${linha.id}-${data}`} className="marco-equipe-gantt" style={{ left: difDias(inicio, data) * pxDia, height: '100%' }}>
                      <i aria-label={`Movimentação de equipe em ${formatarBR(data)}: ${detalhe.replace(/\n/g, '; ')}`} onMouseEnter={(e) => agendarTooltip(e, <><strong>Movimentação · {formatarBR(data)}</strong>{linhasDetalhe.map((linhaTexto, i) => <div key={i}>{linhaTexto}</div>)}</>)} onMouseLeave={ocultarTooltip} onClick={(e) => e.stopPropagation()} />
                    </span>
                  })}
                  {itens.map(({ atividade: a, faixa, conflito }) => {
                    const atividadeVisual = redimensionamento?.atividade.id === a.id ? redimensionamento.previa : a
                    const s = escola(a.escolaId)
                    const eq = equipe(a.equipeId)
                    const texto = agrupar === 'equipe' ? s?.codigo : eq?.nome
                    const obterConteudoTooltip = () => {
                      const integrantesNoPeriodo = integrantesNaAtividade(dados, atividadeVisual, indiceComposicoes)
                      return <>
                        <strong>{s?.nome ?? '?'} · {eq?.nome ?? '?'}</strong>
                        {a.titulo && <div className="gantt-tooltip-etapa">{a.titulo}</div>}
                        <div>{formatarBR(atividadeVisual.inicio)} a {formatarBR(atividadeVisual.fim)}</div>
                        {a.descricao && <div className="gantt-tooltip-descricao">{a.descricao}</div>}
                        <div className="gantt-tooltip-grupo"><b>Composição no período</b>
                          {integrantesNoPeriodo.length ? integrantesNoPeriodo.map(({ pessoa, inicio: inicioVinculo, fim: fimVinculo }, i) => <div key={`${pessoa?.id ?? 'removida'}-${i}`}>• {pessoa?.nome ?? 'Pessoa removida'}{pessoa?.funcao ? ` (${pessoa.funcao})` : ''} · {formatarBR(inicioVinculo)} a {formatarBR(fimVinculo)}</div>) : <div>Nenhuma formação registrada nesta equipe no período.</div>}
                        </div>
                        {conflito && agrupar === 'equipe' && <div className="gantt-tooltip-alerta">⚠ Sobrepõe outra atividade da equipe</div>}
                      </>
                    }
                    return (
                      <div
                        key={a.id}
                        role="button"
                        tabIndex={0}
                        aria-label={`Editar atividade ${a.titulo || s?.codigo || ''}, ${eq?.nome ?? ''}, de ${formatarBR(a.inicio)} a ${formatarBR(a.fim)}`}
                        className={'barra' + (conflito && agrupar === 'equipe' ? ' conflito' : '')}
                        style={{
                          left: difDias(inicio, atividadeVisual.inicio) * pxDia,
                          width: (difDias(atividadeVisual.inicio, atividadeVisual.fim) + 1) * pxDia - 1,
                          top: MARGEM + faixa * (ALTURA_BARRA + FOLGA),
                          height: ALTURA_BARRA,
                          background: s?.cor ?? '#888',
                        }}
                        onMouseEnter={(e) => agendarTooltip(e, obterConteudoTooltip)}
                        onMouseLeave={ocultarTooltip}
                        onKeyDown={(e) => {
                          if (e.target !== e.currentTarget) return
                          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); ocultarTooltip(); onEditar(a) }
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          ocultarTooltip()
                          onEditar(a)
                        }}
                      >
                        <span className="barra-codigo">{texto}</span>
                        <button
                          type="button"
                          className="barra-resize barra-resize-inicio"
                          aria-label={`Ajustar início de ${texto ?? 'atividade'}`}
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => iniciarRedimensionamento(e, a, 'inicio')}
                          onPointerMove={moverRedimensionamento}
                          onPointerUp={concluirRedimensionamento}
                          onPointerCancel={cancelarRedimensionamento}
                        />
                        <button
                          type="button"
                          className="barra-resize barra-resize-fim"
                          aria-label={`Ajustar fim de ${texto ?? 'atividade'}`}
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => iniciarRedimensionamento(e, a, 'fim')}
                          onPointerMove={moverRedimensionamento}
                          onPointerUp={concluirRedimensionamento}
                          onPointerCancel={cancelarRedimensionamento}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {linhas.length === 0 && <p className="vazio">Nenhuma atividade para os filtros escolhidos.</p>}
        </div>
      </div>
      {tooltip && createPortal(<div ref={tooltipRef} className="gantt-tooltip" style={{ left: tooltip.left, top: tooltip.top }} role="tooltip">{tooltip.conteudo}</div>, document.body)}
    </section>
  )
}
