import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { dataISOValida, diasUteis, difDias, segundaDe, somarDias } from '../src/lib/datas.ts'
import { empacotar, contarSobreposicoes } from '../src/lib/gantt.ts'
import { filtrarAtividades } from '../src/lib/filtrar.ts'
import { integrantesNaAtividade } from '../src/lib/composicao.ts'

const atividade = (id, inicio, fim, equipeId = 'e1', escolaId = 'p1') =>
  ({ id, inicio, fim, equipeId, escolaId, descricao: '' })

test('datas inválidas, vazias e dias inexistentes são rejeitados', () => {
  for (const valor of ['', null, {}, '2026-2-01', '2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01']) {
    assert.equal(dataISOValida(valor), false, String(valor))
  }
  assert.equal(dataISOValida('2024-02-29'), true)
  assert.equal(dataISOValida('2026-11-09'), true)
})

test('Hoje usa a data civil de São Paulo quando o UTC já mudou de dia', () => {
  const script = "import {hojeISO} from './src/lib/datas.ts'; process.stdout.write(hojeISO(new Date('2026-11-10T01:30:00Z')))"
  const resultado = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: new URL('..', import.meta.url), env: { ...process.env, TZ: 'America/Sao_Paulo' }, encoding: 'utf8',
  })
  assert.equal(resultado, '2026-11-09')
})

test('aritmética de datas atravessa mês, ano bissexto e ano civil', () => {
  assert.equal(somarDias('2024-02-28', 1), '2024-02-29')
  assert.equal(somarDias('2026-01-01', -1), '2025-12-31')
  assert.equal(difDias('2026-12-31', '2027-01-02'), 2)
  assert.equal(segundaDe('2026-11-08'), '2026-11-02')
})

test('dias úteis incluem extremidades e descontam feriados uma única vez', () => {
  assert.equal(diasUteis('2026-11-06', '2026-11-09', []), 2)
  assert.equal(diasUteis('2026-11-06', '2026-11-09', ['2026-11-09', '2026-11-09', '2026-11-07']), 1)
  assert.equal(diasUteis('2026-11-07', '2026-11-08', []), 0)
  assert.equal(diasUteis('2026-11-09', '2026-11-06', []), 0)
})

test('atividades que compartilham o último dia continuam em conflito', () => {
  const itens = [atividade('a', '2026-11-01', '2026-11-03'), atividade('b', '2026-11-03', '2026-11-04')]
  const resultado = empacotar(itens)
  assert.equal(resultado.faixas, 2)
  assert.ok(resultado.itens.every((i) => i.conflito))
  assert.equal(contarSobreposicoes(itens), 1)
})

test('atividade no dia seguinte reutiliza a faixa sem criar conflito', () => {
  const itens = [atividade('a', '2026-11-01', '2026-11-03'), atividade('b', '2026-11-04', '2026-11-04')]
  assert.equal(empacotar(itens).faixas, 1)
  assert.equal(contarSobreposicoes(itens), 0)
})

test('filtros combinam projeto, disciplina e equipe sem alterar a fonte', () => {
  const dados = { equipes: [{ id: 'e1', disciplinaId: 'd1' }, { id: 'e2', disciplinaId: 'd2' }],
    atividades: [atividade('a', '2026-11-01', '2026-11-03'), atividade('b', '2026-11-01', '2026-11-03', 'e2')] }
  assert.deepEqual(filtrarAtividades(dados, { escolaId: 'p1', disciplinaId: 'd1', equipeId: '' }).map((a) => a.id), ['a'])
  assert.deepEqual(filtrarAtividades(dados, { escolaId: '', disciplinaId: 'd1', equipeId: 'e2' }), [])
  assert.equal(dados.atividades.length, 2)
})

test('mudança de composição dentro da atividade preserva os dois períodos', () => {
  const dados = {
    pessoas: [{ id: 'a', nome: 'Ana' }, { id: 'b', nome: 'Bruno' }],
    composicoesEquipe: [{ id: 'c1', equipeId: 'e1', inicio: '2026-11-01', fim: '2026-11-03' },
      { id: 'c2', equipeId: 'e1', inicio: '2026-11-04', fim: null }],
    integrantesComposicao: [{ id: 'i1', composicaoId: 'c1', pessoaId: 'a' }, { id: 'i2', composicaoId: 'c2', pessoaId: 'b' }],
  }
  const resultado = integrantesNaAtividade(dados, atividade('t', '2026-11-02', '2026-11-05'))
  assert.deepEqual(resultado.map(({ pessoa, inicio, fim }) => [pessoa.nome, inicio, fim]), [
    ['Ana', '2026-11-02', '2026-11-03'], ['Bruno', '2026-11-04', '2026-11-05'],
  ])
})
