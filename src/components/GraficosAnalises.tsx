import { nomeMes } from '../lib/datas'

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
    <div className="grafico-rolagem"><svg viewBox={`0 0 ${largura} ${altura}`} style={{ minWidth: Math.min(largura, 640) }} role="img" aria-label={metrica === 'conclusoes' ? 'Evolução mensal de atividades concluídas' : 'Evolução mensal dos dias úteis alocados'}>
      {[0, 1, 2, 3, 4].map((n) => <g key={n}><line x1={margem.esquerda} x2={largura - 20} y1={y(n * teto / 4)} y2={y(n * teto / 4)} stroke="#e9eef7" strokeDasharray="4 5" /><text x={margem.esquerda - 10} y={y(n * teto / 4) + 4} textAnchor="end">{n * teto / 4}</text></g>)}
      {meses.length > 1 && <polygon points={`${x(0)},${base} ${pontos} ${x(meses.length - 1)},${base}`} fill="#4263dc" opacity=".07" />}
      <polyline points={pontos} fill="none" stroke="#4263dc" strokeWidth="3" strokeLinejoin="round" />
      {meses.map((m, i) => <g key={m.mes} tabIndex={0} aria-label={`${nomeMes(m.mes)}: ${m[metrica]} ${metrica === 'dias' ? 'dias úteis alocados' : 'conclusões'}`}>
        <title>{nomeMes(m.mes)}: {m[metrica]} {metrica === 'dias' ? 'dias úteis alocados' : 'conclusões'}</title>
        <circle cx={x(i)} cy={y(m[metrica])} r="5" fill="#fff" stroke="#4263dc" strokeWidth="2.5" />
        {(i % Math.ceil(meses.length / 12) === 0 || i === meses.length - 1) && <text x={x(i)} y={altura - 10} textAnchor="middle">{nomeMes(m.mes)}</text>}
      </g>)}
    </svg></div>
    <details className="dados-grafico"><summary>Ver dados do gráfico</summary><div className="tabela-rolagem"><table><thead><tr><th>Mês</th><th>Conclusões</th><th>Dias úteis alocados</th></tr></thead><tbody>{meses.map((m) => <tr key={m.mes}><td>{nomeMes(m.mes)}</td><td>{m.conclusoes}</td><td>{m.dias}</td></tr>)}</tbody></table></div></details>
  </div>
}

export function GraficoDisciplinas({ disciplinas, onSelecionar }: {
  disciplinas: { id: string; nome: string; dias: number; indiceCor: number }[]
  onSelecionar: (id: string) => void
}) {
  const total = disciplinas.reduce((s, d) => s + d.dias, 0)
  let acumulado = 0
  return <div className="distribuicao-disciplinas">
    <svg viewBox="0 0 160 160" className="grafico-rosca" role="img" aria-label={`Distribuição de ${total} dias úteis alocados por disciplina`}>
      <circle cx="80" cy="80" r="58" fill="none" stroke="#edf1f8" strokeWidth="20" />
      {disciplinas.map((d) => {
        const arco = total ? d.dias / total * 364.425 : 0
        const deslocamento = acumulado
        acumulado += arco
        return <circle key={d.id} cx="80" cy="80" r="58" fill="none" stroke={CORES_DISCIPLINAS[d.indiceCor % CORES_DISCIPLINAS.length]} strokeWidth="20" strokeDasharray={`${Math.max(0, arco - 2)} 364.425`} strokeDashoffset={-deslocamento} transform="rotate(-90 80 80)"><title>{d.nome}: {d.dias} dias úteis</title></circle>
      })}
      <text className="rosca-total" x="80" y="78" textAnchor="middle">{total.toLocaleString('pt-BR')}</text><text x="80" y="98" textAnchor="middle">dias úteis</text>
    </svg>
    <div className="legenda-disciplinas">{disciplinas.map((d) => <button key={d.id} onClick={() => onSelecionar(d.id)} title={`Filtrar disciplina ${d.nome}`}>
      <i style={{ background: CORES_DISCIPLINAS[d.indiceCor % CORES_DISCIPLINAS.length] }} /><span>{d.nome}</span><strong>{total ? Math.round(d.dias / total * 100) : 0}%</strong><small>{d.dias.toLocaleString('pt-BR')} d</small>
    </button>)}</div>
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
