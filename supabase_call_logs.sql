-- ============================================================
-- Módulo de Rastreamento de Ligações
-- Executar no Supabase SQL Editor.
-- ============================================================

create table if not exists call_logs (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz default now(),
  tenant_id              uuid not null references tenants(id) on delete cascade,
  seller_id              uuid not null references users(id) on delete cascade,
  lead_id                uuid references leads(id) on delete set null,
  consorciado_id         uuid references consorciados(id) on delete set null,
  contact_name           text not null,
  contact_phone          text,
  called_at              timestamptz not null default now(),
  duration_minutes       integer,
  outcome                text not null check (outcome in (
    'atendeu',
    'nao_atendeu',
    'caixa_postal',
    'numero_errado',
    'agendou_reuniao',
    'proposta_enviada',
    'venda_realizada',
    'nao_tem_interesse'
  )),
  notes                  text,
  scheduled_callback_at  timestamptz
);

create index if not exists call_logs_tenant_idx       on call_logs(tenant_id);
create index if not exists call_logs_seller_idx       on call_logs(seller_id);
create index if not exists call_logs_lead_idx         on call_logs(lead_id);
create index if not exists call_logs_consorciado_idx  on call_logs(consorciado_id);
create index if not exists call_logs_called_at_idx    on call_logs(called_at desc);
create index if not exists call_logs_callback_idx     on call_logs(scheduled_callback_at)
  where scheduled_callback_at is not null;

-- RLS
alter table call_logs enable row level security;

-- Leitura: vendedor vê apenas as próprias ligações; admin vê tudo do tenant
drop policy if exists "call_logs_select" on call_logs;
create policy "call_logs_select" on call_logs for select
  using (
    seller_id = auth.uid()
    or (
      tenant_id in (select tenant_id from users where id = auth.uid())
      and get_my_role() in ('agency_admin', 'tenant_admin')
    )
  );

-- Insert: vendedor só insere com seller_id = auth.uid(); admins podem inserir em qualquer seller do tenant
drop policy if exists "call_logs_insert" on call_logs;
create policy "call_logs_insert" on call_logs for insert
  with check (
    tenant_id in (select tenant_id from users where id = auth.uid())
    and (
      seller_id = auth.uid()
      or get_my_role() in ('agency_admin', 'tenant_admin')
    )
  );

-- Update / Delete: dono ou admin do tenant
drop policy if exists "call_logs_update" on call_logs;
create policy "call_logs_update" on call_logs for update
  using (
    seller_id = auth.uid()
    or (
      tenant_id in (select tenant_id from users where id = auth.uid())
      and get_my_role() in ('agency_admin', 'tenant_admin')
    )
  );

drop policy if exists "call_logs_delete" on call_logs;
create policy "call_logs_delete" on call_logs for delete
  using (
    seller_id = auth.uid()
    or (
      tenant_id in (select tenant_id from users where id = auth.uid())
      and get_my_role() in ('agency_admin', 'tenant_admin')
    )
  );
