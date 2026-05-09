export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'agency_admin' | 'tenant_admin' | 'seller' | 'client'
export type LeadStatus = 'novo' | 'contato_feito' | 'proposta_enviada' | 'documentacao' | 'convertido' | 'perdido'
export type AssetType = 'imovel' | 'auto' | 'moto' | 'servicos' | 'outros'
export type LeadSource = 'meta_ads' | 'google_ads' | 'indicacao' | 'organico' | 'manual'
export type ConsorcinadoStatus = 'ativo' | 'contemplado' | 'cancelado' | 'inadimplente'
export type TriggerEvent =
  | 'lead_novo'
  | 'lead_sem_resposta_24h'
  | 'boleto_vencendo_3d'
  | 'assembleia_em_15d'
  | 'assembleia_em_1d'
  | 'pos_contemplacao'
  | 'inatividade_30d'

// Rastreamento de ligações
export type CallOutcome =
  | 'atendeu'
  | 'nao_atendeu'
  | 'caixa_postal'
  | 'numero_errado'
  | 'agendou_reuniao'
  | 'proposta_enviada'
  | 'venda_realizada'
  | 'nao_tem_interesse'

export interface CallLog {
  id: string
  created_at: string
  tenant_id: string
  seller_id: string
  lead_id?: string | null
  consorciado_id?: string | null
  contact_name: string
  contact_phone?: string | null
  called_at: string
  duration_minutes?: number | null
  outcome: CallOutcome
  notes?: string | null
  scheduled_callback_at?: string | null
}

