-- ============================================================
-- MIGRAÇÃO PARA APRESENTAÇÕES V2
--
-- Quebra de compatibilidade intencional: apresentações criadas
-- na v1 (esquema field-based) são descartadas. Templates v1
-- também são removidos antes do reseed.
--
-- Execute no Supabase SQL Editor.
-- ============================================================

-- 1. Acrescentar colunas v2 na tabela de templates
alter table presentation_templates
  add column if not exists default_customization jsonb not null default '{}',
  add column if not exists schema_version integer not null default 2;

-- 2. Acrescentar coluna v2 na tabela de apresentações
alter table presentations
  add column if not exists schema_version integer not null default 2;

-- 3. Tornar opcionais as colunas antigas (caso ainda existam)
alter table presentation_templates
  alter column theme drop not null,
  alter column animation_style drop not null;

-- 4. Limpar dados antigos (BREAKING CHANGE — opção A escolhida)
delete from presentations where coalesce(schema_version, 1) < 2;
delete from presentation_templates where coalesce(schema_version, 1) < 2;

-- 4.1. Atualizar check constraint de category — v2 inclui 'investimento'
alter table presentation_templates
  drop constraint if exists presentation_templates_category_check;

alter table presentation_templates
  add constraint presentation_templates_category_check
  check (category in ('imovel', 'auto', 'moto', 'servicos', 'investimento', 'universal'));

-- 5. Remover colunas antigas (opcional — comentar caso queira manter)
-- alter table presentation_templates drop column if exists theme;
-- alter table presentation_templates drop column if exists animation_style;
