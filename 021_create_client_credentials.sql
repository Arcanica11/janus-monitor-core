-- Create client_credentials table
create table if not exists client_credentials (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  type text not null, -- 'hosting', 'database', 'cms', 'social_media', 'email', 'other'
  service_name text not null,
  url text,
  username text not null,
  password text not null, -- Encrypted
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS Policies
alter table client_credentials enable row level security;

create policy "Users can view credentials of their org"
  on client_credentials for select
  using ( organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "Users can insert credentials for their org"
  on client_credentials for insert
  with check ( organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "Users can update credentials of their org"
  on client_credentials for update
  using ( organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "Users can delete credentials of their org"
  on client_credentials for delete
  using ( organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));
