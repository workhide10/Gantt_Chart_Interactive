import { useState } from 'react'
import type { Atividade, Dados } from '../types'
import { formatarBR, sobrepoe } from '../lib/datas'

interface Props {
  dados: Dados
  inicial: Partial<Atividade> // vazio/parcial = nova atividade; com id = edição
  onSalvar: (a: Atividade) => void
  onExcluir: (id: string) => void
  onCancelar: () => void
}

export function FormAtividade({ dados, inicial, onSalvar, onExcluir, onCancelar }: Props) {
  const [escolaId, setEscolaId] = useState(inicial.escolaId ?? '')
  const [equipeId, setEquipeId] = useState(inicial.equipeId ?? '')
  const [inicio, setInicio] = useState(inicial.inicio ?? '')
  const [fim, setFim] = useState(inicial.fim ?? '')
  const [descricao, setDescricao] = useState(inicial.descricao ?? '')

  const edicao = Boolean(inicial.id)
  const erro =
    !escolaId || !equipeId ? 'Escolha a escola e a equipe.'
    : !inicio || !fim ? 'Informe as datas de início e fim.'
    : fim < inicio ? 'A data final não pode ser antes da inicial.'
    : ''

  // Aviso (não bloqueia): a equipe já tem outra atividade nesse período?
  const conflitos = erro
    ? []
    : dados.atividades.filter((o) => o.id !== inicial.id && o.equipeId === equipeId && sobrepoe(o, { inicio, fim }))

  const salvar = () => {
    if (erro) return
    onSalvar({ id: inicial.id ?? crypto.randomUUID(), escolaId, equipeId, inicio, fim, descricao: descricao.trim() })
  }

  return (
    <div className="modal-fundo" onClick={onCancelar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{edicao ? 'Editar atividade' : 'Nova atividade'}</h2>

        <label>Escola
          <select value={escolaId} onChange={(e) => setEscolaId(e.target.value)}>
            <option value="">Selecione…</option>
            {dados.escolas.map((s) => <option key={s.id} value={s.id}>{s.codigo} – {s.nome}</option>)}
          </select>
        </label>

        <label>Equipe
          <select value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
            <option value="">Selecione…</option>
            {dados.equipes.map((q) => <option key={q.id} value={q.id}>{q.nome}</option>)}
          </select>
        </label>

        <div className="duas-colunas">
          <label>Início
            <input type="date" value={inicio} onChange={(e) => { setInicio(e.target.value); if (!fim || fim < e.target.value) setFim(e.target.value) }} />
          </label>
          <label>Fim
            <input type="date" value={fim} min={inicio} onChange={(e) => setFim(e.target.value)} />
          </label>
        </div>

        <label>Descrição (opcional)
          <textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </label>

        {erro && <p className="erro">{erro}</p>}
        {conflitos.length > 0 && (
          <p className="aviso">
            ⚠ Esta equipe já tem {conflitos.length} atividade(s) neste período:{' '}
            {conflitos.map((c) => `${dados.escolas.find((s) => s.id === c.escolaId)?.codigo} (${formatarBR(c.inicio)}–${formatarBR(c.fim)})`).join(', ')}
          </p>
        )}

        <div className="acoes">
          {edicao && (
            <button className="perigo" onClick={() => { if (confirm('Excluir esta atividade?')) onExcluir(inicial.id!) }}>Excluir</button>
          )}
          <span style={{ flex: 1 }} />
          <button onClick={onCancelar}>Cancelar</button>
          <button className="primario" disabled={Boolean(erro)} onClick={salvar}>Salvar</button>
        </div>
      </div>
    </div>
  )
}
