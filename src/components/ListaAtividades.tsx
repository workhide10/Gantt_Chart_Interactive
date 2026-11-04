import type { Atividade, Dados } from '../types'
import { feriados } from '../data/inicial'
import { diasUteis, formatarBR } from '../lib/datas'

interface Props {
  dados: Dados
  atividades: Atividade[]
  onEditar: (a: Atividade) => void
}

export function ListaAtividades({ dados, atividades, onEditar }: Props) {
  const ordenadas = [...atividades].sort((a, b) => a.inicio.localeCompare(b.inicio))
  return (
    <div className="tabela-rolagem">
      <table>
        <thead>
          <tr><th>Escola</th><th>Equipe</th><th>Disciplina</th><th>Início</th><th>Fim</th><th>Dias úteis</th><th>Descrição</th><th></th></tr>
        </thead>
        <tbody>
          {ordenadas.map((a) => {
            const escola = dados.escolas.find((s) => s.id === a.escolaId)
            const equipe = dados.equipes.find((q) => q.id === a.equipeId)
            const disc = dados.disciplinas.find((d) => d.id === equipe?.disciplinaId)
            return (
              <tr key={a.id}>
                <td><i className="bolinha" style={{ background: escola?.cor }} /> {escola?.codigo}</td>
                <td>{equipe?.nome}</td>
                <td>{disc?.sigla}</td>
                <td>{formatarBR(a.inicio)}</td>
                <td>{formatarBR(a.fim)}</td>
                <td>{diasUteis(a.inicio, a.fim, feriados)}</td>
                <td>{a.descricao}</td>
                <td><button onClick={() => onEditar(a)}>Editar</button></td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {ordenadas.length === 0 && <p className="vazio">Nenhuma atividade para os filtros escolhidos.</p>}
    </div>
  )
}
