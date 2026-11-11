import test from 'node:test'
import assert from 'node:assert/strict'
import { analisarAtividades, analisarExecucao, analisarExecucaoProjetos, simultaneidadeMensal, projetosMensaisPorDisciplina, janelaGlobalAtividades } from '../src/lib/analises.ts'
import { diasUteisEntreMarcos } from '../src/lib/datas.ts'
import { validarDados } from '../src/lib/validacao.ts'
import { lerBackup } from '../src/lib/backups.ts'
import { migrarDados } from '../src/lib/migracoes.ts'
import { ajustarPeriodoAtividade, motivoBloqueioExclusao, registrarAtividade } from '../src/lib/registros.ts'
import { registrarComposicao, registrarMovimentacao } from '../src/lib/equipes.ts'

const filtros = { escolaId: '', disciplinaId: '', equipeId: '' }
const periodo = { inicio: '', fim: '' }
const atividade = (id, inicio, fim, equipeId = 'e1') => ({ id, escolaId: 'p1', equipeId, inicio, fim, descricao: '' })
const dadosExemplo = () => ({
  escolas: [{ id: 'p1', codigo: 'P1', nome: 'Projeto 1', cor: '#4263dc' }, { id: 'p2', codigo: 'P2', nome: 'Projeto 2', cor: '#22a3a1' }],
  disciplinas: [{ id: 'd1', sigla: 'ARQ', nome: 'Arquitetura' }, { id: 'd2', sigla: 'EST', nome: 'Estrutura' }],
  equipes: [{ id: 'e1', nome: 'ARQ-1', disciplinaId: 'd1' }, { id: 'e2', nome: 'EST-1', disciplinaId: 'd2' }],
  pessoas: [{ id: 'pes1', nome: 'Ana', funcao: 'ARQ' }],
  atividades: [atividade('a', '2026-01-01', '2026-01-05'), atividade('b', '2026-01-05', '2026-01-07'), atividade('c', '2026-01-12', '2026-01-13', 'e2')],
  marcos: [], vinculosEquipe: [], composicoesEquipe: [], integrantesComposicao: [], eventosEquipe: [], movimentacoesEquipe: [],
  fontesImportadas: ['alocacao-equipes-2026', 'formacao-equipe-global-v2', 'equipes-arq-numeradas-v1'],
})

test('dashboard une dias úteis e mantém sobreposições por equipe', () => {
  const dados = dadosExemplo(), copia = structuredClone(dados)
  const a = analisarAtividades(dados, filtros, periodo, [])
  assert.equal(a.dias, 7)
  assert.equal(a.conflitos, 1)
  assert.equal(a.mediana, 3)
  assert.equal(a.meses[0].conclusoes, 3)
  assert.equal(a.disciplinas.reduce((s, d) => s + d.dias, 0), a.dias)
  assert.equal(a.faixas.reduce((s, f) => s + f.quantidade, 0), 3)
  assert.deepEqual(dados, copia)
})

test('recorte de datas não transforma atividade que atravessa o período em conclusão', () => {
  const a = analisarAtividades(dadosExemplo(), filtros, { inicio: '2026-01-05', fim: '2026-01-06' }, [])
  assert.equal(a.atividades.length, 2)
  assert.equal(a.dias, 2)
  assert.equal(a.meses[0].conclusoes, 1)
  assert.equal(a.mediana, 3) // A duração integral não é encurtada pelo recorte.
})

test('série mensal distribui dias úteis entre meses sem duplicar conclusões', () => {
  const dados = dadosExemplo()
  dados.atividades = [atividade('longa', '2026-01-30', '2026-02-03')]
  const a = analisarAtividades(dados, filtros, periodo, [])
  assert.deepEqual(a.meses.map((m) => [m.dias, m.conclusoes]), [[1, 0], [2, 1]])
  assert.equal(a.dias, 3)
})

