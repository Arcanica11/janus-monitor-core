-- Migration 004: Add Pricing to Domains
ALTER TABLE public.domains
ADD COLUMN IF NOT EXISTS renewal_price numeric(10, 2) DEFAULT 0;
