'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatPhone } from '@/lib/utils'

const COLUNAS = [
  { key: 'novo', label: 'Novo' },
  { key: 'contato_feito', label: 'Contato feito' },
  { key: 'proposta_enviada', label: 'Proposta enviada' },
  { key: 'documentacao', label: 'Documentação' },
  { key: 'convertido', label: 'Convertido' },
  { key: 'perdido', label: 'Perdido' },
] as const

type Status = typeof COLUNAS[number]['key']

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  novo: { bg: 'rgba(176,196,195,0.15)', text: 'var(--text-secondary)' },
  contato_feito: { bg: 'rgba(0,168,157,0.15)', text: 'var(--accent-mid)' },
  proposta_enviada: { bg: 'rgba(130,100,220,0.15)', text: '#A78BFA' },
  documentacao: { bg: 'rgba(255,181,71,0.15)', text: '#FFB547' },
  convertido: { bg: 'rgba(0,212,200,0.15)', text: 'var(--accent)' },
  perdido: { bg: 'rgba(255,92,92,0.15)', text: 'var(--danger)' },
}

const ASSET_LABEL: Record<string, string> = {
  imovel: 'Imóvel', auto: 'Auto', moto: 'Moto', servicos: 'Serviços', outros: 'Outros'
}

type Lead = {
  id: string
  full_name: string
  phone: string
  desired_credit: number | null
  asset_type: string | null
  qualification_score: number
  source: string
  status: string
  created_at: string
  seller_id: string | null
}

type Seller = {
  id: string
  full_name: string | null
  email: string | null
}

export default function KanbanClient({
  leads: initialLeads,
  sellers,
  isManager,
}: {
  leads: Lead[]
  sellers: Seller[]
  isManager: boolean
}) {
  const [leads, setLeads] = useState(initialLeads)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [sellerView, setSellerView] = useState(false)

  async function moveToStatus(leadId: string, newStatus: string) {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status: newStatus } : l))
    await fetch(`/api/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  function handleDragStart(e: React.DragEvent, leadId: string) {
    setDragging(leadId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, colKey: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(colKey)
  }

  function handleDrop(e: React.DragEvent, colKey: string) {
    e.preventDefault()
    if (dragging) moveToStatus(dragging, colKey)
    setDragging(null)
    setDragOver(null)
  }

  function handleDragEnd() {
    setDragging(null)
    setDragOver(null)
  }

  function renderKanban(filteredLeads: Lead[], prefix = '') {
    const byStatus = COLUNAS.reduce((acc, col) => {
      acc[col.key] = filteredLeads.filter((l) => l.status === col.key)
      return acc
    }, {} as Record<string, Lead[]>)

    return (
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
        {COLUNAS.map((col) => {
          const colKey = `${prefix}${col.key}`
          const colLeads = byStatus[col.key]
          const style = STATUS_STYLE[col.key]
          const isOver = dragOver === colKey

          return (
            <div
              key={colKey}
              style={{
                display: 'flex', flexDirection: 'column', gap: 10,
                minWidth: 220, width: 220, flexShrink: 0,
                borderRadius: 12, padding: 10,
                backgroundColor: isOver ? 'rgba(0,212,200,0.06)' : 'var(--bg-tertiary)',
                border: isOver ? '2px dashed var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
              onDragOver={(e) => handleDragOver(e, colKey)}
              onDrop={(e) => handleDrop(e, colKey)}
              onDragLeave={() => setDragOver(null)}
            >
              {/* Cabeçalho */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                  {col.label}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 20, backgroundColor: style.bg, color: style.text }}>
                  {colLeads.length}
                </span>
              </div>

              {/* Cards */}
              {colLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onDragEnd={handleDragEnd}
                  style={{ opacity: dragging === lead.id ? 0.35 : 1, cursor: 'grab' }}
                >
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    draggable={false}
                    style={{
                      display: 'block', borderRadius: 10, padding: 10, textDecoration: 'none',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 2 }}>
                      {lead.full_name}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      {formatPhone(lead.phone)}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {lead.asset_type && (
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 600, backgroundColor: 'rgba(0,212,200,0.10)', color: 'var(--accent)' }}>
                          {ASSET_LABEL[lead.asset_type] || lead.asset_type}
                        </span>
                      )}
                      {lead.desired_credit && (
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 600, backgroundColor: 'rgba(255,181,71,0.10)', color: '#FFB547' }}>
                          {formatCurrency(lead.desired_credit)}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Score: {lead.qualification_score}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{lead.source}</span>
                    </div>
                  </Link>
                </div>
              ))}

              {colLeads.length === 0 && (
                <p style={{ fontSize: 11, textAlign: 'center', padding: '12px 0', color: 'var(--text-muted)' }}>
                  Vazio
                </p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const unassigned = leads.filter((l) => !l.seller_id)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Toggle visão gerente */}
      {isManager && (
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 10, backgroundColor: 'var(--bg-secondary)', width: 'fit-content' }}>
          <button
            onClick={() => setSellerView(false)}
            style={{
              padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: !sellerView ? 700 : 500,
              backgroundColor: !sellerView ? 'var(--bg-primary)' : 'transparent',
              color: !sellerView ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: !sellerView ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            Todos os leads
          </button>
          <button
            onClick={() => setSellerView(true)}
            style={{
              padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: sellerView ? 700 : 500,
              backgroundColor: sellerView ? 'var(--bg-primary)' : 'transparent',
              color: sellerView ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: sellerView ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            Por vendedor
          </button>
        </div>
      )}

      {/* Visão por vendedor */}
      {sellerView ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {sellers.map((seller) => {
            const sellerLeads = leads.filter((l) => l.seller_id === seller.id)
            return (
              <div key={seller.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)',
                    fontWeight: 700, fontSize: 14, flexShrink: 0,
                  }}>
                    {(seller.full_name || seller.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                      {seller.full_name || seller.email}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {sellerLeads.length} lead{sellerLeads.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {renderKanban(sellerLeads, `${seller.id}-`)}
              </div>
            )
          })}

          {unassigned.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(176,196,195,0.15)', color: 'var(--text-muted)',
                  fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>?</div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Sem vendedor</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {unassigned.length} lead{unassigned.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {renderKanban(unassigned, 'unassigned-')}
            </div>
          )}
        </div>
      ) : (
        renderKanban(leads)
      )}
    </div>
  )
}