test('período invertido, filtros sem resultados e finais de semana não produzem NaN', () => {
  const dados = dadosExemplo()
  assert.equal(analisarAtividades(dados, filtros, { inicio: '2026-02-01', fim: '2026-01-01' }, []).periodoInvalido, true)
  const vazio = analisarAtividades(dados, { ...filtros, escolaId: 'p2' }, periodo, [])
  assert.equal(vazio.mediana, null)
  assert.equal(vazio.dias, 0)
  assert.deepEqual(vazio.meses, [])
  dados.atividades = [atividade('fimsemana', '2026-01-03', '2026-01-04')]
  assert.equal(analisarAtividades(dados, filtros, periodo, []).mediana, 0)
})

test('execução usa a união dos intervalos e distingue dias ativos de pausas', () => {
  const dados = dadosExemplo(), copia = structuredClone(dados)
  const a = analisarExecucao(dados.atividades)
  assert.equal(a.diasAtivos, 7)
  assert.equal(a.diasJanela, 9)
  assert.equal(a.diasPausados, 2)
  assert.deepEqual(a.pausas, [{ inicio: '2026-01-08', fim: '2026-01-11', dias: 2 }])
  assert.equal(analisarExecucaoProjetos(dados, 'p1')[0].diasAtivos, 7)
  assert.equal(analisarAtividades(dados, { ...filtros, disciplinaId: 'd1' }, periodo, []).atividades.length, 2)
  assert.deepEqual(dados, copia)
  assert.equal(analisarExecucao([]).diasPausados, 0)
  assert.equal(analisarExecucao([atividade('x', '2026-01-01', '2026-01-02'), atividade('y', '2026-01-03', '2026-01-03')]).pausas.length, 0)
})

test('validação rejeita linhas nulas, IDs duplicados, datas inválidas e referências ausentes', () => {
  const base = dadosExemplo()
  assert.equal(validarDados(base), true)
  for (const atividades of [[null], [base.atividades[0], base.atividades[0]], [{ ...base.atividades[0], inicio: '2026-02-30' }], [{ ...base.atividades[0], equipeId: 'ausente' }]]) {
    assert.equal(validarDados({ ...base, atividades }), false)
  }
  assert.throws(() => lerBackup('null'))
  assert.throws(() => lerBackup('{inválido'))
})

test('backup antigo continua aceito e arquivo legado não bloqueia exclusão de cadastros livres', () => {
  const dados = dadosExemplo()
  delete dados.marcos
  delete dados.composicoesEquipe
  assert.deepEqual(lerBackup(JSON.stringify(dados)).marcos, [])
  dados.vinculosEquipe = [{ id: 'legado', projetoId: 'p2', equipeId: 'e2', pessoaId: 'pes1', inicio: null, fim: null }]
  assert.equal(motivoBloqueioExclusao(dados, 'projeto', 'p2'), null)
  assert.notEqual(motivoBloqueioExclusao(dados, 'equipe', 'e1'), null)
  assert.equal(validarDados(dados), true)
})

test('migrações são idempotentes e preservam arquivos legados sem recriar duplicatas', () => {
  const dados = dadosExemplo()
  dados.fontesImportadas = []
  dados.vinculosEquipe = [{ id: 'legado', projetoId: null, equipeId: 'e1', pessoaId: 'pes1', inicio: null, fim: null }]
  const referencia = dadosExemplo()
  referencia.vinculosEquipe = [{ id: 'ref', projetoId: 'p1', equipeId: 'e1', pessoaId: 'pes1', inicio: '2026-01-01', fim: '2026-01-07', origem: 'planilha' }]
  const copia = structuredClone(dados)
  const migrado = migrarDados(dados, referencia)
  assert.deepEqual(dados, copia)
  assert.equal(migrado.composicoesEquipe.length, 1)
  assert.equal(migrado.integrantesComposicao.length, 1)
  assert.equal(migrado.vinculosEquipe[0].id, 'legado')
  assert.equal(migrarDados(migrado, referencia), migrado)
  assert.equal(validarDados(migrado), true)
})

