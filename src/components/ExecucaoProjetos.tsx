import { useMemo } from 'react'
import type { Dados } from '../types'
import { difDias, formatarBR, somarDias } from '../lib/datas'

interface Props { dados: Dados; escolaId: string }
interface Periodo { inicio: string; fim: string }
interface Pausa extends Periodo { dias: number }

export function ExecucaoProjetos({ dados, escolaId }: Props) {
  const projetos = useMemo(() => {
    const ids = [...new Set(dados.atividades.map((a) => a.escolaId))]
      .filter((id) => !escolaId || id === escolaId)
    return ids.map((id) => {
      const escola = dados.escolas.find((e) => e.id === id)
      const atividades = dados.atividades.filter((a) => a.escolaId === id).sort((a, b) => a.inicio.localeCompare(b.inicio) || a.fim.localeCompare(b.fim))
      if (!atividades.length) return null

      const periodos: Periodo[] = []
      const pausas: Pausa[] = []
      let atual: Periodo = { inicio: atividades[0].inicio, fim: atividades[0].fim }
      for (const atividade of atividades.slice(1)) {
        if (atividade.inicio <= atual.fim) {
          if (atividade.fim > atual.fim) atual = { ...atual, fim: atividade.fim }
          continue
        }
        const inicioPausa = somarDias(atual.fim, 1)
        const fimPausa = somarDias(atividade.inicio, -1)
        const diasPausa = difDias(inicioPausa, fimPausa) + 1
        if (diasPausa > 0) {
          periodos.push(atual)
          pausas.push({ inicio: inicioPausa, fim: fimPausa, dias: diasPausa })
          atual = { inicio: atividade.inicio, fim: atividade.fim }
        } else {
          // Intervalos sobrepostos ou adjacentes formam um trecho contínuo de execução.
          atual = { inicio: atual.inicio, fim: atividade.fim > atual.fim ? atividade.fim : atual.fim }
        }
      }
      periodos.push(atual)

      const inicio = periodos[0].inicio
      const fim = periodos[periodos.length - 1].fim
      const diasAtivos = periodos.reduce((total, periodo) => total + difDias(periodo.inicio, periodo.fim) + 1, 0)
      const diasJanela = difDias(inicio, fim) + 1
      return {
        id,
        codigo: escola?.codigo ?? 'Projeto removido',
        nome: escola?.nome ?? '',
        cor: escola?.cor ?? '#94a3b8',
        inicio,
        fim,
        diasAtivos,
        diasJanela,
        diasPausados: Math.max(0, diasJanela - diasAtivos),
        periodos,
        pausas,
      }
    }).filter((projeto): projeto is NonNullable<typeof projeto> => Boolean(projeto))
      .sort((a, b) => b.diasAtivos - a.diasAtivos || a.codigo.localeCompare(b.codigo, 'pt-BR'))
  }, [dados.atividades, dados.escolas, escolaId])

  return <section className="execucao-projetos">
    <div className="analises-cabecalho">
      <h2>Tempo de execução dos projetos</h2>
      <p>Considera todas as disciplinas e calcula a união dos intervalos das barras. Cada data coberta por pelo menos uma atividade conta uma vez, mesmo com atividades simultâneas; datas entre intervalos sem atividade são pausas.</p>
    </div>
    <div className="execucao-legenda"><span><b>Dias de execução</b>: datas da união dos intervalos das atividades</span><span><b>Janela</b>: dias corridos da primeira à última atividade, incluindo pausas</span><span>Fins de semana e feriados contam quando estão dentro de um intervalo de atividade ou de pausa</span></div>
    <div className="tabela-rolagem">
      <table className="tabela-execucao">
        <thead><tr><th>Projeto</th><th>Primeira atividade</th><th>Última atividade</th><th>Dias de execução</th><th>Janela total</th><th>Pausas</th><th>Intervalos sem atividade</th></tr></thead>
        <tbody>{projetos.map((projeto) => <tr key={projeto.id}>
          <td><i className="bolinha" style={{ background: projeto.cor }} />{projeto.codigo}{projeto.nome && projeto.nome !== projeto.codigo ? ` · ${projeto.nome}` : ''}</td>
          <td>{formatarBR(projeto.inicio)}</td><td>{formatarBR(projeto.fim)}</td>
          <td><strong>{projeto.diasAtivos}</strong> dias corridos</td>
          <td>{projeto.diasJanela} dias corridos</td>
          <td>{projeto.diasPausados} dias corridos</td>
          <td>{projeto.pausas.length ? <ul className="execucao-pausas">{projeto.pausas.map((pausa, i) => <li key={`${pausa.inicio}-${i}`}>{formatarBR(pausa.inicio)} a {formatarBR(pausa.fim)} · {pausa.dias} dias</li>)}</ul> : <span className="texto-suave">Sem pausa registrada</span>}</td>
        </tr>)}</tbody>
      </table>
      {projetos.length === 0 && <p className="vazio">Nenhum projeto com atividades concluídas para exibir.</p>}
    </div>
  </section>
}
