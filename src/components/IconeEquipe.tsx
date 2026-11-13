export function IconeEquipe({ tipo }: { tipo: 'setas' | 'marcador' | 'antigo' }) {
  if (tipo === 'antigo') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="currentColor" /></svg>
  return tipo === 'setas' ? <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 3 1 8l6 5V9h7a5 5 0 0 1 4.7 3.3A7 7 0 0 0 14 5H7V3Zm10 18 6-5-6-5v4h-7a5 5 0 0 1-4.7-3.3A7 7 0 0 0 10 19h7v2Z" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1a8 8 0 0 0-8 8c0 4.6 5.1 10.8 7.3 13.4a.9.9 0 0 0 1.4 0C14.9 19.8 20 13.6 20 9a8 8 0 0 0-8-8Z" /></svg>
}