test('cadastro atualiza por ID e redimensionamento preserva edições recentes', () => {
  const dados = dadosExemplo()
  const atualizado = registrarAtividade(dados, { ...dados.atividades[0], titulo: 'Título recente' })
  const ajustado = ajustarPeriodoAtividade(atualizado, { ...dados.atividades[0], fim: '2026-01-06' })
  assert.equal(ajustado.atividades.length, 3)
  assert.equal(ajustado.atividades[0].titulo, 'Título recente')
  assert.equal(ajustado.atividades[0].fim, '2026-01-06')
  assert.throws(() => registrarAtividade(dados, { ...dados.atividades[0], equipeId: 'ausente' }))
})

test('formação encerra versão anterior e respeita uma versão posterior', () => {
  const dados = dadosExemplo()
  dados.composicoesEquipe = [{ id: 'anterior', equipeId: 'e1', inicio: '2026-01-01', fim: '2026-01-19' }, { id: 'posterior', equipeId: 'e1', inicio: '2026-01-20', fim: null }]
  const a = registrarComposicao(dados, { id: 'nova', equipeId: 'e1', inicio: '2026-01-10', fim: null }, ['pes1'], () => 'membro-novo')
  assert.equal(a.composicoesEquipe.find((c) => c.id === 'anterior').fim, '2026-01-09')
  assert.equal(a.composicoesEquipe.find((c) => c.id === 'nova').fim, '2026-01-19')
  assert.equal(dados.composicoesEquipe[0].fim, '2026-01-19')
})

test('movimentação atualiza origem e destino em conjunto e mantém as atividades', () => {
  const dados = dadosExemplo()
  dados.equipes[1].disciplinaId = 'd1'
  dados.composicoesEquipe = [{ id: 'original', equipeId: 'e1', inicio: '2026-01-01', fim: null }]
  dados.integrantesComposicao = [{ id: 'i1', composicaoId: 'original', pessoaId: 'pes1' }]
  const evento = { id: 'evento', disciplinaId: 'd1', data: '2026-01-10' }
  const movimentos = [{ id: 'mov', eventoId: 'evento', pessoaId: 'pes1', equipeOrigemId: 'e1', equipeDestinoId: 'e2' }]
  let indice = 0
  const a = registrarMovimentacao(dados, evento, movimentos, [{ equipeId: 'e1', pessoaIds: [] }, { equipeId: 'e2', pessoaIds: ['pes1'] }], () => `novo-${++indice}`)
  assert.equal(a.composicoesEquipe[0].fim, '2026-01-09')
  assert.equal(a.eventosEquipe.length, 1)
  assert.equal(a.movimentacoesEquipe.length, 1)
  assert.equal(a.atividades, dados.atividades)
  assert.equal(validarDados(a), true)
})

test('movimentação rejeita troca entre disciplinas e evento repetido', () => {
  const dados = dadosExemplo()
  const evento = { id: 'evento', disciplinaId: 'd1', data: '2026-01-10' }
  const movimentos = [{ id: 'mov', eventoId: 'evento', pessoaId: 'pes1', equipeOrigemId: 'e1', equipeDestinoId: 'e2' }]
  const atualizacoes = [{ equipeId: 'e1', pessoaIds: [] }, { equipeId: 'e2', pessoaIds: ['pes1'] }]
  assert.throws(() => registrarMovimentacao(dados, evento, movimentos, atualizacoes))
  dados.equipes[1].disciplinaId = 'd1'
  dados.eventosEquipe = [evento]
  assert.throws(() => registrarMovimentacao(dados, evento, movimentos, atualizacoes))
})

 test('execução e marcos excluem finais de semana e feriados', () => {
  const feriados = ['2026-04-21']
  const a = analisarExecucao([atividade('a', '2026-04-17', '2026-04-17'), atividade('b', '2026-04-22', '2026-04-22')], feriados)
  assert.equal(a.diasAtivos, 2)
  assert.equal(a.diasJanela, 3)
  assert.equal(a.diasPausados, 1)
  assert.equal(a.pausas[0].dias, 1)
  assert.equal(diasUteisEntreMarcos('2026-04-17', '2026-04-22', feriados), 2)
  assert.equal(diasUteisEntreMarcos('2026-04-17', '2026-04-17', feriados), 0)
  assert.equal(analisarExecucao([atividade('a', '2026-04-17', '2026-04-17'), atividade('b', '2026-04-20', '2026-04-20')]).pausas.length, 0)
})

