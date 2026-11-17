import { useEffect, useRef } from 'react'

export function ConfirmacaoRegistro({ resumo, onCancelar, onConfirmar }: { resumo: string; onCancelar: () => void; onConfirmar: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const atual = dialogo.current
    atual?.showModal()
    return () => { if (atual?.open) atual.close() }
  }, [])
  return <dialog ref={dialogo} className="confirmacao-registro" aria-labelledby="confirmacao-registro-titulo" onKeyDown={(e) => { if (e.key === 'Escape') e.stopPropagation() }} onCancel={(e) => { e.preventDefault(); e.stopPropagation(); onCancelar() }}>
    <div className="confirmacao-registro-conteudo">
      <h2 id="confirmacao-registro-titulo">Confira o registro</h2>
      <p className="confirmacao-registro-resumo">{resumo}</p>
      <div className="acoes"><button type="button" autoFocus onClick={onCancelar}>Cancelar</button><button type="button" className="primario" onClick={onConfirmar}>Confirmar registro</button></div>
    </div>
  </dialog>
}
