-- 1. Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  customer_name text,
  phone text,
  proposal_amount numeric DEFAULT 0,
  paid_amount numeric DEFAULT 0,
  advance_amount numeric DEFAULT 0,
  status text DEFAULT 'Site Visit',
  progress integer DEFAULT 10,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Ensure missing columns exist if table was created manually
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='progress') THEN
        ALTER TABLE projects ADD COLUMN progress integer DEFAULT 10;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='updated_at') THEN
        ALTER TABLE projects ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='description') THEN
        ALTER TABLE projects ADD COLUMN description text;
    END IF;
END $$;

-- 2. Create Staff/Admin Table (for administrative login)
CREATE TABLE IF NOT EXISTS staff (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
-- For a quick fix, you can disable RLS or add policies for authenticated/anon users
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow everyone to read/write for now (YOU SHOULD HARDEN THESE LATER)
CREATE POLICY "Public Read Access" ON projects FOR SELECT USING (true);
CREATE POLICY "Public Write Access" ON projects FOR ALL USING (true);
CREATE POLICY "Public Staff Access" ON staff FOR SELECT USING (true);

-- 4. Initial Seed Data
INSERT INTO staff (email, password_hash, name) 
VALUES ('admin@example.com', 'admin123', 'Default Admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (name, description, customer_name, phone, proposal_amount, status, progress)
VALUES ('Demo Sol-1', 'Residential rooftop installation.', 'John Doe', '9876543210', 550000, 'Installation', 80)
ON CONFLICT DO NOTHING;

-- 5. Create Status Logs table
CREATE TABLE IF NOT EXISTS status_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  old_status text,
  new_status text,
  updated_by text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for status_logs
ALTER TABLE status_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Access Logs" ON status_logs FOR SELECT USING (true);
CREATE POLICY "Public Write Access Logs" ON status_logs FOR ALL USING (true);