test('sobreposição apenas em fim de semana ou feriado não entra na análise', () => {
  const d = dadosExemplo()
  d.atividades = [atividade('a', '2026-04-17', '2026-04-19'), atividade('b', '2026-04-18', '2026-04-21')]
  assert.equal(analisarAtividades(d, filtros, periodo, ['2026-04-21']).conflitos, 0)
  d.atividades[0].fim = '2026-04-20'
  assert.equal(analisarAtividades(d, filtros, periodo, ['2026-04-21']).conflitos, 1)
})

test('união evita duplicação entre equipes e simultaneidade conta projetos distintos', () => {
 const d = dadosExemplo()
 d.equipes[1].disciplinaId = 'd1'
 d.atividades = [atividade('a', '2026-04-20', '2026-04-22'), {...atividade('b', '2026-04-20', '2026-04-22'), escolaId:'p2'}, atividade('c', '2026-04-20', '2026-04-22', 'e2'), {...atividade('d', '2026-04-20', '2026-04-22'), escolaId:'p2'}]
 const resultado = analisarAtividades(d, filtros, periodo, ['2026-04-21'])
 assert.equal(resultado.dias, 2)
 assert.equal(resultado.disciplinas[0].dias, 2)
 assert.equal(resultado.equipes[0].dias, 2)
 assert.equal(resultado.meses[0].dias, 2)
 const picos = simultaneidadeMensal(d.atividades, 2026, ['2026-04-21'])
 assert.equal(picos.get('e1')[3], 2)
 assert.equal(picos.get('e2')[3], 1)
})

test('projetos mensais por disciplina não duplicam projetos entre equipes ou intervalos', () => {
 const d = dadosExemplo()
 d.equipes[1].disciplinaId = 'd1'
 d.atividades = [atividade('a', '2026-04-20', '2026-04-20'), atividade('b', '2026-04-20', '2026-04-22', 'e2'), {...atividade('c', '2026-04-27', '2026-05-04'), escolaId: 'p2'}, atividade('d', '2026-04-21', '2026-04-21')]
 const mensal = projetosMensaisPorDisciplina(d.atividades, d.equipes, 2026, ['2026-04-21'])
 assert.equal(mensal.get('d1')[3], 2)
 assert.equal(mensal.get('d1')[4], 1)
 assert.equal(mensal.get('d1')[2], 0)
 const soFeriado = projetosMensaisPorDisciplina([atividade('x', '2026-04-21', '2026-04-21')], d.equipes, 2026, ['2026-04-21'])
 assert.equal(soFeriado.size, 0)
})

test('janela global inclui pausas úteis e disciplina une dias de equipes simultâneas', () => {
 const d = dadosExemplo()
 d.equipes[1].disciplinaId = 'd1'
 d.atividades = [atividade('a','2026-04-17','2026-04-20'), atividade('b','2026-04-20','2026-04-22','e2'), atividade('c','2026-04-27','2026-04-27')]
 const feriados = ['2026-04-21']
 assert.deepEqual(janelaGlobalAtividades(d.atividades, feriados), { inicio:'2026-04-17', fim:'2026-04-27', dias:6 })
 const a = analisarAtividades(d, filtros, periodo, feriados)
 assert.equal(a.disciplinas[0].dias, 4)
 assert.equal(analisarAtividades(d, filtros, { inicio:'2026-04-20', fim:'2026-04-22' }, feriados).disciplinas[0].dias, 2)
 assert.equal(janelaGlobalAtividades([], feriados).dias, 0)
})
