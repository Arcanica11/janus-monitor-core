-- =============================================================================
-- MASTER SQL SCRIPT: Janus Monitor Core Schema & Security
-- =============================================================================
-- Author: Antigravity
-- Description: Full database setup including Tables, RLS, Triggers, and Storage.
-- Context: Next.js 15 + Supabase Multi-tenant SaaS

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- =============================================================================
-- 1. TABLES & SCHEMA
-- =============================================================================

-- 1.1 ORGANIZATIONS (Tenant Root)
create table public.organizations (
    id uuid not null default gen_random_uuid(),
    name text not null,
    slug text not null,
    logo_url text null,
    is_internal boolean default false, -- True for 'Arknica'
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    
    constraint organizations_pkey primary key (id),
    constraint organizations_slug_key unique (slug)
);

-- 1.2 PROFILES (Extends auth.users)
create type public.app_role as enum ('admin', 'super_admin');

create table public.profiles (
    id uuid not null, -- References auth.users(id)
    organization_id uuid null, -- Nullable initially until assigned
    role public.app_role default 'admin'::public.app_role,
    full_name text null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    constraint profiles_pkey primary key (id),
    constraint profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade,
    constraint profiles_organization_id_fkey foreign key (organization_id) references public.organizations(id)
);

-- 1.3 CLIENTS (End-customers of Agencies)
create table public.clients (
    id uuid not null default gen_random_uuid(),
    organization_id uuid not null,
    unique_client_id text not null,
    name text not null,
    contact_email text null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    constraint clients_pkey primary key (id),
    constraint clients_unique_client_id_key unique (unique_client_id),
    constraint clients_organization_id_fkey foreign key (organization_id) references public.organizations(id) on delete cascade
);

-- 1.4 DOMAINS
create table public.domains (
    id uuid not null default gen_random_uuid(),
    organization_id uuid not null, -- Denormalized for RLS efficiency
    linked_client_id uuid not null,
    url text not null,
    provider text not null, -- 'Vercel', 'InMotion', etc.
    provider_id text null, -- External ID (e.g., Vercel Project ID)
    status text default 'active',
    expiration_date timestamptz not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    constraint domains_pkey primary key (id),
    constraint domains_organization_id_fkey foreign key (organization_id) references public.organizations(id) on delete cascade,
    constraint domains_linked_client_id_fkey foreign key (linked_client_id) references public.clients(id) on delete cascade
);

-- 1.5 MIGRATIONS
create table public.migrations (
    id uuid not null default gen_random_uuid(),
    organization_id uuid not null,
    domain_id uuid not null,
    status text default 'pending', -- 'pending', 'in_progress', 'completed'
    notes text null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    constraint migrations_pkey primary key (id),
    constraint migrations_organization_id_fkey foreign key (organization_id) references public.organizations(id) on delete cascade,
    constraint migrations_domain_id_fkey foreign key (domain_id) references public.domains(id) on delete cascade
);

-- 1.6 TICKETS
create table public.tickets (
    id uuid not null default gen_random_uuid(),
    organization_id uuid not null,
    client_id uuid not null,
    title text not null,
    description text not null,
    status text default 'open',
    priority text default 'medium',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    constraint tickets_pkey primary key (id),
    constraint tickets_organization_id_fkey foreign key (organization_id) references public.organizations(id) on delete cascade,
    constraint tickets_client_id_fkey foreign key (client_id) references public.clients(id) on delete cascade
);

-- Enable RLS on all tables
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.domains enable row level security;
alter table public.migrations enable row level security;
alter table public.tickets enable row level security;

-- =============================================================================
-- 2. HELPER FUNCTIONS & TRIGGERS
-- =============================================================================

-- Security Functions
create or replace function public.is_super_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role = 'super_admin'
  );
end;
$$ language plpgsql security definer;

create or replace function public.get_my_org_id()
returns uuid as $$
select organization_id from public.profiles where id = auth.uid();
$$ language sql security definer;

-- Trigger: Insert Profile on Signup
-- Note: Requires a default organization or logic null handling.
-- Here we insert with NULL org_id initially.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'admin');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger hook
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================================
-- 3. RLS POLICIES (Row Level Security)
-- =============================================================================

-- 3.1 ORGANIZATIONS
-- Super Admins see all. Users see their own organization.
create policy "Organizations are viewable by members and super admins"
  on public.organizations for select
  using ( is_super_admin() or id = get_my_org_id() );

-- Only Super Admins can create organizations (for now)
create policy "Organizations are insertable by super admins only"
  on public.organizations for insert
  with check ( is_super_admin() );

-- 3.2 PROFILES
-- Users can read their own profile.
create policy "Users can see own profile"
  on public.profiles for select
  using ( auth.uid() = id );
  
-- Super Admins can view all profiles
create policy "Super admins see all profiles"
  on public.profiles for select
  using ( is_super_admin() );

-- 3.3 GENERIC TENANT POLICIES (Clients, Domains, Migrations, Tickets)
-- Rule: Access if Super Admin OR belongs to the same Organization.

-- Clients
create policy "Clients viewable by org members and super admins"
  on public.clients for select
  using ( is_super_admin() or organization_id = get_my_org_id() );

create policy "Clients updatable by org members"
  on public.clients for all
  using ( is_super_admin() or organization_id = get_my_org_id() );

-- Domains
create policy "Domains viewable by org members and super admins"
  on public.domains for select
  using ( is_super_admin() or organization_id = get_my_org_id() );

create policy "Domains updatable by org members"
  on public.domains for all
  using ( is_super_admin() or organization_id = get_my_org_id() );

-- Migrations
create policy "Migrations viewable by org members and super admins"
  on public.migrations for select
  using ( is_super_admin() or organization_id = get_my_org_id() );

create policy "Migrations updatable by org members"
  on public.migrations for all
  using ( is_super_admin() or organization_id = get_my_org_id() );

-- Tickets
create policy "Tickets viewable by org members and super admins"
  on public.tickets for select
  using ( is_super_admin() or organization_id = get_my_org_id() );

create policy "Tickets updatable by org members"
  on public.tickets for all
  using ( is_super_admin() or organization_id = get_my_org_id() );


-- =============================================================================
-- 4. STORAGE SETUP
-- =============================================================================

-- Create Bucket 'janus-assets'
insert into storage.buckets (id, name, public)
values ('janus-assets', 'janus-assets', true)
on conflict (id) do nothing;

-- Storage Policies
-- 1. Read Public
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'janus-assets' );

-- 2. Authenticated Upload (Must belong to an Org)
create policy "Authenticated Upload"
  on storage.objects for insert
  with check (
    bucket_id = 'janus-assets' 
    and auth.role() = 'authenticated'
    and (select organization_id from public.profiles where id = auth.uid()) is not null
  );

-- =============================================================================
-- 5. SEED DATA
-- =============================================================================

-- Initial Organization: Arknica
-- We don't know the user ID yet, so we just create the org.
-- The Super Admin user will need to update their profile manually to point to this org ID later.
insert into public.organizations (name, slug, is_internal)
values ('Arknica', 'arknica', true)
on conflict (slug) do nothing;

-- End of Script
