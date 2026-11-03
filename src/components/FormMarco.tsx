import { useState } from 'react'
import type { Dados, MarcoProjeto } from '../types'
import { difDias, formatarBR, hojeISO } from '../lib/datas'

interface Props {
  dados: Dados
  marcos: MarcoProjeto[]
  inicial: Partial<MarcoProjeto>
  onSalvar: (marco: MarcoProjeto) => void
  onExcluir: (id: string) => void
  onCancelar: () => void
}

export function FormMarco({ dados, marcos, inicial, onSalvar, onExcluir, onCancelar }: Props) {
  const [escolaId, setEscolaId] = useState(inicial.escolaId ?? '')
  const [data, setData] = useState(inicial.data ?? hojeISO())
  const [titulo, setTitulo] = useState(inicial.titulo ?? '')
  const [observacao, setObservacao] = useState(inicial.observacao ?? '')
  const edicao = Boolean(inicial.id)
  const erro = !escolaId ? 'Selecione o projeto.'
    : !titulo.trim() ? 'Informe o nome da etapa ou marco.'
    : !data ? 'Informe a data de conclusão.'
    : data > hojeISO() ? 'Marcos futuros não podem ser cadastrados como concluídos.'
    : ''
  const anteriores = escolaId
    ? marcos.filter((m) => m.escolaId === escolaId && m.id !== inicial.id && m.data <= data).sort((a, b) => b.data.localeCompare(a.data))
    : []
  const anterior = anteriores[0]
  const projeto = dados.escolas.find((e) => e.id === escolaId)

  const salvar = () => {
    if (erro) return
    onSalvar({ id: inicial.id ?? crypto.randomUUID(), escolaId, data, titulo: titulo.trim(), observacao: observacao.trim() })
  }

  return (
    <div className="modal-fundo" onClick={onCancelar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{edicao ? 'Editar marco concluído' : 'Novo marco concluído'}</h2>
        <label>Projeto
          <select value={escolaId} onChange={(e) => setEscolaId(e.target.value)}>
            <option value="">Selecione…</option>
            {dados.escolas.map((p) => <option key={p.id} value={p.id}>{p.codigo} – {p.nome}</option>)}
          </select>
        </label>
        <label>Etapa ou marco
          <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Projeto executivo concluído" />
        </label>
        <label>Data de conclusão
          <input type="date" max={hojeISO()} value={data} onChange={(e) => setData(e.target.value)} />
        </label>
        {anterior && <p className="marco-intervalo">Intervalo desde o marco anterior em {projeto?.codigo}: <strong>{difDias(anterior.data, data)} dias</strong> (último marco: {formatarBR(anterior.data)}).</p>}
        <label>Observações para análise (opcional)
          <textarea rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Resultado, atraso ou contexto que ajude a analisar as causas" />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <div className="acoes">
          {edicao && <button className="perigo" onClick={() => { if (confirm('Remover este marco do projeto?')) onExcluir(inicial.id!) }}>Remover marco</button>}
          <span style={{ flex: 1 }} />
          <button onClick={onCancelar}>Cancelar</button>
          <button className="primario" disabled={Boolean(erro)} onClick={salvar}>Salvar marco</button>
        </div>
      </div>
    </div>
  )
}
