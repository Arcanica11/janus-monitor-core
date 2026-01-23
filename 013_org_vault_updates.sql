-- =============================================================================
-- MIGRATION 013: ORGANIZATION VAULT UPDATES
-- =============================================================================

-- 1. ADD NEW COLUMNS TO org_vault
ALTER TABLE public.org_vault
ADD COLUMN IF NOT EXISTS login_email text,
ADD COLUMN IF NOT EXISTS tier text, -- 'Free', 'Pro', 'Enterprise'
ADD COLUMN IF NOT EXISTS url text;

-- 2. RENAME encrypted_password to password_hash IF NEEDED
-- User requested "password_hash" to store the text (initially plain, later encrypted).
-- Previous migration created "encrypted_password". We can just rename it or add the new one.
-- Let's rename for clarity if it exists, otherwise add.

DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name = 'org_vault' AND column_name = 'encrypted_password') THEN
    ALTER TABLE public.org_vault RENAME COLUMN encrypted_password TO password_hash;
  ELSE
    ALTER TABLE public.org_vault ADD COLUMN IF NOT EXISTS password_hash text;
  END IF;
END $$;

-- 3. UPDATE CATEGORY CHECK CONSTRAINT (Optional, but good practice if we used check before)
-- If we didn't add a check constraint in 012 (we just said default 'general'), we can add one now or leave it strict.
-- User requested ENUM-like behavior: 'service', 'email_account', 'database', 'other'.

ALTER TABLE public.org_vault
DROP CONSTRAINT IF EXISTS org_vault_category_check;

ALTER TABLE public.org_vault
ADD CONSTRAINT org_vault_category_check 
CHECK (category IN ('general', 'service', 'email_account', 'database', 'other'));
