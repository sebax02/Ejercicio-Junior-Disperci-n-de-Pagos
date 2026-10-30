create table beneficiaries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document_id text not null unique,
  bank text not null,
  account_number text not null,
  email text,
  created_at timestamptz default now()
);

create table disbursement_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'DRAFT',
  total_amount numeric(12,2) not null default 0,
  created_at timestamptz default now(),
  processed_at timestamptz
);

create table disbursement_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references disbursement_batches(id) on delete cascade,
  beneficiary_id uuid not null references beneficiaries(id),
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'PENDING',
  failure_reason text,
  processed_at timestamptz,
  unique (batch_id, beneficiary_id)
);
