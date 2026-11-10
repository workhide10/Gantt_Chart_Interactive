import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dados, EventoEquipe, MovimentacaoIntegrante } from '../types'
import { dataISOValida, hojeISO } from '../lib/datas'

import type { AtualizacaoEquipe } from '../lib/equipes'
interface Props {
  dados: Dados
  equipeInicialId: string
  onSalvar: (evento: EventoEquipe, movimentos: MovimentacaoIntegrante[], atualizacoes: AtualizacaoEquipe[]) => void
  onCancelar: () => void
}

function integrantesNaData(dados: Dados, equipeId: string, data: string): string[] {
  const composicao = (dados.composicoesEquipe ?? [])
    .filter((c) => c.equipeId === equipeId && c.inicio <= data && (!c.fim || c.fim >= data))
    .sort((a, b) => b.inicio.localeCompare(a.inicio))[0]
  return composicao ? [...new Set((dados.integrantesComposicao ?? []).filter((i) => i.composicaoId === composicao.id).map((i) => i.pessoaId))] : []
}

export function MovimentarEquipe({ dados, equipeInicialId, onSalvar, onCancelar }: Props) {
  const [tipo, setTipo] = useState<'troca' | 'saida'>('troca')
  const [disciplinaId, setDisciplinaId] = useState(dados.equipes.find((e) => e.id === equipeInicialId)?.disciplinaId ?? '')
  const [equipeAId, setEquipeAId] = useState(equipeInicialId)
  const [equipeBId, setEquipeBId] = useState('')
  const [data, setData] = useState(hojeISO())
  const [selecionadosA, setSelecionadosA] = useState<string[]>([])
  const [selecionadosB, setSelecionadosB] = useState<string[]>([])
  const [movidosAParaB, setMovidosAParaB] = useState<string[]>([])
  const [movidosBParaA, setMovidosBParaA] = useState<string[]>([])
  const [selecionadosSaida, setSelecionadosSaida] = useState<string[]>([])
  const [saidasPendentes, setSaidasPendentes] = useState<string[]>([])
  const [motivo, setMotivo] = useState('')
  const dialogoRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialogo = dialogoRef.current
    dialogo?.showModal()
    return () => dialogo?.close()
  }, [])
  const cancelar = () => {
    if ((movidosAParaB.length || movidosBParaA.length || saidasPendentes.length || motivo.trim()) && !confirm('Descartar as movimentações preparadas?')) return
    onCancelar()
  }

  const equipesDisciplina = dados.equipes.filter((e) => e.disciplinaId === disciplinaId)
  const membrosA = useMemo(() => integrantesNaData(dados, equipeAId, data), [dados.composicoesEquipe, dados.integrantesComposicao, equipeAId, data])
  const membrosB = useMemo(() => integrantesNaData(dados, equipeBId, data), [dados.composicoesEquipe, dados.integrantesComposicao, equipeBId, data])
  const listaA = [...new Set([...membrosA.filter((id) => !movidosAParaB.includes(id)), ...movidosBParaA])]
  const listaB = [...new Set([...membrosB.filter((id) => !movidosBParaA.includes(id)), ...movidosAParaB])]
  const transferidosA = membrosA.filter((id) => !listaA.includes(id) && listaB.includes(id))
  const transferidosB = membrosB.filter((id) => !listaB.includes(id) && listaA.includes(id))
  const membrosSemSaida = membrosA.filter((id) => !saidasPendentes.includes(id))

  const erro = !disciplinaId ? 'Selecione uma disciplina.'
    : !equipeAId ? 'Selecione a equipe de origem.'
    : tipo === 'troca' && !equipeBId ? 'Selecione a segunda equipe.'
    : tipo === 'troca' && equipeAId === equipeBId ? 'Escolha duas equipes diferentes.'
    : !dataISOValida(data) ? 'Informe uma data válida para a movimentação.'
    : data > hojeISO() ? 'Esta plataforma registra apenas movimentações históricas.'
    : tipo === 'troca' && !transferidosA.length && !transferidosB.length ? 'Use as setas para mover ao menos uma pessoa.'
    : tipo === 'saida' && !saidasPendentes.length ? 'Use a seta para adicionar pelo menos uma pessoa à lista de saída.'
    : tipo === 'saida' && !motivo.trim() ? 'Descreva o motivo da saída.'
    : ''

  const redefinirTrocas = () => { setMovidosAParaB([]); setMovidosBParaA([]); setSelecionadosA([]); setSelecionadosB([]) }
  const moverAParaB = () => {
    if (!selecionadosA.length) return
    const ids = [...selecionadosA]
    setMovidosBParaA((anteriores) => anteriores.filter((id) => !ids.includes(id)))
    setMovidosAParaB((anteriores) => [...new Set([...anteriores, ...ids.filter((id) => membrosA.includes(id) && !membrosB.includes(id))])])
    setSelecionadosA([])
  }
  const moverBParaA = () => {
    if (!selecionadosB.length) return
    const ids = [...selecionadosB]
    setMovidosAParaB((anteriores) => anteriores.filter((id) => !ids.includes(id)))
    setMovidosBParaA((anteriores) => [...new Set([...anteriores, ...ids.filter((id) => membrosB.includes(id) && !membrosA.includes(id))])])
    setSelecionadosB([])
  }
  const enviarParaSaida = () => {
    setSaidasPendentes((anteriores) => [...new Set([...anteriores, ...selecionadosSaida])])
    setSelecionadosSaida([])
  }
  const reintegrarDaSaida = (id: string) => setSaidasPendentes((anteriores) => anteriores.filter((pessoaId) => pessoaId !== id))

  const salvar = () => {
    if (erro) return
    const eventoId = crypto.randomUUID()
    const evento: EventoEquipe = { id: eventoId, disciplinaId, data }
    const movimentos: MovimentacaoIntegrante[] = []
    const atualizacoes: AtualizacaoEquipe[] = []
    if (tipo === 'troca') {
      transferidosA.forEach((pessoaId) => movimentos.push({ id: crypto.randomUUID(), eventoId, pessoaId, equipeOrigemId: equipeAId, equipeDestinoId: equipeBId }))
      transferidosB.forEach((pessoaId) => movimentos.push({ id: crypto.randomUUID(), eventoId, pessoaId, equipeOrigemId: equipeBId, equipeDestinoId: equipeAId }))
      atualizacoes.push({ equipeId: equipeAId, pessoaIds: listaA }, { equipeId: equipeBId, pessoaIds: listaB })
    } else {
      saidasPendentes.forEach((pessoaId) => movimentos.push({ id: crypto.randomUUID(), eventoId, pessoaId, equipeOrigemId: equipeAId, equipeDestinoId: null, motivo: motivo.trim() }))
      atualizacoes.push({ equipeId: equipeAId, pessoaIds: membrosSemSaida })
    }
    onSalvar(evento, movimentos, atualizacoes)
  }

  const alternar = (id: string, lista: string[], setter: (lista: string[]) => void) => setter(lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id])
  const renderLista = (equipeId: string, pessoaIds: string[], selecionados: string[], setter: (ids: string[]) => void, lado: 'A' | 'B') => {
    const nomeEquipe = dados.equipes.find((e) => e.id === equipeId)?.nome ?? 'Equipe'
    const idMovido = (id: string) => lado === 'A' ? movidosBParaA.includes(id) : movidosAParaB.includes(id)
    const origem = (id: string) => lado === 'A' ? dados.equipes.find((e) => membrosB.includes(id) ? e.id === equipeBId : false)?.nome : dados.equipes.find((e) => membrosA.includes(id) ? e.id === equipeAId : false)?.nome
    return <fieldset className="mov-lista"><legend>{nomeEquipe}<span> · {pessoaIds.length} integrante(s)</span></legend><div className="lista-participantes">
      {pessoaIds.map((id) => { const pessoa = dados.pessoas.find((p) => p.id === id); const foiMovido = idMovido(id)
        return <label className={`participante-selecao participante-item${foiMovido ? ' participante-movido' : ''}`} key={id}><input type="checkbox" checked={selecionados.includes(id)} onChange={() => alternar(id, selecionados, setter)} /><span>{pessoa?.nome ?? 'Pessoa removida'}<small>{pessoa?.funcao || 'Função não informada'}{foiMovido ? ` · veio de ${origem(id) ?? 'outra equipe'}` : ''}</small></span>{foiMovido && <b className="selo-movido">Movido</b>}</label>
      })}{pessoaIds.length === 0 && <p className="vazio">Nenhum integrante registrado nesta equipe para a data selecionada.</p>}</div></fieldset>
  }

  return <dialog ref={dialogoRef} className="modal-fundo dialogo-nativo" aria-labelledby="movimentacao-titulo" onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelar() } }} onCancel={(e) => { e.preventDefault(); cancelar() }} onClick={(e) => { if (e.target === e.currentTarget) cancelar() }}><div className="modal modal-movimentacao">
    <div className="modal-cabecalho"><h2 id="movimentacao-titulo">Movimentar integrantes</h2><button type="button" className="fechar-modal" onClick={cancelar} aria-label="Fechar movimentação">×</button></div><p className="texto-suave">Selecione as pessoas e use as setas para preparar as movimentações. O evento registra todas as alterações em conjunto.</p>
    <div className="seg"><button className={tipo === 'troca' ? 'ativo' : ''} onClick={() => { setTipo('troca'); setSaidasPendentes([]); setSelecionadosSaida([]) }}>Troca entre equipes</button><button className={tipo === 'saida' ? 'ativo' : ''} onClick={() => { setTipo('saida'); redefinirTrocas() }}>Saída da equipe</button></div>
    <div className="duas-colunas"><label>Disciplina<select value={disciplinaId} onChange={(e) => { setDisciplinaId(e.target.value); setEquipeAId(''); setEquipeBId(''); redefinirTrocas(); setSaidasPendentes([]); setSelecionadosSaida([]) }}><option value="">Selecione…</option>{dados.disciplinas.map((d) => <option key={d.id} value={d.id}>{d.sigla} – {d.nome}</option>)}</select></label><label>Data do marco<input type="date" value={data} max={hojeISO()} onChange={(e) => { setData(e.target.value); redefinirTrocas(); setSaidasPendentes([]); setSelecionadosSaida([]) }} /></label></div>
    {tipo === 'troca' ? <>
      <div className="duas-colunas"><label>Equipe A<select value={equipeAId} onChange={(e) => { setEquipeAId(e.target.value); redefinirTrocas() }}><option value="">Selecione…</option>{equipesDisciplina.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label><label>Equipe B<select value={equipeBId} onChange={(e) => { setEquipeBId(e.target.value); redefinirTrocas() }}><option value="">Selecione…</option>{equipesDisciplina.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label></div>
      {equipeAId && equipeBId && equipeAId !== equipeBId && <div className="mov-grade">{renderLista(equipeAId, listaA, selecionadosA, setSelecionadosA, 'A')}<div className="mov-setas"><button type="button" title="Mover selecionados da equipe A para B" aria-label="Mover da equipe A para B" disabled={!selecionadosA.length} onClick={moverAParaB}>→</button><button type="button" title="Mover selecionados da equipe B para A" aria-label="Mover da equipe B para A" disabled={!selecionadosB.length} onClick={moverBParaA}>←</button></div>{renderLista(equipeBId, listaB, selecionadosB, setSelecionadosB, 'B')}</div>}
      <p className="texto-suave">Os integrantes movidos aparecem destacados na equipe de destino. A seta inversa desfaz a movimentação antes de salvar.</p>
    </> : <>
      <label>Equipe<select value={equipeAId} onChange={(e) => { setEquipeAId(e.target.value); setSaidasPendentes([]); setSelecionadosSaida([]) }}><option value="">Selecione…</option>{equipesDisciplina.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></label>
      {equipeAId && <div className="mov-grade mov-grade-saida"><fieldset className="mov-lista"><legend>{dados.equipes.find((e) => e.id === equipeAId)?.nome} · integrantes</legend><div className="lista-participantes">{membrosSemSaida.map((id) => <label className="participante-selecao participante-item" key={id}><input type="checkbox" checked={selecionadosSaida.includes(id)} onChange={() => alternar(id, selecionadosSaida, setSelecionadosSaida)} /><span>{dados.pessoas.find((p) => p.id === id)?.nome ?? 'Pessoa removida'}<small>{dados.pessoas.find((p) => p.id === id)?.funcao || 'Função não informada'}</small></span></label>)}{membrosSemSaida.length === 0 && <p className="vazio">Nenhum integrante disponível.</p>}</div></fieldset><div className="mov-setas"><button type="button" title="Adicionar selecionados à saída" aria-label="Mover para saída" disabled={!selecionadosSaida.length} onClick={enviarParaSaida}>→</button></div><fieldset className="mov-lista mov-lista-saida"><legend>Saída · {saidasPendentes.length} selecionado(s)</legend><div className="lista-participantes">{saidasPendentes.map((id) => <label className="participante-selecao participante-item participante-movido" key={id}><input type="checkbox" checked onChange={() => reintegrarDaSaida(id)} /><span>{dados.pessoas.find((p) => p.id === id)?.nome ?? 'Pessoa removida'}<small>Sem equipe de destino</small></span><b className="selo-movido">Saída</b></label>)}{saidasPendentes.length === 0 && <p className="vazio">Use a seta para preparar a saída de integrantes.</p>}</div></fieldset></div>}
      {saidasPendentes.length > 0 && <label>Motivo da saída<textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: férias, desligamento, afastamento ou outro motivo" rows={3} /></label>}
      <p className="texto-suave">A seta prepara a saída sem alocação para outra equipe. Informe o motivo; um eventual retorno pode ser registrado em outro marco.</p>
    </>}
    {erro && <p className="erro">{erro}</p>}
    <div className="acoes"><span style={{ flex: 1 }} /><button onClick={cancelar}>Cancelar</button><button className="primario" disabled={Boolean(erro)} onClick={salvar}>Salvar movimentações</button></div>
  </div></dialog>
}