export interface Database {
  public: {
    Tables: {
      agency: {
        Row: {
          id: string
          created_at: string
          name: string
          owner_email: string
        }
        Insert: {
          id?: string
          created_at?: string
          name?: string
          owner_email: string
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          owner_email?: string
        }
      }
      tenants: {
        Row: {
          id: string
          created_at: string
          agency_id: string | null
          name: string
          slug: string
          logo_url: string | null
          primary_color: string | null
          plan: string | null
          is_active: boolean
          evolution_api_url: string | null
          evolution_api_key: string | null
          last_spreadsheet_import: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          agency_id?: string | null
          name: string
          slug: string
          logo_url?: string | null
          primary_color?: string | null
          plan?: string | null
          is_active?: boolean
          evolution_api_url?: string | null
          evolution_api_key?: string | null
          last_spreadsheet_import?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          agency_id?: string | null
          name?: string
          slug?: string
          logo_url?: string | null
          primary_color?: string | null
          plan?: string | null
          is_active?: boolean
          evolution_api_url?: string | null
          evolution_api_key?: string | null
          last_spreadsheet_import?: string | null
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          full_name: string | null
          email: string | null
          role: UserRole
          tenant_id: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
        }
        Insert: {
          id: string
          created_at?: string
          full_name?: string | null
          email?: string | null
          role: UserRole
          tenant_id?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string | null
          email?: string | null
          role?: UserRole
          tenant_id?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
        }
      }
      leads: {
        Row: {
          id: string
          created_at: string
          tenant_id: string
          seller_id: string | null
          full_name: string
          email: string | null
          phone: string
          desired_credit: number | null
          asset_type: AssetType | null
          monthly_income: number | null
          has_existing_consortium: boolean
          status: LeadStatus
          qualification_score: number
          source: LeadSource
          utm_source: string | null
          utm_campaign: string | null
          notes: string | null
          lost_reason: string | null
          last_contact_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          tenant_id: string
          seller_id?: string | null
          full_name: string
          email?: string | null
          phone: string
          desired_credit?: number | null
          asset_type?: AssetType | null
          monthly_income?: number | null
          has_existing_consortium?: boolean
          status?: LeadStatus
          qualification_score?: number
          source?: LeadSource
          utm_source?: string | null
          utm_campaign?: string | null
          notes?: string | null
          lost_reason?: string | null
          last_contact_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['leads']['Insert']>
      }
      consorciados: {
        Row: {
          id: string
          created_at: string
          tenant_id: string
          seller_id: string | null
          lead_id: string | null
          user_id: string | null
          full_name: string
          cpf: string | null
          phone: string | null
          email: string | null
          credit_value: number
          group_number: string | null
          quota_number: string | null
          installments_paid: number
          total_installments: number | null
          monthly_installment: number | null
          next_assembly_date: string | null
          administrator: string | null
          status: ConsorcinadoStatus
          contemplation_score: number
          last_data_update: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          tenant_id: string
          seller_id?: string | null
          lead_id?: string | null
          user_id?: string | null
          full_name: string
          cpf?: string | null
          phone?: string | null
          email?: string | null
          credit_value: number
          group_number?: string | null
          quota_number?: string | null
          installments_paid?: number
          total_installments?: number | null
          monthly_installment?: number | null
          next_assembly_date?: string | null
          administrator?: string | null
          status?: ConsorcinadoStatus
          contemplation_score?: number
          last_data_update?: string | null
        }
        Update: Partial<Database['public']['Tables']['consorciados']['Insert']>
      }
      assemblies: {
        Row: {
          id: string
          created_at: string
          tenant_id: string
          consorciado_id: string
          assembly_date: string
          group_number: string | null
          winning_bid_amount: number | null
          winning_bid_percentage: number | null
          was_contemplated: boolean
          bid_offered: number | null
          draw_contemplated: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          tenant_id: string
          consorciado_id: string
          assembly_date: string
          group_number?: string | null
          winning_bid_amount?: number | null
          winning_bid_percentage?: number | null
          was_contemplated?: boolean
          bid_offered?: number | null
          draw_contemplated?: boolean
        }
        Update: Partial<Database['public']['Tables']['assemblies']['Insert']>
      }
      documents: {
        Row: {
          id: string
          created_at: string
          tenant_id: string
          consorciado_id: string
          name: string
          file_url: string
          type: 'contrato' | 'boleto' | 'carta_credito' | 'declaracao_ir' | 'outro' | null
        }
        Insert: {
          id?: string
          created_at?: string
          tenant_id: string
          consorciado_id: string
          name: string
          file_url: string
          type?: 'contrato' | 'boleto' | 'carta_credito' | 'declaracao_ir' | 'outro' | null
        }
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      automations: {
        Row: {
          id: string
          created_at: string
          tenant_id: string
          name: string
          trigger_event: TriggerEvent
          delay_hours: number
          channel: 'whatsapp' | 'email'
          message_template: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          tenant_id: string
          name: string
          trigger_event: TriggerEvent
          delay_hours?: number
          channel: 'whatsapp' | 'email'
          message_template: string
          is_active?: boolean
        }
        Update: Partial<Database['public']['Tables']['automations']['Insert']>
      }
      automation_logs: {
        Row: {
          id: string
          created_at: string
          automation_id: string | null
          tenant_id: string | null
          target_id: string | null
          target_type: 'lead' | 'consorciado' | null
          channel: string | null
          status: 'enviado' | 'falha' | 'pendente' | null
          error_message: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          automation_id?: string | null
          tenant_id?: string | null
          target_id?: string | null
          target_type?: 'lead' | 'consorciado' | null
          channel?: string | null
          status?: 'enviado' | 'falha' | 'pendente' | null
          error_message?: string | null
        }
        Update: Partial<Database['public']['Tables']['automation_logs']['Insert']>
      }
      spreadsheet_imports: {
        Row: {
          id: string
          created_at: string
          tenant_id: string
          imported_by: string | null
          file_name: string | null
          rows_processed: number
          rows_success: number
          rows_error: number
          status: 'processando' | 'concluido' | 'erro'
          error_log: Json | null
          column_mapping: Json | null
          administrator: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          tenant_id: string
          imported_by?: string | null
          file_name?: string | null
          rows_processed?: number
          rows_success?: number
          rows_error?: number
          status?: 'processando' | 'concluido' | 'erro'
          error_log?: Json | null
          column_mapping?: Json | null
          administrator?: string | null
        }
        Update: Partial<Database['public']['Tables']['spreadsheet_imports']['Insert']>
      }
      chat_messages: {
        Row: {
          id: string
          created_at: string
          tenant_id: string
          consorciado_id: string
          sender_role: 'client' | 'seller' | null
          sender_id: string | null
          message: string
          read_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          tenant_id: string
          consorciado_id: string
          sender_role?: 'client' | 'seller' | null
          sender_id?: string | null
          message: string
          read_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
      call_logs: {
        Row: {
          id: string
          created_at: string
          tenant_id: string
          seller_id: string
          lead_id: string | null
          consorciado_id: string | null
          contact_name: string
          contact_phone: string | null
          called_at: string
          duration_minutes: number | null
          outcome: CallOutcome
          notes: string | null
          scheduled_callback_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          tenant_id: string
          seller_id: string
          lead_id?: string | null
          consorciado_id?: string | null
          contact_name: string
          contact_phone?: string | null
          called_at?: string
          duration_minutes?: number | null
          outcome: CallOutcome
          notes?: string | null
          scheduled_callback_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['call_logs']['Insert']>
      }
      presentation_templates: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          category: 'imovel' | 'auto' | 'moto' | 'servicos' | 'universal'
          thumbnail_url: string | null
          slides: Json
          theme: Json
          animation_style: 'fade' | 'slide' | 'zoom' | 'flip'
          is_active: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          category: 'imovel' | 'auto' | 'moto' | 'servicos' | 'universal'
          thumbnail_url?: string | null
          slides: Json
          theme: Json
          animation_style?: 'fade' | 'slide' | 'zoom' | 'flip'
          is_active?: boolean
          sort_order?: number
        }
        Update: Partial<Database['public']['Tables']['presentation_templates']['Insert']>
      }
      presentations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          tenant_id: string
          seller_id: string | null
          template_id: string | null
          lead_id: string | null
          consorciado_id: string | null
          title: string
          slides: Json
          customization: Json
          share_token: string | null
          share_expires_at: string | null
          view_count: number
          last_viewed_at: string | null
          status: 'rascunho' | 'finalizada' | 'enviada' | 'visualizada'
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          tenant_id: string
          seller_id?: string | null
          template_id?: string | null
          lead_id?: string | null
          consorciado_id?: string | null
          title: string
          slides: Json
          customization?: Json
          share_token?: string | null
          share_expires_at?: string | null
          view_count?: number
          last_viewed_at?: string | null
          status?: 'rascunho' | 'finalizada' | 'enviada' | 'visualizada'
        }
        Update: Partial<Database['public']['Tables']['presentations']['Insert']>
      }
    }
    Functions: {
      get_my_tenant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
  }
}
