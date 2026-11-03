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
  itens: T[]
  colunas: Coluna<T>[]
  onChange: (novos: T[]) => void
  criarNovo: () => T
  motivoBloqueio: (item: T) => string | null // se devolver texto, a exclusão é bloqueada
}

export function TabelaEditavel<T extends { id: string }>({ itens, colunas, onChange, criarNovo, motivoBloqueio }: Props<T>) {
  const alterar = (id: string, chave: string, valor: string | null) =>
    onChange(itens.map((i) => (i.id === id ? ({ ...i, [chave]: valor } as T) : i)))

  const excluir = (item: T) => {
    const motivo = motivoBloqueio(item)
    if (motivo) return alert(motivo)
    if (confirm('Excluir este registro?')) onChange(itens.filter((i) => i.id !== item.id))
  }

  return (
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
            <tr key={item.id}>
              {colunas.map((c) => {
                const valor = String(item[c.chave] ?? '')
                return (
                  <td key={c.chave}>
                    {c.tipo === 'select' ? (
                      <select value={valor} onChange={(e) => alterar(item.id, c.chave, e.target.value === '' && c.permiteVazio ? null : e.target.value)}>
                        {c.permiteVazio && <option value="">—</option>}
                        {c.opcoes?.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
                      </select>
                    ) : (
                      <input
                        type={c.tipo === 'cor' ? 'color' : 'text'}
                        value={valor}
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
      <button className="primario" style={{ marginTop: 8 }} onClick={() => onChange([...itens, criarNovo()])}>+ Adicionar</button>
    </div>
  )
}
