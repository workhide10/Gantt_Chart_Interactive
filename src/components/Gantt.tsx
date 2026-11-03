import { useEffect, useMemo, useRef, useState } from 'react'
import type { Atividade, Dados, Filtros, MarcoProjeto } from '../types'
import { feriados } from '../data/inicial'
import { difDias, formatarBR, hojeISO, nomeMes, segundaDe, somarDias } from '../lib/datas'
import { empacotar } from '../lib/gantt'
import { filtrarAtividades } from '../lib/filtrar'

const LARGURA_ROTULO = 150
const ALTURA_BARRA = 22
const FOLGA = 3
const MARGEM = 6

type Agrupar = 'equipe' | 'escola'
type EscalaTemporal = 'semanas' | 'meses' | 'trimestres'

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
}

export function Gantt({ dados, filtros, marcos, onEditar, onNova, onEditarMarco }: Props) {
  const [agrupar, setAgrupar] = useState<Agrupar>('equipe')
  const [escala, setEscala] = useState<EscalaTemporal>('meses')
  const ganttRef = useRef<HTMLDivElement>(null)
  const [larguraVisivel, setLarguraVisivel] = useState(0)

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

  const escalaBase = escala === 'semanas' ? 14 : escala === 'meses' ? 5 : 2
  const pxDia = Math.max(escalaBase, larguraVisivel > 0 ? (larguraVisivel - LARGURA_ROTULO) / totalDias : escalaBase)
  const larguraTrilha = totalDias * pxDia

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
            </div>
          </div>

          {linhas.map((linha) => {
            const { itens, faixas } = empacotar(linha.atividades)
            const altura = faixas * (ALTURA_BARRA + FOLGA) + MARGEM * 2
            return (
              <div key={linha.id} className="gantt-linha" style={{ height: altura }}>
                <div className="rotulo" style={{ width: LARGURA_ROTULO }} title={linha.rotulo}>
                  {linha.cor && <i className="bolinha" style={{ background: linha.cor }} />}
                  {linha.rotulo}
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
                    const s = escola(a.escolaId)
                    const eq = equipe(a.equipeId)
                    const texto = agrupar === 'equipe' ? s?.codigo : eq?.nome
                    return (
                      <div
                        key={a.id}
                        className={'barra' + (conflito && agrupar === 'equipe' ? ' conflito' : '')}
                        style={{
                          left: difDias(inicio, a.inicio) * pxDia,
                          width: (difDias(a.inicio, a.fim) + 1) * pxDia - 1,
                          top: MARGEM + faixa * (ALTURA_BARRA + FOLGA),
                          height: ALTURA_BARRA,
                          background: s?.cor ?? '#888',
                        }}
                        title={`${s?.nome ?? '?'} · ${eq?.nome ?? '?'}\n${formatarBR(a.inicio)} a ${formatarBR(a.fim)}${a.descricao ? '\n' + a.descricao : ''}${conflito && agrupar === 'equipe' ? '\n⚠ Sobrepõe outra atividade da equipe' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditar(a)
                        }}
                      >
                        <span className="barra-codigo">{texto}</span>
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
