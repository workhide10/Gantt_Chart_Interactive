import { useState } from 'react'
import type { Dados } from '../types'
import { TabelaEditavel } from './TabelaEditavel'

interface Props {
  dados: Dados
  onChange: (d: Dados) => void
}

type Aba = 'escolas' | 'disciplinas' | 'equipes' | 'pessoas'
const ABAS: { id: Aba; titulo: string }[] = [
  { id: 'escolas', titulo: 'Escolas' },
  { id: 'disciplinas', titulo: 'Disciplinas' },
  { id: 'equipes', titulo: 'Equipes' },
  { id: 'pessoas', titulo: 'Pessoas' },
]

export function Cadastros({ dados, onChange }: Props) {
  const [aba, setAba] = useState<Aba>('escolas')
  const novoId = () => crypto.randomUUID()

  const opcoesDisciplina = dados.disciplinas.map((d) => ({ valor: d.id, rotulo: d.sigla }))
  const opcoesEquipe = dados.equipes.map((e) => ({ valor: e.id, rotulo: e.nome }))

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
            return n ? `Esta escola tem ${n} atividade(s). Exclua as atividades primeiro.` : null
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
            const pe = dados.pessoas.filter((p) => p.equipeId === e.id).length
            return at || pe ? `Esta equipe tem ${at} atividade(s) e ${pe} pessoa(s). Remova ou mova antes de excluir.` : null
          }}
        />
      )}

      {aba === 'pessoas' && (
        <TabelaEditavel
          itens={dados.pessoas}
          colunas={[
            { chave: 'nome', titulo: 'Nome' },
            { chave: 'funcao', titulo: 'Função' },
            { chave: 'equipeId', titulo: 'Equipe', tipo: 'select', opcoes: opcoesEquipe, permiteVazio: true },
          ]}
          onChange={(pessoas) => onChange({ ...dados, pessoas })}
          criarNovo={() => ({ id: novoId(), nome: '', funcao: '', equipeId: null })}
          motivoBloqueio={() => null}
        />
      )}
    </section>
  )
}
