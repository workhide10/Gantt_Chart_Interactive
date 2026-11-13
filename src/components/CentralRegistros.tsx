import { useEffect, useRef, useState } from 'react'
import type { Atividade, Dados, Filtros, MarcoProjeto } from '../types'
import { hojeISO } from '../lib/datas'
import { adicionarIntegrantes, registrarMovimentacao } from '../lib/equipes'
import { FormAtividade } from './FormAtividade'
import { FormMarco } from './FormMarco'
import { AdicionarIntegrante } from './AdicionarIntegrante'
import { MovimentarEquipe } from './MovimentarEquipe'
import { FormacaoAtual } from './ComposicoesEquipe'
import { NovoCadastro } from './Cadastros'

type Acao = 'inicio' | 'atividade' | 'marco' | 'adicionar' | 'troca' | 'saida' | 'formacao' | 'escolas' | 'disciplinas' | 'equipes' | 'pessoas'
type Cadastro = 'escolas' | 'disciplinas' | 'equipes' | 'pessoas'
interface Props {
  dados: Dados
  filtros: Filtros
  contexto: Partial<Atividade>
  onFechar: () => void
  onSalvarAtividade: (atividade: Atividade, continuar?: boolean) => void
  onExcluirAtividade: (id: string) => void
  onSalvarMarco: (marco: MarcoProjeto) => void
  onExcluirMarco: (id: string) => void
  onDadosChange: (dados: Dados) => void
}

export function CentralRegistros({ dados, filtros, contexto, onFechar, onSalvarAtividade, onExcluirAtividade, onSalvarMarco, onExcluirMarco, onDadosChange }: Props) {
  const [acao, setAcao] = useState<Acao>('inicio')
  const [alterado, setAlterado] = useState(false)
  const [versao, setVersao] = useState(0)
  const [mensagem, setMensagem] = useState('')
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => { const atual = dialogo.current; atual?.showModal(); return () => { if (atual?.open) atual.close() } }, [])
  const grupos: { nome: string; opcoes: { id: Acao; nome: string }[] }[] = [
    { nome: 'Atividades', opcoes: [{ id: 'atividade', nome: 'Nova atividade' }] },
    { nome: 'Marcos', opcoes: [{ id: 'marco', nome: 'Novo marco' }] },
    { nome: 'Equipes', opcoes: [{ id: 'adicionar', nome: 'Adicionar integrante' }, { id: 'troca', nome: 'Transferir integrante' }, { id: 'saida', nome: 'Ausência ou saída' }, { id: 'formacao', nome: 'Composição atual' }] },
    { nome: 'Cadastros', opcoes: [{ id: 'escolas', nome: 'Novo projeto' }, { id: 'disciplinas', nome: 'Nova disciplina' }, { id: 'equipes', nome: 'Nova equipe' }, { id: 'pessoas', nome: 'Nova pessoa' }] },
  ]
  const cadastro = (['escolas', 'disciplinas', 'equipes', 'pessoas'] as Acao[]).includes(acao)
  const confirmarSaida = () => !alterado || confirm('Descartar as alterações ainda não salvas?')
  const navegar = (proxima: Acao) => { if (proxima === acao) return; if (!confirmarSaida()) return; setAcao(proxima); setAlterado(false); setMensagem(''); setVersao((v) => v + 1) }
  const fechar = () => { if (confirmarSaida()) onFechar() }
  const concluir = (texto: string) => { setAlterado(false); setMensagem(texto); setVersao((v) => v + 1) }
  const cancelar = () => { setAlterado(false); setMensagem(''); setAcao('inicio') }
  const projetoId = contexto.escolaId || filtros.escolaId || undefined
  const equipeId = contexto.equipeId || filtros.equipeId || ''
  return <dialog ref={dialogo} className="central-dialogo" aria-labelledby="central-titulo" onCancel={(e) => { e.preventDefault(); fechar() }} onClick={(e) => { if (e.target === e.currentTarget) fechar() }}>
    <div className="central-pagina">
      <header className="central-cabecalho"><div><span>CENTRAL DO GANTT</span><h2 id="central-titulo">Registros</h2><p>Selecione uma ação para preencher os dados nesta área.</p></div><button type="button" className="fechar-modal" onClick={fechar} aria-label="Fechar central de registros">×</button></header>
      <div className="central-corpo"><nav className="central-menu" aria-label="Ações de registro">{grupos.map((grupo) => <div className="central-grupo" key={grupo.nome}><strong>{grupo.nome}</strong>{grupo.opcoes.map((item) => <button type="button" key={item.id} className={acao === item.id ? 'ativo' : ''} aria-current={acao === item.id ? 'page' : undefined} onClick={() => navegar(item.id)}>{item.nome}</button>)}</div>)}</nav>
        <div className="central-conteudo" onChangeCapture={() => { if (acao !== 'formacao') setAlterado(true) }}>
          {mensagem && <p className="sucesso" role="status">{mensagem}</p>}
          {acao === 'inicio' && <div className="central-boas-vindas"><h3>O que deseja registrar?</h3><p>Escolha uma opção no menu para abrir o formulário. As informações são salvas na mesma base usada pelas demais abas.</p><button type="button" className="primario" onClick={() => navegar('atividade')}>Registrar atividade</button></div>}
          {acao === 'atividade' && <FormAtividade key={versao} inline dados={dados} inicial={{ escolaId: projetoId, equipeId: equipeId || undefined, inicio: contexto.inicio || hojeISO(), fim: contexto.fim || contexto.inicio || hojeISO() }} onSalvar={(atividade, continuar) => { onSalvarAtividade(atividade, continuar); setAlterado(false); setMensagem('Atividade salva.'); if (!continuar) setVersao((v) => v + 1) }} onExcluir={onExcluirAtividade} onCancelar={cancelar} />}
          {acao === 'marco' && <FormMarco key={versao} inline dados={dados} inicial={{ escolaId: projetoId, data: contexto.inicio }} onSalvar={(marco) => { onSalvarMarco(marco); concluir('Marco salvo.') }} onExcluir={onExcluirMarco} onCancelar={cancelar} />}
          {acao === 'adicionar' && <AdicionarIntegrante key={versao} inline dados={dados} equipeInicialId={equipeId} onCancelar={cancelar} onSalvar={(id, data, pessoas) => { try { onDadosChange(adicionarIntegrantes(dados, id, data, pessoas)); concluir('Integrante adicionado.'); return null } catch (erro) { return erro instanceof Error ? erro.message : 'Não foi possível adicionar.' } }} />}
          {(acao === 'troca' || acao === 'saida') && <MovimentarEquipe key={`${acao}-${versao}`} inline dados={dados} equipeInicialId={equipeId} tipoInicial={acao} onCancelar={cancelar} onSalvar={(evento, movimentos, atualizacoes) => { onDadosChange(registrarMovimentacao(dados, evento, movimentos, atualizacoes)); concluir('Movimentação registrada.') }} />}
          {acao === 'formacao' && <FormacaoAtual dados={dados} exibirFiltro />}
          {cadastro && <NovoCadastro key={`${acao}-${versao}`} inline dados={dados} inicial={acao as Cadastro} onCancelar={cancelar} onSalvar={(_tipo, novos) => { onDadosChange(novos); concluir('Cadastro salvo.') }} />}
        </div>
      </div>
    </div>
  </dialog>
}
