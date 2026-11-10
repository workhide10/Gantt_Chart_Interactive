import { useEffect, useMemo, useRef, useState } from 'react'
import type { ComposicaoEquipe, Dados, EventoEquipe, MovimentacaoIntegrante } from '../types'
import { dataISOValida, formatarBR, hojeISO, somarDias } from '../lib/datas'
import { registrarComposicao, registrarMovimentacao, type AtualizacaoEquipe } from '../lib/equipes'
import { MovimentarEquipe } from './MovimentarEquipe'

interface Props { dados: Dados; onChange: (dados: Dados) => void }

export function ComposicoesEquipe({ dados, onChange }: Props) {
  const [equipeFiltro, setEquipeFiltro] = useState('')
  const [formulario, setFormulario] = useState(false)
  const [movimentacao, setMovimentacao] = useState(false)
  const [editando, setEditando] = useState<ComposicaoEquipe | null>(null)
  const composicoes = dados.composicoesEquipe ?? []
  const integrantes = dados.integrantesComposicao ?? []
  const ordenadas = useMemo(() => composicoes
    .filter((c) => !equipeFiltro || c.equipeId === equipeFiltro)
    .sort((a, b) => a.inicio.localeCompare(b.inicio) || (dados.equipes.find((e) => e.id === a.equipeId)?.nome ?? '').localeCompare(dados.equipes.find((e) => e.id === b.equipeId)?.nome ?? '')),
  [composicoes, dados.equipes, equipeFiltro])

  const salvar = (composicao: ComposicaoEquipe, pessoaIds: string[]): string | null => {
    try {
      onChange(registrarComposicao(dados, composicao, pessoaIds))
      setFormulario(false)
      setEditando(null)
      return null
    } catch (erro) {
      return erro instanceof Error ? erro.message : 'Falha ao registrar a formação.'
    }
  }

  const salvarMovimentacao = (evento: EventoEquipe, movimentos: MovimentacaoIntegrante[], atualizacoes: AtualizacaoEquipe[]) => {
    onChange(registrarMovimentacao(dados, evento, movimentos, atualizacoes))
    setMovimentacao(false)
  }

  const remover = (c: ComposicaoEquipe) => {
    if (!confirm('Remover esta versão da composição? O intervalo ficará sem formação registrada.')) return
    onChange({ ...dados, composicoesEquipe: composicoes.filter((x) => x.id !== c.id), integrantesComposicao: integrantes.filter((i) => i.composicaoId !== c.id) })
  }
  const equipesSemComposicao = [...new Set(dados.atividades.filter((a) => !composicoes.some((c) => c.equipeId === a.equipeId && c.inicio <= a.fim && (!c.fim || c.fim >= a.inicio))).map((a) => a.equipeId))]

  return <section className="pagina-composicoes">
    <div className="composicoes-cabecalho"><div><h2>Composição temporal das equipes</h2><p>Registre mudanças em lote entre equipes ou a saída de uma pessoa. A composição fica versionada por período e relacionada às atividades pela equipe e pelas datas.</p></div><div className="acoes-cabecalho"><button className="primario" onClick={() => setMovimentacao(true)}>+ Troca ou saída de integrante</button><button onClick={() => { setEditando(null); setFormulario(true) }}>Ajustar composição</button></div></div>
    <div className="composicoes-filtros"><label>Equipe<select value={equipeFiltro} onChange={(e) => setEquipeFiltro(e.target.value)}><option value="">Todas</option>{dados.equipes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label></div>
    {equipesSemComposicao.length > 0 && <p className="aviso">Há {equipesSemComposicao.length} equipe(s) com atividades sem composição registrada no período: {equipesSemComposicao.map((id) => dados.equipes.find((e) => e.id === id)?.nome ?? 'Equipe removida').join(', ')}.</p>}
    <div className="tabela-rolagem"><table><thead><tr><th>Disciplina</th><th>Equipe</th><th>Vigência</th><th>Integrantes</th><th>Origem</th><th></th></tr></thead><tbody>
      {ordenadas.map((c) => { const equipe = dados.equipes.find((e) => e.id === c.equipeId); const disciplina = dados.disciplinas.find((d) => d.id === equipe?.disciplinaId); const pessoas = integrantes.filter((i) => i.composicaoId === c.id).map((i) => dados.pessoas.find((p) => p.id === i.pessoaId)?.nome).filter(Boolean)
        return <tr key={c.id}><td>{disciplina?.sigla ?? '—'}</td><td>{equipe?.nome ?? 'Equipe removida'}</td><td>{formatarBR(c.inicio)} – {c.fim ? formatarBR(c.fim) : 'Em aberto'}</td><td>{pessoas.join(', ') || 'Nenhum integrante'}</td><td>{c.origem === 'planilha' ? 'Planilha / referência' : 'Manual'}</td><td className="vinculo-acoes"><button onClick={() => { setEditando(c); setFormulario(true) }}>Corrigir composição</button><button className="perigo" onClick={() => remover(c)}>Remover</button></td></tr> })}
    </tbody></table>{ordenadas.length === 0 && <p className="vazio">Nenhuma formação registrada para os filtros escolhidos. Use “Ajustar composição” para iniciar o histórico.</p>}</div>
    {formulario && <FormularioComposicao key={editando?.id ?? 'nova-composicao'} dados={dados} inicial={editando} equipeInicialId={equipeFiltro} onSalvar={salvar} onCancelar={() => { setFormulario(false); setEditando(null) }} />}
    {movimentacao && <MovimentarEquipe dados={dados} equipeInicialId={equipeFiltro} onSalvar={salvarMovimentacao} onCancelar={() => setMovimentacao(false)} />}
  </section>
}

interface FormularioProps { dados: Dados; inicial: ComposicaoEquipe | null; equipeInicialId: string; onSalvar: (composicao: ComposicaoEquipe, pessoaIds: string[]) => string | null; onCancelar: () => void }
function FormularioComposicao({ dados, inicial, equipeInicialId, onSalvar, onCancelar }: FormularioProps) {
  const [equipeId, setEquipeId] = useState(inicial?.equipeId ?? equipeInicialId)
  const [inicio, setInicio] = useState(inicial?.inicio ?? hojeISO())
  const [pessoaIds, setPessoaIds] = useState<string[]>(() => inicial ? (dados.integrantesComposicao ?? []).filter((i) => i.composicaoId === inicial.id).map((i) => i.pessoaId) : [])
  const [busca, setBusca] = useState(''); const [membrosAlterados, setMembrosAlterados] = useState(Boolean(inicial)); const [erroSalvar, setErroSalvar] = useState('')
  const composicoes = dados.composicoesEquipe ?? []
  const equipe = dados.equipes.find((e) => e.id === equipeId)
  const dialogoRef = useRef<HTMLDialogElement>(null)
  const [alterado, setAlterado] = useState(false)
  useEffect(() => {
    const dialogo = dialogoRef.current
    dialogo?.showModal()
    return () => dialogo?.close()
  }, [])
  const cancelar = () => {
    if (alterado && !confirm('Descartar as alterações desta composição?')) return
    onCancelar()
  }
  const carregarAnterior = (equipe: string, data: string) => {
    if (!equipe || inicial) return
    const candidatas = composicoes.filter((c) => c.equipeId === equipe && c.inicio < data).sort((a, b) => b.inicio.localeCompare(a.inicio))
    const vigente = candidatas.find((c) => !c.fim || c.fim >= data) ?? candidatas[0]
    setPessoaIds(vigente ? (dados.integrantesComposicao ?? []).filter((i) => i.composicaoId === vigente.id).map((i) => i.pessoaId) : []); setMembrosAlterados(false)
  }
  useEffect(() => { carregarAnterior(equipeId, inicio) }, [equipeId])
  const posteriores = composicoes.filter((c) => c.equipeId === equipeId && c.inicio > inicio).sort((a, b) => a.inicio.localeCompare(b.inicio))
  const fimProjetado = inicial ? inicial.fim : posteriores.length ? somarDias(posteriores[0].inicio, -1) : null
  const jaNaEquipe = (pessoaId: string) => composicoes.some((c) => c.equipeId === equipeId && (dados.integrantesComposicao ?? []).some((m) => m.composicaoId === c.id && m.pessoaId === pessoaId))
  const movimentos = pessoaIds.flatMap((pessoaId) => composicoes
    .filter((c) => c.equipeId !== equipeId && c.inicio <= inicio && (!c.fim || c.fim >= inicio) &&
      dados.equipes.find((e) => e.id === c.equipeId)?.disciplinaId === equipe?.disciplinaId &&
      (dados.integrantesComposicao ?? []).some((m) => m.composicaoId === c.id && m.pessoaId === pessoaId))
    .map((c) => ({ pessoa: dados.pessoas.find((p) => p.id === pessoaId)?.nome ?? 'Pessoa', equipe: dados.equipes.find((e) => e.id === c.equipeId)?.nome ?? 'Equipe' })))
  const movimentosUnicos = [...new Map(movimentos.map((m) => [`${m.pessoa}|${m.equipe}`, m])).values()]
  const erro = !equipeId ? 'Selecione uma equipe.' : !dataISOValida(inicio) ? 'Informe uma data válida para a formação.' : inicio > hojeISO() ? 'Esta plataforma registra apenas alterações históricas.' : !inicial && composicoes.some((c) => c.equipeId === equipeId && c.inicio === inicio) ? 'Já existe uma composição com essa data. Use “Corrigir composição” na lista.' : inicial && movimentosUnicos.length > 0 ? 'Para transferir integrantes entre equipes, use “Troca ou saída de integrante” com a data efetiva da troca.' : !pessoaIds.length ? 'Selecione ao menos um integrante.' : ''
  const salvar = () => { if (erro) return; const resultado = onSalvar({ id: inicial?.id ?? crypto.randomUUID(), equipeId, inicio, fim: inicial?.fim ?? null, origem: 'manual' }, pessoaIds); if (resultado) setErroSalvar(resultado) }
  const pessoasVisiveis = dados.pessoas.filter((p) => `${p.nome} ${p.funcao}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).sort((a, b) => Number(jaNaEquipe(b.id)) - Number(jaNaEquipe(a.id)) || a.nome.localeCompare(b.nome, 'pt-BR'))
  return <dialog ref={dialogoRef} className="modal-fundo dialogo-nativo" aria-labelledby="composicao-titulo" onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelar() } }} onCancel={(e) => { e.preventDefault(); cancelar() }} onClick={(e) => { if (e.target === e.currentTarget) cancelar() }}><form className="modal modal-composicao" onSubmit={(e) => { e.preventDefault(); salvar() }}>
    <div className="modal-cabecalho"><h2 id="composicao-titulo">{inicial ? 'Corrigir formação da equipe' : 'Registrar formação da equipe'}</h2><button type="button" className="fechar-modal" onClick={cancelar} aria-label="Fechar composição">×</button></div><p className="texto-suave">{inicial ? 'A correção ajusta os integrantes desta versão, mantendo sua vigência.' : 'A nova formação vale a partir da data escolhida. A versão anterior será encerrada na véspera.'}</p>
    <label>Equipe<select disabled={Boolean(inicial)} value={equipeId} autoFocus={!inicial} onChange={(e) => { setEquipeId(e.target.value); setAlterado(true); setErroSalvar('') }}><option value="">Selecione…</option>{dados.equipes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
    {equipe && <p className="texto-suave">Disciplina: {dados.disciplinas.find((d) => d.id === equipe.disciplinaId)?.sigla ?? '—'}</p>}
    <label>{inicial ? 'Início desta versão' : 'Mudança válida a partir de'}<input type="date" value={inicio} max={hojeISO()} disabled={Boolean(inicial)} onChange={(e) => { setInicio(e.target.value); setAlterado(true); setErroSalvar(''); if (!membrosAlterados) carregarAnterior(equipeId, e.target.value) }} /></label>
    {fimProjetado && !inicial && <p className="composicao-fim-projetado">Esta versão terminará em {formatarBR(fimProjetado)}, antes da próxima formação registrada.</p>}
    {!inicial && movimentosUnicos.length > 0 && <p className="aviso">A data escolhida registrará a transferência e atualizará também a formação de origem: {movimentosUnicos.map((m) => `${m.pessoa} sai de ${m.equipe}`).join('; ')}. As duas equipes terão novas versões a partir da mesma data.</p>}
    <fieldset className="selecao-participantes"><legend>Integrantes <span>({pessoaIds.length} selecionado(s))</span></legend><p>A formação anterior é carregada para você ajustar quem entrou ou saiu.</p><input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pessoa ou função" aria-label="Buscar integrante" /><div className="lista-participantes">
      {pessoasVisiveis.map((p) => <label className="participante-selecao participante-item" key={p.id}><input type="checkbox" checked={pessoaIds.includes(p.id)} onChange={(e) => { setMembrosAlterados(true); setAlterado(true); setErroSalvar(''); setPessoaIds((atuais) => e.target.checked ? [...atuais, p.id] : atuais.filter((id) => id !== p.id)) }} /><span>{p.nome}<small>{p.funcao || 'Função não informada'}{jaNaEquipe(p.id) ? ' · já vinculada a esta equipe' : ''}</small></span></label>)}
      {pessoasVisiveis.length === 0 && <p className="vazio">Nenhuma pessoa encontrada. Cadastre-a em Cadastros → Pessoas.</p>}
    </div></fieldset>
    {(erro || erroSalvar) && <p className="erro">{erro || erroSalvar}</p>}<div className="acoes"><span style={{ flex: 1 }} /><button type="button" onClick={cancelar}>Cancelar</button><button type="submit" className="primario" disabled={Boolean(erro)}>{inicial ? 'Salvar correção' : 'Registrar formação'}</button></div>
  </form></dialog>
}
