import { useMemo, useRef, useState } from 'react'
import type { Atividade, Filtros, MarcoProjeto } from './types'
import { useDados } from './hooks/useDados'
import { baixarArquivo, lerBackup } from './lib/backups'
import { filtrarAtividades } from './lib/filtrar'
import { hojeISO } from './lib/datas'
import { Gantt } from './components/Gantt'
import { DashboardAnalises } from './components/DashboardAnalises'
import { BarraFiltros } from './components/BarraFiltros'
import { ListaAtividades } from './components/ListaAtividades'
import { FormAtividade } from './components/FormAtividade'
import { Cadastros } from './components/Cadastros'
import { FormMarco } from './components/FormMarco'
import { ListaMarcos } from './components/ListaMarcos'
import { ComposicoesEquipe } from './components/ComposicoesEquipe'

type Aba = 'gantt' | 'atividades' | 'marcos' | 'analises' | 'equipes' | 'cadastros'
type IntervaloAnalise = { inicio: string; fim: string }


export default function App() {
  // Todos os dados do sistema ficam neste estado, salvo automaticamente no navegador.
  const operacoes = useDados()
  const { dados, setDados, armazenamento } = operacoes
  const [aba, setAba] = useState<Aba>('gantt')
  const [filtros, setFiltros] = useState<Filtros>({ escolaId: '', disciplinaId: '', equipeId: '' })
  const [editando, setEditando] = useState<Partial<Atividade> | null>(null) // null = modal fechado
  const [marcoEditando, setMarcoEditando] = useState<Partial<MarcoProjeto> | null>(null)
  const [intervaloAnalise, setIntervaloAnalise] = useState<IntervaloAnalise>({ inicio: '', fim: '' })
  const arquivoRef = useRef<HTMLInputElement>(null)

  const atividades = useMemo(() => filtrarAtividades(dados, filtros), [dados, filtros])
  const marcos = dados.marcos ?? []
  const novaAtividade = (preset: Partial<Atividade> = {}) => {
    setEditando({
      escolaId: filtros.escolaId || undefined,
      equipeId: filtros.equipeId || undefined,
      inicio: hojeISO(),
      fim: hojeISO(),
      ...preset,
    })
  }

  const salvarAtividade = (a: Atividade, continuar = false) => {
    operacoes.salvarAtividade(a)
    if (!continuar) setEditando(null)
  }

  const redimensionarAtividade = (atividade: Atividade) => {
    operacoes.redimensionarAtividade(atividade)
  }

  const excluirAtividade = (id: string) => {
    operacoes.excluirAtividade(id)
    setEditando(null)
  }

  const salvarMarco = (marco: MarcoProjeto) => {
    operacoes.salvarMarco(marco)
    setMarcoEditando(null)
  }

  const excluirMarco = (id: string) => {
    operacoes.excluirMarco(id)
    setMarcoEditando(null)
  }

  const exportar = () => baixarArquivo(JSON.stringify(dados, null, 2), `gantt-equipes-${hojeISO()}.json`)

  const importar = async (arquivo: File) => {
    try {
      const lido = lerBackup(await arquivo.text())
      if (confirm(`Importar ${lido.atividades.length} atividade(s), ${lido.escolas.length} projeto(s) e ${lido.equipes.length} equipe(s)? Os dados atuais serão substituídos.`)) {
        operacoes.substituirDados(lido)
        setFiltros({ escolaId: '', disciplinaId: '', equipeId: '' })
      }
    } catch {
      alert('Não foi possível importar. Verifique o arquivo, os campos, as datas e as referências. Nenhum dado foi substituído.')
    }
  }

  return (
    <div className="app">
      <header>
        <div className="marca">
          <span className="marca-icone" aria-hidden="true"><i /><i /><i /></span>
          <div><span className="marca-contexto">PLANEJAMENTO & GESTÃO</span><h1>Gantt de Equipes</h1></div>
        </div>
        <nav className="seg navegacao" aria-label="Navegação principal">
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
              : <button className="primario" onClick={() => novaAtividade()}>+ Nova atividade</button>}
          <button onClick={exportar}>Exportar</button>
          <button onClick={() => arquivoRef.current?.click()}>Importar</button>
          <button
            title="Volta aos dados da planilha original"
            onClick={() => { if (confirm('Apagar tudo e voltar aos dados da planilha?')) { operacoes.restaurarDados(); setFiltros({ escolaId: '', disciplinaId: '', equipeId: '' }) } }}
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
        {armazenamento.erro && <div className="aviso" role="alert">{armazenamento.erro} <button onClick={exportar}>Exportar dados desta sessão</button>
          {armazenamento.bloqueado && armazenamento.original !== null && <button onClick={() => baixarArquivo(armazenamento.original!, `gantt-equipes-recuperacao-${hojeISO()}.json`)}>Baixar conteúdo original</button>}
        </div>}
        {aba !== 'cadastros' && aba !== 'marcos' && aba !== 'equipes' && <BarraFiltros dados={dados} filtros={filtros} onChange={setFiltros} />}

        {aba === 'gantt' && (
          <Gantt dados={dados} filtros={filtros} marcos={marcos} onEditar={setEditando} onNova={novaAtividade} onEditarMarco={setMarcoEditando} onRedimensionar={redimensionarAtividade} />
        )}
        {aba === 'atividades' && <ListaAtividades dados={dados} atividades={atividades} onEditar={setEditando} onDuplicar={(atividade) => { const { id: _id, ...copia } = atividade; novaAtividade(copia) }} />}
        {aba === 'marcos' && <ListaMarcos dados={dados} marcos={marcos} onEditar={setMarcoEditando} onExcluir={excluirMarco} />}
        {aba === 'equipes' && <ComposicoesEquipe dados={dados} onChange={setDados} />}
        {aba === 'analises' && <DashboardAnalises dados={dados} filtros={filtros} periodo={intervaloAnalise} onPeriodoChange={setIntervaloAnalise} onFiltrosChange={setFiltros} />}
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
          key={marcoEditando.id ?? 'novo-marco'}
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
