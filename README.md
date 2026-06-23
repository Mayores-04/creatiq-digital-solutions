# Creatiq Digital Solutions

Creatiq is a responsive marketing website and secure agency CRM built with Next.js, Supabase, and Cloudinary.

## What is included

- Public services, portfolio work, company details, and inquiry form.
- `/admin` CRM for Owner and Staff operations: inquiries, clients, projects, tasks, employees, reports, activity, publishing, and user access.
- Supabase Auth and Row Level Security; there is no public admin registration.
- Cloudinary public brand/portfolio media and signed private Supabase project-document uploads.

## Local setup

1. Copy `.env.example` to `.env.local` and fill the server-only credentials.
2. Apply the SQL migration in [supabase/README.md](supabase/README.md), then provision the first Owner.
3. Install and start the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the public site and [http://localhost:3000/admin](http://localhost:3000/admin) for the CRM.

## Verification

```bash
npm run lint
npx next build
```

Before deployment, rotate every credential that was shared in chat. Keep `.env.local`, service-role keys, SMTP passwords, database URLs, and Cloudinary secrets out of source control.
