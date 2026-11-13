import type { Dados } from '../types'
import { dataISOValida } from './datas.ts'

// A validação também protege a leitura do armazenamento local e os backups antigos.
export function validarDados(valor: unknown): valor is Dados {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return false
  const fonte = valor as Record<string, unknown>
  const colecao = (chave: string, obrigatoria: boolean, validar: (item: Record<string, unknown>) => boolean) => {
    const itens = fonte[chave]
    if (itens === undefined) return !obrigatoria
    if (!Array.isArray(itens)) return false
    const ids = new Set<string>()
    return itens.every((item: unknown) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false
      const registro = item as Record<string, unknown>
      if (typeof registro.id !== 'string' || !registro.id.trim() || ids.has(registro.id)) return false
      ids.add(registro.id)
      return validar(registro)
    })
  }
  const texto = (v: unknown) => typeof v === 'string'
  const opcional = (v: unknown) => v === undefined || texto(v)
  const dataNula = (v: unknown) => v === null || dataISOValida(v)
  const origem = (v: unknown) => v === undefined || v === 'manual' || v === 'planilha'
  if (!colecao('escolas', true, (p) => texto(p.codigo) && texto(p.nome) && typeof p.cor === 'string' && /^#[\da-f]{6}$/i.test(p.cor)) ||
    !colecao('disciplinas', true, (d) => texto(d.sigla) && texto(d.nome)) ||
    !colecao('equipes', true, (e) => texto(e.nome) && texto(e.disciplinaId)) ||
    !colecao('pessoas', true, (p) => texto(p.nome) && texto(p.funcao) && (p.equipeId == null || texto(p.equipeId))) ||
    !colecao('atividades', true, (a) => texto(a.escolaId) && texto(a.equipeId) && opcional(a.titulo) && texto(a.descricao) && dataISOValida(a.inicio) && dataISOValida(a.fim) && a.inicio <= a.fim) ||
    !colecao('marcos', false, (m) => texto(m.escolaId) && texto(m.titulo) && texto(m.observacao) && dataISOValida(m.data) && (m.simbolo === undefined || m.simbolo === 'losango' || m.simbolo === 'circulo')) ||
    !colecao('vinculosEquipe', false, (v) => texto(v.pessoaId) && texto(v.equipeId) && (v.projetoId == null || texto(v.projetoId)) && dataNula(v.inicio) && dataNula(v.fim) && (!v.inicio || !v.fim || String(v.inicio) <= String(v.fim)) && (origem(v.origem) || v.origem === 'legado')) ||
    !colecao('composicoesEquipe', false, (c) => texto(c.equipeId) && dataISOValida(c.inicio) && dataNula(c.fim) && (!c.fim || c.inicio <= String(c.fim)) && origem(c.origem)) ||
    !colecao('integrantesComposicao', false, (i) => texto(i.composicaoId) && texto(i.pessoaId)) ||
    !colecao('eventosEquipe', false, (e) => texto(e.disciplinaId) && dataISOValida(e.data) && (e.simbolo === undefined || e.simbolo === 'setas' || e.simbolo === 'marcador') && (e.equipeAdicaoId === undefined || texto(e.equipeAdicaoId)) && (e.pessoasAdicionadas === undefined || (Array.isArray(e.pessoasAdicionadas) && e.pessoasAdicionadas.every(texto))) && ((e.equipeAdicaoId === undefined) === (e.pessoasAdicionadas === undefined))) ||
    !colecao('movimentacoesEquipe', false, (m) => texto(m.eventoId) && texto(m.pessoaId) && texto(m.equipeOrigemId) && (m.equipeDestinoId === null || texto(m.equipeDestinoId)) && opcional(m.motivo)) ||
    (fonte.fontesImportadas !== undefined && (!Array.isArray(fonte.fontesImportadas) || !fonte.fontesImportadas.every(texto)))) return false

  const dados = valor as Dados
  const projetos = new Set(dados.escolas.map((p) => p.id))
  const disciplinas = new Set(dados.disciplinas.map((d) => d.id))
  const equipes = new Set(dados.equipes.map((e) => e.id))
  const pessoas = new Set(dados.pessoas.map((p) => p.id))
  const composicoes = new Set((dados.composicoesEquipe ?? []).map((c) => c.id))
  const eventos = new Set((dados.eventosEquipe ?? []).map((e) => e.id))
  return dados.equipes.every((e) => disciplinas.has(e.disciplinaId)) &&
    dados.atividades.every((a) => projetos.has(a.escolaId) && equipes.has(a.equipeId)) &&
    (dados.marcos ?? []).every((m) => projetos.has(m.escolaId)) &&
    (dados.composicoesEquipe ?? []).every((c) => equipes.has(c.equipeId)) &&
    (dados.integrantesComposicao ?? []).every((i) => composicoes.has(i.composicaoId) && pessoas.has(i.pessoaId)) &&
    (dados.eventosEquipe ?? []).every((e) => disciplinas.has(e.disciplinaId) && (!e.equipeAdicaoId || (equipes.has(e.equipeAdicaoId) && dados.equipes.some((q) => q.id === e.equipeAdicaoId && q.disciplinaId === e.disciplinaId))) && (!e.pessoasAdicionadas || e.pessoasAdicionadas.every((id) => pessoas.has(id)))) &&
    (dados.movimentacoesEquipe ?? []).every((m) => eventos.has(m.eventoId) && pessoas.has(m.pessoaId) && equipes.has(m.equipeOrigemId) && (m.equipeDestinoId === null || equipes.has(m.equipeDestinoId)))
}

