import { SeletorCor } from './SeletorCor'
import { useLayoutEffect, useRef, useState } from 'react'

// Tabela genérica para cadastrar/editar/excluir registros (Escola, Disciplina, Equipe, Pessoa).
// O "<T extends { id: string }>" significa: funciona para qualquer tipo que tenha um campo id.

export interface Coluna<T> {
  chave: keyof T & string
  titulo: string
  tipo?: 'texto' | 'cor' | 'select'
  opcoes?: { valor: string; rotulo: string }[]
  permiteVazio?: boolean // para selects opcionais (grava null)
}

interface Props<T extends { id: string }> {
  ocultarAdicionar?: boolean
  itens: T[]
  colunas: Coluna<T>[]
  onChange: (novos: T[]) => void
  criarNovo: () => T
  motivoBloqueio: (item: T) => string | null // se devolver texto, a exclusão é bloqueada
  bloqueioAdicionar?: string
}

export function TabelaEditavel<T extends { id: string }>({ itens, colunas, onChange, criarNovo, motivoBloqueio, bloqueioAdicionar, ocultarAdicionar }: Props<T>) {
  const tabelaRef = useRef<HTMLDivElement>(null)
  const [novoId, setNovoId] = useState<string | null>(null)
  useLayoutEffect(() => {
    if (!novoId) return
    const linha = Array.from(tabelaRef.current?.querySelectorAll<HTMLTableRowElement>('tr[data-id]') ?? []).find((elemento) => elemento.dataset.id === novoId)
    linha?.querySelector<HTMLElement>('input, select')?.focus()
    linha?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [novoId])
  const adicionar = () => {
    if (bloqueioAdicionar) return
    const novo = criarNovo()
    onChange([...itens, novo])
    setNovoId(novo.id)
  }
  const alterar = (id: string, chave: keyof T & string, valor: string | null) =>
    onChange(itens.map((i) => (i.id === id ? ({ ...i, [chave]: valor } as T) : i)))

  const excluir = (item: T) => {
    const motivo = motivoBloqueio(item)
    if (motivo) return alert(motivo)
    if (confirm('Excluir este registro?')) onChange(itens.filter((i) => i.id !== item.id))
  }

  return (
    <div ref={tabelaRef}>
      <div className="lista-ferramentas"><p className="dica">{bloqueioAdicionar || 'Edite diretamente nos campos. As alterações são salvas automaticamente neste navegador.'}</p>{!ocultarAdicionar && <button className="primario" disabled={Boolean(bloqueioAdicionar)} title={bloqueioAdicionar} onClick={adicionar}>+ Adicionar</button>}</div>
      <div className="tabela-rolagem">
      <table>
        <thead>
          <tr>
            {colunas.map((c) => <th key={c.chave}>{c.titulo}</th>)}
            <th></th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item) => (
            <tr key={item.id} data-id={item.id}>
              {colunas.map((c) => {
                const valor = String(item[c.chave] ?? '')
                return (
                  <td key={c.chave}>
                    {c.tipo === 'select' ? (
                      <select aria-label={c.titulo} value={valor} onChange={(e) => alterar(item.id, c.chave, e.target.value === '' && c.permiteVazio ? null : e.target.value)}>
                        {c.permiteVazio && <option value="">—</option>}
                        {c.opcoes?.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
                      </select>
                    ) : c.tipo === 'cor' ? (
                      <SeletorCor valor={valor} onChange={(cor) => alterar(item.id, c.chave, cor)} />
                    ) : (
                      <input
                        type="text"
                        value={valor}
                        aria-label={c.titulo}
                        onChange={(e) => alterar(item.id, c.chave, e.target.value)}
                      />
                    )}
                  </td>
                )
              })}
              <td><button className="perigo" onClick={() => excluir(item)}>Excluir</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      {itens.length === 0 && <p className="vazio">Nenhum registro. Use “Adicionar” para começar.</p>}
      </div>
    </div>
  )
}
