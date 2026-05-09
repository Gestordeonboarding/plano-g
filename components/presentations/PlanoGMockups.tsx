/**
 * Mockups SVG do sistema Plano G usados nos slides de apresentação
 * para mostrar visualmente o que o consorciado / vendedor vai receber.
 *
 * Cada mockup recebe a cor de destaque (accent) que vem da paleta
 * da administradora selecionada para a apresentação.
 */

interface MockupProps {
  accent: string
  className?: string
}

/**
 * Wrapper de notebook com a tela do sistema dentro.
 */
function Laptop({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 800 520" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="laptop-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a1a1a" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      {/* Tela */}
      <rect x="60" y="20" width="680" height="420" rx="12" fill="url(#laptop-body)" />
      <rect x="74" y="34" width="652" height="392" rx="6" fill="#0D1F1E" />
      {/* Webcam */}
      <circle cx="400" cy="28" r="2" fill="#333" />
      {/* Conteúdo */}
      <foreignObject x="74" y="34" width="652" height="392">
        <div
          style={{ width: '100%', height: '100%', display: 'flex', overflow: 'hidden', borderRadius: 6 }}
        >
          {children as React.ReactElement}
        </div>
      </foreignObject>
      {/* Base */}
      <path d="M30 440 L770 440 L740 480 L60 480 Z" fill="#222" />
      <rect x="350" y="438" width="100" height="6" rx="3" fill="#0a0a0a" />
      <rect x="20" y="478" width="760" height="6" rx="3" fill="#1a1a1a" />
    </svg>
  )
}

/**
 * Wrapper de celular com a tela do sistema dentro.
 */
function Phone({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 320 640" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="phone-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#222" />
          <stop offset="1" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      {/* Corpo */}
      <rect x="10" y="10" width="300" height="620" rx="38" fill="url(#phone-body)" />
      {/* Tela */}
      <rect x="22" y="22" width="276" height="596" rx="28" fill="#0D1F1E" />
      {/* Notch */}
      <rect x="125" y="28" width="70" height="18" rx="9" fill="#0a0a0a" />
      {/* Conteúdo */}
      <foreignObject x="22" y="22" width="276" height="596">
        <div
          style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: 28 }}
        >
          {children as React.ReactElement}
        </div>
      </foreignObject>
    </svg>
  )
}

// ============================================================================
//  Dashboard do vendedor
// ============================================================================

