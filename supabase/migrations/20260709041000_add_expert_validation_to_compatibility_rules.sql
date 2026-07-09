alter table public.compatibility_rules
  add column if not exists expert_validated boolean not null default true,
  add column if not exists expert_notes text;
