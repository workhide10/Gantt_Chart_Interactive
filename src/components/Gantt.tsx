import { useMemo, useState } from 'react'
import type { Atividade, Dados, Filtros } from '../types'
import { feriados } from '../data/inicial'
import { difDias, formatarBR, hojeISO, nomeMes, segundaDe, somarDias } from '../lib/datas'
import { empacotar } from '../lib/gantt'
import { filtrarAtividades } from '../lib/filtrar'

const LARGURA_ROTULO = 150
const ALTURA_BARRA = 22
const FOLGA = 3
const MARGEM = 6

type Agrupar = 'equipe' | 'escola'

interface Linha {
  id: string
  rotulo: string
  cor?: string
  atividades: Atividade[]
}

interface Props {
  dados: Dados
  filtros: Filtros
  onEditar: (a: Atividade) => void
  onNova: (preset: Partial<Atividade>) => void
}

export function Gantt({ dados, filtros, onEditar, onNova }: Props) {
  const [agrupar, setAgrupar] = useState<Agrupar>('equipe')
  const [pxDia, setPxDia] = useState(6) // zoom: pixels por dia

  const visiveis = useMemo(() => filtrarAtividades(dados, filtros), [dados, filtros])

  // Período mostrado: da primeira à última atividade cadastrada (sempre em semanas completas).
  const { inicio, totalDias } = useMemo(() => {
    const todas = dados.atividades
    const menor = todas.length ? todas.reduce((m, a) => (a.inicio < m ? a.inicio : m), todas[0].inicio) : hojeISO()
    const maior = todas.length ? todas.reduce((m, a) => (a.fim > m ? a.fim : m), todas[0].fim) : somarDias(hojeISO(), 60)
    const ini = segundaDe(menor)
    const fim = somarDias(segundaDe(maior), 6)
    return { inicio: ini, totalDias: difDias(ini, fim) + 1 }
  }, [dados.atividades])

  const larguraTrilha = totalDias * pxDia

  // Cabeçalho: meses e semanas
  const meses = useMemo(() => {
    const lista: { rotulo: string; esq: number; larg: number }[] = []
    for (let i = 0; i < totalDias; i++) {
      const dia = somarDias(inicio, i)
      const rotulo = nomeMes(dia)
      const ultimo = lista[lista.length - 1]
      if (ultimo && ultimo.rotulo === rotulo) ultimo.larg += pxDia
      else lista.push({ rotulo, esq: i * pxDia, larg: pxDia })
    }
    return lista
  }, [inicio, totalDias, pxDia])

  const semanas = useMemo(() => {
    const lista: { rotulo: string; esq: number }[] = []
    for (let i = 0; i < totalDias; i += 7) {
      lista.push({ rotulo: formatarBR(somarDias(inicio, i)).slice(0, 5), esq: i * pxDia })
    }
    return lista
  }, [inicio, totalDias, pxDia])

  // Linhas conforme o agrupamento escolhido
  const linhas: Linha[] = useMemo(() => {
    if (agrupar === 'equipe') {
      return dados.equipes
        .filter((e) => (!filtros.equipeId || e.id === filtros.equipeId) && (!filtros.disciplinaId || e.disciplinaId === filtros.disciplinaId))
        .map((e) => ({ id: e.id, rotulo: e.nome, atividades: visiveis.filter((a) => a.equipeId === e.id) }))
    }
    return dados.escolas
      .map((s) => ({ id: s.id, rotulo: `${s.codigo} – ${s.nome}`, cor: s.cor, atividades: visiveis.filter((a) => a.escolaId === s.id) }))
      .filter((l) => l.atividades.length > 0)
  }, [agrupar, dados.equipes, dados.escolas, filtros.equipeId, filtros.disciplinaId, visiveis])

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

  const escolasNaTela = [...new Set(visiveis.map((a) => a.escolaId))].map(escola).filter(Boolean)

  return (
    <section>
      <div className="gantt-controles">
        <div className="seg">
          <button className={agrupar === 'equipe' ? 'ativo' : ''} onClick={() => setAgrupar('equipe')}>Por equipe</button>
          <button className={agrupar === 'escola' ? 'ativo' : ''} onClick={() => setAgrupar('escola')}>Por escola</button>
        </div>
        <label className="zoom">
          Zoom
          <input type="range" min={2} max={16} value={pxDia} onChange={(e) => setPxDia(Number(e.target.value))} />
        </label>
        <span className="dica">Clique numa barra para editar, ou numa área vazia para criar.</span>
      </div>

      <div className="legenda">
        {escolasNaTela.map((s) => s && (
          <span key={s.id} className="chip" title={s.nome}>
            <i style={{ background: s.cor }} /> {s.codigo}
          </span>
        ))}
      </div>

      <div className="gantt-rolagem">
        <div className="gantt" style={{ width: LARGURA_ROTULO + larguraTrilha }}>
          <div className="gantt-cab">
            <div className="rotulo" style={{ width: LARGURA_ROTULO }}>{agrupar === 'equipe' ? 'Equipe' : 'Escola'}</div>
            <div className="cab-trilha" style={{ width: larguraTrilha }}>
              <div className="cab-linha">
                {meses.map((m) => (
                  <div key={m.esq} className="cab-mes" style={{ left: m.esq, width: m.larg }}>{m.rotulo}</div>
                ))}
              </div>
              <div className="cab-linha">
                {semanas.map((s) => (
                  <div key={s.esq} className="cab-semana" style={{ left: s.esq }}>{s.rotulo}</div>
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
                        {texto}
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
