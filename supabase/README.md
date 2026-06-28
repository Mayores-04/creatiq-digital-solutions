# Creatiq CRM database setup

The CRM is intentionally secure-by-default: there is no public registration and no hardcoded administrator.

## 1. Apply the schema

Open the Supabase project SQL Editor and run the migrations in order.

The migrations create the CRM tables, RLS policies, published-site policies, private `creatiq-digital-solutions` bucket, public-service seeds, Staff-only operational RPCs, unified Projects data, Admin-role security, contributors, pipeline logic, customer reviews, content planner media, and Meta/Facebook webhook storage.

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

Copy the root `.env.example` into `.env.local` and fill the values from the Supabase project, Cloudinary, SMTP provider, and Meta.

The `SUPABASE_SERVICE_ROLE_KEY` must be the actual **service_role** secret from Supabase's API settings — not a publishable/anon key. It is used only on the server for secure Admin-created user invitations, Meta webhook persistence, and other trusted server writes; website inquiries use a dedicated, validated database RPC.

For deployed environments such as Vercel, configure the same server-only variables there too. A correct local `.env` does not update Vercel automatically.

## 4. Confirm security

- Anonymous visitors can only read published company settings, services, public projects, and approved reviews.
- Staff work through narrowly-scoped database RPCs for inquiry status, assigned task status, and assigned-project progress.
- Project documents are private; uploads and downloads require project membership and signed URLs.
- Admins have the administrative CRUD and publishing permissions; an Admin cannot change their own role.
