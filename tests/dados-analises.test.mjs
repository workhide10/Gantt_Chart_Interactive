import test from 'node:test'
import assert from 'node:assert/strict'
import { analisarAtividades, analisarExecucao, analisarExecucaoProjetos, simultaneidadeMensal, projetosMensaisPorDisciplina, janelaGlobalAtividades, janelaReferencia } from '../src/lib/analises.ts'
import { diasCorridosEntreMarcos, somarDias } from '../src/lib/datas.ts'
import { validarDados } from '../src/lib/validacao.ts'
import { lerBackup } from '../src/lib/backups.ts'
import { migrarDados } from '../src/lib/migracoes.ts'
import { ajustarPeriodoAtividade, motivoBloqueioExclusao, registrarAtividade } from '../src/lib/registros.ts'
import { registrarComposicao, registrarMovimentacao, adicionarIntegrantes } from '../src/lib/equipes.ts'

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

test('dashboard une dias corridos e mantém sobreposições por equipe', () => {
  const dados = dadosExemplo(), copia = structuredClone(dados)
  const a = analisarAtividades(dados, filtros, periodo, [])
  assert.equal(a.dias, 9)
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
  assert.equal(a.mediana, 4) // A duração integral não é encurtada pelo recorte.
})

test('série mensal distribui dias corridos entre meses sem duplicar conclusões', () => {
  const dados = dadosExemplo()
  dados.atividades = [atividade('longa', '2026-01-30', '2026-02-03')]
  const a = analisarAtividades(dados, filtros, periodo, [])
  assert.deepEqual(a.meses.map((m) => [m.dias, m.conclusoes]), [[2, 0], [3, 1]])
  assert.equal(a.dias, 5)
})

test('período invertido, filtros sem resultados e finais de semana não produzem NaN', () => {
  const dados = dadosExemplo()
  assert.equal(analisarAtividades(dados, filtros, { inicio: '2026-02-01', fim: '2026-01-01' }, []).periodoInvalido, true)
  const vazio = analisarAtividades(dados, { ...filtros, escolaId: 'p2' }, periodo, [])
  assert.equal(vazio.mediana, null)
  assert.equal(vazio.dias, 0)
  assert.deepEqual(vazio.meses, [])
  dados.atividades = [atividade('fimsemana', '2026-01-03', '2026-01-04')]
  assert.equal(analisarAtividades(dados, filtros, periodo, []).mediana, 2)
})

