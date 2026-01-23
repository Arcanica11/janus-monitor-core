-- Create tickets table
create table if not exists tickets (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references organizations(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  subject text not null,
  description text,
  status text default 'open' not null, -- open, in_progress, closed
  priority text default 'medium' not null, -- low, medium, high
  created_by uuid references profiles(id),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- RLS Policies
alter table tickets enable row level security;

create policy "Users can view tickets of their org"
  on tickets for select
  using ( organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "Users can insert tickets for their org"
  on tickets for insert
  with check ( organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "Users can update tickets of their org"
  on tickets for update
  using ( organization_id in (
    select organization_id from profiles where id = auth.uid()
  ));
