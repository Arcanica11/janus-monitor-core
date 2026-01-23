-- 019_update_clients_schema.sql

-- 1. Add new columns to 'clients' table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Update RLS Policies

-- Enable RLS just in case it wasn't
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Policy: Select (Visible to members of the same organization)
-- Assuming 'organization_id' matches the user's 'organization_id' in profiles
CREATE POLICY "Clients are visible to org members"
ON clients FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles
    WHERE id = auth.uid()
  )
);

-- Policy: Insert (Authenticated users can insert)
-- We'll validate organization_id validity in the backend action, but RLS should allow insert.
-- A stricter policy would check if the inserted organization_id matches user's org.
CREATE POLICY "Users can create clients for their org"
ON clients FOR INSERT
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

-- Policy: Update (Admins and Super Admins)
CREATE POLICY "Admins can update clients"
ON clients FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND (role = 'admin' OR role = 'super_admin') 
    AND organization_id = clients.organization_id
  )
  OR
  EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Policy: Delete (Super Admin Only)
CREATE POLICY "Only Super Admins can delete clients"
ON clients FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
