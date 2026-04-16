import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate, daysUntil } from '@/lib/utils'
import Link from 'next/link'
import {
  Building2, Car, Zap, CreditCard, ChevronLeft, Bell,
  TrendingUp, FileText, MessageCircle, LayoutGrid,
  Calendar, User, Star, Plus,
} from 'lucide-react'

type AssetType = 'imovel' | 'automovel' | 'moto' | 'outros'

const THEMES: Record<AssetType, {
  label: string; bg: string; accent: string; border: string
  orb: string; icon: React.ReactNode; emoji: string
}> = {
  imovel:    { label: 'Imóvel',    bg: 'linear-gradient(160deg,#040c18,#071828,#030a12)', accent: '#D4AF37', border: 'rgba(212,175,55,0.2)',  orb: 'rgba(212,175,55,0.15)', icon: <Building2 size={20}/>, emoji: '🏛️' },
  automovel: { label: 'Automóvel', bg: 'linear-gradient(160deg,#080205,#130408,#060102)', accent: '#ff4757', border: 'rgba(255,71,87,0.2)',   orb: 'rgba(255,71,87,0.15)',  icon: <Car size={20}/>,       emoji: '🏎️' },
  moto:      { label: 'Moto',      bg: 'linear-gradient(160deg,#0a0700,#160c00,#070400)', accent: '#F6AD55', border: 'rgba(246,173,85,0.2)',  orb: 'rgba(246,173,85,0.15)', icon: <Zap size={20}/>,       emoji: '🏍️' },
  outros:    { label: 'Consórcio', bg: 'linear-gradient(160deg,#040c10,#071820,#030a10)', accent: '#00D4C8', border: 'rgba(0,212,200,0.2)',   orb: 'rgba(0,212,200,0.15)',  icon: <CreditCard size={20}/>, emoji: '💎' },
}

function getTheme(t: string | null) {
  return THEMES[(t as AssetType) ?? 'outros'] ?? THEMES.outros
}