function DashboardScreen({ accent }: { accent: string }) {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0D1F1E', display: 'flex', fontFamily: 'system-ui, sans-serif', color: '#fff', fontSize: 9 }}>
      {/* Sidebar */}
      <div style={{ width: 110, padding: 10, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          {/* Marca do mockup — quadrado decorativo (sem texto "Plano G") */}
          <div style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: accent }} />
          <div style={{ width: 32, height: 6, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.20)' }} />
        </div>
        {['Dashboard', 'Leads', 'Consorciados', 'Apresentações', 'Conversas', 'Relatórios'].map((label, i) => (
          <div key={label} style={{
            padding: '4px 6px', borderRadius: 4, fontSize: 8,
            backgroundColor: i === 0 ? `${accent}22` : 'transparent',
            color: i === 0 ? accent : 'rgba(255,255,255,0.7)',
          }}>{label}</div>
        ))}
      </div>
      {/* Main */}
      <div style={{ flex: 1, padding: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700 }}>Visão Geral</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <div style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: accent }} />
          </div>
        </div>
        {/* Cards KPI */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
          {[
            { label: 'Leads', value: '247' },
            { label: 'Conversão', value: '34%' },
            { label: 'Consorciados', value: '189' },
            { label: 'Faturamento', value: 'R$ 1.2M' },
          ].map((kpi) => (
            <div key={kpi.label} style={{ padding: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>{kpi.label}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: accent, marginTop: 2 }}>{kpi.value}</div>
            </div>
          ))}
        </div>
        {/* Chart */}
        <div style={{ padding: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)', height: 90, position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Vendas — últimos 6 meses</div>
          <svg viewBox="0 0 200 60" style={{ width: '100%', height: 60 }}>
            <path d="M0 50 L33 40 L66 35 L99 22 L132 18 L165 8 L200 4 L200 60 L0 60 Z" fill={`${accent}33`} />
            <path d="M0 50 L33 40 L66 35 L99 22 L132 18 L165 8 L200 4" fill="none" stroke={accent} strokeWidth="1.5" />
            {[0, 33, 66, 99, 132, 165, 200].map((cx, i) => (
              <circle key={i} cx={cx} cy={[50, 40, 35, 22, 18, 8, 4][i]} r="1.5" fill={accent} />
            ))}
          </svg>
        </div>
        {/* Tabela */}
        <div style={{ marginTop: 10, padding: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Leads recentes</div>
          {['Carlos Silva', 'Ana Souza', 'Roberto L.'].map((nome, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderTop: i ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <span style={{ fontSize: 8 }}>{nome}</span>
              <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 8, backgroundColor: `${accent}22`, color: accent }}>
                {['Quente', 'Morno', 'Quente'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
//  Portal do consorciado (PWA)
// ============================================================================

function PortalScreen({ accent }: { accent: string }) {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0D1F1E', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Topo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>Olá, Carlos</div>
        <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: accent }} />
      </div>
      {/* Card cota */}
      <div style={{ padding: 12, borderRadius: 8, backgroundColor: accent, color: '#fff' }}>
        <div style={{ fontSize: 8, opacity: 0.8 }}>Crédito contratado</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>R$ 250.000</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 8 }}>
          <span>Parcela mensal</span>
          <span style={{ fontWeight: 700 }}>R$ 1.890</span>
        </div>
        <div style={{ marginTop: 6, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '42%', backgroundColor: '#fff' }} />
        </div>
        <div style={{ fontSize: 7, marginTop: 3, opacity: 0.8 }}>76 de 180 parcelas pagas</div>
      </div>
      {/* Próxima assembleia */}
      <div style={{ padding: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>Próxima assembleia</div>
        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>15 de Maio</div>
        <div style={{ fontSize: 8, color: accent, marginTop: 2 }}>Em 12 dias</div>
      </div>
      {/* Atalhos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {['Cota', 'Lance', 'Histórico'].map((label) => (
          <div key={label} style={{ padding: '8px 4px', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)', textAlign: 'center', fontSize: 8 }}>
            <div style={{ width: 16, height: 16, margin: '0 auto 4px', borderRadius: 4, backgroundColor: `${accent}33` }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
//  WhatsApp / Conversas
// ============================================================================

function WhatsAppScreen({ accent }: { accent: string }) {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0D1F1E', color: '#fff', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>A</div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700 }}>Ana Souza</div>
          <div style={{ fontSize: 7, color: accent }}>Online agora</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
        <div style={{ alignSelf: 'flex-start', maxWidth: '75%', padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', fontSize: 8 }}>
          Oi! Vi seu interesse em consórcio imobiliário 🏠
        </div>
        <div style={{ alignSelf: 'flex-end', maxWidth: '75%', padding: 6, borderRadius: 8, backgroundColor: accent, color: '#fff', fontSize: 8 }}>
          Tenho! Pode me explicar?
        </div>
        <div style={{ alignSelf: 'flex-start', maxWidth: '75%', padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', fontSize: 8 }}>
          Claro! Vou te enviar uma proposta personalizada agora 📊
        </div>
        <div style={{ alignSelf: 'flex-start', maxWidth: '85%', padding: 6, borderRadius: 8, backgroundColor: `${accent}22`, fontSize: 8, border: `1px solid ${accent}` }}>
          📎 Proposta-Ana-Souza.pdf
          <div style={{ fontSize: 6, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Apresentação automática</div>
        </div>
      </div>
      <div style={{ padding: 8, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 4 }}>
        <div style={{ flex: 1, padding: '6px 8px', borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>Mensagem...</div>
        <div style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: accent }} />
      </div>
    </div>
  )
}

// ============================================================================
//  Relatórios
// ============================================================================

function ReportsScreen({ accent }: { accent: string }) {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0D1F1E', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700 }}>Funil de Vendas</div>

      {/* Funil */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[
          { label: 'Leads', val: '847', pct: 100 },
          { label: 'Qualificados', val: '432', pct: 51 },
          { label: 'Apresentação', val: '198', pct: 23 },
          { label: 'Proposta', val: '87', pct: 10 },
          { label: 'Fechado', val: '34', pct: 4 },
        ].map((etapa) => (
          <div key={etapa.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 8, width: 70, color: 'rgba(255,255,255,0.7)' }}>{etapa.label}</div>
            <div style={{ flex: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 3, position: 'relative' }}>
              <div style={{ height: '100%', width: `${etapa.pct}%`, backgroundColor: accent, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#fff' }}>{etapa.val}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mini gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
        <div style={{ padding: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>Ranking vendedores</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginTop: 2 }}>Top 1: Você</div>
          <div style={{ fontSize: 7, marginTop: 2 }}>R$ 234k este mês</div>
        </div>
        <div style={{ padding: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>Tempo médio</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginTop: 2 }}>4,2 dias</div>
          <div style={{ fontSize: 7, marginTop: 2 }}>Lead → fechamento</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
//  Captura de leads
// ============================================================================

function LeadsScreen({ accent }: { accent: string }) {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#0D1F1E', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700 }}>Leads</div>
        <div style={{ padding: '3px 8px', borderRadius: 4, backgroundColor: accent, fontSize: 8, fontWeight: 700, color: '#fff' }}>+ Novo</div>
      </div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 4 }}>
        {['Todos', 'Quentes', 'Mornos', 'Frios'].map((f, i) => (
          <div key={f} style={{ padding: '3px 6px', borderRadius: 4, fontSize: 7, backgroundColor: i === 0 ? `${accent}22` : 'transparent', color: i === 0 ? accent : 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>{f}</div>
        ))}
      </div>
      {/* Lista */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
        {[
          { n: 'Carlos Silva', t: 'Imóvel · R$ 350k', s: 'Quente', sc: accent },
          { n: 'Ana Souza', t: 'Auto · R$ 80k', s: 'Morno', sc: '#FFB547' },
          { n: 'Pedro Lima', t: 'Imóvel · R$ 500k', s: 'Quente', sc: accent },
          { n: 'Marcia R.', t: 'Serviços · R$ 30k', s: 'Frio', sc: '#5A7A78' },
          { n: 'João Costa', t: 'Auto · R$ 120k', s: 'Quente', sc: accent },
        ].map((lead, i) => (
          <div key={i} style={{ padding: 6, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: `${accent}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: accent }}>{lead.n[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 600 }}>{lead.n}</div>
              <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)' }}>{lead.t}</div>
            </div>
            <div style={{ padding: '2px 5px', borderRadius: 3, fontSize: 6, fontWeight: 700, color: lead.sc, backgroundColor: 'rgba(255,255,255,0.04)' }}>{lead.s.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
//  Componente principal
// ============================================================================

export default function PlanoGMockup({ kind, accent, className }: MockupProps & { kind: string }) {
  switch (kind) {
    case 'dashboard':
      return <div className={className}><Laptop accent={accent}><DashboardScreen accent={accent} /></Laptop></div>
    case 'reports':
      return <div className={className}><Laptop accent={accent}><ReportsScreen accent={accent} /></Laptop></div>
    case 'leads':
      return <div className={className}><Laptop accent={accent}><LeadsScreen accent={accent} /></Laptop></div>
    case 'portal':
      return <div className={className}><Phone accent={accent}><PortalScreen accent={accent} /></Phone></div>
    case 'whatsapp':
      return <div className={className}><Phone accent={accent}><WhatsAppScreen accent={accent} /></Phone></div>
    case 'phone':
      return <div className={className}><Phone accent={accent}><PortalScreen accent={accent} /></Phone></div>
    default:
      return <div className={className}><Laptop accent={accent}><DashboardScreen accent={accent} /></Laptop></div>
  }
}
