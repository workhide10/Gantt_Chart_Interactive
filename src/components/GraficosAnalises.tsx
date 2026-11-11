import { formatarBR, nomeMes } from '../lib/datas'

export const CORES_DISCIPLINAS = ['#4263dc', '#22a3a1', '#9b6ad3', '#e5a047', '#de718b', '#6f91c8', '#7aab61', '#b87955', '#7b83a4']

interface PontoMensal { mes: string; conclusoes: number; dias: number }

export function GraficoEvolucao({ meses, metrica }: { meses: PontoMensal[]; metrica: 'conclusoes' | 'dias' }) {
  const largura = Math.max(640, meses.length * 42), altura = 220
  const margem = { esquerda: 44, direita: 20, topo: 20, base: 36 }
  const base = altura - margem.base
  const maximo = Math.max(4, ...meses.map((m) => m[metrica]))
  const teto = Math.ceil(maximo / 4) * 4
  const x = (i: number) => margem.esquerda + (meses.length === 1 ? (largura - 64) / 2 : i * (largura - 64) / (meses.length - 1))
  const y = (n: number) => base - n / teto * (base - margem.topo)
  const pontos = meses.map((m, i) => `${x(i)},${y(m[metrica])}`).join(' ')
  return <div className="grafico-evolucao">
    <div className="grafico-rolagem"><svg viewBox={`0 0 ${largura} ${altura}`} style={{ minWidth: Math.min(largura, 640) }} role="img" aria-label={metrica === 'conclusoes' ? 'Evolução mensal de intervalos encerrados' : 'Evolução mensal dos dias úteis alocados'}>
      {[0, 1, 2, 3, 4].map((n) => <g key={n}><line x1={margem.esquerda} x2={largura - 20} y1={y(n * teto / 4)} y2={y(n * teto / 4)} stroke="#e9eef7" strokeDasharray="4 5" /><text x={margem.esquerda - 10} y={y(n * teto / 4) + 4} textAnchor="end">{n * teto / 4}</text></g>)}
      {meses.length > 1 && <polygon points={`${x(0)},${base} ${pontos} ${x(meses.length - 1)},${base}`} fill="#4263dc" opacity=".07" />}
      <polyline points={pontos} fill="none" stroke="#4263dc" strokeWidth="3" strokeLinejoin="round" />
      {meses.map((m, i) => <g key={m.mes} tabIndex={0} aria-label={`${nomeMes(m.mes)}: ${m[metrica]} ${metrica === 'dias' ? 'dias úteis alocados' : 'términos de intervalo'}`}>
        <title>{nomeMes(m.mes)}: {m[metrica]} {metrica === 'dias' ? 'dias úteis alocados' : 'términos de intervalo'}</title>
        <circle cx={x(i)} cy={y(m[metrica])} r="5" fill="#fff" stroke="#4263dc" strokeWidth="2.5" />
        {(i % Math.ceil(meses.length / 12) === 0 || i === meses.length - 1) && <text x={x(i)} y={altura - 10} textAnchor="middle">{nomeMes(m.mes)}</text>}
      </g>)}
    </svg></div>
    <details className="dados-grafico"><summary>Ver dados do gráfico</summary><div className="tabela-rolagem"><table><thead><tr><th>Mês</th><th>Términos de intervalo</th><th>Dias úteis alocados</th></tr></thead><tbody>{meses.map((m) => <tr key={m.mes}><td>{nomeMes(m.mes)}</td><td>{m.conclusoes}</td><td>{m.dias}</td></tr>)}</tbody></table></div></details>
  </div>
}

