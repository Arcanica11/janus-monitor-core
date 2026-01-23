-- Add missing columns to org_corporate_emails
ALTER TABLE public.org_corporate_emails 
ADD COLUMN IF NOT EXISTS provider TEXT,
ADD COLUMN IF NOT EXISTS linked_gmail TEXT,
ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;
