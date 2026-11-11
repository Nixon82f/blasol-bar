-- TABLAS PARA BLA SOL BAR EN SUPABASE

-- 1. Tabla de configuración global (catálogo de productos, freezers, insumos, settings)
create table if not exists app_config (
  id text primary key default 'main',
  products jsonb not null default '[]'::jsonb,
  freezers jsonb not null default '["Freezer 1", "Freezer 2"]'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  insumos jsonb not null default '[]'::jsonb,
  last_cost jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de registros diarios (cada fila es un día YYYY-MM-DD)
create table if not exists daily_sheets (
  date text primary key, -- 'YYYY-MM-DD'
  rows jsonb not null default '{}'::jsonb,
  entradas jsonb not null default '[]'::jsonb,
  gastos jsonb not null default '[]'::jsonb,
  caja jsonb not null default '{"efectivo": "", "transf": "", "restarGastos": true}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tabla de fiados
create table if not exists debts (
  id text primary key,
  name text not null,
  detail text,
  amount numeric not null default 0,
  date text not null,
  status text not null default 'pendiente',
  resolved_date text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS) o permitir acceso con anon key para simplicidad del bar:
alter table app_config enable row level security;
alter table daily_sheets enable row level security;
alter table debts enable row level security;

-- Políticas de acceso para usuarios autorizados / anónimos con API Key:
create policy "Acceso completo a app_config" on app_config for all using (true) with check (true);
create policy "Acceso completo a daily_sheets" on daily_sheets for all using (true) with check (true);
create policy "Acceso completo a debts" on debts for all using (true) with check (true);

-- Habilitar Realtime para reflejar cambios en vivo en ambos celulares
alter publication supabase_realtime add table app_config;
alter publication supabase_realtime add table daily_sheets;
alter publication supabase_realtime add table debts;
