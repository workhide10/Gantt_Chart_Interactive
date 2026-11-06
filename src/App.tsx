import { useEffect, useMemo, useRef, useState } from 'react'
import type { Atividade, ComposicaoEquipe, Dados, Filtros, IntegranteComposicaoEquipe, MarcoProjeto } from './types'
import { useLocalStorage } from './hooks/useLocalStorage'
import { dadosIniciais } from './data/inicial'
import { filtrarAtividades } from './lib/filtrar'
import { hojeISO } from './lib/datas'
import { Gantt } from './components/Gantt'
import { Resumo } from './components/Resumo'
import { BarraFiltros } from './components/BarraFiltros'
import { ListaAtividades } from './components/ListaAtividades'
import { FormAtividade } from './components/FormAtividade'
import { Cadastros } from './components/Cadastros'
import { FormMarco } from './components/FormMarco'
import { ListaMarcos } from './components/ListaMarcos'
import { ComposicoesEquipe } from './components/ComposicoesEquipe'
import { ExecucaoProjetos } from './components/ExecucaoProjetos'

type Aba = 'gantt' | 'atividades' | 'marcos' | 'analises' | 'equipes' | 'cadastros'
type IntervaloAnalise = { inicio: string; fim: string }

export default function App() {
  // Todos os dados do sistema ficam neste estado, salvo automaticamente no navegador.
  const [dados, setDados] = useLocalStorage<Dados>('gantt-equipes:v1', dadosIniciais)
  const [aba, setAba] = useState<Aba>('gantt')
  const [filtros, setFiltros] = useState<Filtros>({ escolaId: '', disciplinaId: '', equipeId: '' })
  const [editando, setEditando] = useState<Partial<Atividade> | null>(null) // null = modal fechado
  const [marcoEditando, setMarcoEditando] = useState<Partial<MarcoProjeto> | null>(null)
  const [intervaloAnalise, setIntervaloAnalise] = useState<IntervaloAnalise>({ inicio: '', fim: '' })
  const arquivoRef = useRef<HTMLInputElement>(null)

  const atividades = useMemo(() => filtrarAtividades(dados, filtros), [dados, filtros])
  const atividadesAnalise = useMemo(() => {
    if (intervaloAnalise.inicio && intervaloAnalise.fim && intervaloAnalise.inicio > intervaloAnalise.fim) return []
    return atividades.filter((a) =>
      (!intervaloAnalise.inicio || a.fim >= intervaloAnalise.inicio) &&
      (!intervaloAnalise.fim || a.inicio <= intervaloAnalise.fim),
    )
  }, [atividades, intervaloAnalise])
  const marcos = dados.marcos ?? []
  // Migra vínculos antigos para uma linha temporal global por equipe.
  useEffect(() => {
    const fonteReferencia = 'alocacao-equipes-2026'
    const fonteComposicoes = 'formacao-equipe-global-v2'
    const fonteNomesArq = 'equipes-arq-numeradas-v1'
    const fontes = dados.fontesImportadas ?? []
    const importarReferencia = !fontes.includes(fonteReferencia)
    const renomearEquipesArq = !fontes.includes(fonteNomesArq)
    const migrarGlobal = !fontes.includes(fonteComposicoes)
    // Evita reconstruir conjuntos e varrer os cadastros inteiros em cada alteração normal.
    const migracaoNecessaria = !Array.isArray(dados.marcos) || !Array.isArray(dados.vinculosEquipe) ||
      dados.pessoas.some((pessoa) => pessoa.equipeId !== undefined) || importarReferencia || migrarGlobal || renomearEquipesArq
    if (!migracaoNecessaria) return
    const vinculosOriginais = Array.isArray(dados.vinculosEquipe) ? dados.vinculosEquipe : []
    const vinculosExistentes = vinculosOriginais.map((v) => ({ ...v, projetoId: v.projetoId ?? null }))
    const referencias = importarReferencia ? (dadosIniciais.vinculosEquipe ?? []) : []
    const chavesVigencia = new Set(vinculosExistentes.map((v) => `${v.pessoaId}|${v.equipeId}|${v.projetoId}|${v.inicio}|${v.fim}`))
    const referenciasNovas = referencias.filter((v) => !chavesVigencia.has(`${v.pessoaId}|${v.equipeId}|${v.projetoId}|${v.inicio}|${v.fim}`))
    const vinculosTodos = [...vinculosExistentes, ...referenciasNovas]
    const paresPessoaEquipe = new Set(vinculosTodos.map((v) => `${v.pessoaId}|${v.equipeId}`))
    const legados = dados.pessoas.flatMap((pessoa) => !pessoa.equipeId || paresPessoaEquipe.has(`${pessoa.id}|${pessoa.equipeId}`) ? [] : [{
      id: `legado-${pessoa.id}`, pessoaId: pessoa.id, equipeId: pessoa.equipeId, projetoId: null,
      inicio: null, fim: null, origem: 'legado' as const,
    }])
    const vinculosComLegados = [...vinculosTodos, ...legados]
    const pessoasDisponiveis = [...dados.pessoas, ...dadosIniciais.pessoas.filter((p) => !dados.pessoas.some((existente) => existente.id === p.id))]

    let composicoes: ComposicaoEquipe[] = Array.isArray(dados.composicoesEquipe) ? dados.composicoesEquipe : []
    let integrantes: IntegranteComposicaoEquipe[] = Array.isArray(dados.integrantesComposicao) ? dados.integrantesComposicao : []
    const idsMigrados = new Set<string>()
    if (migrarGlobal) {
      type RegistroOrigem = { id: string; equipeId: string; inicio: string; fim: string | null; pessoaId: string; origem?: 'manual' | 'legado' | 'planilha' }
      const registros: RegistroOrigem[] = []
      const elegiveis = vinculosComLegados.filter((v) => v.projetoId && v.inicio &&
        dados.escolas.some((p) => p.id === v.projetoId) && dados.equipes.some((e) => e.id === v.equipeId) &&
        pessoasDisponiveis.some((p) => p.id === v.pessoaId) && (!v.fim || v.fim >= v.inicio!))
      for (const v of elegiveis) { registros.push({ id: v.id, equipeId: v.equipeId, inicio: v.inicio!, fim: v.fim, pessoaId: v.pessoaId, origem: v.origem }); idsMigrados.add(v.id) }

      // Backups feitos pela versão anterior guardam projetoId na composição; ao consolidar,
      // o projeto é descartado e os membros passam a compor a cronologia global da equipe.
      const compsAntigas = (dados.composicoesEquipe ?? []) as (ComposicaoEquipe & { projetoId?: string })[]
      for (const c of compsAntigas) for (const m of (dados.integrantesComposicao ?? []).filter((x) => x.composicaoId === c.id)) {
        if (dados.equipes.some((e) => e.id === c.equipeId) && pessoasDisponiveis.some((p) => p.id === m.pessoaId)) registros.push({ id: `${c.id}-${m.pessoaId}`, equipeId: c.equipeId, inicio: c.inicio, fim: c.fim, pessoaId: m.pessoaId, origem: c.origem })
      }
      const porEquipe = new Map<string, RegistroOrigem[]>()
      for (const r of registros) porEquipe.set(r.equipeId, [...(porEquipe.get(r.equipeId) ?? []), r])
      composicoes = []; integrantes = []
      for (const [equipeId, lista] of porEquipe) {
        const porData = new Map<string, RegistroOrigem[]>()
        for (const r of lista) porData.set(r.inicio, [...(porData.get(r.inicio) ?? []), r])
        const snapshots = [...porData].sort(([a], [b]) => a.localeCompare(b)).map(([inicio, rs]) => ({ inicio, pessoas: [...new Set(rs.map((r) => r.pessoaId))].sort(), planilha: rs.every((r) => r.origem === 'planilha') }))
        const assinaturas = new Set(snapshots.map((s) => s.pessoas.join('|')))
        // A planilha é um retrato estático: quando a equipe tem uma única composição conhecida,
        // ela vira uma formação-base aberta desde a primeira data observada.
        const baseline = assinaturas.size === 1 && lista.every((r) => r.origem === 'planilha')
        const versoes = baseline ? [{ inicio: snapshots[0].inicio, pessoas: snapshots[0].pessoas, fim: null as string | null, planilha: true }] : snapshots.map((s, i) => ({ ...s, fim: snapshots[i + 1]?.inicio ? new Date(new Date(`${snapshots[i + 1].inicio}T12:00:00`).getTime() - 86400000).toISOString().slice(0, 10) : null }))
        for (const [i, v] of versoes.entries()) {
          const id = `comp-global-${equipeId}-${v.inicio}-${i}`
          composicoes.push({ id, equipeId, inicio: v.inicio, fim: v.fim, origem: v.planilha ? 'planilha' : 'manual' })
          for (const pessoaId of v.pessoas) integrantes.push({ id: `${id}-${pessoaId}`, composicaoId: id, pessoaId })
        }
      }
    }

    const precisaMigrar = !Array.isArray(dados.marcos) || !Array.isArray(dados.vinculosEquipe) ||
      dados.pessoas.some((pessoa) => pessoa.equipeId !== undefined) || importarReferencia || migrarGlobal || renomearEquipesArq
    if (precisaMigrar) {
      setDados({
        ...dados,
        equipes: renomearEquipesArq
          ? dados.equipes.map((equipe, indice, lista) => equipe.disciplinaId === 'dis-arq'
            ? { ...equipe, nome: `ARQ-${lista.slice(0, indice + 1).filter((item) => item.disciplinaId === 'dis-arq').length}` }
            : equipe)
          : dados.equipes,
        pessoas: [...dados.pessoas, ...dadosIniciais.pessoas.filter((p) => !dados.pessoas.some((existente) => existente.id === p.id))]
          .map(({ id, nome, funcao }) => ({ id, nome, funcao })),
        marcos: Array.isArray(dados.marcos) ? dados.marcos : [],
        vinculosEquipe: migrarGlobal ? vinculosComLegados.filter((v) => !idsMigrados.has(v.id)) : vinculosComLegados,
        composicoesEquipe: composicoes,
        integrantesComposicao: integrantes,
        fontesImportadas: [...new Set([...fontes, ...(importarReferencia ? [fonteReferencia] : []), ...(migrarGlobal ? [fonteComposicoes] : []), ...(renomearEquipesArq ? [fonteNomesArq] : [])])],
      })
    }
  }, [dados, setDados])

  const salvarAtividade = (a: Atividade) => {
    const existe = dados.atividades.some((x) => x.id === a.id)
    setDados({
      ...dados,
      atividades: existe ? dados.atividades.map((x) => (x.id === a.id ? a : x)) : [...dados.atividades, a],
    })
    setEditando(null)
  }

  const redimensionarAtividade = (atividade: Atividade) => {
    setDados({ ...dados, atividades: dados.atividades.map((a) => a.id === atividade.id ? atividade : a) })
  }

  const excluirAtividade = (id: string) => {
    setDados({ ...dados, atividades: dados.atividades.filter((x) => x.id !== id) })
    setEditando(null)
  }

  const salvarMarco = (marco: MarcoProjeto) => {
    const existe = marcos.some((x) => x.id === marco.id)
    setDados({ ...dados, marcos: existe ? marcos.map((x) => x.id === marco.id ? marco : x) : [...marcos, marco] })
    setMarcoEditando(null)
  }

  const excluirMarco = (id: string) => {
    setDados({ ...dados, marcos: marcos.filter((x) => x.id !== id) })
    setMarcoEditando(null)
  }

  // Backup: o localStorage pode ser apagado ao limpar o navegador, então exporte de vez em quando.
  const exportar = () => {
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `gantt-equipes-${hojeISO()}.json`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const importar = (arquivo: File) => {
    const leitor = new FileReader()
    leitor.onload = () => {
      try {
        const lido = JSON.parse(String(leitor.result)) as Partial<Dados>
        const chaves: (keyof Dados)[] = ['escolas', 'disciplinas', 'equipes', 'pessoas', 'atividades']
        if (!chaves.every((k) => Array.isArray(lido[k]))) throw new Error('formato')
        if (lido.marcos !== undefined && !Array.isArray(lido.marcos)) throw new Error('formato')
        if (lido.vinculosEquipe !== undefined && !Array.isArray(lido.vinculosEquipe)) throw new Error('formato')
        if (lido.composicoesEquipe !== undefined && !Array.isArray(lido.composicoesEquipe)) throw new Error('formato')
        if (lido.integrantesComposicao !== undefined && !Array.isArray(lido.integrantesComposicao)) throw new Error('formato')
        if (lido.eventosEquipe !== undefined && !Array.isArray(lido.eventosEquipe)) throw new Error('formato')
        if (lido.movimentacoesEquipe !== undefined && !Array.isArray(lido.movimentacoesEquipe)) throw new Error('formato')
        if (confirm('Substituir todos os dados atuais pelos do arquivo?')) setDados({ ...lido, marcos: lido.marcos ?? [], eventosEquipe: lido.eventosEquipe ?? [], movimentacoesEquipe: lido.movimentacoesEquipe ?? [] } as Dados)
      } catch {
        alert('Arquivo inválido. Use um arquivo exportado por este sistema.')
      }
    }
    leitor.readAsText(arquivo)
  }

  return (
    <div className="app">
      <header>
        <h1>Gantt de Equipes</h1>
        <nav className="seg">
          <button className={aba === 'gantt' ? 'ativo' : ''} onClick={() => setAba('gantt')}>Gantt</button>
          <button className={aba === 'atividades' ? 'ativo' : ''} onClick={() => setAba('atividades')}>Atividades</button>
          <button className={aba === 'marcos' ? 'ativo' : ''} onClick={() => setAba('marcos')}>Marcos</button>
          <button className={aba === 'analises' ? 'ativo' : ''} onClick={() => setAba('analises')}>Análises</button>
          <button className={aba === 'equipes' ? 'ativo' : ''} onClick={() => setAba('equipes')}>Equipes</button>
          <button className={aba === 'cadastros' ? 'ativo' : ''} onClick={() => setAba('cadastros')}>Cadastros</button>
        </nav>
        <div className="header-acoes">
          {aba === 'marcos'
            ? <button className="primario" onClick={() => setMarcoEditando({})}>+ Novo marco</button>
            : aba === 'equipes'
              ? null
              : <button className="primario" onClick={() => setEditando({})}>+ Nova atividade</button>}
          <button onClick={exportar}>Exportar</button>
          <button onClick={() => arquivoRef.current?.click()}>Importar</button>
          <button
            title="Volta aos dados da planilha original"
            onClick={() => { if (confirm('Apagar tudo e voltar aos dados da planilha?')) setDados(dadosIniciais) }}
          >
            Restaurar
          </button>
          <input
            ref={arquivoRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importar(f)
              e.target.value = ''
            }}
          />
        </div>
      </header>

      <main>
        {aba !== 'cadastros' && aba !== 'marcos' && aba !== 'equipes' && <BarraFiltros dados={dados} filtros={filtros} onChange={setFiltros} />}

        {aba === 'gantt' && (
          <Gantt dados={dados} filtros={filtros} marcos={marcos} onEditar={setEditando} onNova={setEditando} onEditarMarco={setMarcoEditando} onRedimensionar={redimensionarAtividade} />
        )}
        {aba === 'atividades' && <ListaAtividades dados={dados} atividades={atividades} onEditar={setEditando} />}
        {aba === 'marcos' && <ListaMarcos dados={dados} marcos={marcos} onEditar={setMarcoEditando} onExcluir={excluirMarco} />}
        {aba === 'equipes' && <ComposicoesEquipe dados={dados} onChange={setDados} />}
        {aba === 'analises' && (
          <section className="pagina-analises">
            <div className="analises-cabecalho">
              <h2>Análises de gestão</h2>
              <p>Indicadores das atividades concluídas. Use os filtros acima para ajustar a leitura por projeto, disciplina ou equipe.</p>
            </div>
            <div className="filtro-periodo">
              <div className="filtro-periodo-texto"><strong>Intervalo de análise</strong><span>As atividades são consideradas nos dias úteis que coincidirem com o período selecionado.</span></div>
              <label>De<input type="date" value={intervaloAnalise.inicio} max={intervaloAnalise.fim || undefined} onChange={(e) => setIntervaloAnalise({ ...intervaloAnalise, inicio: e.target.value })} /></label>
              <label>Até<input type="date" value={intervaloAnalise.fim} min={intervaloAnalise.inicio || undefined} onChange={(e) => setIntervaloAnalise({ ...intervaloAnalise, fim: e.target.value })} /></label>
              <button onClick={() => setIntervaloAnalise({ inicio: '', fim: '' })}>Limpar período</button>
            </div>
            {intervaloAnalise.inicio && intervaloAnalise.fim && intervaloAnalise.inicio > intervaloAnalise.fim && <p className="erro-periodo">A data inicial precisa ser anterior ou igual à data final.</p>}
            <Resumo dados={dados} atividades={atividadesAnalise} periodo={intervaloAnalise} />
            <ExecucaoProjetos dados={dados} escolaId={filtros.escolaId} />
          </section>
        )}
        {aba === 'cadastros' && <Cadastros dados={dados} onChange={setDados} />}
      </main>

      {editando && (
        <FormAtividade
          key={editando.id ?? 'nova'}
          dados={dados}
          inicial={editando}
          onSalvar={salvarAtividade}
          onExcluir={excluirAtividade}
          onCancelar={() => setEditando(null)}
        />
      )}
      {marcoEditando && (
        <FormMarco
          dados={dados}
          marcos={marcos}
          inicial={marcoEditando}
          onSalvar={salvarMarco}
          onExcluir={excluirMarco}
          onCancelar={() => setMarcoEditando(null)}
        />
      )}
    </div>
  )
}
