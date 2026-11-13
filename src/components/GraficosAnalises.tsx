import { formatarBR } from '../lib/datas'

export const CORES_DISCIPLINAS = ['#4263dc', '#22a3a1', '#9b6ad3', '#e5a047', '#de718b', '#6f91c8', '#7aab61', '#b87955', '#7b83a4']

export function GraficoDisciplinas({ disciplinas, janela, referencia, onSelecionar }: {
  disciplinas: { id: string; nome: string; dias: number; indiceCor: number }[]
  janela: { inicio: string; fim: string; dias: number }
  referencia: 'projeto selecionado' | 'toda a plataforma'
  onSelecionar: (id: string) => void
}) {
  return <div className="tempo-disciplinas">
    <p className="tempo-disciplinas-referencia">Janela de referência ({referencia}): <strong>{janela.dias} dias corridos</strong> · {formatarBR(janela.inicio)} a {formatarBR(janela.fim)}</p>
    <div className="tempo-disciplinas-lista">{disciplinas.map((d) => {
      const percentual = janela.dias ? d.dias / janela.dias * 100 : 0
      return <button type="button" className="tempo-disciplina-linha" key={d.id} onClick={() => onSelecionar(d.id)} aria-label={`${d.nome}: ${d.dias} de ${janela.dias} dias corridos, ${percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}>
        <span className="tempo-disciplina-nome">{d.nome}</span><span className="tempo-disciplina-trilho"><i style={{ width: `${percentual}%`, background: CORES_DISCIPLINAS[d.indiceCor % CORES_DISCIPLINAS.length] }} /></span><strong>{d.dias} dias</strong><span>{percentual.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span>
      </button>
    })}</div>
    <p className="nota-grafico">A janela usa a primeira e a última atividade {referencia === 'projeto selecionado' ? 'do projeto selecionado' : 'de toda a plataforma'} e inclui pausas. O período, a disciplina e a equipe filtram os dias por disciplina sem alterar essa janela. Os dias por disciplina respeitam os filtros e contam datas coincidentes uma única vez. Disciplinas podem trabalhar nos mesmos dias; os percentuais não precisam somar 100%. Finais de semana e feriados são incluídos.</p>
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
  if (!linhas.length) return <p className="vazio">Nenhum projeto com registro em dias corridos neste ano e recorte.</p>
  return <div className="simultaneidade-grafico">
    <div className="simultaneidade-legenda"><span>Projetos distintos no mês</span><span>Menor</span><i aria-hidden="true" /><span>Maior</span></div>
    <div className="tabela-rolagem"><table className="simultaneidade-tabela" aria-label="Projetos distintos por disciplina e mês">
      <thead><tr><th scope="col">Disciplina</th>{meses.map((mes) => <th scope="col" key={mes}>{mes}</th>)}</tr></thead>
      <tbody>{linhas.map((disciplina) => <tr key={disciplina.id}><th scope="row"><button className="botao-discreto" title={disciplina.nome} onClick={() => onSelecionar(disciplina.id)}>{disciplina.sigla}</button></th>{projetosMensais.get(disciplina.id)!.map((valor, i) => <td key={i} aria-label={`${disciplina.sigla}, ${meses[i]}: ${valor} projetos distintos`}><span className="simultaneidade-celula" style={valor ? { backgroundColor: `rgba(66, 99, 220, ${0.15 + 0.75 * valor / maximo})`, color: valor / maximo > 0.55 ? '#fff' : '#263b91' } : undefined}>{valor || '—'}</span></td>)}</tr>)}</tbody>
    </table></div>
    <p className="nota-grafico">Cada projeto conta uma vez por disciplina e mês, mesmo com várias equipes ou intervalos. Os projetos do mês não precisam ter ocorrido simultaneamente. Clique em uma disciplina para filtrá-la.</p>
  </div>
}
