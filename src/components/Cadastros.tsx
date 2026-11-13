import { useEffect, useRef, useState } from 'react'
import type { Dados } from '../types'
import { SeletorCor } from './SeletorCor'
import { TabelaEditavel } from './TabelaEditavel'
import { motivoBloqueioExclusao } from '../lib/registros'

interface Props {
  dados: Dados
  onChange: (d: Dados) => void
}

type Aba = 'escolas' | 'disciplinas' | 'equipes' | 'pessoas'
const ABAS: { id: Aba; titulo: string }[] = [
  { id: 'escolas', titulo: 'Projetos' },
  { id: 'disciplinas', titulo: 'Disciplinas' },
  { id: 'equipes', titulo: 'Equipes base' },
  { id: 'pessoas', titulo: 'Pessoas' },
]

export function Cadastros({ dados, onChange }: Props) {
  const [aba, setAba] = useState<Aba>('escolas')
  const [novo, setNovo] = useState(false)
  const novoId = () => crypto.randomUUID()

  const opcoesDisciplina = dados.disciplinas.map((d) => ({ valor: d.id, rotulo: d.sigla }))

  return (
    <section>
      <div className="cadastros-navegacao"><div className="seg">
        {ABAS.map((a) => (
          <button key={a.id} className={aba === a.id ? 'ativo' : ''} onClick={() => setAba(a.id)}>{a.titulo}</button>
        ))}
      </div><button className="primario" onClick={() => setNovo(true)}>+ Novo cadastro</button></div>

      {aba === 'escolas' && (
        <TabelaEditavel ocultarAdicionar
          itens={dados.escolas}
          colunas={[
            { chave: 'codigo', titulo: 'Código' },
            { chave: 'nome', titulo: 'Nome' },
            { chave: 'cor', titulo: 'Cor', tipo: 'cor' },
          ]}
          onChange={(escolas) => onChange({ ...dados, escolas })}
          criarNovo={() => ({ id: novoId(), codigo: '', nome: '', cor: '#3b82f6' })}
          motivoBloqueio={(e) => motivoBloqueioExclusao(dados, 'projeto', e.id)}
        />
      )}

      {aba === 'disciplinas' && (
        <TabelaEditavel ocultarAdicionar
          itens={dados.disciplinas}
          colunas={[
            { chave: 'sigla', titulo: 'Sigla' },
            { chave: 'nome', titulo: 'Nome' },
          ]}
          onChange={(disciplinas) => onChange({ ...dados, disciplinas })}
          criarNovo={() => ({ id: novoId(), sigla: '', nome: '' })}
          motivoBloqueio={(d) => motivoBloqueioExclusao(dados, 'disciplina', d.id)}
        />
      )}

      {aba === 'equipes' && (
        <TabelaEditavel ocultarAdicionar
          itens={dados.equipes}
          bloqueioAdicionar={dados.disciplinas.length ? undefined : 'Cadastre uma disciplina antes de adicionar equipes.'}
          colunas={[
            { chave: 'nome', titulo: 'Equipe' },
            { chave: 'disciplinaId', titulo: 'Disciplina', tipo: 'select', opcoes: opcoesDisciplina },
          ]}
          onChange={(equipes) => onChange({ ...dados, equipes })}
          criarNovo={() => ({ id: novoId(), nome: '', disciplinaId: dados.disciplinas[0]?.id ?? '' })}
          motivoBloqueio={(e) => motivoBloqueioExclusao(dados, 'equipe', e.id)}
        />
      )}

      {aba === 'pessoas' && (
        <TabelaEditavel ocultarAdicionar
          itens={dados.pessoas}
          colunas={[
            { chave: 'nome', titulo: 'Nome' },
            { chave: 'funcao', titulo: 'Função' },
          ]}
          onChange={(pessoas) => onChange({ ...dados, pessoas })}
          criarNovo={() => ({ id: novoId(), nome: '', funcao: '' })}
          motivoBloqueio={(pessoa) => motivoBloqueioExclusao(dados, 'pessoa', pessoa.id)}
        />
      )}


      {novo && <NovoCadastro dados={dados} inicial={aba} onCancelar={() => setNovo(false)} onSalvar={(tipo, atualizado) => { onChange(atualizado); setAba(tipo); setNovo(false) }} />}
    </section>
  )
}

