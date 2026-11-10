import { useMemo, useState } from 'react'
import type { Atividade, Dados } from '../types'
import { feriados } from '../data/inicial'
import { diasUteis, formatarBR } from '../lib/datas'
import { criarIndiceComposicoes, integrantesNaAtividade } from '../lib/composicao'

interface Props {
  dados: Dados
  atividades: Atividade[]
  onEditar: (a: Atividade) => void
  onDuplicar: (a: Atividade) => void
}

export function ListaAtividades({ dados, atividades, onEditar, onDuplicar }: Props) {
  const [busca, setBusca] = useState('')
  const [ordem, setOrdem] = useState<'recentes' | 'antigas'>('recentes')
  const linhas = useMemo(() => {
    const projetos = new Map(dados.escolas.map((p) => [p.id, p]))
    const equipes = new Map(dados.equipes.map((e) => [e.id, e]))
    const disciplinas = new Map(dados.disciplinas.map((d) => [d.id, d]))
    const indice = criarIndiceComposicoes(dados)
    return atividades.map((atividade) => {
      const projeto = projetos.get(atividade.escolaId)
      const equipe = equipes.get(atividade.equipeId)
      const disciplina = equipe ? disciplinas.get(equipe.disciplinaId) : undefined
      const participantes = [...new Set(integrantesNaAtividade(dados, atividade, indice).flatMap((i) =>
        i.pessoa ? [`${i.pessoa.nome} (${formatarBR(i.inicio)}–${formatarBR(i.fim)})`] : [],
      ))].join(', ')
      return { atividade, projeto, equipe, disciplina, participantes }
    })
  }, [dados, atividades])
  const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
  const termo = normalizar(busca.trim())
  const visiveis = linhas.filter(({ atividade, projeto, equipe, disciplina, participantes }) =>
    normalizar([projeto?.codigo, projeto?.nome, equipe?.nome, disciplina?.sigla, atividade.titulo, atividade.descricao, participantes].join(' ')).includes(termo),
  ).sort((a, b) => (ordem === 'recentes' ? -1 : 1) * a.atividade.inicio.localeCompare(b.atividade.inicio) || a.atividade.id.localeCompare(b.atividade.id))

  return (
    <section>
      <div className="lista-ferramentas">
        <label className="busca-lista">Buscar atividades
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Projeto, equipe, etapa ou participante…" />
        </label>
        <label>Ordenar por<select value={ordem} onChange={(e) => setOrdem(e.target.value as typeof ordem)}>
          <option value="recentes">Mais recentes primeiro</option><option value="antigas">Mais antigas primeiro</option>
        </select></label>
        <span className="dica" role="status">{visiveis.length} de {atividades.length} atividade(s)</span>
        {busca && <button onClick={() => setBusca('')}>Limpar busca</button>}
      </div>
      <div className="tabela-rolagem">
        <table>
          <thead>
            <tr><th>Projeto</th><th>Etapa / atividade</th><th>Equipe</th><th>Disciplina</th><th>Início</th><th>Fim</th><th>Dias úteis</th><th>Participantes</th><th>Observações</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {visiveis.map(({ atividade: a, projeto, equipe, disciplina, participantes }) => (
              <tr key={a.id}>
                <td><i className="bolinha" style={{ background: projeto?.cor }} /> {projeto?.codigo ?? 'Projeto removido'}</td>
                <td><button className="link-editar" onClick={() => onEditar(a)} aria-label={`Editar ${a.titulo || projeto?.codigo || 'atividade'}`}>{a.titulo || 'Atividade sem título'}</button></td>
                <td>{equipe?.nome ?? 'Equipe removida'}</td>
                <td>{disciplina?.sigla ?? '—'}</td>
                <td className="data-tabela">{formatarBR(a.inicio)}</td>
                <td className="data-tabela">{formatarBR(a.fim)}</td>
                <td>{diasUteis(a.inicio, a.fim, feriados)}</td>
                <td>{participantes || 'Nenhum associado'}</td>
                <td>{a.descricao || '—'}</td>
                <td><div className="marco-acoes"><button onClick={() => onEditar(a)}>Editar</button><button onClick={() => onDuplicar(a)} title="Abre uma cópia para revisar antes de salvar">Duplicar</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {visiveis.length === 0 && <p className="vazio">{busca ? 'Nenhuma atividade corresponde à busca. Ajuste o texto ou limpe a busca.' : 'Nenhuma atividade para os filtros selecionados. Use “Nova atividade” para registrar uma.'}</p>}
      </div>
    </section>
  )
}
