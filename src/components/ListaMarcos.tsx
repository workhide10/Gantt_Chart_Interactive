import { useMemo } from 'react'
import type { Dados, MarcoProjeto } from '../types'
import { difDias, formatarBR } from '../lib/datas'

interface Props {
  dados: Dados
  marcos: MarcoProjeto[]
  onEditar: (marco: MarcoProjeto) => void
  onExcluir: (id: string) => void
}

export function ListaMarcos({ dados, marcos, onEditar, onExcluir }: Props) {
  const linhas = useMemo(() => {
    const ordenados = [...marcos].sort((a, b) => {
      const projetoA = dados.escolas.find((p) => p.id === a.escolaId)?.codigo ?? ''
      const projetoB = dados.escolas.find((p) => p.id === b.escolaId)?.codigo ?? ''
      return projetoA.localeCompare(projetoB) || a.data.localeCompare(b.data) || a.titulo.localeCompare(b.titulo)
    })
    const anteriorPorProjeto = new Map<string, MarcoProjeto>()
    return ordenados.map((marco) => {
      const anterior = anteriorPorProjeto.get(marco.escolaId)
      anteriorPorProjeto.set(marco.escolaId, marco)
      return { marco, anterior }
    })
  }, [dados.escolas, marcos])
  const intervalos = linhas.flatMap((linha) => linha.anterior ? [difDias(linha.anterior.data, linha.marco.data)] : [])
  const media = intervalos.length ? Math.round(intervalos.reduce((s, d) => s + d, 0) / intervalos.length) : null
  const projetosComMarcos = new Set(marcos.map((m) => m.escolaId)).size

  return (
    <section className="lista-marcos">
      <div className="cartoes">
        <div className="cartao"><b>{marcos.length}</b><span>marcos concluídos</span></div>
        <div className="cartao"><b>{projetosComMarcos}</b><span>projetos com marcos</span></div>
        <div className="cartao"><b>{media === null ? '—' : `${media} dias`}</b><span>intervalo médio entre marcos do mesmo projeto</span></div>
      </div>
      <div className="tabela-rolagem">
        <table>
          <thead><tr><th>Projeto</th><th>Etapa / marco</th><th>Conclusão</th><th>Tempo desde o marco anterior</th><th>Observações</th><th>Ações</th></tr></thead>
          <tbody>
            {linhas.map(({ marco, anterior }) => {
              const projeto = dados.escolas.find((p) => p.id === marco.escolaId)
              return (
                <tr key={marco.id}>
                  <td><i className="bolinha" style={{ background: projeto?.cor }} />{projeto?.codigo ?? 'Projeto removido'}</td>
                  <td><strong>{marco.titulo}</strong></td>
                  <td>{formatarBR(marco.data)}</td>
                  <td>{anterior ? `${difDias(anterior.data, marco.data)} dias` : 'Primeiro marco do projeto'}</td>
                  <td className="marco-observacao">{marco.observacao || '—'}</td>
                  <td><div className="marco-acoes"><button onClick={() => onEditar(marco)}>Editar</button><button className="perigo" onClick={() => { if (confirm(`Remover o marco “${marco.titulo}”?`)) onExcluir(marco.id) }}>Remover</button></div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {linhas.length === 0 && <p className="vazio">Nenhum marco cadastrado. Adicione marcos concluídos para comparar o tempo entre as etapas.</p>}
      </div>
      <p className="dica">O intervalo é contado em dias corridos entre datas de conclusão consecutivas dentro do mesmo projeto. As observações ficam registradas junto a cada marco para apoiar a análise das causas.</p>
    </section>
  )
}
