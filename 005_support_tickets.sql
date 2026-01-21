-- =============================================================================
-- MIGRATION 005: SUPPORT TICKETS & MAINTENANCE LOGIC
-- =============================================================================

-- 1. UPDATE CLIENTS TABLE
-- Notes: Add tracking for maintenance allowance and last date
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS maintenance_allowance int DEFAULT 2,
ADD COLUMN IF NOT EXISTS last_maintenance_date timestamptz;

-- 2. CREATE TICKETS TABLE
CREATE TABLE IF NOT EXISTS public.tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    type text NOT NULL CHECK (type IN ('maintenance', 'support', 'feature')),
    is_billable boolean DEFAULT false,
    cost numeric(10, 2) DEFAULT 0,
    invoiced boolean DEFAULT false,
    created_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL,
    completed_at timestamptz
);

-- RLS for Tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Members of the same organization can view/edit
CREATE POLICY "Tickets visible to organization members"
    ON public.tickets FOR ALL
    USING (
         (select auth.uid()) in (
            select id from public.auth_members_view 
            where organization_id = public.tickets.organization_id
        )
        OR public.is_super_admin()
    );

-- 3. MAINTENANCE TRIGGER LOGIC
-- Function: Auto-update client.last_maintenance_date when a maintenance ticket is closed
CREATE OR REPLACE FUNCTION public.update_client_maintenance_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the ticket is of type 'maintenance' and status changes to 'closed'
    IF NEW.type = 'maintenance' AND NEW.status = 'closed' AND (OLD.status IS DISTINCT FROM 'closed') THEN
        -- Allow manual completed_at or default to now
        IF NEW.completed_at IS NULL THEN
            NEW.completed_at := now();
        END IF;

        -- Update the client
        UPDATE public.clients
        SET last_maintenance_date = NEW.completed_at
        WHERE id = NEW.client_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Helper for updated_at on tickets table (Standard)
DROP TRIGGER IF EXISTS handle_updated_at ON public.tickets;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tickets
    FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- Trigger: Execute maintenance logic
DROP TRIGGER IF EXISTS on_ticket_close_update_maintenance ON public.tickets;
CREATE TRIGGER on_ticket_close_update_maintenance
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_client_maintenance_date();

-- Grant permissions
GRANT ALL ON public.tickets TO authenticated;
