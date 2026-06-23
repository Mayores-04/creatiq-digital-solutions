alter table public.portfolio_projects
  add column if not exists project_url text,
  add column if not exists technologies jsonb not null default '[]'::jsonb,
  add column if not exists project_date text,
  add column if not exists asset_size text,
  add column if not exists source_image_path text;

insert into public.portfolio_projects (
  slug, title, category, summary, project_url, technologies, project_date,
  asset_size, source_image_path, is_published, sort_order, published_at
) values
  (
    'portfolio-2024', 'Portfolio', 'Portfolio Website',
    'My first modern personal portfolio showcase website featuring projects, skills, and contact pages.',
    'https://jakemayores.vercel.app', '["Next.js", "TypeScript", "Tailwind CSS", "Node.js"]'::jsonb, '2024', '1.9M', '/projects/Portfolio2.PNG', true, 10, now()
  ),
  (
    'gocar-express', 'GoCarExpress', 'Management System',
    'I worked on the admin system and backend for this car service platform, handling workflows for managing bookings, service status, customer records, and operational updates. I was not responsible for the frontend build.',
    'https://github.com/Mayores-04/GoCar_Express', '["TypeScript", "Express.js", "MongoDB"]'::jsonb, 'Jan 2024', '2.7M', '/projects/GoCarExpress.png', true, 11, now()
  ),
  (
    'email-sender', 'EmailSender', 'Web Application',
    'Email utility app for composing and sending messages with a clean and simple interface.',
    'https://jm-email-sender.vercel.app', '["React", "Node.js", "EmailJS"]'::jsonb, '2024', '1.2M', '/projects/EmailSender.png', true, 12, now()
  ),
  (
    'movie-munch', 'MovieMunch', 'Desktop Application',
    'The MovieMunch System is an innovative desktop application designed to enhance the cinema experience. Book movie tickets and pre-order snacks. This is a fully functional application.',
    'https://github.com/Mayores-04/Movie_reservation', '["C#", "MongoDB", "Figma", "Bunifu UI", "Guna UI"]'::jsonb, '2024', '890K', '/projects/MovieMunch.PNG', true, 13, now()
  ),
  (
    'alpha-official-2024', 'AlphaOfficial2024', 'Organization Website',
    'Official ALPHA organization website for announcements, details, and public presence.',
    'https://alpha-official2024.vercel.app', '["Next.js", "TypeScript", "Tailwind CSS", "MongoDB"]'::jsonb, '2024', '1.1M', '/projects/alpha_official_2024.png', true, 14, now()
  ),
  (
    'portfolio-2025', 'Portfolio', 'Portfolio Website',
    'My second personal portfolio with a more modern design and updated projects.',
    'https://jake-mayores-portfolio.vercel.app', '["Next.js", "TypeScript", "Tailwind CSS", "Node.js"]'::jsonb, '2025', '2.0M', '/projects/portfolio1.png', true, 15, now()
  ),
  (
    'messaging-app', 'MessagingApp', 'Web Application',
    'Messaging app project deployed on Vercel with a chat-focused user experience.',
    'https://jm-messaging-app.vercel.app', '["Next.js 14+", "TypeScript", "Clerk", "Convex DB", "Tailwind CSS", "ShadCN UI"]'::jsonb, '2025', '1.4M', '/projects/my_messenger.png', true, 16, now()
  ),
  (
    'alpha-admin-dashboard', 'AlphaAdminDashboard', 'Admin Dashboard',
    'Admin dashboard for ALPHA workflows, management tasks, and content operations.',
    'https://alpha-admin-dashboard-six.vercel.app', '["Next.js", "TypeScript", "Tailwind CSS", "MongoDB"]'::jsonb, '2025', '1.6M', '/projects/alpha_admin_dashboard.png', true, 17, now()
  ),
  (
    'officers-personality-test', 'OfficersPersonalityTest', 'Web Application',
    'Personality test app for officers with guided questions and result-based feedback.',
    'https://officers-personality-test.vercel.app', '["Next.js", "TypeScript", "Tailwind CSS", "MongoDB"]'::jsonb, '2025', '860K', '/projects/alpha_personality_test.png', true, 18, now()
  ),
  (
    'hibla', 'Hibla', 'Mobile Application',
    'A mobile application that aims to make reading fun, engaging, and not boring.',
    'https://github.com/Mayores-04/Hibla', '["React Native Expo", "Firebase"]'::jsonb, 'Sep 2025', '1.3M', '/projects/Hibla.jpg', true, 19, now()
  ),
  (
    'tuon', 'Tuon', 'Mobile Application',
    'A productivity app that helps students and freelancers focus on their tasks.',
    'https://github.com/Mayores-04/Tuon', '["React Native Expo", "Firebase"]'::jsonb, 'Oct 2025', '1.2M', '/projects/TuonPomodoro.jpg', true, 20, now()
  ),
  (
    'valen-card-creator', 'ValenCardCreator', 'Web Application',
    'Interactive card creator app for generating personalized Valentine-themed cards.',
    'https://valencard-creator.vercel.app', '["Web Application"]'::jsonb, '2026', '980K', '/projects/valencard.png', true, 21, now()
  ),
  (
    'bianca-portfolio', 'Bianca Portfolio', 'Portfolio Website',
    'Modern personal showcase website featuring projects, skills, and contact pages.',
    'https://angelika-bianca-portfolio.vercel.app', '["Next.js", "TypeScript", "Tailwind CSS", "Node.js"]'::jsonb, 'Feb 2026', '1.9M', '/projects/bianca-portfolio.png', true, 22, now()
  )
on conflict (slug) do update set
  title = excluded.title,
  category = excluded.category,
  summary = excluded.summary,
  project_url = excluded.project_url,
  technologies = excluded.technologies,
  project_date = excluded.project_date,
  asset_size = excluded.asset_size,
  source_image_path = excluded.source_image_path,
  is_published = excluded.is_published,
  sort_order = excluded.sort_order,
  published_at = excluded.published_at;
