'use client'

import { useState } from 'react'
import { Copy, Check, RefreshCw, Code, Key } from 'lucide-react'

interface Props {
  apiKey: string | null
  tenantId: string
  isAdmin: boolean
  appUrl: string
}

export default function ApiDocsClient({ apiKey, tenantId, isAdmin, appUrl }: Props) {
  const [key, setKey] = useState(apiKey)
  const [copied, setCopied] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const endpoint = `${appUrl}/api/public/leads`
  const endpointVendas = `${appUrl}/api/public/vendas`

  async function generateKey() {
    setGenerating(true)
    const res = await fetch('/api/tenant/generate-api-key', { method: 'POST' })
    const data = await res.json()
    if (res.ok) { setKey(data.api_key); setShowKey(true) }
    setGenerating(false)
  }

  function copy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const curlExample = `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${key || 'SUA_API_KEY'}" \\
  -d '{
    "full_name": "João Silva",
    "phone": "11999998888",
    "email": "joao@email.com",
    "desired_credit": 150000,
    "monthly_income": 8000,
    "asset_type": "imovel",
    "source": "site"
  }'`

  const jsExample = `const response = await fetch('${endpoint}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${key || 'SUA_API_KEY'}',
  },
  body: JSON.stringify({
    full_name: 'João Silva',
    phone: '11999998888',
    email: 'joao@email.com',
    desired_credit: 150000,
    monthly_income: 8000,
    asset_type: 'imovel',
    source: 'site',
  }),
})
const data = await response.json()
// { success: true, lead: { id, full_name, phone, status, qualification_score, created_at } }`

  const phpExample = `<?php
$response = file_get_contents('${endpoint}', false, stream_context_create([
  'http' => [
    'method' => 'POST',
    'header' => implode("\\r\\n", [
      'Content-Type: application/json',
      'x-api-key: ${key || 'SUA_API_KEY'}',
    ]),
    'content' => json_encode([
      'full_name' => 'João Silva',
      'phone'     => '11999998888',
      'asset_type'=> 'imovel',
      'source'    => 'site',
    ]),
  ],
]));
$data = json_decode($response, true);`

  const fields = [
    { name: 'full_name', type: 'string', req: true, desc: 'Nome completo do lead' },
    { name: 'phone', type: 'string', req: true, desc: 'Telefone (só dígitos ou formatado)' },
    { name: 'email', type: 'string', req: false, desc: 'E-mail do lead' },
    { name: 'desired_credit', type: 'number', req: false, desc: 'Valor do crédito desejado em R$' },
    { name: 'monthly_income', type: 'number', req: false, desc: 'Renda mensal em R$' },
    { name: 'asset_type', type: 'string', req: false, desc: '"imovel" | "auto" | "moto" | "servicos" | "outros"' },
    { name: 'source', type: 'string', req: false, desc: 'Origem do lead (ex: "site", "facebook", "indicacao"). Padrão: "api"' },
    { name: 'notes', type: 'string', req: false, desc: 'Observações adicionais' },
    { name: 'seller_id', type: 'string (uuid)', req: false, desc: 'ID do vendedor para atribuição automática' },
  ]

  const curlVendas = `curl -X POST ${endpointVendas} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${key || 'SUA_API_KEY'}" \\
  -d '{
    "full_name": "Maria Oliveira",
    "phone": "11988887777",
    "credit_value": 120000,
    "cpf": "123.456.789-00",
    "email": "maria@email.com",
    "asset_type": "imovel",
    "administrator": "Embracon",
    "group_number": "1234",
    "quota_number": "56",
    "total_installments": 180,
    "installments_paid": 0,
    "monthly_installment": 850,
    "seller_id": "uuid-do-vendedor",
    "lead_id": "uuid-do-lead"
  }'`

  const fieldsVendas = [
    { name: 'full_name', type: 'string', req: true, desc: 'Nome completo do comprador' },
    { name: 'phone', type: 'string', req: true, desc: 'Telefone (só dígitos ou formatado)' },
    { name: 'credit_value', type: 'number', req: true, desc: 'Valor do crédito contratado em R$' },
    { name: 'cpf', type: 'string', req: false, desc: 'CPF do comprador' },
    { name: 'email', type: 'string', req: false, desc: 'E-mail do comprador' },
    { name: 'asset_type', type: 'string', req: false, desc: '"imovel" | "auto" | "moto" | "servicos" | "outros"' },
    { name: 'administrator', type: 'string', req: false, desc: 'Administradora do consórcio (ex: "Embracon")' },
    { name: 'group_number', type: 'string', req: false, desc: 'Número do grupo' },
    { name: 'quota_number', type: 'string', req: false, desc: 'Número da cota' },
    { name: 'total_installments', type: 'number', req: false, desc: 'Total de parcelas do plano' },
    { name: 'installments_paid', type: 'number', req: false, desc: 'Parcelas já pagas. Padrão: 0' },
    { name: 'monthly_installment', type: 'number', req: false, desc: 'Valor da parcela mensal em R$' },
    { name: 'next_assembly_date', type: 'string (YYYY-MM-DD)', req: false, desc: 'Data da próxima assembleia' },
    { name: 'status', type: 'string', req: false, desc: '"ativo" | "contemplado" | "inadimplente" | "cancelado". Padrão: "ativo"' },
    { name: 'seller_id', type: 'string (uuid)', req: false, desc: 'ID do vendedor responsável pela venda' },
    { name: 'lead_id', type: 'string (uuid)', req: false, desc: 'ID do lead para marcá-lo como convertido automaticamente' },
  ]

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(0,212,200,0.15)' }}>
          <Code size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>API de Leads</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Integre seu site, landing page ou CRM para enviar leads diretamente ao seu painel
          </p>
        </div>
      </div>

      {/* API Key */}
      <div className="card-pg p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Key size={15} style={{ color: 'var(--accent)' }} />
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Sua API Key</p>
        </div>

        {key ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs px-3 py-2 rounded-lg font-mono break-all"
              style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
              {showKey ? key : '•'.repeat(32)}
            </code>
            <button onClick={() => setShowKey((v) => !v)}
              className="text-xs px-2 py-1.5 rounded btn-outline shrink-0">
              {showKey ? 'Ocultar' : 'Mostrar'}
            </button>
            <button onClick={() => copy(key, 'key')}
              className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0">
              {copied === 'key' ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhuma API key gerada.</p>
            {isAdmin && (
              <button onClick={generateKey} disabled={generating}
                className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
                <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Gerando...' : 'Gerar API Key'}
              </button>
            )}
          </div>
        )}

        {key && isAdmin && (
          <div className="flex items-center gap-2 mt-1">
            <button onClick={generateKey} disabled={generating}
              className="btn-outline text-xs flex items-center gap-1.5 disabled:opacity-50">
              <RefreshCw size={12} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Gerando...' : 'Regenerar key'}
            </button>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Atenção: regenerar invalida a key atual.
            </p>
          </div>
        )}
      </div>

      {/* Endpoint */}
      <div className="card-pg p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Endpoint</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded font-bold"
            style={{ backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }}>POST</span>
          <code className="flex-1 text-xs px-3 py-2 rounded-lg font-mono"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            {endpoint}
          </code>
          <button onClick={() => copy(endpoint, 'url')} className="btn-outline text-xs px-2 py-1.5 shrink-0">
            {copied === 'url' ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>

        <div>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Headers obrigatórios</p>
          <div className="flex flex-col gap-1">
            {[['Content-Type', 'application/json'], ['x-api-key', key || 'SUA_API_KEY']].map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <span style={{ color: 'var(--accent)' }}>{k}:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campos */}
      <div className="card-pg overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Campos do body (JSON)</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              {['Campo', 'Tipo', 'Req.', 'Descrição'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f.name} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td className="px-4 py-2.5">
                  <code style={{ color: 'var(--accent)' }}>{f.name}</code>
                </td>
                <td className="px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>{f.type}</td>
                <td className="px-4 py-2.5">
                  {f.req
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }}>sim</span>
                    : <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>não</span>
                  }
                </td>
                <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{f.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exemplos */}
      <div className="flex flex-col gap-4">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Exemplos de integração</h2>

        {[
          { id: 'curl', label: 'cURL', code: curlExample },
          { id: 'js', label: 'JavaScript / Node.js', code: jsExample },
          { id: 'php', label: 'PHP', code: phpExample },
        ].map(({ id, label, code }) => (
          <div key={id} className="card-pg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <button onClick={() => copy(code, id)} className="text-xs flex items-center gap-1"
                style={{ color: 'var(--text-muted)' }}>
                {copied === id ? <><Check size={11} /> Copiado!</> : <><Copy size={11} /> Copiar</>}
              </button>
            </div>
            <pre className="text-xs p-4 overflow-x-auto font-mono leading-relaxed"
              style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
              {code}
            </pre>
          </div>
        ))}
      </div>

      {/* ── ENDPOINT VENDAS ── */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Endpoint: Vendas</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Registre uma venda fechada diretamente como consorciado no sistema. Ideal para integração com CRMs ou sistemas de gestão.
        </p>
      </div>

      <div className="card-pg p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Endpoint</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded font-bold"
            style={{ backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }}>POST</span>
          <code className="flex-1 text-xs px-3 py-2 rounded-lg font-mono"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            {endpointVendas}
          </code>
          <button onClick={() => copy(endpointVendas, 'url-vendas')} className="btn-outline text-xs px-2 py-1.5 shrink-0">
            {copied === 'url-vendas' ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Mesma autenticação: header <code style={{ color: 'var(--accent)' }}>x-api-key</code>
        </p>
      </div>

      <div className="card-pg overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Campos do body — Vendas</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              {['Campo', 'Tipo', 'Req.', 'Descrição'].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fieldsVendas.map((f) => (
              <tr key={f.name} style={{ borderTop: '1px solid var(--border-color)' }}>
                <td className="px-4 py-2.5"><code style={{ color: 'var(--accent)' }}>{f.name}</code></td>
                <td className="px-4 py-2.5" style={{ color: 'var(--text-muted)' }}>{f.type}</td>
                <td className="px-4 py-2.5">
                  {f.req
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: 'rgba(0,212,200,0.15)', color: 'var(--accent)' }}>sim</span>
                    : <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>não</span>
                  }
                </td>
                <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{f.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card-pg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>cURL — Exemplo Vendas</span>
          <button onClick={() => copy(curlVendas, 'curl-vendas')} className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
            {copied === 'curl-vendas' ? <><Check size={11} /> Copiado!</> : <><Copy size={11} /> Copiar</>}
          </button>
        </div>
        <pre className="text-xs p-4 overflow-x-auto font-mono leading-relaxed"
          style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
          {curlVendas}
        </pre>
      </div>

      <div className="card-pg p-5 flex flex-col gap-2">
        <h2 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Resposta — Vendas</h2>
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,212,200,0.3)' }}>
          <div className="px-3 py-1.5 flex items-center gap-2" style={{ backgroundColor: 'rgba(0,212,200,0.10)' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>201</span>
            <span className="text-xs" style={{ color: 'var(--accent)' }}>Sucesso</span>
          </div>
          <pre className="text-xs p-3 font-mono" style={{ color: 'var(--text-muted)' }}>
{`{ "success": true, "message": "Venda registrada com sucesso",
  "consorciado": {
    "id": "uuid", "full_name": "Maria Oliveira",
    "phone": "11988887777", "credit_value": 120000,
    "status": "ativo", "group_number": "1234",
    "quota_number": "56", "contemplation_score": 65,
    "created_at": "2025-04-15T10:00:00Z"
  }
}`}
          </pre>
        </div>
      </div>

      {/* Resposta */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Endpoint: Leads</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Envie leads de interesse para o funil de vendas.
        </p>
      </div>

      {/* Resposta */}
      <div className="card-pg p-5 flex flex-col gap-3">
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Respostas — Leads</h2>
        <div className="flex flex-col gap-2">
          {[
            { status: '201', label: 'Sucesso', color: 'var(--accent)', bg: 'rgba(0,212,200,0.10)',
              body: '{ "success": true, "lead": { "id": "uuid", "full_name": "...", "status": "novo", "qualification_score": 75 } }' },
            { status: '400', label: 'Dados inválidos', color: '#FFB547', bg: 'rgba(255,181,71,0.10)',
              body: '{ "error": "Os campos full_name e phone são obrigatórios" }' },
            { status: '401', label: 'Sem autenticação', color: 'var(--danger)', bg: 'rgba(255,92,92,0.10)',
              body: '{ "error": "API key obrigatória. Envie no header: x-api-key: <sua-chave>" }' },
            { status: '403', label: 'API key inválida', color: 'var(--danger)', bg: 'rgba(255,92,92,0.10)',
              body: '{ "error": "API key inválida ou tenant inativo" }' },
          ].map(({ status, label, color, bg, body }) => (
            <div key={status} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${color}30` }}>
              <div className="px-3 py-1.5 flex items-center gap-2" style={{ backgroundColor: bg }}>
                <span className="text-xs font-bold" style={{ color }}>{status}</span>
                <span className="text-xs" style={{ color }}>{label}</span>
              </div>
              <pre className="text-xs p-3 font-mono" style={{ color: 'var(--text-muted)' }}>{body}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