test('execução usa a união dos intervalos e distingue dias ativos de pausas', () => {
  const dados = dadosExemplo(), copia = structuredClone(dados)
  const a = analisarExecucao(dados.atividades)
  assert.equal(a.diasAtivos, 9)
  assert.equal(a.diasJanela, 13)
  assert.equal(a.diasPausados, 4)
  assert.deepEqual(a.pausas, [{ inicio: '2026-01-08', fim: '2026-01-11', dias: 4 }])
  assert.equal(analisarExecucaoProjetos(dados, 'p1')[0].diasAtivos, 9)
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

 test('execução e marcos incluem finais de semana e feriados', () => {
  const feriados = ['2026-04-21']
  const a = analisarExecucao([atividade('a', '2026-04-17', '2026-04-17'), atividade('b', '2026-04-22', '2026-04-22')], feriados)
  assert.equal(a.diasAtivos, 2)
  assert.equal(a.diasJanela, 6)
  assert.equal(a.diasPausados, 4)
  assert.equal(a.pausas[0].dias, 4)
  assert.equal(diasCorridosEntreMarcos('2026-04-17', '2026-04-22'), 5)
  assert.equal(diasCorridosEntreMarcos('2026-04-17', '2026-04-17'), 0)
  assert.equal(analisarExecucao([atividade('a', '2026-04-17', '2026-04-17'), atividade('b', '2026-04-20', '2026-04-20')]).pausas[0].dias, 2)
})

test('sobreposição em fim de semana ou feriado entra na análise', () => {
  const d = dadosExemplo()
  d.atividades = [atividade('a', '2026-04-17', '2026-04-19'), atividade('b', '2026-04-18', '2026-04-21')]
  assert.equal(analisarAtividades(d, filtros, periodo, ['2026-04-21']).conflitos, 1)
  d.atividades[0].fim = '2026-04-20'
  assert.equal(analisarAtividades(d, filtros, periodo, ['2026-04-21']).conflitos, 1)
})

test('união evita duplicação entre equipes e simultaneidade conta projetos distintos', () => {
 const d = dadosExemplo()
 d.equipes[1].disciplinaId = 'd1'
 d.atividades = [atividade('a', '2026-04-20', '2026-04-22'), {...atividade('b', '2026-04-20', '2026-04-22'), escolaId:'p2'}, atividade('c', '2026-04-20', '2026-04-22', 'e2'), {...atividade('d', '2026-04-20', '2026-04-22'), escolaId:'p2'}]
 const resultado = analisarAtividades(d, filtros, periodo, ['2026-04-21'])
 assert.equal(resultado.dias, 3)
 assert.equal(resultado.disciplinas[0].dias, 3)
 assert.equal(resultado.equipes[0].dias, 3)
 assert.equal(resultado.meses[0].dias, 3)
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
 assert.equal(soFeriado.get('d1')[3], 1)
})

test('janela global inclui pausas corridas e disciplina une dias de equipes simultâneas', () => {
 const d = dadosExemplo()
 d.equipes[1].disciplinaId = 'd1'
 d.atividades = [atividade('a','2026-04-17','2026-04-20'), atividade('b','2026-04-20','2026-04-22','e2'), atividade('c','2026-04-27','2026-04-27')]
 const feriados = ['2026-04-21']
 assert.deepEqual(janelaGlobalAtividades(d.atividades, feriados), { inicio:'2026-04-17', fim:'2026-04-27', dias:11 })
 const a = analisarAtividades(d, filtros, periodo, feriados)
 assert.equal(a.disciplinas[0].dias, 7)
 assert.equal(analisarAtividades(d, filtros, { inicio:'2026-04-20', fim:'2026-04-22' }, feriados).disciplinas[0].dias, 3)
 assert.equal(janelaGlobalAtividades([], feriados).dias, 0)
})

test('adicionar integrante preserva formação e impede transferência silenciosa', () => {
 const d = dadosExemplo()
 d.pessoas.push({ id:'pes2', nome:'Bia', funcao:'' }, { id:'pes3', nome:'Cris', funcao:'' })
 d.composicoesEquipe = [{ id:'c1', equipeId:'e1', inicio:'2026-01-01', fim:null }, { id:'c2', equipeId:'e2', inicio:'2026-01-01', fim:null }]
 d.integrantesComposicao = [{ id:'i1', composicaoId:'c1', pessoaId:'pes1' }, { id:'i2', composicaoId:'c2', pessoaId:'pes3' }]
 let n=0; const novoId=() => `novo-${++n}`
 const atualizado=adicionarIntegrantes(d, 'e1', '2026-01-05', ['pes2'], novoId)
 const nova=atualizado.composicoesEquipe.find((c) => c.equipeId === 'e1' && c.inicio === '2026-01-05')
 assert.equal(atualizado.composicoesEquipe.find((c) => c.id === 'c1').fim, '2026-01-04')
 assert.deepEqual(atualizado.integrantesComposicao.filter((i) => i.composicaoId === nova.id).map((i) => i.pessoaId).sort(), ['pes1','pes2'])
 assert.throws(() => adicionarIntegrantes(d, 'e1', '2026-01-05', ['pes3'], novoId), /Transferir/)
 assert.throws(() => adicionarIntegrantes(d, 'e1', '2026-01-05', ['pes1'], novoId), /já pertencem/)
 const mesmoDia=adicionarIntegrantes(d, 'e1', '2026-01-01', ['pes2'], novoId)
 assert.equal(mesmoDia.composicoesEquipe.filter((c) => c.equipeId === 'e1').length, 1)
 assert.equal(mesmoDia.integrantesComposicao.filter((i) => i.composicaoId === 'c1').length, 2)
})

test('adição, saída e transferência registram símbolos correspondentes', () => {
 const d=dadosExemplo(); d.equipes[1].disciplinaId='d1'
 d.composicoesEquipe=[{id:'c',equipeId:'e1',inicio:'2026-01-01',fim:null}]
 d.integrantesComposicao=[{id:'i',composicaoId:'c',pessoaId:'pes1'}]
 d.pessoas.push({id:'pes2',nome:'Bia',funcao:''})
 let n=0; const id=()=>`novo-${++n}`
 const adicao=adicionarIntegrantes(d,'e1','2026-01-02',['pes2'],id)
 assert.equal(adicao.eventosEquipe[0].simbolo,'marcador')
 assert.deepEqual(adicao.eventosEquipe[0].pessoasAdicionadas,['pes2'])
 assert.equal(validarDados(adicao),true)
 const ev={id:'ev',disciplinaId:'d1',data:'2026-01-03',simbolo:'setas'}
 const saida=registrarMovimentacao(d,ev,[{id:'m',eventoId:'ev',pessoaId:'pes1',equipeOrigemId:'e1',equipeDestinoId:null,motivo:'Férias'}],[{equipeId:'e1',pessoaIds:[]}],id)
 assert.equal(saida.eventosEquipe[0].simbolo,'marcador')
 const troca=registrarMovimentacao(d,{...ev,simbolo:'marcador'},[{id:'m',eventoId:'ev',pessoaId:'pes1',equipeOrigemId:'e1',equipeDestinoId:'e2'}],[{equipeId:'e1',pessoaIds:[]},{equipeId:'e2',pessoaIds:['pes1']}],id)
 assert.equal(troca.eventosEquipe[0].simbolo,'setas')
})

test('janela de referência usa histórico completo do projeto selecionado', () => {
 const dados = dadosExemplo()
 dados.atividades.push({ ...atividade('outro', '2025-12-01', '2026-02-01'), escolaId: 'p2' })
 assert.deepEqual(janelaReferencia(dados, 'p1'), { inicio: '2026-01-01', fim: '2026-01-13', dias: 13 })
 assert.deepEqual(janelaReferencia(dados, ''), { inicio: '2025-12-01', fim: '2026-02-01', dias: 63 })
 assert.deepEqual(janelaReferencia(dados, 'ausente'), { inicio: '', fim: '', dias: 0 })
})

test('backup aceita marco genérico e mantém compatibilidade com marcos antigos', () => {
 const dados = dadosExemplo()
 dados.marcos = [{ id:'m1', escolaId:'p1', data:'2026-01-08', titulo:'Aguardando', observacao:'Aguardando aprovação', simbolo:'generico' }, { id:'m2', escolaId:'p1', data:'2026-01-10', titulo:'Entrega', observacao:'' }]
 assert.equal(validarDados(dados), true)
 assert.equal(lerBackup(JSON.stringify(dados)).marcos[0].simbolo, 'generico')
 dados.marcos[0].simbolo = 'desconhecido'
 assert.equal(validarDados(dados), false)
})

test('cálculo otimizado conserva união e sobreposições em intervalos variados', () => {
 let estado = 1257
 const aleatorio = (max) => { estado = (estado * 1664525 + 1013904223) >>> 0; return estado % max }
 for (let amostra = 0; amostra < 60; amostra++) {
   const dados = dadosExemplo()
   dados.atividades = Array.from({ length: 25 }, (_, i) => {
     const inicio = somarDias('2026-01-01', aleatorio(55))
     return atividade(String(i), inicio, somarDias(inicio, aleatorio(10)), i % 2 ? 'e1' : 'e2')
   })
   const recorte = { inicio: '2026-01-15', fim: '2026-02-20' }
   const a = analisarAtividades(dados, filtros, recorte)
   const diasPorMes = new Map(), diasPorEquipe = new Map()
   const recortadas = dados.atividades.filter((x) => x.inicio <= recorte.fim && x.fim >= recorte.inicio).map((x) => ({...x, inicio: x.inicio < recorte.inicio ? recorte.inicio : x.inicio, fim: x.fim > recorte.fim ? recorte.fim : x.fim}))
   for (const x of recortadas) for (let dia = x.inicio; dia <= x.fim; dia = somarDias(dia, 1)) {
     const mes = dia.slice(0, 7)
     if (!diasPorMes.has(mes)) diasPorMes.set(mes, new Set())
     diasPorMes.get(mes).add(dia)
     if (!diasPorEquipe.has(x.equipeId)) diasPorEquipe.set(x.equipeId, new Set())
     diasPorEquipe.get(x.equipeId).add(dia)
   }
   for (const mes of a.meses) assert.equal(mes.dias, diasPorMes.get(mes.mes.slice(0, 7))?.size ?? 0)
   for (const equipe of a.equipes) {
     assert.equal(equipe.dias, diasPorEquipe.get(equipe.id).size)
     const lista = recortadas.filter((x) => x.equipeId === equipe.id)
     let pares = 0
     for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) if (lista[i].inicio <= lista[j].fim && lista[j].inicio <= lista[i].fim) pares++
     assert.equal(equipe.conflitos, pares)
   }
 }
})

test('histórico de adição permanece legível após mudança de disciplina da equipe', () => {
 const dados = dadosExemplo()
 let n = 0
 const atual = adicionarIntegrantes(dados, 'e1', '2026-01-05', ['pes1'], () => `adicao-${++n}`)
 assert.equal(validarDados(atual), true)
 const alterado = { ...atual, equipes: atual.equipes.map((e) => e.id === 'e1' ? { ...e, disciplinaId: 'd2' } : e) }
 assert.equal(validarDados(alterado), true)
 assert.equal(lerBackup(JSON.stringify(alterado)).eventosEquipe[0].disciplinaId, 'd1')
})

test('projetos por mês respeitam passagem de ano e dias extremos', () => {
 const d = dadosExemplo()
 d.atividades = [atividade('a', '2025-12-31', '2026-01-01'), {...atividade('b', '2026-02-28', '2026-03-01'), escolaId:'p2'}, atividade('c', '2027-01-01', '2027-01-02')]
 const meses = projetosMensaisPorDisciplina(d.atividades, d.equipes, 2026).get('d1')
 assert.deepEqual(meses, [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0])
})
