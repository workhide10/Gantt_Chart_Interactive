import { useMemo } from 'react'
import type { Atividade, Dados } from '../types'
import { feriados } from '../data/inicial'
import { diasUteis } from '../lib/datas'
import { contarSobreposicoes } from '../lib/gantt'

interface Props {
  dados: Dados
  atividades: Atividade[] // já filtradas
  periodo: { inicio: string; fim: string }
}

export function Resumo({ dados, atividades, periodo }: Props) {
  const analise = useMemo(() => {
    const delimitadas = atividades.map((a) => ({
      ...a,
      inicio: periodo.inicio && a.inicio < periodo.inicio ? periodo.inicio : a.inicio,
      fim: periodo.fim && a.fim > periodo.fim ? periodo.fim : a.fim,
    }))
    const atividadesPorEquipe = new Map<string, typeof delimitadas>()
    for (const atividade of delimitadas) {
      const lista = atividadesPorEquipe.get(atividade.equipeId) ?? []
      lista.push(atividade)
      atividadesPorEquipe.set(atividade.equipeId, lista)
    }
    const porEquipe = dados.equipes.map((e) => {
      const lista = atividadesPorEquipe.get(e.id) ?? []
      const dias = lista.reduce((soma, a) => soma + diasUteis(a.inicio, a.fim, feriados), 0)
      const conflitos = contarSobreposicoes(lista)
      return { equipe: e, atividades: lista.length, dias, conflitos }
    })
    const maior = Math.max(1, ...porEquipe.map((x) => x.dias))
    return {
      porEquipe: porEquipe.filter((x) => x.atividades > 0).sort((a, b) => b.dias - a.dias),
      maior,
      conflitos: porEquipe.reduce((s, x) => s + x.conflitos, 0),
      escolas: new Set(atividades.map((a) => a.escolaId)).size,
    }
  }, [dados.equipes, atividades, periodo.inicio, periodo.fim])

  return (
    <section className="resumo">
      <div className="cartoes">
        <div className="cartao"><b>{atividades.length}</b><span>atividades</span></div>
        <div className="cartao"><b>{analise.escolas}</b><span>escolas</span></div>
        <div className="cartao"><b>{analise.porEquipe.length}</b><span>equipes alocadas</span></div>
        <div className={'cartao' + (analise.conflitos ? ' alerta' : '')}><b>{analise.conflitos}</b><span>sobreposições na mesma equipe</span></div>
      </div>

      <h3>Carga por equipe (dias úteis alocados no intervalo)</h3>
      <div className="carga">
        {analise.porEquipe.map(({ equipe, dias, conflitos }) => (
          <div key={equipe.id} className="carga-linha">
            <span className="nome">{equipe.nome}</span>
            <div className="trilho"><div className="preench" style={{ width: `${(dias / analise.maior) * 100}%` }} /></div>
            <span className="num">{dias}{conflitos > 0 && <em title="Há atividades sobrepostas"> ⚠</em>}</span>
          </div>
        ))}
      </div>
      <p className="dica">Dias úteis = segunda a sexta, descontando os feriados da planilha. Atividades sobrepostas na mesma equipe contam em dobro.</p>
    </section>
  )
}
