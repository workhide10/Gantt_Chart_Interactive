import { useMemo, useState } from 'react'
import type { Dados } from '../types'
import { formatarBR } from '../lib/datas'
import { analisarExecucaoProjetos } from '../lib/analises'

interface Props { dados: Dados; escolaId: string; onSelecionar: (id: string) => void }

export function ExecucaoProjetos({ dados, escolaId, onSelecionar }: Props) {
  const projetos = useMemo(() => analisarExecucaoProjetos(dados, escolaId), [dados.atividades, dados.escolas, escolaId])
  const [ordem, setOrdem] = useState<'pausas' | 'duracao'>('pausas')
  const [todos, setTodos] = useState(false)
  const ordenados = [...projetos].sort((a, b) => ordem === 'pausas' ? b.diasPausados - a.diasPausados || b.diasJanela - a.diasJanela : b.diasJanela - a.diasJanela)

  return <section className="execucao-projetos painel-grafico">
    <div className="painel-cabecalho"><div><span className="dashboard-sobretitulo">CONTEXTO COMPLETO DO PROJETO</span><h3>Execução e pausas</h3><p>Compare o tempo com atividades e os intervalos sem registros ao longo da janela de cada projeto.</p></div>
      <label className="ordenacao-execucao">Ordenar por<select value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)}><option value="pausas">Mais dias de pausa</option><option value="duracao">Maior janela de execução</option></select></label>
    </div>
    <p className="escopo-execucao">Respeita o filtro de projeto. Considera todas as disciplinas, equipes e datas para preservar a linha do tempo completa.</p>
    <div className="legenda-execucao"><span><i />Dias com atividades</span><span><i />Dias de pausa</span><small>Dias corridos · valores comparáveis por linha</small></div>
    <div className="ranking-projetos">{(todos ? ordenados : ordenados.slice(0, 6)).map((p) => <button key={p.id} className="execucao-linha" onClick={() => onSelecionar(p.id)} aria-label={`Filtrar projeto ${p.codigo}, ${p.diasAtivos} dias com atividades, ${p.diasPausados} dias de pausa, janela de ${p.diasJanela} dias`}>
      <strong><i className="bolinha" style={{ background: p.cor }} />{p.codigo}</strong><span className="execucao-trilho"><i style={{ width: `${p.diasAtivos / p.diasJanela * 100}%` }} /><i style={{ width: `${p.diasPausados / p.diasJanela * 100}%` }} /></span><span className="execucao-valores"><b>{p.diasAtivos}</b> execução <span>·</span> <b>{p.diasPausados}</b> pausa <small>{p.diasJanela} dias de janela</small></span>
    </button>)}</div>
    {projetos.length > 6 && <button className="botao-discreto" onClick={() => setTodos(!todos)}>{todos ? 'Mostrar os 6 primeiros' : `Ver todos os ${projetos.length} projetos`}</button>}
    {projetos.length === 0 && <p className="vazio">Nenhum projeto com atividades para exibir.</p>}
    {projetos.length > 0 && <details className="dados-grafico"><summary>Ver detalhamento completo dos projetos</summary>
    <div className="tabela-rolagem">
      <table className="tabela-execucao">
        <thead><tr><th>Projeto</th><th>Primeira atividade</th><th>Última atividade</th><th>Dias de execução</th><th>Janela total</th><th>Pausas</th><th>Intervalos sem atividade</th></tr></thead>
        <tbody>{projetos.map((projeto) => <tr key={projeto.id}>
          <td><i className="bolinha" style={{ background: projeto.cor }} />{projeto.codigo}{projeto.nome && projeto.nome !== projeto.codigo ? ` · ${projeto.nome}` : ''}</td>
          <td>{formatarBR(projeto.inicio)}</td><td>{formatarBR(projeto.fim)}</td>
          <td><strong>{projeto.diasAtivos}</strong> dias corridos</td>
          <td>{projeto.diasJanela} dias corridos</td>
          <td>{projeto.diasPausados} dias corridos</td>
          <td>{projeto.pausas.length ? <ul className="execucao-pausas">{projeto.pausas.map((pausa, i) => <li key={`${pausa.inicio}-${i}`}>{formatarBR(pausa.inicio)} a {formatarBR(pausa.fim)} · {pausa.dias} dias</li>)}</ul> : <span className="texto-suave">Sem pausa registrada</span>}</td>
        </tr>)}</tbody>
      </table>
      {projetos.length === 0 && <p className="vazio">Nenhum projeto com atividades concluídas para exibir.</p>}
    </div></details>}
    <p className="nota-grafico">Cada dia coberto conta uma vez, mesmo com atividades simultâneas. Fins de semana e feriados entram na janela e nas pausas. Clique em um projeto para filtrar o dashboard.</p>
  </section>
}
