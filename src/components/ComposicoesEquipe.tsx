import { useEffect, useMemo, useState } from 'react'
import type { ComposicaoEquipe, Dados, IntegranteComposicaoEquipe } from '../types'
import { formatarBR, hojeISO, sobrepoe, somarDias } from '../lib/datas'

interface Props { dados: Dados; onChange: (dados: Dados) => void }

export function ComposicoesEquipe({ dados, onChange }: Props) {
  const [equipeFiltro, setEquipeFiltro] = useState('')
  const [formulario, setFormulario] = useState(false)
  const [editando, setEditando] = useState<ComposicaoEquipe | null>(null)
  const composicoes = dados.composicoesEquipe ?? []
  const integrantes = dados.integrantesComposicao ?? []
  const ordenadas = useMemo(() => composicoes
    .filter((c) => !equipeFiltro || c.equipeId === equipeFiltro)
    .sort((a, b) => a.inicio.localeCompare(b.inicio) || (dados.equipes.find((e) => e.id === a.equipeId)?.nome ?? '').localeCompare(dados.equipes.find((e) => e.id === b.equipeId)?.nome ?? '')),
  [composicoes, dados.equipes, equipeFiltro])

  const salvar = (composicao: ComposicaoEquipe, pessoaIds: string[]): string | null => {
    const membrosAntigos = integrantes.filter((i) => i.composicaoId === composicao.id)
    if (editando) {
      onChange({ ...dados, composicoesEquipe: composicoes.map((c) => c.id === composicao.id ? composicao : c),
        integrantesComposicao: [...integrantes.filter((i) => i.composicaoId !== composicao.id),
          ...pessoaIds.map((pessoaId) => membrosAntigos.find((m) => m.pessoaId === pessoaId) ?? ({ id: crypto.randomUUID(), composicaoId: composicao.id, pessoaId }))] })
      setFormulario(false); setEditando(null); return null
    }
    if (composicoes.some((c) => c.equipeId === composicao.equipeId && c.inicio === composicao.inicio)) return 'Já existe uma composição com essa data de início. Use “Corrigir composição” na linha correspondente.'
    const posteriores = composicoes.filter((c) => c.equipeId === composicao.equipeId && c.inicio > composicao.inicio).sort((a, b) => a.inicio.localeCompare(b.inicio))
    const anteriores = composicoes.filter((c) => c.equipeId === composicao.equipeId && c.inicio < composicao.inicio && (!c.fim || c.fim >= composicao.inicio)).sort((a, b) => b.inicio.localeCompare(a.inicio))
    const nova = { ...composicao, fim: posteriores.length ? somarDias(posteriores[0].inicio, -1) : null }
    const atualizadas = composicoes.map((c) => c.id === anteriores[0]?.id ? { ...c, fim: somarDias(composicao.inicio, -1) } : c)
    const novos: IntegranteComposicaoEquipe[] = pessoaIds.map((pessoaId) => ({ id: crypto.randomUUID(), composicaoId: composicao.id, pessoaId }))
    onChange({ ...dados, composicoesEquipe: [...atualizadas, nova], integrantesComposicao: [...integrantes, ...novos] })
    setFormulario(false); setEditando(null); return null
  }

  const remover = (c: ComposicaoEquipe) => {
    if (!confirm('Remover esta versão da composição? O intervalo ficará sem formação registrada.')) return
    onChange({ ...dados, composicoesEquipe: composicoes.filter((x) => x.id !== c.id), integrantesComposicao: integrantes.filter((i) => i.composicaoId !== c.id) })
  }
  const pendenciasLegadas = (dados.vinculosEquipe ?? []).filter((v) => !v.projetoId || !v.inicio || !v.pessoaId || !v.equipeId).length
  const equipesSemComposicao = [...new Set(dados.atividades.filter((a) => !composicoes.some((c) => c.equipeId === a.equipeId && c.inicio <= a.fim && (!c.fim || c.fim >= a.inicio))).map((a) => a.equipeId))]

  return <section className="pagina-composicoes">
    <div className="composicoes-cabecalho"><div><h2>Composição temporal das equipes</h2><p>Registre cada equipe e sua formação por período. As atividades permanecem independentes; o Gantt relaciona pessoas pela equipe e pela sobreposição de datas, com a disciplina definida na equipe.</p></div><button className="primario" onClick={() => { setEditando(null); setFormulario(true) }}>+ Registrar mudança de equipe</button></div>
    <div className="composicoes-filtros"><label>Equipe<select value={equipeFiltro} onChange={(e) => setEquipeFiltro(e.target.value)}><option value="">Todas</option>{dados.equipes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label></div>
    {pendenciasLegadas > 0 && <p className="aviso">Há {pendenciasLegadas} vínculo(s) antigo(s) sem equipe, pessoa ou data suficiente para importar. Foram preservados para revisão.</p>}
    {equipesSemComposicao.length > 0 && <p className="aviso">Há {equipesSemComposicao.length} equipe(s) com atividades sem composição registrada no período: {equipesSemComposicao.map((id) => dados.equipes.find((e) => e.id === id)?.nome ?? 'Equipe removida').join(', ')}.</p>}
    <div className="tabela-rolagem"><table><thead><tr><th>Disciplina</th><th>Equipe</th><th>Vigência</th><th>Integrantes</th><th>Origem</th><th></th></tr></thead><tbody>
      {ordenadas.map((c) => { const equipe = dados.equipes.find((e) => e.id === c.equipeId); const disciplina = dados.disciplinas.find((d) => d.id === equipe?.disciplinaId); const pessoas = integrantes.filter((i) => i.composicaoId === c.id).map((i) => dados.pessoas.find((p) => p.id === i.pessoaId)?.nome).filter(Boolean)
        return <tr key={c.id}><td>{disciplina?.sigla ?? '—'}</td><td>{equipe?.nome ?? 'Equipe removida'}</td><td>{formatarBR(c.inicio)} – {c.fim ? formatarBR(c.fim) : 'Em aberto'}</td><td>{pessoas.join(', ') || 'Nenhum integrante'}</td><td>{c.origem === 'planilha' ? 'Planilha / referência' : 'Manual'}</td><td className="vinculo-acoes"><button onClick={() => { setEditando(c); setFormulario(true) }}>Corrigir composição</button><button className="perigo" onClick={() => remover(c)}>Remover</button></td></tr> })}
    </tbody></table>{ordenadas.length === 0 && <p className="vazio">Nenhuma formação registrada para os filtros escolhidos. Use “Registrar mudança de equipe” para iniciar o histórico.</p>}</div>
    {formulario && <FormularioComposicao key={editando?.id ?? 'nova-composicao'} dados={dados} inicial={editando} onSalvar={salvar} onCancelar={() => { setFormulario(false); setEditando(null) }} />}
  </section>
}

interface FormularioProps { dados: Dados; inicial: ComposicaoEquipe | null; onSalvar: (composicao: ComposicaoEquipe, pessoaIds: string[]) => string | null; onCancelar: () => void }
function FormularioComposicao({ dados, inicial, onSalvar, onCancelar }: FormularioProps) {
  const [equipeId, setEquipeId] = useState(inicial?.equipeId ?? '')
  const [inicio, setInicio] = useState(inicial?.inicio ?? hojeISO())
  const [pessoaIds, setPessoaIds] = useState<string[]>(() => inicial ? (dados.integrantesComposicao ?? []).filter((i) => i.composicaoId === inicial.id).map((i) => i.pessoaId) : [])
  const [busca, setBusca] = useState(''); const [membrosAlterados, setMembrosAlterados] = useState(Boolean(inicial)); const [erroSalvar, setErroSalvar] = useState('')
  const composicoes = dados.composicoesEquipe ?? []
  const equipe = dados.equipes.find((e) => e.id === equipeId)
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
  const conflitoPessoa = pessoaIds.some((pessoaId) => composicoes.some((c) => {
    const outraEquipe = dados.equipes.find((e) => e.id === c.equipeId)
    if (outraEquipe?.disciplinaId !== equipe?.disciplinaId || c.equipeId === equipeId || c.id === inicial?.id) return false
    if (!(dados.integrantesComposicao ?? []).some((m) => m.composicaoId === c.id && m.pessoaId === pessoaId)) return false
    return sobrepoe({ inicio, fim: fimProjetado ?? '9999-12-31' }, { inicio: c.inicio, fim: c.fim ?? '9999-12-31' })
  }))
  const erro = !equipeId ? 'Selecione uma equipe.' : !inicio ? 'Informe a data em que a formação passa a valer.' : inicio > hojeISO() ? 'Esta plataforma registra apenas alterações históricas.' : !inicial && composicoes.some((c) => c.equipeId === equipeId && c.inicio === inicio) ? 'Já existe uma composição com essa data. Use “Corrigir composição” na lista.' : !pessoaIds.length ? 'Selecione ao menos um integrante.' : conflitoPessoa ? 'Uma pessoa está alocada a outra equipe da mesma disciplina durante parte dessa vigência.' : ''
  const salvar = () => { if (erro) return; const resultado = onSalvar({ id: inicial?.id ?? crypto.randomUUID(), equipeId, inicio, fim: inicial?.fim ?? null, origem: 'manual' }, pessoaIds); if (resultado) setErroSalvar(resultado) }
  const pessoasVisiveis = dados.pessoas.filter((p) => `${p.nome} ${p.funcao}`.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR'))).sort((a, b) => Number(jaNaEquipe(b.id)) - Number(jaNaEquipe(a.id)) || a.nome.localeCompare(b.nome, 'pt-BR'))
  return <div className="modal-fundo" onClick={onCancelar}><div className="modal modal-composicao" onClick={(e) => e.stopPropagation()}>
    <h2>{inicial ? 'Corrigir formação da equipe' : 'Registrar mudança de equipe'}</h2><p className="texto-suave">A nova formação vale a partir da data escolhida. A versão anterior será encerrada na véspera.</p>
    <label>Equipe<select disabled={Boolean(inicial)} value={equipeId} onChange={(e) => setEquipeId(e.target.value)}><option value="">Selecione…</option>{dados.equipes.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
    {equipe && <p className="texto-suave">Disciplina: {dados.disciplinas.find((d) => d.id === equipe.disciplinaId)?.sigla ?? '—'}</p>}
    <label>{inicial ? 'Início desta versão' : 'Mudança válida a partir de'}<input type="date" value={inicio} max={hojeISO()} disabled={Boolean(inicial)} onChange={(e) => { setInicio(e.target.value); if (!membrosAlterados) carregarAnterior(equipeId, e.target.value) }} /></label>
    {fimProjetado && !inicial && <p className="composicao-fim-projetado">Esta versão terminará em {formatarBR(fimProjetado)}, antes da próxima formação registrada.</p>}
    <fieldset className="selecao-participantes"><legend>Integrantes <span>({pessoaIds.length} selecionado(s))</span></legend><p>A formação anterior é carregada para você ajustar quem entrou ou saiu.</p><input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar pessoa ou função" aria-label="Buscar integrante" /><div className="lista-participantes">
      {pessoasVisiveis.map((p) => <label className="participante-selecao participante-item" key={p.id}><input type="checkbox" checked={pessoaIds.includes(p.id)} onChange={(e) => { setMembrosAlterados(true); setPessoaIds((atuais) => e.target.checked ? [...atuais, p.id] : atuais.filter((id) => id !== p.id)) }} /><span>{p.nome}<small>{p.funcao || 'Função não informada'}{jaNaEquipe(p.id) ? ' · já vinculada a esta equipe' : ''}</small></span></label>)}
      {pessoasVisiveis.length === 0 && <p className="vazio">Nenhuma pessoa encontrada. Cadastre-a em Cadastros → Pessoas.</p>}
    </div></fieldset>
    {(erro || erroSalvar) && <p className="erro">{erro || erroSalvar}</p>}<div className="acoes"><span style={{ flex: 1 }} /><button onClick={onCancelar}>Cancelar</button><button className="primario" disabled={Boolean(erro)} onClick={salvar}>{inicial ? 'Salvar correção' : 'Registrar formação'}</button></div>
  </div></div>
}
