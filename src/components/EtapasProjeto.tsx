import { useState } from 'react'
import type { Dados, EtapaProjeto } from '../types'
import { diasUteisCalendario, formatarBR, somarDias } from '../lib/datas'

interface Props { dados: Dados; onSalvar: (etapa: EtapaProjeto) => void; onExcluir: (id: string) => void }

export function EtapasProjeto({ dados, onSalvar, onExcluir }: Props) {
  const [editando, setEditando] = useState<EtapaProjeto | null>(null)
  const [modal, setModal] = useState(false)
  const [projetoId, setProjetoId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')
  const abrir = (etapa?: EtapaProjeto) => {
    setModal(true)
    setEditando(etapa ?? null); setProjetoId(etapa?.escolaId ?? ''); setTitulo(etapa?.titulo ?? '')
    setInicio(etapa?.inicio ?? ''); setFim(etapa?.fim ?? ''); setDescricao(etapa?.descricao ?? ''); setErro('')
  }
  const salvar = () => {
    if (!projetoId || !titulo.trim() || !inicio || (fim && fim < inicio)) { setErro('Informe projeto, nome e intervalo válido.'); return }
    try { onSalvar({ id: editando?.id ?? crypto.randomUUID(), escolaId: projetoId, titulo: titulo.trim(), inicio, fim: fim || null, descricao: descricao.trim() }); setModal(false); setEditando(null) }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível salvar a etapa.') }
  }
  const lista = [...(dados.etapas ?? [])].sort((a, b) => (dados.escolas.find((p) => p.id === a.escolaId)?.codigo ?? '').localeCompare(dados.escolas.find((p) => p.id === b.escolaId)?.codigo ?? '') || a.inicio.localeCompare(b.inicio))
  return <section className="lista-marcos">
    <div className="painel-cabecalho"><div><span className="dashboard-sobretitulo">ETAPAS DE PRODUÇÃO</span><h2>Etapas dos projetos</h2><p>Cada etapa tem um intervalo próprio. As atividades precisam pertencer a uma etapa e estar contidas no prazo dela.</p></div><button className="primario" onClick={() => abrir()}>+ Nova etapa</button></div>
    <div className="tabela-rolagem"><table><thead><tr><th>Projeto</th><th>Etapa</th><th>Início</th><th>Fim</th><th>Atividades</th><th>Período útil registrado</th><th>Ações</th></tr></thead><tbody>
      {lista.map((etapa) => { const projeto = dados.escolas.find((p) => p.id === etapa.escolaId); const atividades = dados.atividades.filter((a) => a.etapaId === etapa.id); const dias = new Set<string>(); for (const a of atividades) for (let d = a.inicio; d <= a.fim; d = somarDias(d, 1)) if (diasUteisCalendario(d, d, dados.calendario ?? [])) dias.add(d); return <tr key={etapa.id}><td>{projeto?.codigo ?? 'Projeto removido'}</td><td><strong>{etapa.titulo}</strong>{etapa.descricao && <div className="texto-suave">{etapa.descricao}</div>}</td><td>{formatarBR(etapa.inicio)}</td><td>{etapa.fim ? formatarBR(etapa.fim) : <span className="texto-suave">Em aberto</span>}</td><td>{atividades.length}</td><td>{dias.size} dia(s) útil(eis) · união</td><td><div className="marco-acoes"><button onClick={() => abrir(etapa)}>Editar</button><button className="perigo" disabled={atividades.length > 0} title={atividades.length ? 'Desvincule as atividades antes de remover' : ''} onClick={() => { if (confirm(`Remover a etapa “${etapa.titulo}”?`)) onExcluir(etapa.id) }}>Remover</button></div></td></tr> })}
    </tbody></table>{lista.length === 0 && <p className="vazio">Cadastre uma etapa para poder relacionar novas atividades.</p>}</div>
    {modal && <dialog open className="modal-fundo dialogo-nativo"><form className="modal" onSubmit={(e) => { e.preventDefault(); salvar() }}><div className="modal-cabecalho"><h2>{editando ? 'Editar etapa' : 'Nova etapa'}</h2><button type="button" className="fechar-modal" onClick={() => setModal(false)}>×</button></div>
      <label>Projeto<select required value={projetoId} onChange={(e) => setProjetoId(e.target.value)}><option value="">Selecione…</option>{dados.escolas.filter((p) => !p.arquivado || p.id === editando?.escolaId).map((p) => <option key={p.id} value={p.id}>{p.codigo} · {p.nome}</option>)}</select></label>
      <label>Nome da etapa<input required value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Estudo preliminar" /></label>
      <div className="duas-colunas"><label>Início<input required type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} /></label><label>Fim (opcional)<input type="date" min={inicio} value={fim} onChange={(e) => setFim(e.target.value)} /></label></div>
      <p className="texto-suave">Deixe o fim vazio enquanto a etapa estiver em andamento. Feriados e fins de semana são excluídos das contagens, mas permanecem dentro do intervalo civil da etapa.</p>
      <label>Descrição (opcional)<textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} /></label>{erro && <p className="erro">{erro}</p>}
      <div className="acoes"><button type="button" onClick={() => setModal(false)}>Cancelar</button><button type="submit" className="primario">Salvar etapa</button></div></form></dialog>}
    {/* projetoId temporário sinaliza o modal de criação; editar usa registro preenchido */}
    <div className="dica">As etapas delimitam o fluxo produtivo. Os marcos pontuais e de troca de equipe continuam na aba Marcos/Gantt.</div>
  </section>
}
