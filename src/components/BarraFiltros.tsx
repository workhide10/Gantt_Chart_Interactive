import type { ReactNode } from 'react'
import type { Dados, Filtros } from '../types'

interface Props {
  dados: Dados
  somenteProjeto?: boolean
  acao?: ReactNode
  filtros: Filtros
  onChange: (f: Filtros) => void
}

export function BarraFiltros({ dados, filtros, onChange, somenteProjeto = false, acao }: Props) {
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
          disabled={somenteProjeto}
          title={somenteProjeto ? 'Marcos não possuem disciplina associada' : undefined}
          value={somenteProjeto ? '' : filtros.disciplinaId}
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
        <select disabled={somenteProjeto} title={somenteProjeto ? 'Marcos não possuem equipe associada' : undefined} value={somenteProjeto ? '' : filtros.equipeId} onChange={(e) => onChange({ ...filtros, equipeId: e.target.value })}>
          <option value="">Todas as equipes</option>
          {equipesVisiveis.map((x) => (
            <option key={x.id} value={x.id}>{x.nome}</option>
          ))}
        </select>
      </label>
      <button disabled={somenteProjeto ? !filtros.escolaId : !filtros.escolaId && !filtros.disciplinaId && !filtros.equipeId} onClick={() => onChange(somenteProjeto ? { ...filtros, escolaId: '' } : { escolaId: '', disciplinaId: '', equipeId: '' })}>Limpar filtros</button>
      {acao && <div className="filtros-acao">{acao}</div>}
      {somenteProjeto && <small className="filtros-observacao">Marcos não possuem disciplina ou equipe associada.</small>}
    </div>
  )
}
