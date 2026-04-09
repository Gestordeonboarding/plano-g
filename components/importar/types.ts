export interface ColumnMapping {
  full_name: string
  cpf: string
  phone: string
  group_number: string
  quota_number: string
  credit_value: string
  installments_paid: string
  total_installments: string
  next_assembly_date: string
  monthly_installment: string
  status: string
}

export const SYSTEM_FIELDS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: 'full_name', label: 'Nome completo', required: true },
  { key: 'cpf', label: 'CPF', required: false },
  { key: 'phone', label: 'Telefone', required: false },
  { key: 'group_number', label: 'Número do grupo', required: false },
  { key: 'quota_number', label: 'Número da cota', required: false },
  { key: 'credit_value', label: 'Valor do crédito', required: true },
  { key: 'installments_paid', label: 'Parcelas pagas', required: false },
  { key: 'total_installments', label: 'Total de parcelas', required: false },
  { key: 'next_assembly_date', label: 'Data próxima assembleia', required: false },
  { key: 'monthly_installment', label: 'Valor da parcela mensal', required: false },
  { key: 'status', label: 'Status', required: false },
]

export const ADMINISTRADORAS = [
  'Embracon', 'Porto Seguro', 'Ademicon', 'Midway', 'Outra'
]

export const EMPTY_MAPPING: ColumnMapping = {
  full_name: '', cpf: '', phone: '', group_number: '', quota_number: '',
  credit_value: '', installments_paid: '', total_installments: '',
  next_assembly_date: '', monthly_installment: '', status: '',
}
