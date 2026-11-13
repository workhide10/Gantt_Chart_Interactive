import { useEffect, useRef, useState } from 'react'
import type { Dados } from '../types'
import { dataISOValida, hojeISO } from '../lib/datas'

interface Props {
  inline?: boolean
  dados: Dados
  equipeInicialId: string
  onSalvar: (equipeId: string, data: string, pessoas: string[]) => string | null
  onCancelar: () => void
}

export function AdicionarIntegrante({ dados, equipeInicialId, onSalvar, onCancelar, inline = false }: Props) {
  const [equipeId, setEquipeId] = useState(equipeInicialId)
  const [data, setData] = useState(hojeISO())
  const [selecionados, setSelecionados] = useState<string[]>([])
  const [busca, setBusca] = useState('')
  const [erroSalvar, setErroSalvar] = useState('')
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => { const atual = dialogo.current; if (!inline) atual?.showModal(); return () => { if (!inline && atual?.open) atual.close() } }, [inline])
  const cancelar = () => { if (selecionados.length && !confirm('Descartar os integrantes selecionados?')) return; onCancelar() }
  const vigente = (dados.composicoesEquipe ?? []).find((c) => c.equipeId === equipeId && c.inicio <= data && (!c.fim || c.fim >= data))
  const atuais = new Set((dados.integrantesComposicao ?? []).filter((i) => i.composicaoId === vigente?.id).map((i) => i.pessoaId))
  const pessoas = dados.pessoas.filter((p) => `${p.nome} ${p.funcao}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  const erro = !equipeId ? 'Selecione uma equipe.' : !dataISOValida(data) ? 'Informe uma data válida.' : data > hojeISO() ? 'Informe uma data até hoje.' : !selecionados.length ? 'Selecione ao menos uma pessoa.' : ''
  const salvar = () => { if (erro) return; setErroSalvar(onSalvar(equipeId, data, selecionados) ?? '') }
  return <dialog ref={dialogo} open={inline || undefined} className={inline ? 'central-formulario' : 'modal-fundo dialogo-nativo'} aria-labelledby="adicionar-integrante-titulo" onCancel={(e) => { e.preventDefault(); cancelar() }} onClick={(e) => { if (e.target === e.currentTarget) cancelar() }}>
    <form className="modal modal-composicao" onSubmit={(e) => { e.preventDefault(); salvar() }}>
      <div className="modal-cabecalho"><h2 id="adicionar-integrante-titulo">Adicionar integrante</h2><button type="button" className="fechar-modal" onClick={cancelar} aria-label="Fechar">×</button></div>
      <p className="texto-suave">Adicione pessoas à formação vigente sem remover integrantes. Para alguém que já está em outra equipe, use Transferir integrante.</p>
      <div className="duas-colunas"><label>Equipe<select value={equipeId} onChange={(e) => { setEquipeId(e.target.value); setSelecionados([]); setErroSalvar('') }}><option value="">Selecione…</option>{dados.equipes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label><label>Data de entrada<input type="date" max={hojeISO()} value={data} onChange={(e) => { setData(e.target.value); setSelecionados([]); setErroSalvar('') }} /></label></div>
      <p className="texto-suave">A mudança vale até a próxima formação registrada. Para retorno de ausência, informe a data efetiva do retorno.</p>
      <fieldset className="selecao-participantes"><legend>Pessoas a adicionar ({selecionados.length})</legend><input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pessoa ou função" aria-label="Buscar pessoa" /><div className="lista-participantes">{pessoas.map((p) => <label className="participante-selecao participante-item" key={p.id}><input type="checkbox" disabled={atuais.has(p.id)} checked={selecionados.includes(p.id)} onChange={(e) => { setErroSalvar(''); setSelecionados((ids) => e.target.checked ? [...ids, p.id] : ids.filter((id) => id !== p.id)) }} /><span>{p.nome}<small>{atuais.has(p.id) ? 'Já integra a equipe nesta data' : p.funcao || 'Função não informada'}</small></span></label>)}{!pessoas.length && <p className="vazio">Nenhuma pessoa encontrada. Cadastre-a em Cadastros → Pessoas.</p>}</div></fieldset>
      {(erro || erroSalvar) && <p className="erro">{erroSalvar || erro}</p>}
      <div className="acoes"><span style={{ flex: 1 }} /><button type="button" onClick={cancelar}>Cancelar</button><button type="submit" className="primario" disabled={Boolean(erro)}>Adicionar integrante</button></div>
    </form>
  </dialog>
}
