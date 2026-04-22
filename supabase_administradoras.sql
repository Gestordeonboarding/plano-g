-- ============================================================
-- EXECUTAR NO SUPABASE SQL EDITOR (Dashboard → SQL Editor)
-- ============================================================

-- 1. Tabela master de administradoras (lista pré-cadastrada)
create table if not exists administradoras (
  id   uuid default gen_random_uuid() primary key,
  nome text not null,
  slug text unique not null,
  cor  text default '#6B7280',
  created_at timestamptz default now()
);

-- 2. Quais administradoras cada tenant representa + suas taxas
create table if not exists tenant_administradoras (
  id                  uuid default gen_random_uuid() primary key,
  tenant_id           uuid not null references tenants(id) on delete cascade,
  administradora_id   uuid not null references administradoras(id) on delete cascade,
  taxa_administracao  numeric(5,2) default 0,
  fundo_reserva       numeric(5,2) default 0,
  comissao_venda      numeric(5,2) default 0,
  comissao_lance      numeric(5,2) default 0,
  ativa               boolean default true,
  created_at          timestamptz default now(),
  unique(tenant_id, administradora_id)
);

-- 3. Cartas disponíveis por tenant/administradora
create table if not exists cartas (
  id                      uuid default gen_random_uuid() primary key,
  tenant_id               uuid not null references tenants(id) on delete cascade,
  tenant_administradora_id uuid not null references tenant_administradoras(id) on delete cascade,
  tipo                    text not null check (tipo in ('imovel','auto','moto','servico','outros')),
  valor_credito           numeric(12,2) not null,
  prazo_meses             integer not null,
  parcela_estimada        numeric(10,2),
  contemplacao_media      numeric(5,2),
  disponivel              boolean default true,
  descricao               text,
  created_at              timestamptz default now()
);

-- RLS
alter table administradoras enable row level security;
alter table tenant_administradoras enable row level security;
alter table cartas enable row level security;

-- administradoras: leitura pública
create policy "adm_public_read" on administradoras for select using (true);

-- tenant_administradoras: só membros do tenant
create policy "tadm_select" on tenant_administradoras for select
  using (tenant_id in (select tenant_id from users where id = auth.uid()));
create policy "tadm_insert" on tenant_administradoras for insert
  with check (tenant_id in (select tenant_id from users where id = auth.uid()));
create policy "tadm_update" on tenant_administradoras for update
  using (tenant_id in (select tenant_id from users where id = auth.uid()));
create policy "tadm_delete" on tenant_administradoras for delete
  using (tenant_id in (select tenant_id from users where id = auth.uid()));

-- cartas: só membros do tenant
create policy "cartas_select" on cartas for select
  using (tenant_id in (select tenant_id from users where id = auth.uid()));
create policy "cartas_insert" on cartas for insert
  with check (tenant_id in (select tenant_id from users where id = auth.uid()));
create policy "cartas_update" on cartas for update
  using (tenant_id in (select tenant_id from users where id = auth.uid()));
create policy "cartas_delete" on cartas for delete
  using (tenant_id in (select tenant_id from users where id = auth.uid()));

-- Seed: administradoras brasileiras
insert into administradoras (nome, slug, cor) values
  ('Embracon',              'embracon',   '#E8401C'),
  ('Porto Seguro',          'porto',      '#003087'),
  ('Ademicon',              'ademicon',   '#FF6B00'),
  ('Rodobens',              'rodobens',   '#C4162A'),
  ('Magalu Consórcios',     'magalu',     '#0086FF'),
  ('Sompo',                 'sompo',      '#006B3F'),
  ('BB Consórcios',         'bb',         '#FFCA00'),
  ('Caixa Consórcios',      'caixa',      '#005CA9'),
  ('Sicoob',                'sicoob',     '#008542'),
  ('Randon',                'randon',     '#E31E24'),
  ('BV Consórcios',         'bv',         '#5A2D82'),
  ('Itaú Consórcios',       'itau',       '#EC7000'),
  ('Bradesco Consórcios',   'bradesco',   '#CC092F'),
  ('Santander Consórcios',  'santander',  '#EC0000'),
  ('Midway',                'midway',     '#00A651'),
  ('Votorantim',            'votorantim', '#1E3A5F'),
  ('Sulcredi',              'sulcredi',   '#004B8D'),
  ('Banco do Nordeste',     'bnb',        '#009B3A'),
  ('Pão de Açúcar',         'pao-acucar', '#FF6600'),
  ('Outra',                 'outra',      '#6B7280')
on conflict (slug) do nothing;
