import { useMemo } from 'react'
import type { Dados, MarcoProjeto } from '../types'
import { formatarBR } from '../lib/datas'

interface Props { dados: Dados; marcos: MarcoProjeto[]; onEditar: (marco: MarcoProjeto) => void; onExcluir: (id: string) => void }

export function ListaMarcos({ dados, marcos, onEditar, onExcluir }: Props) {
  const linhas = useMemo(() => [...marcos].sort((a, b) => {
    const projetoA = dados.escolas.find((p) => p.id === a.escolaId)?.codigo ?? ''
    const projetoB = dados.escolas.find((p) => p.id === b.escolaId)?.codigo ?? ''
    return projetoA.localeCompare(projetoB) || a.data.localeCompare(b.data) || a.titulo.localeCompare(b.titulo)
  }), [dados.escolas, marcos])
  const entregas = marcos.filter((m) => !m.simbolo || m.simbolo === 'losango').length
  const revisoes = marcos.filter((m) => m.simbolo === 'circulo').length
  return <section className="lista-marcos">
    <div className="cartoes">
      <div className="cartao"><b>{marcos.length}</b><span>marcos no total</span></div>
      <div className="cartao"><b>{entregas}</b><span>marcos de entrega</span></div>
      <div className="cartao"><b>{revisoes}</b><span>marcos de revisão</span></div>
    </div>
    <div className="tabela-rolagem"><table><thead><tr><th>Projeto</th><th>Tipo</th><th>Marco</th><th>Data</th><th>Descrição / observações</th><th>Ações</th></tr></thead><tbody>
      {linhas.map((marco) => { const projeto = dados.escolas.find((p) => p.id === marco.escolaId); const tipo = marco.simbolo === 'circulo' ? '● Revisão' : marco.simbolo === 'generico' ? '■ Genérico' : '◆ Entrega'; return <tr key={marco.id}>
        <td><i className="bolinha" style={{ background: projeto?.cor }} />{projeto?.codigo ?? 'Projeto removido'}</td><td>{tipo}</td><td><strong>{marco.titulo}</strong></td><td>{formatarBR(marco.data)}</td><td className="marco-observacao">{marco.observacao || '—'}</td><td><div className="marco-acoes"><button onClick={() => onEditar(marco)}>Editar</button><button className="perigo" onClick={() => { if (confirm(`Remover o marco “${marco.titulo}”?`)) onExcluir(marco.id) }}>Remover</button></div></td>
      </tr> })}
    </tbody></table>{linhas.length === 0 && <p className="vazio">Nenhum marco cadastrado para o filtro selecionado.</p>}</div>
    <p className="dica">Marcos genéricos permitem registrar fatos e contexto, como o motivo de uma pausa. Eles não alteram automaticamente os períodos de atividade ou os cálculos de execução.</p>
  </section>
}