export default async function CotaPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params
  const authClient = await createClient()
  const db = await createServiceClient()

  const { data: { user } } = await authClient.auth.getUser()
  if (!user) redirect(`/portal/${slug}/entrar`)

  const { data: tenant } = await db.from('tenants').select('id').eq('slug', slug).single()
  if (!tenant) redirect(`/portal/${slug}/entrar`)

  // Garante vínculo: extrai CPF do email e linka antes de buscar
  const emailCpf = user.email?.replace('@portal.local', '') ?? ''
  const cpfFormatted = emailCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (emailCpf && /^\d{11}$/.test(emailCpf)) {
    await db.from('consorciados').update({ user_id: user.id })
      .eq('tenant_id', (tenant as { id: string }).id)
      .in('cpf', [emailCpf, cpfFormatted])
  }

  const { data: con } = await db
    .from('consorciados').select('*')
    .eq('id', id).eq('user_id', user.id).eq('tenant_id', (tenant as { id: string }).id)
    .single()

  if (!con) redirect(`/portal/${slug}`)

  const c = con as {
    id: string; full_name: string; credit_value: number; asset_type: string | null
    group_number: string | null; quota_number: string | null
    installments_paid: number; total_installments: number | null
    monthly_installment: number | null; next_assembly_date: string | null
    contemplation_score: number; status: string; administrator: string | null
    seller_id: string | null
  }

  // Buscar vendedor
  let sellerPhone: string | null = null
  let sellerName = 'Consultor'
  if (c.seller_id) {
    const { data: s } = await db.from('users').select('full_name, phone').eq('id', c.seller_id).single()
    if (s) {
      sellerName = (s as { full_name: string | null }).full_name || 'Consultor'
      sellerPhone = (s as { phone: string | null }).phone
    }
  }

  const theme = getTheme(c.asset_type)
  const pct = c.total_installments ? Math.round((c.installments_paid / c.total_installments) * 100) : 0
  const dias = daysUntil(c.next_assembly_date)
  const score = c.contemplation_score || 0
  const scoreColor = score >= 70 ? '#00D4C8' : score >= 40 ? '#F6AD55' : '#ff4757'
  const scoreLabel = score >= 70 ? 'Alto' : score >= 40 ? 'Médio' : 'Baixo'

  const wp = sellerPhone?.replace(/\D/g, '')
  const firstName = c.full_name.split(' ')[0]
  const wpMsgLance = encodeURIComponent(`Olá ${sellerName}! Sou ${firstName} e quero simular um lance no meu consórcio de ${theme.label}.`)
  const wpMsgNovo = encodeURIComponent(`Olá ${sellerName}! Sou ${firstName} e gostaria de contratar um novo consórcio.`)

  const acoes = [
    { label: 'Simular Lance', icon: <TrendingUp size={18}/>, href: `/portal/${slug}/simulador`, external: false, color: theme.accent },
    { label: 'Documentos',    icon: <FileText size={18}/>,   href: `/portal/${slug}/documentos`, external: false, color: theme.accent },
    { label: 'Assembleias',   icon: <Calendar size={18}/>,   href: `/portal/${slug}/assembleias`, external: false, color: theme.accent },
    { label: 'Falar c/ Consultor', icon: <MessageCircle size={18}/>, href: wp ? `https://wa.me/55${wp}` : `/portal/${slug}/chat`, external: !!wp, color: '#25D366' },
    { label: 'Carteira',      icon: <LayoutGrid size={18}/>, href: `/portal/${slug}`, external: false, color: 'var(--text-muted)' },
    { label: 'Perfil',        icon: <User size={18}/>,       href: `/portal/${slug}/perfil`, external: false, color: 'var(--text-muted)' },
  ]

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes floatSlow { 0%,100%{transform:translateY(0) rotate(0deg);} 50%{transform:translateY(-12px) rotate(3deg);} }
        @keyframes glowPulse { 0%,100%{opacity:0.5;} 50%{opacity:1;} }
        .fu1{animation:fadeUp .5s ease .00s both} .fu2{animation:fadeUp .5s ease .08s both}
        .fu3{animation:fadeUp .5s ease .16s both} .fu4{animation:fadeUp .5s ease .24s both}
        .fu5{animation:fadeUp .5s ease .32s both}
        .float-em{animation:floatSlow 8s ease-in-out infinite;}
        .glow{animation:glowPulse 5s ease-in-out infinite;}
        .acao{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 6px;border-radius:14px;text-decoration:none;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.04);transition:transform .15s;}
        .acao:active{transform:scale(0.94);}
      `}</style>

      <div style={{
        margin: '-20px -16px', minHeight: 'calc(100vh - 56px)',
        background: theme.bg, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Orb */}
        <div className="glow" style={{
          position:'absolute',top:'-40px',left:'50%',transform:'translateX(-50%)',
          width:300,height:300,borderRadius:'50%',
          background:`radial-gradient(circle,${theme.orb} 0%,transparent 70%)`,
          pointerEvents:'none',
        }}/>

        {/* Emoji watermark */}
        <div className="float-em" style={{
          position:'absolute',right:'-5px',top:'10%',
          fontSize:100,opacity:0.05,pointerEvents:'none',userSelect:'none',
        }}>{theme.emoji}</div>

        {/* Top bar */}
        <div className="fu1" style={{
          display:'flex',alignItems:'center',gap:10,padding:'12px 16px',
          borderBottom:`1px solid ${theme.border}`,position:'relative',zIndex:10,
        }}>
          <Link href={`/portal/${slug}`} style={{color:'rgba(255,255,255,0.4)',display:'flex'}}>
            <ChevronLeft size={20}/>
          </Link>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{
              width:30,height:30,borderRadius:8,
              background:`${theme.accent}22`,border:`1px solid ${theme.accent}44`,
              display:'flex',alignItems:'center',justifyContent:'center',color:theme.accent,
            }}>{theme.icon}</div>
            <div>
              <p style={{fontSize:13,fontWeight:700,color:'#fff'}}>{theme.label}</p>
              <p style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>
                Grupo {c.group_number||'—'} · Cota {c.quota_number||'—'}
              </p>
            </div>
          </div>
          {c.status === 'ativo' && (
            <span style={{
              marginLeft:'auto',fontSize:9,fontWeight:800,textTransform:'uppercase',
              padding:'3px 8px',borderRadius:20,
              background:'rgba(0,212,200,0.15)',color:'#00D4C8',
              border:'1px solid rgba(0,212,200,0.3)',
            }}>Ativo</span>
          )}
        </div>

        {/* Conteúdo */}
        <div style={{flex:1,padding:'16px 16px 100px',position:'relative',zIndex:1,display:'flex',flexDirection:'column',gap:12}}>

          {/* Alerta assembleia */}
          {dias !== null && dias <= 15 && (
            <div className="fu1" style={{
              display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:12,
              background:'rgba(246,173,85,0.1)',border:'1px solid rgba(246,173,85,0.25)',
            }}>
              <Bell size={15} color="#F6AD55"/>
              <p style={{fontSize:12,fontWeight:700,color:'#F6AD55'}}>
                Assembleia em {dias} dia{dias!==1?'s':''}
                {c.next_assembly_date && ` · ${formatDate(c.next_assembly_date)}`}
              </p>
            </div>
          )}

          {/* Card principal */}
          <div className="fu2" style={{
            borderRadius:16,padding:'16px',
            background:`${theme.accent}0d`,
            border:`1px solid ${theme.border}`,
            backdropFilter:'blur(20px)',
          }}>
            <p style={{fontSize:10,color:'rgba(255,255,255,0.4)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:2}}>
              Crédito contratado
            </p>
            <p style={{fontSize:28,fontWeight:900,color:theme.accent,letterSpacing:'-0.02em',marginBottom:14}}>
              {formatCurrency(c.credit_value)}
            </p>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 16px',marginBottom:14}}>
              {[
                {label:'Parcela mensal', value:formatCurrency(c.monthly_installment)},
                {label:'Próx. assembleia', value:c.next_assembly_date?formatDate(c.next_assembly_date):'—'},
                {label:'Administradora', value:c.administrator||'—'},
                {label:'Parcelas', value:`${c.installments_paid}/${c.total_installments||'—'}`},
              ].map(({label,value})=>(
                <div key={label}>
                  <p style={{fontSize:9,color:'rgba(255,255,255,0.35)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</p>
                  <p style={{fontSize:12,fontWeight:700,color:'rgba(255,255,255,0.8)'}}>{value}</p>
                </div>
              ))}
            </div>

            {/* Progress */}
            <div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontSize:9,color:'rgba(255,255,255,0.35)',fontWeight:600}}>Progresso</span>
                <span style={{fontSize:9,color:theme.accent,fontWeight:700}}>{pct}%</span>
              </div>
              <div style={{height:4,borderRadius:4,background:'rgba(255,255,255,0.08)'}}>
                <div style={{height:4,borderRadius:4,width:`${pct}%`,background:theme.accent}}/>
              </div>
            </div>
          </div>

          {/* Score */}
          <div className="fu3" style={{
            borderRadius:16,padding:'14px 16px',
            background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',
            backdropFilter:'blur(20px)',display:'flex',alignItems:'center',gap:14,
          }}>
            <div>
              <p style={{fontSize:9,color:'rgba(255,255,255,0.35)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Score</p>
              <p style={{fontSize:32,fontWeight:900,color:scoreColor,lineHeight:1}}>{score}</p>
            </div>
            <div style={{flex:1}}>
              <span style={{
                fontSize:10,fontWeight:800,padding:'2px 8px',borderRadius:20,
                background:`${scoreColor}18`,color:scoreColor,
                border:`1px solid ${scoreColor}33`,display:'inline-block',marginBottom:6,
              }}>{scoreLabel}</span>
              <div style={{height:4,borderRadius:4,background:'rgba(255,255,255,0.08)'}}>
                <div style={{height:4,borderRadius:4,width:`${score}%`,background:scoreColor}}/>
              </div>
            </div>
            <Star size={16} color={scoreColor}/>
          </div>

          {/* Ações */}
          <div className="fu4">
            <p style={{fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:10}}>
              Ações
            </p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
              {acoes.map((a,i)=>{
                const style_={color:a.color} as React.CSSProperties
                if(a.href && a.external) return (
                  <a key={i} href={a.href} target="_blank" rel="noopener noreferrer" className="acao"
                    style={{animation:`fadeUp .4s ease ${.3+i*.04}s both`}}>
                    <span style={style_}>{a.icon}</span>
                    <span style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.5)',textAlign:'center',lineHeight:1.3}}>{a.label}</span>
                  </a>
                )
                return (
                  <Link key={i} href={a.href||'#'} className="acao"
                    style={{animation:`fadeUp .4s ease ${.3+i*.04}s both`}}>
                    <span style={style_}>{a.icon}</span>
                    <span style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.5)',textAlign:'center',lineHeight:1.3}}>{a.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* CTA novo consórcio */}
          <div className="fu5">
            {wp ? (
              <a
                href={`https://wa.me/55${wp}?text=${wpMsgNovo}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:'flex',alignItems:'center',justifyContent:'center',gap:8,
                  padding:'14px',borderRadius:14,
                  background:'rgba(37,211,102,0.1)',border:'1px solid rgba(37,211,102,0.25)',
                  color:'#25D366',fontWeight:700,fontSize:13,textDecoration:'none',
                }}
              >
                <Plus size={16}/>
                Quero um novo consórcio
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}
