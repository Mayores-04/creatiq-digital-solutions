# Creatiq CRM database setup

The CRM is intentionally secure-by-default: there is no public registration and no hardcoded administrator.

## 1. Apply the schema

Open the Supabase project SQL Editor and run:

`migrations/20260623_000001_creatiq_crm.sql`

It creates the CRM tables, RLS policies, published-site policies, private `creatiq-digital-solutions` bucket, public-service seeds, and the Staff-only operational RPCs. Apply every migration in order, including the unified Projects, Admin-role, contributor, pipeline, and customer-review migration.

## 2. Create the first Admin

1. In **Authentication → Users**, create or invite the initial administrator by email.
2. The `handle_new_user` trigger creates their `profiles` row as `STAFF`.
3. In the SQL Editor, promote only that approved user:

```sql
update public.profiles
set role = 'ADMIN'
where email = 'approved-owner@example.com';
```

4. They can then sign in at `/admin` and invite Staff through **User Management**.

Never expose an Admin invite or promotion flow on the public site.

## 3. Configure environment variables

Copy the root `.env.example` into `.env.local` and fill the values from the Supabase project, Cloudinary, and SMTP provider. The `SUPABASE_SERVICE_ROLE_KEY` must be the actual **service_role** secret from Supabase’s API settings—not a publishable/anon key. It is used only for secure Admin-created user invitations; website inquiries use a dedicated, validated database RPC.

## 4. Confirm security

- Anonymous visitors can only read published company settings, services, public projects, and approved reviews.
- Staff work through narrowly-scoped database RPCs for inquiry status, assigned task status, and assigned-project progress.
- Project documents are private; uploads and downloads require project membership and signed URLs.
- Admins have the administrative CRUD and publishing permissions; an Admin cannot change their own role.
