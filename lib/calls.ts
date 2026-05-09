import type { CallOutcome } from '@/types/database'

export const OUTCOME_LABELS: Record<CallOutcome, string> = {
  atendeu: 'Atendeu',
  nao_atendeu: 'Não atendeu',
  caixa_postal: 'Caixa postal',
  numero_errado: 'Número errado',
  agendou_reuniao: 'Agendou reunião',
  proposta_enviada: 'Proposta enviada',
  venda_realizada: 'Venda realizada',
  nao_tem_interesse: 'Sem interesse',
}

export const OUTCOME_EMOJI: Record<CallOutcome, string> = {
  atendeu: '✅',
  nao_atendeu: '📵',
  caixa_postal: '📬',
  numero_errado: '❌',
  agendou_reuniao: '📅',
  proposta_enviada: '📄',
  venda_realizada: '🏆',
  nao_tem_interesse: '🚫',
}

export const OUTCOME_COLORS: Record<CallOutcome, { bg: string; text: string; bold?: boolean }> = {
  atendeu:           { bg: 'rgba(0,212,200,0.15)',   text: '#00D4C8' },
  nao_atendeu:       { bg: 'rgba(176,196,195,0.15)', text: '#B0C4C3' },
  caixa_postal:      { bg: 'rgba(176,196,195,0.15)', text: '#B0C4C3' },
  numero_errado:     { bg: 'rgba(255,92,92,0.15)',   text: '#FF5C5C' },
  agendou_reuniao:   { bg: 'rgba(167,139,250,0.15)', text: '#A78BFA' },
  proposta_enviada:  { bg: 'rgba(255,181,71,0.15)',  text: '#FFB547' },
  venda_realizada:   { bg: 'rgba(0,212,200,0.15)',   text: '#00D4C8', bold: true },
  nao_tem_interesse: { bg: 'rgba(255,92,92,0.15)',   text: '#FF5C5C' },
}

/** Resultados que contam como conversão para o painel de relatórios. */
export const CONVERSION_OUTCOMES: CallOutcome[] = [
  'agendou_reuniao',
  'proposta_enviada',
  'venda_realizada',
]

/** Resultados que indicam que o vendedor de fato falou com o contato. */
export const SUCCESSFUL_OUTCOMES: CallOutcome[] = [
  'atendeu',
  'agendou_reuniao',
  'proposta_enviada',
  'venda_realizada',
]

export function isSuccessfulContact(outcome: CallOutcome): boolean {
  return SUCCESSFUL_OUTCOMES.includes(outcome)
}

export function isConversion(outcome: CallOutcome): boolean {
  return CONVERSION_OUTCOMES.includes(outcome)
}

/** Taxa de conversão sobre TODAS as ligações. */
export function conversionRate(calls: { outcome: CallOutcome }[]): string {
  if (!calls.length) return '0%'
  const converted = calls.filter((c) => isConversion(c.outcome)).length
  return `${((converted / calls.length) * 100).toFixed(1)}%`
}

/** Taxa de atendimento (atendeu / total). */
export function answerRate(calls: { outcome: CallOutcome }[]): string {
  if (!calls.length) return '0%'
  const answered = calls.filter((c) => isSuccessfulContact(c.outcome)).length
  return `${((answered / calls.length) * 100).toFixed(1)}%`
}
