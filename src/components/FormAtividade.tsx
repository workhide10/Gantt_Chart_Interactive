import { useState } from 'react'
import type { Atividade, Dados } from '../types'
import { formatarBR, sobrepoe } from '../lib/datas'

interface Props {
  dados: Dados
  inicial: Partial<Atividade>
  onSalvar: (atividade: Atividade) => void
  onExcluir: (id: string) => void
  onCancelar: () => void
}

export function FormAtividade({ dados, inicial, onSalvar, onExcluir, onCancelar }: Props) {
  const [escolaId, setEscolaId] = useState(inicial.escolaId ?? '')
  const [equipeId, setEquipeId] = useState(inicial.equipeId ?? '')
  const [inicio, setInicio] = useState(inicial.inicio ?? '')
  const [fim, setFim] = useState(inicial.fim ?? '')
  const [titulo, setTitulo] = useState(inicial.titulo ?? '')
  const [descricao, setDescricao] = useState(inicial.descricao ?? '')
  const edicao = Boolean(inicial.id)
  const erro =
    !escolaId || !equipeId ? 'Escolha o projeto e a equipe.'
    : !inicio || !fim ? 'Informe as datas de início e fim.'
    : fim < inicio ? 'A data final não pode ser antes da inicial.'
    : ''
  const conflitos = erro ? [] : dados.atividades.filter((a) =>
    a.id !== inicial.id && a.equipeId === equipeId && sobrepoe(a, { inicio, fim }),
  )

  const salvar = () => {
    if (erro) return
    onSalvar({
      id: inicial.id ?? crypto.randomUUID(),
      escolaId,
      equipeId,
      inicio,
      fim,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
    })
  }

  return (
    <div className="modal-fundo" onClick={onCancelar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{edicao ? 'Editar atividade concluída' : 'Nova atividade concluída'}</h2>
        <label>Projeto
          <select value={escolaId} onChange={(e) => setEscolaId(e.target.value)}>
            <option value="">Selecione…</option>
            {dados.escolas.map((p) => <option key={p.id} value={p.id}>{p.codigo} – {p.nome}</option>)}
          </select>
        </label>
        <label>Equipe
          <select value={equipeId} onChange={(e) => setEquipeId(e.target.value)}>
            <option value="">Selecione…</option>
            {dados.equipes.map((q) => <option key={q.id} value={q.id}>{q.nome}</option>)}
          </select>
        </label>
        <label>Etapa / atividade (opcional)
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Compatibilização" />
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
        {conflitos.length > 0 && <p className="aviso">Esta equipe já possui {conflitos.length} atividade(s) sobreposta(s): {conflitos.map((a) => `${dados.escolas.find((p) => p.id === a.escolaId)?.codigo} (${formatarBR(a.inicio)}–${formatarBR(a.fim)})`).join(', ')}</p>}
        <div className="acoes">
          {edicao && <button className="perigo" onClick={() => { if (confirm('Excluir esta atividade?')) onExcluir(inicial.id!) }}>Excluir</button>}
          <span style={{ flex: 1 }} />
          <button onClick={onCancelar}>Cancelar</button>
          <button className="primario" disabled={Boolean(erro)} onClick={salvar}>Salvar atividade</button>
        </div>
      </div>
    </div>
  )
}
