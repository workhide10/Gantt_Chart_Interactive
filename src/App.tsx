import { useMemo, useRef, useState } from 'react'
import type { Atividade, Dados, Filtros } from './types'
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

type Aba = 'gantt' | 'atividades' | 'cadastros'

export default function App() {
  // Todos os dados do sistema ficam neste estado, salvo automaticamente no navegador.
  const [dados, setDados] = useLocalStorage<Dados>('gantt-equipes:v1', dadosIniciais)
  const [aba, setAba] = useState<Aba>('gantt')
  const [filtros, setFiltros] = useState<Filtros>({ escolaId: '', disciplinaId: '', equipeId: '' })
  const [editando, setEditando] = useState<Partial<Atividade> | null>(null) // null = modal fechado
  const arquivoRef = useRef<HTMLInputElement>(null)

  const atividades = useMemo(() => filtrarAtividades(dados, filtros), [dados, filtros])

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
        if (confirm('Substituir todos os dados atuais pelos do arquivo?')) setDados(lido as Dados)
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
          <button className={aba === 'cadastros' ? 'ativo' : ''} onClick={() => setAba('cadastros')}>Cadastros</button>
        </nav>
        <div className="header-acoes">
          <button className="primario" onClick={() => setEditando({})}>+ Nova atividade</button>
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
        {aba !== 'cadastros' && <BarraFiltros dados={dados} filtros={filtros} onChange={setFiltros} />}

        {aba === 'gantt' && (
          <>
            <Gantt dados={dados} filtros={filtros} onEditar={setEditando} onNova={setEditando} />
            <Resumo dados={dados} atividades={atividades} />
          </>
        )}
        {aba === 'atividades' && <ListaAtividades dados={dados} atividades={atividades} onEditar={setEditando} />}
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
    </div>
  )
}
