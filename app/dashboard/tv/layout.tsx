/**
 * Layout do Modo TV — ocupa tela cheia, sem Sidebar nem Topbar.
 *
 * O layout pai (app/dashboard/layout.tsx) renderiza Sidebar + Topbar
 * + main com padding. Aqui, sobrescrevemos pro modo TV usar 100vw/100vh
 * direto, ideal pra exibição em monitor/TV.
 */
export default function ModoTVLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#080f0d' }}>
      {children}
    </div>
  )
}
