import { useState } from 'react'
import type { Dados } from '../types'
import { TabelaEditavel } from './TabelaEditavel'
import { motivoBloqueioExclusao } from '../lib/registros'

interface Props {
  dados: Dados
  onChange: (d: Dados) => void
}

type Aba = 'escolas' | 'disciplinas' | 'equipes' | 'pessoas'
const ABAS: { id: Aba; titulo: string }[] = [
  { id: 'escolas', titulo: 'Projetos' },
  { id: 'disciplinas', titulo: 'Disciplinas' },
  { id: 'equipes', titulo: 'Equipes base' },
  { id: 'pessoas', titulo: 'Pessoas' },
]

export function Cadastros({ dados, onChange }: Props) {
  const [aba, setAba] = useState<Aba>('escolas')
  const novoId = () => crypto.randomUUID()

  const opcoesDisciplina = dados.disciplinas.map((d) => ({ valor: d.id, rotulo: d.sigla }))

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
          motivoBloqueio={(e) => motivoBloqueioExclusao(dados, 'projeto', e.id)}
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
          motivoBloqueio={(d) => motivoBloqueioExclusao(dados, 'disciplina', d.id)}
        />
      )}

      {aba === 'equipes' && (
        <TabelaEditavel
          itens={dados.equipes}
          bloqueioAdicionar={dados.disciplinas.length ? undefined : 'Cadastre uma disciplina antes de adicionar equipes.'}
          colunas={[
            { chave: 'nome', titulo: 'Equipe' },
            { chave: 'disciplinaId', titulo: 'Disciplina', tipo: 'select', opcoes: opcoesDisciplina },
          ]}
          onChange={(equipes) => onChange({ ...dados, equipes })}
          criarNovo={() => ({ id: novoId(), nome: '', disciplinaId: dados.disciplinas[0]?.id ?? '' })}
          motivoBloqueio={(e) => motivoBloqueioExclusao(dados, 'equipe', e.id)}
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
          motivoBloqueio={(pessoa) => motivoBloqueioExclusao(dados, 'pessoa', pessoa.id)}
        />
      )}


    </section>
  )
}
