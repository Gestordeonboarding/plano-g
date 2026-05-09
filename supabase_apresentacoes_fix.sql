-- ============================================================
-- CORREÇÃO: Cria tabelas de apresentações e insere os 8 templates
-- ============================================================

-- 1. Tabela de templates (sem dependências externas)
create table if not exists presentation_templates (
  id             uuid default gen_random_uuid() primary key,
  name           text not null,
  description    text,
  category       text not null default 'universal',
  thumbnail_url  text,
  slides         jsonb not null default '[]',
  theme          jsonb not null default '{}',
  animation_style text not null default 'slide',
  is_active      boolean default true,
  sort_order     integer default 0,
  created_at     timestamptz default now()
);

-- 2. Tabela de apresentações (sem FK para leads — evita erro)
create table if not exists presentations (
  id               uuid default gen_random_uuid() primary key,
  tenant_id        uuid not null references tenants(id) on delete cascade,
  seller_id        uuid references users(id) on delete set null,
  template_id      uuid references presentation_templates(id) on delete set null,
  lead_id          uuid,
  title            text not null default 'Nova Apresentação',
  slides           jsonb not null default '[]',
  customization    jsonb not null default '{}',
  status           text not null default 'rascunho'
                     check (status in ('rascunho','finalizada','enviada','visualizada')),
  share_token      text unique,
  share_expires_at timestamptz,
  view_count       integer default 0,
  last_viewed_at   timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- RLS
alter table presentation_templates enable row level security;
alter table presentations enable row level security;

-- Templates: leitura pública
drop policy if exists "pt_public_read" on presentation_templates;
create policy "pt_public_read" on presentation_templates for select using (true);

-- Presentations: só o tenant
drop policy if exists "pres_select" on presentations;
drop policy if exists "pres_insert" on presentations;
drop policy if exists "pres_update" on presentations;
drop policy if exists "pres_delete" on presentations;
create policy "pres_select" on presentations for select
  using (tenant_id in (select tenant_id from users where id = auth.uid()));
create policy "pres_insert" on presentations for insert
  with check (tenant_id in (select tenant_id from users where id = auth.uid()));
create policy "pres_update" on presentations for update
  using (tenant_id in (select tenant_id from users where id = auth.uid()));
create policy "pres_delete" on presentations for delete
  using (tenant_id in (select tenant_id from users where id = auth.uid()));

-- ============================================================
-- SEED: 8 Templates
-- ============================================================

insert into presentation_templates (name, description, category, animation_style, sort_order, theme, slides, is_active) values

-- 1. Proposta Imóvel
('Proposta Imóvel', 'Ideal para apresentações de consórcio imobiliário', 'imovel', 'slide', 1,
 '{"accent_color":"#00D4C8","bg_color":"#0D1F1E","font":"inter","show_logo":true}',
 '[
   {"id":"s1","type":"cover","title":"Capa","editable_fields":[{"key":"client_name","label":"Nome do cliente","type":"text","value":"","placeholder":"João Silva","required":true,"max_chars":100},{"key":"subtitle","label":"Subtítulo","type":"text","value":"","placeholder":"Proposta de Consórcio Imobiliário","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true},
   {"id":"s2","type":"problem","title":"O sonho da casa própria","editable_fields":[{"key":"problem_text","label":"Texto do problema","type":"textarea","value":"","placeholder":"Financiar um imóvel custa o dobro do valor...","required":false,"max_chars":500}],"layout":"split","background":"dark","locked":false,"visible":true},
   {"id":"s3","type":"solution","title":"Por que consórcio?","editable_fields":[{"key":"benefit1","label":"Benefício 1","type":"text","value":"","placeholder":"Sem juros abusivos","required":false,"max_chars":100},{"key":"benefit2","label":"Benefício 2","type":"text","value":"","placeholder":"Parcelas fixas e acessíveis","required":false,"max_chars":100},{"key":"benefit3","label":"Benefício 3","type":"text","value":"","placeholder":"Liberdade para escolher o imóvel","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s4","type":"comparison","title":"Consórcio vs Financiamento","editable_fields":[{"key":"financiamento_total","label":"Custo total financiamento","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"consorcio_total","label":"Custo total consórcio","type":"currency","value":"","placeholder":"R$ 0,00","required":false}],"layout":"split","background":"dark","locked":false,"visible":true},
   {"id":"s5","type":"numbers","title":"Seu plano personalizado","editable_fields":[{"key":"credit_value","label":"Valor do crédito","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"monthly_payment","label":"Parcela mensal","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"total_months","label":"Prazo (meses)","type":"text","value":"","placeholder":"180","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s6","type":"timeline","title":"Como funciona a contemplação","editable_fields":[{"key":"step1","label":"Passo 1","type":"text","value":"","placeholder":"Adesão ao grupo","required":false,"max_chars":100},{"key":"step2","label":"Passo 2","type":"text","value":"","placeholder":"Assembleias mensais","required":false,"max_chars":100},{"key":"step3","label":"Passo 3","type":"text","value":"","placeholder":"Contemplação e uso da carta","required":false,"max_chars":100}],"layout":"full","background":"dark","locked":false,"visible":true},
   {"id":"s7","type":"about","title":"Sobre nós","editable_fields":[{"key":"company_name","label":"Nome da empresa","type":"text","value":"","placeholder":"Minha Empresa","required":false,"max_chars":100},{"key":"about_text","label":"Texto sobre a empresa","type":"textarea","value":"","placeholder":"Somos especialistas em consórcio...","required":false,"max_chars":500}],"layout":"split","background":"dark","locked":false,"visible":true},
   {"id":"s8","type":"cta","title":"Próximos passos","editable_fields":[{"key":"cta_text","label":"Chamada para ação","type":"text","value":"","placeholder":"Vamos começar sua jornada!","required":false,"max_chars":100},{"key":"phone","label":"WhatsApp","type":"text","value":"","placeholder":"(11) 99999-9999","required":false,"max_chars":100},{"key":"email","label":"Email","type":"text","value":"","placeholder":"contato@empresa.com","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true}
 ]', true),

-- 2. Proposta Auto Premium
('Proposta Auto Premium', 'Para consórcio de veículos de alto padrão', 'auto', 'zoom', 2,
 '{"accent_color":"#3B82F6","bg_color":"#0D1F1E","font":"inter","show_logo":true}',
 '[
   {"id":"s1","type":"cover","title":"Capa","editable_fields":[{"key":"client_name","label":"Nome do cliente","type":"text","value":"","placeholder":"Maria Souza","required":true,"max_chars":100},{"key":"car_model","label":"Modelo do veículo","type":"text","value":"","placeholder":"Toyota Corolla","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true},
   {"id":"s2","type":"problem","title":"Liberdade de escolher","editable_fields":[{"key":"text","label":"Texto","type":"textarea","value":"","placeholder":"Com consórcio você escolhe o veículo que quiser...","required":false,"max_chars":500}],"layout":"split","background":"dark","locked":false,"visible":true},
   {"id":"s3","type":"comparison","title":"Custo real da compra","editable_fields":[{"key":"financing_cost","label":"Custo financiamento","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"consortium_cost","label":"Custo consórcio","type":"currency","value":"","placeholder":"R$ 0,00","required":false}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s4","type":"numbers","title":"Seu plano de veículo","editable_fields":[{"key":"credit_value","label":"Valor do crédito","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"monthly_payment","label":"Parcela mensal","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"months","label":"Meses","type":"text","value":"","placeholder":"60","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s5","type":"solution","title":"Simulação de lance","editable_fields":[{"key":"lance_value","label":"Lance estimado","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"lance_pct","label":"Percentual do lance","type":"text","value":"","placeholder":"20%","required":false,"max_chars":100},{"key":"obs","label":"Observações","type":"textarea","value":"","placeholder":"","required":false,"max_chars":500}],"layout":"split","background":"dark","locked":false,"visible":true},
   {"id":"s6","type":"about","title":"Por que nos escolher","editable_fields":[{"key":"diff1","label":"Diferencial 1","type":"text","value":"","placeholder":"Assessoria completa","required":false,"max_chars":100},{"key":"diff2","label":"Diferencial 2","type":"text","value":"","placeholder":"Melhor custo-benefício","required":false,"max_chars":100},{"key":"diff3","label":"Diferencial 3","type":"text","value":"","placeholder":"Suporte pós-venda","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s7","type":"cta","title":"Vamos fechar?","editable_fields":[{"key":"cta_text","label":"Chamada","type":"text","value":"","placeholder":"Seu novo veículo está a um passo!","required":false,"max_chars":100},{"key":"phone","label":"WhatsApp","type":"text","value":"","placeholder":"(11) 99999-9999","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true}
 ]', true),

-- 3. Apresentação Institucional
('Apresentação Institucional', 'Apresente sua empresa antes de falar do produto', 'universal', 'fade', 3,
 '{"accent_color":"#00D4C8","bg_color":"#0D1F1E","font":"inter","show_logo":true}',
 '[
   {"id":"s1","type":"cover","title":"Capa","editable_fields":[{"key":"company_name","label":"Nome da empresa","type":"text","value":"","placeholder":"Minha Empresa","required":true,"max_chars":100},{"key":"tagline","label":"Tagline","type":"text","value":"","placeholder":"Realizando sonhos desde 2010","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true},
   {"id":"s2","type":"about","title":"Nossa história","editable_fields":[{"key":"history","label":"História","type":"textarea","value":"","placeholder":"Fundada em 2010, somos referência em...","required":false,"max_chars":500}],"layout":"split","background":"dark","locked":false,"visible":true},
   {"id":"s3","type":"numbers","title":"Nossos números","editable_fields":[{"key":"clients","label":"Clientes atendidos","type":"text","value":"","placeholder":"500+","required":false,"max_chars":100},{"key":"years","label":"Anos de mercado","type":"text","value":"","placeholder":"14","required":false,"max_chars":100},{"key":"satisfaction","label":"Satisfação","type":"text","value":"","placeholder":"98%","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s4","type":"solution","title":"O que fazemos","editable_fields":[{"key":"service1","label":"Serviço 1","type":"text","value":"","placeholder":"Consórcio Imobiliário","required":false,"max_chars":100},{"key":"service2","label":"Serviço 2","type":"text","value":"","placeholder":"Consórcio de Veículos","required":false,"max_chars":100},{"key":"service3","label":"Serviço 3","type":"text","value":"","placeholder":"Assessoria completa","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s5","type":"problem","title":"Por que consórcio","editable_fields":[{"key":"why","label":"Por que escolher","type":"textarea","value":"","placeholder":"Consórcio é a forma mais inteligente de realizar seu sonho...","required":false,"max_chars":500}],"layout":"split","background":"dark","locked":false,"visible":true},
   {"id":"s6","type":"testimonial","title":"Cases de sucesso","editable_fields":[{"key":"client","label":"Nome do cliente","type":"text","value":"","placeholder":"Pedro Costa","required":false,"max_chars":100},{"key":"testimonial","label":"Depoimento","type":"textarea","value":"","placeholder":"Realizei o sonho da casa própria com muito menos custo...","required":false,"max_chars":500}],"layout":"centered","background":"dark","locked":false,"visible":true},
   {"id":"s7","type":"cta","title":"Fale conosco","editable_fields":[{"key":"phone","label":"WhatsApp","type":"text","value":"","placeholder":"(11) 99999-9999","required":false,"max_chars":100},{"key":"email","label":"Email","type":"text","value":"","placeholder":"contato@empresa.com","required":false,"max_chars":100},{"key":"site","label":"Site","type":"text","value":"","placeholder":"www.empresa.com","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true}
 ]', true),

-- 4. Proposta Rápida
('Proposta Rápida', 'Versão compacta para reuniões curtas', 'universal', 'slide', 4,
 '{"accent_color":"#00D4C8","bg_color":"#0D1F1E","font":"inter","show_logo":true}',
 '[
   {"id":"s1","type":"cover","title":"Capa","editable_fields":[{"key":"client_name","label":"Nome do cliente","type":"text","value":"","placeholder":"Cliente","required":true,"max_chars":100},{"key":"company","label":"Empresa","type":"text","value":"","placeholder":"Minha Empresa","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true},
   {"id":"s2","type":"problem","title":"Seu objetivo","editable_fields":[{"key":"goal","label":"Objetivo do cliente","type":"textarea","value":"","placeholder":"Adquirir imóvel / veículo / serviço...","required":false,"max_chars":500}],"layout":"centered","background":"dark","locked":false,"visible":true},
   {"id":"s3","type":"numbers","title":"Nossa solução","editable_fields":[{"key":"credit","label":"Crédito","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"parcela","label":"Parcela","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"prazo","label":"Prazo","type":"text","value":"","placeholder":"180 meses","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s4","type":"timeline","title":"Próximos passos","editable_fields":[{"key":"step1","label":"Passo 1","type":"text","value":"","placeholder":"Assinatura do contrato","required":false,"max_chars":100},{"key":"step2","label":"Passo 2","type":"text","value":"","placeholder":"Início das assembleias","required":false,"max_chars":100},{"key":"step3","label":"Passo 3","type":"text","value":"","placeholder":"Contemplação","required":false,"max_chars":100}],"layout":"full","background":"dark","locked":false,"visible":true},
   {"id":"s5","type":"cta","title":"Vamos começar!","editable_fields":[{"key":"phone","label":"WhatsApp","type":"text","value":"","placeholder":"(11) 99999-9999","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true}
 ]', true),

-- 5. Conquiste seu Imóvel
('Conquiste seu Imóvel', 'Foco emocional e aspiracional', 'imovel', 'flip', 5,
 '{"accent_color":"#8B5CF6","bg_color":"#0D1F1E","font":"inter","show_logo":true}',
 '[
   {"id":"s1","type":"cover","title":"Capa Cinematográfica","editable_fields":[{"key":"client_name","label":"Nome","type":"text","value":"","placeholder":"Ana Paula","required":true,"max_chars":100},{"key":"dream","label":"O sonho","type":"text","value":"","placeholder":"A casa dos seus sonhos","required":false,"max_chars":100}],"layout":"full","background":"accent","locked":false,"visible":true},
   {"id":"s2","type":"testimonial","title":"Quem já realizou","editable_fields":[{"key":"name","label":"Nome","type":"text","value":"","placeholder":"Roberto Lima","required":false,"max_chars":100},{"key":"story","label":"História","type":"textarea","value":"","placeholder":"Há 2 anos atrás eu não acreditava que seria possível...","required":false,"max_chars":500}],"layout":"split","background":"dark","locked":false,"visible":true},
   {"id":"s3","type":"problem","title":"Por que agora é o momento","editable_fields":[{"key":"reason","label":"Motivo","type":"textarea","value":"","placeholder":"O mercado imobiliário valoriza 12% ao ano...","required":false,"max_chars":500}],"layout":"centered","background":"dark","locked":false,"visible":true},
   {"id":"s4","type":"numbers","title":"Seu plano","editable_fields":[{"key":"credit","label":"Valor do crédito","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"parcela","label":"Parcela mensal","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"prazo","label":"Prazo","type":"text","value":"","placeholder":"180 meses","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s5","type":"solution","title":"Diferenciais","editable_fields":[{"key":"d1","label":"Diferencial 1","type":"text","value":"","placeholder":"Sem juros","required":false,"max_chars":100},{"key":"d2","label":"Diferencial 2","type":"text","value":"","placeholder":"Carta de crédito valorizada","required":false,"max_chars":100},{"key":"d3","label":"Diferencial 3","type":"text","value":"","placeholder":"Flexibilidade total","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s6","type":"cta","title":"Realize seu sonho","editable_fields":[{"key":"cta","label":"Chamada","type":"text","value":"","placeholder":"A casa própria está mais perto do que você imagina!","required":false,"max_chars":100},{"key":"phone","label":"WhatsApp","type":"text","value":"","placeholder":"(11) 99999-9999","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true}
 ]', true),

-- 6. Auto Acessível
('Auto Acessível', 'Foco em custo baixo e acessibilidade', 'auto', 'slide', 6,
 '{"accent_color":"#F59E0B","bg_color":"#0D1F1E","font":"inter","show_logo":true}',
 '[
   {"id":"s1","type":"cover","title":"Capa","editable_fields":[{"key":"client_name","label":"Nome","type":"text","value":"","placeholder":"Carlos","required":true,"max_chars":100},{"key":"vehicle","label":"Veículo desejado","type":"text","value":"","placeholder":"Moto / Carro","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true},
   {"id":"s2","type":"problem","title":"O problema do financiamento","editable_fields":[{"key":"problem","label":"Problema","type":"textarea","value":"","placeholder":"No financiamento você paga até 100% a mais pelo veículo...","required":false,"max_chars":500}],"layout":"split","background":"dark","locked":false,"visible":true},
   {"id":"s3","type":"solution","title":"A solução consórcio","editable_fields":[{"key":"b1","label":"Benefício 1","type":"text","value":"","placeholder":"Parcela acessível","required":false,"max_chars":100},{"key":"b2","label":"Benefício 2","type":"text","value":"","placeholder":"Zero juros","required":false,"max_chars":100},{"key":"b3","label":"Benefício 3","type":"text","value":"","placeholder":"Escolha livre do veículo","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s4","type":"numbers","title":"Seu plano","editable_fields":[{"key":"credit","label":"Crédito","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"parcela","label":"Parcela (cabe no bolso!)","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"meses","label":"Meses","type":"text","value":"","placeholder":"60","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s5","type":"comparison","title":"Compare você mesmo","editable_fields":[{"key":"fin_total","label":"Total financiamento","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"con_total","label":"Total consórcio","type":"currency","value":"","placeholder":"R$ 0,00","required":false}],"layout":"split","background":"dark","locked":false,"visible":true},
   {"id":"s6","type":"cta","title":"Seu veículo novo te espera","editable_fields":[{"key":"phone","label":"WhatsApp","type":"text","value":"","placeholder":"(11) 99999-9999","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true}
 ]', true),

-- 7. Proposta Investimento
('Proposta Investimento', 'Consórcio como estratégia de patrimônio', 'universal', 'fade', 7,
 '{"accent_color":"#10B981","bg_color":"#0D1F1E","font":"inter","show_logo":true}',
 '[
   {"id":"s1","type":"cover","title":"Capa","editable_fields":[{"key":"client_name","label":"Nome","type":"text","value":"","placeholder":"Investidor","required":true,"max_chars":100},{"key":"subtitle","label":"Subtítulo","type":"text","value":"","placeholder":"Construindo patrimônio com inteligência","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true},
   {"id":"s2","type":"problem","title":"Consórcio como investimento","editable_fields":[{"key":"text","label":"Argumento","type":"textarea","value":"","placeholder":"Enquanto outros perdem dinheiro com juros, você constrói patrimônio...","required":false,"max_chars":500}],"layout":"split","background":"dark","locked":false,"visible":true},
   {"id":"s3","type":"comparison","title":"Vs outros investimentos","editable_fields":[{"key":"cdi","label":"CDI (12 meses)","type":"text","value":"","placeholder":"11% a.a.","required":false,"max_chars":100},{"key":"consorcio","label":"Consórcio (valorização)","type":"text","value":"","placeholder":"15% a.a. no imóvel","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s4","type":"numbers","title":"Simulação de retorno","editable_fields":[{"key":"invested","label":"Valor investido","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"patrimony","label":"Patrimônio estimado em 5 anos","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"roi","label":"Retorno estimado","type":"text","value":"","placeholder":"35%","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s5","type":"timeline","title":"Seu plano","editable_fields":[{"key":"s1","label":"Fase 1","type":"text","value":"","placeholder":"Adesão e parcelas","required":false,"max_chars":100},{"key":"s2","label":"Fase 2","type":"text","value":"","placeholder":"Contemplação","required":false,"max_chars":100},{"key":"s3","label":"Fase 3","type":"text","value":"","placeholder":"Valorização do bem","required":false,"max_chars":100}],"layout":"full","background":"dark","locked":false,"visible":true},
   {"id":"s6","type":"cta","title":"Comece a investir hoje","editable_fields":[{"key":"cta","label":"Chamada","type":"text","value":"","placeholder":"Seu patrimônio começa agora!","required":false,"max_chars":100},{"key":"phone","label":"WhatsApp","type":"text","value":"","placeholder":"(11) 99999-9999","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true}
 ]', true),

-- 8. Proposta Serviços
('Proposta Serviços', 'Para viagem, cirurgia, reforma e outros serviços', 'servicos', 'zoom', 8,
 '{"accent_color":"#EC4899","bg_color":"#0D1F1E","font":"inter","show_logo":true}',
 '[
   {"id":"s1","type":"cover","title":"Capa","editable_fields":[{"key":"client_name","label":"Nome","type":"text","value":"","placeholder":"Cliente","required":true,"max_chars":100},{"key":"service","label":"Projeto desejado","type":"text","value":"","placeholder":"Viagem / Cirurgia / Reforma","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true},
   {"id":"s2","type":"problem","title":"Realize seu projeto","editable_fields":[{"key":"dream","label":"Sonho do cliente","type":"textarea","value":"","placeholder":"Você merece realizar esse projeto sem comprometer seu orçamento...","required":false,"max_chars":500}],"layout":"split","background":"dark","locked":false,"visible":true},
   {"id":"s3","type":"solution","title":"Como funciona","editable_fields":[{"key":"h1","label":"Como 1","type":"text","value":"","placeholder":"Escolha o valor do crédito","required":false,"max_chars":100},{"key":"h2","label":"Como 2","type":"text","value":"","placeholder":"Pague parcelas acessíveis","required":false,"max_chars":100},{"key":"h3","label":"Como 3","type":"text","value":"","placeholder":"Use a carta quando contemplado","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s4","type":"numbers","title":"Seu plano personalizado","editable_fields":[{"key":"credit","label":"Valor do crédito","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"parcela","label":"Parcela mensal","type":"currency","value":"","placeholder":"R$ 0,00","required":false},{"key":"prazo","label":"Prazo","type":"text","value":"","placeholder":"36 meses","required":false,"max_chars":100}],"layout":"cards","background":"dark","locked":false,"visible":true},
   {"id":"s5","type":"cta","title":"Próximos passos","editable_fields":[{"key":"cta","label":"Chamada","type":"text","value":"","placeholder":"Seu projeto começa hoje!","required":false,"max_chars":100},{"key":"phone","label":"WhatsApp","type":"text","value":"","placeholder":"(11) 99999-9999","required":false,"max_chars":100}],"layout":"centered","background":"accent","locked":false,"visible":true}
 ]', true)

on conflict do nothing;
