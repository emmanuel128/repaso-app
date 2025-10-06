# Database Setup

This folder contains SQL scripts for setting up the Supabase database for the Repaso App.

## Scripts

### `database-setup.sql`
Complete database setup with sample data.

**Includes:**
- Database tables (`study_sections`, `study_topics`)
- Indexes for performance
- Row Level Security (RLS) policies
- Auto-update timestamp triggers
- **Sample data** - 8 psychology sections with topics

**Use this for:** Quick testing and development

### `database-setup-clean.sql`
Clean database setup without sample data.

**Includes:**
- Database tables (`study_sections`, `study_topics`)
- Indexes for performance
- Row Level Security (RLS) policies
- Auto-update timestamp triggers
- **No sample data** - empty tables

**Use this for:** Production or when you want to start fresh

## How to Use

1. **Go to your Supabase project dashboard**
2. **Open SQL Editor** (left sidebar)
3. **Create a new query**
4. **Copy and paste** one of the scripts
5. **Run the query**

## Database Schema

```sql
-- Study Sections (Main psychology areas)
study_sections:
├── id (UUID, Primary Key)
├── title (Text, Required)
├── description (Text)
├── weight (Integer, Exam weight %)
├── color (Text, Tailwind CSS class)
├── created_at (Timestamp)
└── updated_at (Timestamp)

-- Study Topics (Individual topics within sections)
study_topics:
├── id (UUID, Primary Key)
├── section_id (UUID, Foreign Key → study_sections.id)
├── title (Text, Required)
├── content (Text, Optional)
├── order_index (Integer, For ordering)
├── created_at (Timestamp)
└── updated_at (Timestamp)
```

## Security

- **Public read access** - Anyone can view sections and topics (for main app)
- **Admin write access** - Only authenticated users can create/edit/delete
- **Row Level Security** enabled on both tables
- **Cascade delete** - Deleting a section removes all its topics

## Admin Access

After running the database setup:

1. **Create admin user** in Supabase Authentication panel
2. **Login at** `/admin/login` with those credentials
3. **Manage sections** through the admin dashboard

## Environment Variables

Add to your `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```