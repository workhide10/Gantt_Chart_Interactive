import type { Dados } from '../types'
import { formatarBR } from '../lib/datas'

interface Props {
  dados: Dados
  onChange: (dados: Dados) => void
}

export function PendenciasVinculos({ dados, onChange }: Props) {
  const pendencias = dados.vinculosEquipe ?? []
  const remover = (id: string) => {
    if (!confirm('Descartar este vínculo antigo sem dados suficientes para formar uma composição?')) return
    onChange({ ...dados, vinculosEquipe: pendencias.filter((v) => v.id !== id) })
  }

  return <section className="vinculos-equipe">
    <div className="vinculos-cabecalho"><div>
      <h3>Vínculos antigos pendentes</h3>
      <p>Registros sem projeto ou vigência completa não foram transformados em composição. Para registrar uma formação, use a área Equipes.</p>
    </div></div>
    <div className="tabela-rolagem">
      <table>
        <thead><tr><th>Pessoa</th><th>Equipe</th><th>Projeto</th><th>Início</th><th>Fim</th><th>Campos pendentes</th><th></th></tr></thead>
        <tbody>{pendencias.map((v) => {
          const ausentes = [!v.projetoId && 'projeto', !v.inicio && 'início da vigência', !v.pessoaId && 'pessoa', !v.equipeId && 'equipe'].filter(Boolean)
          return <tr key={v.id}>
            <td>{dados.pessoas.find((p) => p.id === v.pessoaId)?.nome ?? 'Não identificado'}</td>
            <td>{dados.equipes.find((e) => e.id === v.equipeId)?.nome ?? 'Não identificada'}</td>
            <td>{dados.escolas.find((p) => p.id === v.projetoId)?.codigo ?? 'Não informado'}</td>
            <td>{v.inicio ? formatarBR(v.inicio) : 'Não informado'}</td>
            <td>{v.fim ? formatarBR(v.fim) : 'Em aberto'}</td>
            <td>{ausentes.join(', ') || 'Revisar vínculo manualmente'}</td>
            <td><button className="perigo" onClick={() => remover(v.id)}>Descartar</button></td>
          </tr>
        })}</tbody>
      </table>
      {pendencias.length === 0 && <p className="vazio">Nenhuma pendência antiga. As composições estão registradas separadamente das atividades.</p>}
    </div>
  </section>
}
