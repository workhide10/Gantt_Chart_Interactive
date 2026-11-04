import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import type { Atividade, Dados, Filtros, MarcoProjeto } from '../types'
import { feriados } from '../data/inicial'
import { difDias, formatarBR, hojeISO, nomeMes, segundaDe, somarDias } from '../lib/datas'
import { empacotar } from '../lib/gantt'
import { filtrarAtividades } from '../lib/filtrar'
import { integrantesNaAtividade } from '../lib/composicao'

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

interface Linha {
  id: string
  rotulo: string
  cor?: string
  atividades: Atividade[]
  marcos?: MarcoProjeto[]
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
  const ganttRef = useRef<HTMLDivElement>(null)
  const [larguraVisivel, setLarguraVisivel] = useState(0)
  const [redimensionamento, setRedimensionamento] = useState<SessaoRedimensionamento | null>(null)
  const redimensionamentoRef = useRef<SessaoRedimensionamento | null>(null)

  const visiveis = useMemo(() => filtrarAtividades(dados, filtros), [dados, filtros])

  // Período mostrado: da primeira à última atividade cadastrada (sempre em semanas completas).
  const { inicio, totalDias } = useMemo(() => {
    const datas = [...dados.atividades.flatMap((a) => [a.inicio, a.fim]), ...marcos.map((m) => m.data)]
    const menor = datas.length ? datas.reduce((m, d) => d < m ? d : m, datas[0]) : hojeISO()
    const maior = datas.length ? datas.reduce((m, d) => d > m ? d : m, datas[0]) : somarDias(hojeISO(), 60)
    const ini = segundaDe(menor)
    const fim = somarDias(segundaDe(maior), 6)
    return { inicio: ini, totalDias: difDias(ini, fim) + 1 }
  }, [dados.atividades, marcos])

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
    const marcosProjeto = marcos.filter((m) => !filtros.escolaId || m.escolaId === filtros.escolaId)
    if (agrupar === 'equipe') {
      return dados.equipes
        .filter((e) => (!filtros.equipeId || e.id === filtros.equipeId) && (!filtros.disciplinaId || e.disciplinaId === filtros.disciplinaId))
        .map((e) => ({ id: e.id, rotulo: e.nome, atividades: visiveis.filter((a) => a.equipeId === e.id) }))
    }
    return dados.escolas
      .filter((s) => !filtros.escolaId || s.id === filtros.escolaId)
      .map((s) => ({ id: s.id, rotulo: `${s.codigo} – ${s.nome}`, cor: s.cor, atividades: visiveis.filter((a) => a.escolaId === s.id), marcos: marcosProjeto.filter((m) => m.escolaId === s.id) }))
      .filter((l) => l.atividades.length > 0 || (l.marcos?.length ?? 0) > 0)
  }, [agrupar, dados.equipes, dados.escolas, filtros.equipeId, filtros.disciplinaId, filtros.escolaId, marcos, visiveis])

  const escola = (id: string) => dados.escolas.find((e) => e.id === id)
  const equipe = (id: string) => dados.equipes.find((e) => e.id === id)

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

  const escolasNaTela = [...new Set([...visiveis.map((a) => a.escolaId), ...marcos.map((m) => m.escolaId)])].map(escola).filter(Boolean)
  const diasDoEixo = escala === 'semanas'
    ? Array.from({ length: totalDias }, (_, dia) => somarDias(inicio, dia))
    : []

  return (
    <section>
      <div className="gantt-controles">
        <div className="seg">
          <button className={agrupar === 'equipe' ? 'ativo' : ''} onClick={() => setAgrupar('equipe')}>Por equipe</button>
          <button className={agrupar === 'escola' ? 'ativo' : ''} onClick={() => setAgrupar('escola')}>Por escola</button>
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
        <span className="dica">Clique numa barra para editar; no agrupamento por projeto, ◆ identifica um marco concluído.</span>
      </div>

      <div className="legenda">
        {escolasNaTela.map((s) => s && (
          <span key={s.id} className="chip" title={s.nome}>
            <i style={{ background: s.cor }} /> {s.codigo}
          </span>
        ))}
      </div>

      <div className="gantt-rolagem" ref={ganttRef}>
        <div className="gantt" style={{ width: LARGURA_ROTULO + larguraTrilha }}>
          <div className="gantt-cab">
            <div className="rotulo" style={{ width: LARGURA_ROTULO }}>{agrupar === 'equipe' ? 'Equipe' : 'Escola'}</div>
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
                      title={`${marco.titulo} · ${formatarBR(marco.data)}${marco.observacao ? `\n${marco.observacao}` : ''}`}
                      aria-label={`Editar marco ${marco.titulo}, ${formatarBR(marco.data)}`}
                      onClick={(e) => { e.stopPropagation(); onEditarMarco(marco) }}
                    >◆</button>
                  ))}
                  {itens.map(({ atividade: a, faixa, conflito }) => {
                    const atividadeVisual = redimensionamento?.atividade.id === a.id ? redimensionamento.previa : a
                    const s = escola(a.escolaId)
                    const eq = equipe(a.equipeId)
                    const texto = agrupar === 'equipe' ? s?.codigo : eq?.nome
                    const integrantesNoPeriodo = integrantesNaAtividade(dados, atividadeVisual)
                    const textoIntegrantes = integrantesNoPeriodo.length
                      ? integrantesNoPeriodo.map(({ pessoa, inicio: inicioVinculo, fim: fimVinculo }) =>
                          `• ${pessoa?.nome ?? 'Pessoa removida'}${pessoa?.funcao ? ` (${pessoa.funcao})` : ''} · ${formatarBR(inicioVinculo)} a ${formatarBR(fimVinculo)}`,
                        ).join('\n')
                      : 'Nenhuma formação registrada para esta equipe neste período.'
                    const legadosSemProjeto = (dados.vinculosEquipe ?? []).filter((v) => v.equipeId === a.equipeId && !v.projetoId).length
                    const informacaoIntegrantes = `\nComposição registrada no período:\n${textoIntegrantes}${legadosSemProjeto ? `\nHá ${legadosSemProjeto} vínculo(s) legado(s) sem projeto para revisar em Cadastros → Pendências antigas.` : ''}`
                    return (
                      <div
                        key={a.id}
                        className={'barra' + (conflito && agrupar === 'equipe' ? ' conflito' : '')}
                        style={{
                          left: difDias(inicio, atividadeVisual.inicio) * pxDia,
                          width: (difDias(atividadeVisual.inicio, atividadeVisual.fim) + 1) * pxDia - 1,
                          top: MARGEM + faixa * (ALTURA_BARRA + FOLGA),
                          height: ALTURA_BARRA,
                          background: s?.cor ?? '#888',
                        }}
                        title={`${s?.nome ?? '?'} · ${eq?.nome ?? '?'}${a.titulo ? `\n${a.titulo}` : ''}\n${formatarBR(atividadeVisual.inicio)} a ${formatarBR(atividadeVisual.fim)}${a.descricao ? '\n' + a.descricao : ''}${informacaoIntegrantes}${conflito && agrupar === 'equipe' ? '\n⚠ Sobrepõe outra atividade da equipe' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditar(a)
                        }}
                      >
                        <span className="barra-codigo">{texto}</span>
                        <button
                          type="button"
                          className="barra-resize barra-resize-inicio"
                          aria-label={`Ajustar início de ${texto ?? 'atividade'}`}
                          title="Arraste para ajustar a data de início"
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
                          title="Arraste para ajustar a data de fim"
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
    </section>
  )
}
