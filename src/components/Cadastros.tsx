import { useState } from 'react'
import type { Dados } from '../types'
import { TabelaEditavel } from './TabelaEditavel'
import { PendenciasVinculos } from './PendenciasVinculos'

interface Props {
  dados: Dados
  onChange: (d: Dados) => void
}

type Aba = 'escolas' | 'disciplinas' | 'equipes' | 'pessoas' | 'vinculos'
const ABAS: { id: Aba; titulo: string }[] = [
  { id: 'escolas', titulo: 'Projetos' },
  { id: 'disciplinas', titulo: 'Disciplinas' },
  { id: 'equipes', titulo: 'Equipes base' },
  { id: 'pessoas', titulo: 'Pessoas' },
  { id: 'vinculos', titulo: 'Pendências antigas' },
]

export function Cadastros({ dados, onChange }: Props) {
  const [aba, setAba] = useState<Aba>('escolas')
  const novoId = () => crypto.randomUUID()

  const opcoesDisciplina = dados.disciplinas.map((d) => ({ valor: d.id, rotulo: d.sigla }))
  const vinculos = dados.vinculosEquipe ?? []
  const composicoes = dados.composicoesEquipe ?? []
  const integrantes = dados.integrantesComposicao ?? []

  return (
    <section>
      <div className="seg">
        {ABAS.map((a) => (
          <button key={a.id} className={aba === a.id ? 'ativo' : ''} onClick={() => setAba(a.id)}>{a.titulo}</button>
        ))}
      </div>

      {aba === 'escolas' && (
        <TabelaEditavel
          itens={dados.escolas}
          colunas={[
            { chave: 'codigo', titulo: 'Código' },
            { chave: 'nome', titulo: 'Nome' },
            { chave: 'cor', titulo: 'Cor', tipo: 'cor' },
          ]}
          onChange={(escolas) => onChange({ ...dados, escolas })}
          criarNovo={() => ({ id: novoId(), codigo: '', nome: '', cor: '#3b82f6' })}
          motivoBloqueio={(e) => {
            const n = dados.atividades.filter((a) => a.escolaId === e.id).length
            const m = (dados.marcos ?? []).filter((marco) => marco.escolaId === e.id).length
            const v = vinculos.filter((vinculo) => vinculo.projetoId === e.id).length
            return n || m || v ? `Este projeto tem ${n} atividade(s), ${m} marco(s) e ${v} pendência(s) de equipe.` : null
          }}
        />
      )}

      {aba === 'disciplinas' && (
        <TabelaEditavel
          itens={dados.disciplinas}
          colunas={[
            { chave: 'sigla', titulo: 'Sigla' },
            { chave: 'nome', titulo: 'Nome' },
          ]}
          onChange={(disciplinas) => onChange({ ...dados, disciplinas })}
          criarNovo={() => ({ id: novoId(), sigla: '', nome: '' })}
          motivoBloqueio={(d) => {
            const n = dados.equipes.filter((e) => e.disciplinaId === d.id).length
            return n ? `Esta disciplina é usada por ${n} equipe(s).` : null
          }}
        />
      )}

      {aba === 'equipes' && (
        <TabelaEditavel
          itens={dados.equipes}
          colunas={[
            { chave: 'nome', titulo: 'Equipe' },
            { chave: 'disciplinaId', titulo: 'Disciplina', tipo: 'select', opcoes: opcoesDisciplina },
          ]}
          onChange={(equipes) => onChange({ ...dados, equipes })}
          criarNovo={() => ({ id: novoId(), nome: '', disciplinaId: dados.disciplinas[0]?.id ?? '' })}
          motivoBloqueio={(e) => {
            const at = dados.atividades.filter((a) => a.equipeId === e.id).length
            const pe = vinculos.filter((v) => v.equipeId === e.id).length
            const co = composicoes.filter((c) => c.equipeId === e.id).length
            return at || pe || co ? `Esta equipe tem ${at} atividade(s), ${co} composição(ões) históricas e ${pe} pendência(s).` : null
          }}
        />
      )}

      {aba === 'pessoas' && (
        <TabelaEditavel
          itens={dados.pessoas}
          colunas={[
            { chave: 'nome', titulo: 'Nome' },
            { chave: 'funcao', titulo: 'Função' },
          ]}
          onChange={(pessoas) => onChange({ ...dados, pessoas })}
          criarNovo={() => ({ id: novoId(), nome: '', funcao: '' })}
          motivoBloqueio={(pessoa) => {
            const n = vinculos.filter((v) => v.pessoaId === pessoa.id).length
            const c = integrantes.filter((i) => i.pessoaId === pessoa.id).length
            return n || c ? `Esta pessoa aparece em ${c} composição(ões) e ${n} pendência(s) histórica(s).` : null
          }}
        />
      )}

      {aba === 'vinculos' && <PendenciasVinculos dados={dados} onChange={onChange} />}

    </section>
  )
}
