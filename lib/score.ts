interface ScoreInput {
  installments_paid: number
  total_installments: number
  status: string
  // Fator 2 — passado como parâmetro opcional (calculado externamente via histórico)
  estimated_lance_ok?: boolean
}

export function calculateScore(input: ScoreInput): number {
  let score = 0

  const total = input.total_installments || 1

  // Fator 1: % pago — peso 40 pontos
  const pct = input.installments_paid / total
  score += Math.round(pct * 40)

  // Fator 2: histórico de lances — peso 30 pontos
  if (input.estimated_lance_ok) score += 30

  // Fator 3: parcelas restantes — peso 20 pontos
  const remaining = total - input.installments_paid
  if (remaining <= 12) score += 20
  else if (remaining <= 24) score += 10

  // Fator 4: pontualidade — peso 10 pontos
  if (input.status === 'ativo') score += 10

  return Math.min(100, Math.max(0, score))
}
