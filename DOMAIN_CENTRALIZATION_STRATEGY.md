# Domain Centralization Strategy - Janus Monitor

## Overview

This document outlines the approach for centralizing domain management within the Janus Monitor system, allowing tracking of both organization-owned domains and client domains through a unified `services` table.

## Current State

### Services Table Schema (After Migration)

The `services` table now supports comprehensive tracking with the following fields:

```sql
CREATE TABLE public.services (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  client_id uuid NULLABLE,  -- NULL for org-owned, UUID for client domains
  service_name text NOT NULL,
  description text,
  amount numeric(10, 2),
  currency text DEFAULT 'USD',
  billing_cycle text,  -- 'monthly', 'yearly', 'one_time'
  next_payment_date date,
  status text DEFAULT 'active',

  -- NEW FIELDS FOR UNIFIED DOMAIN MANAGEMENT
  provider text,  -- e.g., 'Vercel', 'Namecheap', 'GoDaddy', 'InMotion'
  account_holder text,  -- e.g., 'arknica11', 'ivang111'
  service_type text,  -- 'hosting', 'domain', 'email', 'ssl', 'other'
  registrar text,  -- Domain registrar (Namecheap, GoDaddy, etc.)
  expiration_date date,  -- For domain renewals
  renewal_price numeric(10, 2),  -- Can differ from initial amount

  created_at timestamptz,
  updated_at timestamptz
);
```

## Domain Management Approach

### 1. Organization-Owned Domains

**Use Case**: Arknica owns `arknica.com` registered via Namecheap under account `arknica11`

```typescript
// Example: Adding org-owned domain
const formData = new FormData();
formData.append("client_id", ""); // NULL for org-owned
formData.append("service_name", "arknica.com");
formData.append("service_type", "domain");
formData.append("provider", "Namecheap");
formData.append("account_holder", "arknica11");
formData.append("registrar", "Namecheap");
formData.append("amount", "12.99");
formData.append("renewal_price", "14.99");
formData.append("billing_cycle", "yearly");
formData.append("expiration_date", "2027-01-15");
formData.append("status", "active");
```

### 2. Client Domains

**Use Case**: Client "Rueda La Rola" owns `ruedalrola.com` managed by Arknica

```typescript
// Example: Adding client domain
const formData = new FormData();
formData.append("client_id", "uuid-of-rueda-la-rola");
formData.append("service_name", "ruedalrola.com");
formData.append("service_type", "domain");
formData.append("provider", "GoDaddy");
formData.append("account_holder", "ivang111");
formData.append("registrar", "GoDaddy");
formData.append("amount", "15.00");
formData.append("renewal_price", "17.99");
formData.append("billing_cycle", "yearly");
formData.append("expiration_date", "2026-08-20");
formData.append("status", "active");
```

### 3. Hosting Services

**Use Case**: Vercel hosting for client project

```typescript
// Example: Adding hosting service
const formData = new FormData();
formData.append("client_id", "uuid-of-client");
formData.append("service_name", "Vercel Pro Hosting");
formData.append("service_type", "hosting");
formData.append("provider", "Vercel");
formData.append("account_holder", "arknica11");
formData.append("amount", "20.00");
formData.append("billing_cycle", "monthly");
formData.append("status", "active");
```

## Benefits of Unified Approach

### ✅ Advantages

1. **Single Source of Truth**: All services (domains, hosting, email) in one table
2. **Flexible Ownership**: `client_id` NULL = org-owned, UUID = client-owned
3. **Complete Tracking**: Provider, account holder, registrar all captured
4. **Renewal Management**: Separate `renewal_price` and `expiration_date` fields
5. **Existing RLS**: Already has proper Row Level Security policies

### ⚠️ Considerations

1. **Service Type Required**: Must specify `service_type` to differentiate domains from hosting
2. **UI Filtering**: Frontend needs to filter by `service_type` for domain-specific views
3. **Validation**: Ensure domain-specific fields (registrar, expiration_date) are required when `service_type = 'domain'`

## Implementation Checklist

### Backend (COMPLETED ✓)

- [x] Add `provider`, `account_holder`, `service_type` to services table
- [x] Add `registrar`, `expiration_date`, `renewal_price` for domain support
- [x] Make `client_id` nullable for org-owned services
- [x] Update `addIncomeService` to accept new fields
- [x] Verify `getOrganizationFullDetails` returns services data

### Frontend (TODO)

- [ ] Update income service form to include:
  - Provider dropdown (Vercel, Namecheap, GoDaddy, InMotion, Other)
  - Account Holder input (arknica11, ivang111, custom)
  - Service Type selector (hosting, domain, email, ssl, other)
  - Conditional fields for domains (registrar, expiration_date, renewal_price)
- [ ] Create domain-specific view filtered by `service_type = 'domain'`
- [ ] Add expiration alerts for domains (30/60/90 days before expiration)
- [ ] Display provider and account holder in service cards

## Query Examples

### Get All Domains for Organization

```sql
SELECT * FROM services
WHERE organization_id = 'org-uuid'
AND service_type = 'domain'
ORDER BY expiration_date ASC;
```

### Get Expiring Domains (Next 60 Days)

```sql
SELECT * FROM services
WHERE organization_id = 'org-uuid'
AND service_type = 'domain'
AND expiration_date BETWEEN NOW() AND (NOW() + INTERVAL '60 days')
ORDER BY expiration_date ASC;
```

### Get All Services by Provider

```sql
SELECT * FROM services
WHERE organization_id = 'org-uuid'
AND provider = 'Vercel'
ORDER BY created_at DESC;
```

### Get Client-Owned vs Org-Owned Breakdown

```sql
-- Client-owned
SELECT * FROM services
WHERE organization_id = 'org-uuid'
AND client_id IS NOT NULL;

-- Org-owned
SELECT * FROM services
WHERE organization_id = 'org-uuid'
AND client_id IS NULL;
```

## Migration Path

### For Existing Data

If you have domains currently in `org_assets` table:

```sql
-- Example migration (adjust as needed)
INSERT INTO services (
  organization_id,
  client_id,
  service_name,
  service_type,
  registrar,
  expiration_date,
  status,
  created_at
)
SELECT
  organization_id,
  NULL as client_id,  -- Assuming org-owned
  name as service_name,
  'domain' as service_type,
  registrar,
  expiration_date,
  'active' as status,
  created_at
FROM org_assets
WHERE type = 'domain';
```

## Conclusion

The `services` table is now fully equipped to handle unified domain management alongside hosting, email, and other services. The schema supports:

- ✅ Organization-owned and client-owned domains
- ✅ Provider and account holder tracking
- ✅ Registrar and expiration date management
- ✅ Separate renewal pricing
- ✅ Proper RLS policies

**Next Steps**: Update the frontend UI to expose these new fields in forms and display views.
