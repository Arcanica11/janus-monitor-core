-- 020_create_corporate_emails.sql

-- 1. Create the unified corporate_emails table
CREATE TABLE IF NOT EXISTS corporate_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- Nullable: If null, it's an internal org email
  email_address TEXT NOT NULL,
  encrypted_password TEXT NOT NULL, -- Will store IV:CONTENT
  provider TEXT, -- e.g., 'Zoho', 'Google', 'InMotion'
  linked_gmail TEXT, -- Personal gmail where it redirects
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_corporate_emails_org ON corporate_emails(organization_id);
CREATE INDEX IF NOT EXISTS idx_corporate_emails_client ON corporate_emails(client_id);

-- 3. Enable RLS
ALTER TABLE corporate_emails ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- SELECT: Visible to members of the same organization
CREATE POLICY "Emails visible to org members"
ON corporate_emails FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = auth.uid()
  )
);

-- INSERT: Authenticated users can insert if they belong to the org
CREATE POLICY "Users can create emails for their org"
ON corporate_emails FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND (
    organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
);

-- UPDATE: Admins and Super Admins
CREATE POLICY "Admins can update emails"
ON corporate_emails FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'super_admin') 
    AND organization_id = corporate_emails.organization_id
  )
  OR
  EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- DELETE: Super Admins Only (As per request)
CREATE POLICY "Only Super Admins can delete emails"
ON corporate_emails FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
