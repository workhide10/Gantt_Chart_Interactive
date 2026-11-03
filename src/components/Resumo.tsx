import { useMemo } from 'react'
import type { Atividade, Dados } from '../types'
import { feriados } from '../data/inicial'
import { diasUteis, sobrepoe } from '../lib/datas'

interface Props {
  dados: Dados
  atividades: Atividade[] // já filtradas
}

export function Resumo({ dados, atividades }: Props) {
  const analise = useMemo(() => {
    const porEquipe = dados.equipes.map((e) => {
      const lista = atividades.filter((a) => a.equipeId === e.id)
      const dias = lista.reduce((soma, a) => soma + diasUteis(a.inicio, a.fim, feriados), 0)
      let conflitos = 0
      for (let i = 0; i < lista.length; i++)
        for (let j = i + 1; j < lista.length; j++) if (sobrepoe(lista[i], lista[j])) conflitos++
      return { equipe: e, atividades: lista.length, dias, conflitos }
    })
    const maior = Math.max(1, ...porEquipe.map((x) => x.dias))
    return {
      porEquipe: porEquipe.filter((x) => x.atividades > 0).sort((a, b) => b.dias - a.dias),
      maior,
      conflitos: porEquipe.reduce((s, x) => s + x.conflitos, 0),
      escolas: new Set(atividades.map((a) => a.escolaId)).size,
    }
  }, [dados.equipes, atividades])

  return (
    <section className="resumo">
      <div className="cartoes">
        <div className="cartao"><b>{atividades.length}</b><span>atividades</span></div>
        <div className="cartao"><b>{analise.escolas}</b><span>escolas</span></div>
        <div className="cartao"><b>{analise.porEquipe.length}</b><span>equipes alocadas</span></div>
        <div className={'cartao' + (analise.conflitos ? ' alerta' : '')}><b>{analise.conflitos}</b><span>sobreposições na mesma equipe</span></div>
      </div>

      <h3>Carga por equipe (dias úteis alocados)</h3>
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
