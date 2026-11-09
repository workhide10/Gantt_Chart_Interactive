import type { Dados, Filtros } from '../types'

interface Props {
  dados: Dados
  filtros: Filtros
  onChange: (f: Filtros) => void
}

export function BarraFiltros({ dados, filtros, onChange }: Props) {
  const equipesVisiveis = filtros.disciplinaId
    ? dados.equipes.filter((e) => e.disciplinaId === filtros.disciplinaId)
    : dados.equipes

  return (
    <div className="filtros">
      <label>
        Projeto
        <select value={filtros.escolaId} onChange={(e) => onChange({ ...filtros, escolaId: e.target.value })}>
          <option value="">Todos os projetos</option>
          {dados.escolas.map((x) => (
            <option key={x.id} value={x.id}>{x.codigo} – {x.nome}</option>
          ))}
        </select>
      </label>
      <label>
        Disciplina
        <select
          value={filtros.disciplinaId}
          onChange={(e) => onChange({ ...filtros, disciplinaId: e.target.value, equipeId: '' })}
        >
          <option value="">Todas as disciplinas</option>
          {dados.disciplinas.map((x) => (
            <option key={x.id} value={x.id}>{x.sigla}</option>
          ))}
        </select>
      </label>
      <label>
        Equipe
        <select value={filtros.equipeId} onChange={(e) => onChange({ ...filtros, equipeId: e.target.value })}>
          <option value="">Todas as equipes</option>
          {equipesVisiveis.map((x) => (
            <option key={x.id} value={x.id}>{x.nome}</option>
          ))}
        </select>
      </label>
      <button disabled={!filtros.escolaId && !filtros.disciplinaId && !filtros.equipeId} onClick={() => onChange({ escolaId: '', disciplinaId: '', equipeId: '' })}>Limpar filtros</button>
    </div>
  )
}