export function GraficoDisciplinas({ disciplinas, janela, onSelecionar }: {
  disciplinas: { id: string; nome: string; dias: number; indiceCor: number }[]
  janela: { inicio: string; fim: string; dias: number }
  onSelecionar: (id: string) => void
}) {
  return <div className="tempo-disciplinas">
    <p className="tempo-disciplinas-referencia">Janela de referência: <strong>{janela.dias} dias úteis</strong> · {formatarBR(janela.inicio)} a {formatarBR(janela.fim)}</p>
    <div className="tempo-disciplinas-lista">{disciplinas.map((d) => {
      const percentual = janela.dias ? d.dias / janela.dias * 100 : 0
      return <button type="button" className="tempo-disciplina-linha" key={d.id} onClick={() => onSelecionar(d.id)} aria-label={`${d.nome}: ${d.dias} de ${janela.dias} dias úteis, ${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}>
        <span className="tempo-disciplina-nome">{d.nome}</span><span className="tempo-disciplina-trilho"><i style={{ width: `${percentual}%`, background: CORES_DISCIPLINAS[d.indiceCor % CORES_DISCIPLINAS.length] }} /></span><strong>{d.dias} dias</strong><span>{percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>
      </button>
    })}</div>
    <p className="nota-grafico">A janela usa a primeira e a última atividade de toda a plataforma e inclui pausas. Os dias por disciplina respeitam os filtros e contam datas coincidentes uma única vez. Disciplinas podem trabalhar nos mesmos dias; os percentuais não precisam somar 100%. Finais de semana e feriados cadastrados são excluídos.</p>
  </div>
}

export function GraficoDuracoes({ faixas }: { faixas: { nome: string; quantidade: number }[] }) {
  const maior = Math.max(1, ...faixas.map((f) => f.quantidade))
  return <div className="histograma" role="img" aria-label={`Atividades por duração em dias úteis: ${faixas.map((f) => `${f.nome}: ${f.quantidade}`).join('; ')}`}>
    {faixas.map((f, i) => <div className="histograma-coluna" key={f.nome}>
      <div className="histograma-area"><div className="histograma-barra" style={{ height: `${f.quantidade / maior * 100}%`, background: i === 3 ? '#9b6ad3' : '#6280e5' }}><strong>{f.quantidade}</strong></div></div>
      <span>{f.nome}</span>
    </div>)}
  </div>
}

export function GraficoProjetosDisciplina({ disciplinas, projetosMensais, onSelecionar }: {
  disciplinas: { id: string; sigla: string; nome: string }[]
  projetosMensais: Map<string, number[]>
  onSelecionar: (id: string) => void
}) {
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const linhas = disciplinas.filter((d) => projetosMensais.has(d.id))
  const maximo = Math.max(1, ...[...projetosMensais.values()].flat())
  if (!linhas.length) return <p className="vazio">Nenhum projeto com registro em dias úteis neste ano e recorte.</p>
  return <div className="simultaneidade-grafico">
    <div className="simultaneidade-legenda"><span>Projetos distintos no mês</span><span>Menor</span><i aria-hidden="true" /><span>Maior</span></div>
    <div className="tabela-rolagem"><table className="simultaneidade-tabela" aria-label="Projetos distintos por disciplina e mês">
      <thead><tr><th scope="col">Disciplina</th>{meses.map((mes) => <th scope="col" key={mes}>{mes}</th>)}</tr></thead>
      <tbody>{linhas.map((disciplina) => <tr key={disciplina.id}><th scope="row"><button className="botao-discreto" title={disciplina.nome} onClick={() => onSelecionar(disciplina.id)}>{disciplina.sigla}</button></th>{projetosMensais.get(disciplina.id)!.map((valor, i) => <td key={i} aria-label={`${disciplina.sigla}, ${meses[i]}: ${valor} projetos distintos`}><span className="simultaneidade-celula" style={valor ? { backgroundColor: `rgba(66, 99, 220, ${0.15 + 0.75 * valor / maximo})`, color: valor / maximo > 0.55 ? '#fff' : '#263b91' } : undefined}>{valor || '—'}</span></td>)}</tr>)}</tbody>
    </table></div>
    <p className="nota-grafico">Cada projeto conta uma vez por disciplina e mês, mesmo com várias equipes ou intervalos. Os projetos do mês não precisam ter ocorrido simultaneamente. Clique em uma disciplina para filtrá-la.</p>
  </div>
}