export function NovoCadastro({ dados, inicial, onCancelar, onSalvar, inline = false }: { dados: Dados; inicial: Aba; onCancelar: () => void; onSalvar: (tipo: Aba, dados: Dados) => void; inline?: boolean }) {
  const [tipo, setTipo] = useState<Aba>(inicial)
  const [nome, setNome] = useState('')
  const [codigo, setCodigo] = useState('')
  const [cor, setCor] = useState('#3b82f6')
  const [disciplinaId, setDisciplinaId] = useState('')
  const [funcao, setFuncao] = useState('')
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => { const atual = dialogo.current; if (!inline) atual?.showModal(); return () => { if (!inline && atual?.open) atual.close() } }, [inline])
  const cancelar = () => { if ((nome.trim() || codigo.trim() || funcao.trim()) && !confirm('Descartar os dados deste cadastro?')) return; onCancelar() }
  const salvar = () => {
    if (!nome.trim() || ((tipo === 'escolas' || tipo === 'disciplinas') && !codigo.trim()) || (tipo === 'equipes' && !disciplinaId)) return
    const id = crypto.randomUUID(), nomeLimpo = nome.trim()
    const atualizado = tipo === 'escolas' ? { ...dados, escolas: [...dados.escolas, { id, nome: nomeLimpo, codigo: codigo.trim(), cor }] }
      : tipo === 'disciplinas' ? { ...dados, disciplinas: [...dados.disciplinas, { id, nome: nomeLimpo, sigla: codigo.trim() }] }
      : tipo === 'equipes' ? { ...dados, equipes: [...dados.equipes, { id, nome: nomeLimpo, disciplinaId }] }
      : { ...dados, pessoas: [...dados.pessoas, { id, nome: nomeLimpo, funcao: funcao.trim() }] }
    onSalvar(tipo, atualizado)
  }
  return <dialog ref={dialogo} open={inline || undefined} className={inline ? 'central-formulario' : 'modal-fundo dialogo-nativo'} aria-labelledby="novo-cadastro-titulo" onCancel={(e) => { e.preventDefault(); cancelar() }} onClick={(e) => { if (e.target === e.currentTarget) cancelar() }}>
    <form className="modal" onSubmit={(e) => { e.preventDefault(); salvar() }}>
      <div className="modal-cabecalho"><h2 id="novo-cadastro-titulo">Novo cadastro</h2><button type="button" className="fechar-modal" onClick={cancelar} aria-label="Fechar">×</button></div>
      <label>O que deseja cadastrar?<select value={tipo} onChange={(e) => { if ((nome.trim() || codigo.trim() || funcao.trim() || disciplinaId) && !confirm('Alterar o tipo e descartar os dados preenchidos?')) return; setTipo(e.target.value as Aba); setNome(''); setCodigo(''); setFuncao(''); setDisciplinaId('') }}>{ABAS.map((a) => <option value={a.id} key={a.id}>{a.titulo}</option>)}</select></label>
      {(tipo === 'escolas' || tipo === 'disciplinas') && <label>{tipo === 'escolas' ? 'Código' : 'Sigla'}<input required value={codigo} onChange={(e) => setCodigo(e.target.value)} /></label>}
      <label>Nome<input required value={nome} onChange={(e) => setNome(e.target.value)} /></label>
      {tipo === 'escolas' && <div><span className="cadastro-cor-rotulo">Cor do projeto</span><SeletorCor valor={cor} onChange={setCor} /></div>}
      {tipo === 'equipes' && <label>Disciplina<select required value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}><option value="">Selecione…</option>{dados.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.sigla} – {d.nome}</option>)}</select>{!dados.disciplinas.length && <span>Cadastre uma disciplina antes de criar uma equipe.</span>}</label>}
      {tipo === 'pessoas' && <label>Função (opcional)<input value={funcao} onChange={(e) => setFuncao(e.target.value)} /></label>}
      <div className="acoes"><span style={{ flex: 1 }} /><button type="button" onClick={cancelar}>Cancelar</button><button className="primario" type="submit" disabled={!nome.trim() || ((tipo === 'escolas' || tipo === 'disciplinas') && !codigo.trim()) || (tipo === 'equipes' && !disciplinaId)}>Salvar cadastro</button></div>
    </form>
  </dialog>
}
