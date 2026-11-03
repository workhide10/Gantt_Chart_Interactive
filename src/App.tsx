import { useEffect, useMemo, useRef, useState } from 'react'
import type { Atividade, Dados, Filtros, MarcoProjeto } from './types'
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

type Aba = 'gantt' | 'atividades' | 'marcos' | 'analises' | 'cadastros'
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

  // Migra silenciosamente os dados já salvos antes da inclusão dos marcos.
  useEffect(() => {
    if (!Array.isArray(dados.marcos)) setDados({ ...dados, marcos: [] })
  }, [dados, setDados])

  const salvarAtividade = (a: Atividade) => {
    const existe = dados.atividades.some((x) => x.id === a.id)
    setDados({
      ...dados,
      atividades: existe ? dados.atividades.map((x) => (x.id === a.id ? a : x)) : [...dados.atividades, a],
    })
    setEditando(null)
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
        if (confirm('Substituir todos os dados atuais pelos do arquivo?')) setDados({ ...lido, marcos: lido.marcos ?? [] } as Dados)
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
          <button className={aba === 'cadastros' ? 'ativo' : ''} onClick={() => setAba('cadastros')}>Cadastros</button>
        </nav>
        <div className="header-acoes">
          {aba === 'marcos'
            ? <button className="primario" onClick={() => setMarcoEditando({})}>+ Novo marco</button>
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
        {aba !== 'cadastros' && aba !== 'marcos' && <BarraFiltros dados={dados} filtros={filtros} onChange={setFiltros} />}

        {aba === 'gantt' && (
          <Gantt dados={dados} filtros={filtros} marcos={marcos} onEditar={setEditando} onNova={setEditando} onEditarMarco={setMarcoEditando} />
        )}
        {aba === 'atividades' && <ListaAtividades dados={dados} atividades={atividades} onEditar={setEditando} />}
        {aba === 'marcos' && <ListaMarcos dados={dados} marcos={marcos} onEditar={setMarcoEditando} onExcluir={excluirMarco} />}
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
          </section>
        )}
        {aba === 'cadastros' && <Cadastros dados={dados} onChange={setDados} />}
      </main>

      {editando && (
        <FormAtividade
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
