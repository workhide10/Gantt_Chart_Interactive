import { useEffect, useRef, useState } from 'react'

const tema = ['#ffffff','#000000','#e7e6e6','#44546a','#4472c4','#ed7d31','#70ad47','#5b9bd5','#a5369b','#92d050']
const tonalidades = [
  '#f2f2f2','#7f7f7f','#d0cece','#d6dce4','#d9e2f3','#fce4d6','#e2f0d9','#ddebf7','#eed9eb','#e2f0d9',
  '#d9d9d9','#595959','#aeaaaa','#adb9ca','#b4c6e7','#f8cbad','#c6e0b4','#bdd7ee','#d8aeda','#c6e0b4',
  '#bfbfbf','#404040','#757171','#8497b0','#8ea9db','#f4b183','#a9d18e','#9dc3e6','#c883c1','#a9d18e',
  '#a6a6a6','#262626','#3b3838','#323f4f','#2f5597','#c55a11','#548235','#2e75b6','#7b2673','#548235',
  '#7f7f7f','#0d0d0d','#171616','#222a35','#1f3864','#833c0c','#385723','#1f4e79','#52194c','#385723',
]
const padrao = ['#c00000','#ff0000','#ffc000','#ffff00','#92d050','#00b050','#00b0f0','#0070c0','#002060','#7030a0']

export function SeletorCor({ valor, onChange }: { valor: string; onChange: (cor: string) => void }) {
  const [aberto, setAberto] = useState(false)
  const [personalizada, setPersonalizada] = useState(valor)
  const dialogo = useRef<HTMLDialogElement>(null)
  const botao = useRef<HTMLButtonElement>(null)
  useEffect(() => { if (!aberto) return; const atual = dialogo.current; atual?.showModal(); return () => { if (atual?.open) atual.close() } }, [aberto])
  const fechar = () => { setAberto(false); requestAnimationFrame(() => botao.current?.focus()) }
  const escolher = (cor: string) => { onChange(cor); fechar() }
  const grade = (cores: string[], nome: string) => <div className="paleta-grade" role="group" aria-label={nome}>{cores.map((cor, i) => <button type="button" key={`${cor}-${i}`} className="paleta-amostra" style={{ backgroundColor: cor }} aria-label={`Selecionar cor ${cor}`} aria-pressed={valor.toLowerCase() === cor} title={cor} onClick={() => escolher(cor)} />)}</div>
  return <span className="seletor-cor"><button ref={botao} type="button" className="seletor-cor-botao" onClick={() => { setPersonalizada(valor); setAberto(true) }} aria-label={`Escolher cor do projeto. Cor atual ${valor}`}><span className="seletor-cor-amostra" style={{ backgroundColor: valor }} /> <span>{valor.toUpperCase()}</span> <span aria-hidden="true">▾</span></button>
    {aberto && <dialog ref={dialogo} className="paleta-dialogo" aria-labelledby="paleta-titulo" onCancel={(e) => { e.preventDefault(); fechar() }} onClick={(e) => { if (e.target === e.currentTarget) fechar() }}><div className="paleta-painel">
      <div className="paleta-cabecalho"><strong id="paleta-titulo">Escolher cor</strong><button type="button" onClick={fechar} aria-label="Fechar paleta">×</button></div>
      <h3>Cores do tema</h3>{grade(tema, 'Cores do tema')}{grade(tonalidades, 'Tonalidades do tema')}
      <h3>Cores padrão</h3>{grade(padrao, 'Cores padrão')}
      <div className="paleta-personalizada"><label>Cor personalizada <input value={personalizada} onChange={(e) => setPersonalizada(e.target.value)} placeholder="#RRGGBB" maxLength={7} aria-label="Cor personalizada em hexadecimal" /></label><button type="button" disabled={!/^#[0-9a-f]{6}$/i.test(personalizada)} onClick={() => escolher(personalizada)}>Aplicar</button></div>
    </div></dialog>}
  </span>
}
