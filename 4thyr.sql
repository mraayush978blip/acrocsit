-- ==============================================================================
-- ACRO AMS: 4th YEAR COMPLETE DATABASE SETUP SCRIPT
-- ==============================================================================
-- Run this entire script in Supabase SQL Editor to initialize a 100% working
-- 4th Year project database with all tables, constraints, RPC functions,
-- RLS security policies, performance indexes, and seeds.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. WHITELIST TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.whitelist (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. BRANCHES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    view_only BOOLEAN DEFAULT false,
    hide_from_teacher_student BOOLEAN DEFAULT false,
    hide_from_coordinator BOOLEAN DEFAULT false
);

-- ------------------------------------------------------------------------------
-- 3. BATCHES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 4. SUBJECTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    type TEXT
);

-- ------------------------------------------------------------------------------
-- 5. PROFILES TABLE (Extends Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL,
    branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
    batch_id TEXT,
    enrollment_id TEXT,
    roll_no TEXT,
    mobile_no TEXT,
    last_login TIMESTAMP WITH TIME ZONE
);

-- ------------------------------------------------------------------------------
-- 6. FACULTY ASSIGNMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
    id TEXT PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 7. COORDINATOR ASSIGNMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coordinators (
    id TEXT PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 8. ATTENDANCE TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL,
    is_present BOOLEAN NOT NULL,
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    timestamp BIGINT NOT NULL,
    lecture_slot INTEGER,
    reason TEXT
);

-- ------------------------------------------------------------------------------
-- 9. MARKS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marks (
    id TEXT PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mid_sem_type TEXT NOT NULL,
    marks_obtained REAL NOT NULL,
    max_marks REAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, subject_id, mid_sem_type)
);

-- ------------------------------------------------------------------------------
-- 10. NOTIFICATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    from_user_name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    data JSONB,
    timestamp BIGINT NOT NULL
);

-- ------------------------------------------------------------------------------
-- 11. SYSTEM SETTINGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT PRIMARY KEY,
    student_login_enabled BOOLEAN DEFAULT true
);

-- ------------------------------------------------------------------------------
-- 12. DELETED ATTENDANCE (RECYCLE BIN)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deleted_attendance (
    id TEXT PRIMARY KEY, 
    date DATE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
    branch_id TEXT NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    batch_id TEXT NOT NULL,
    is_present BOOLEAN NOT NULL,
    marked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
    timestamp BIGINT NOT NULL,
    lecture_slot INTEGER,
    reason TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 13. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- SEED DATA
-- ------------------------------------------------------------------------------
-- 1. Default system settings
INSERT INTO public.system_settings (id, student_login_enabled) 
VALUES ('default', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Mandatory coordinator 'sub_extra' subject
INSERT INTO public.subjects (id, name, code, type) 
VALUES ('sub_extra', 'Extra Lectures', 'EXTRA', 'theory') 
ON CONFLICT (id) DO NOTHING;

-- 3. Initial Admin and Developer accounts in whitelist (prevents RLS lockout)
INSERT INTO public.whitelist (email, role) VALUES 
    ('developerishere@gmail.com', 'DEVELOPER'),
    ('hod@acropolis.in', 'ADMIN'),
    ('acro472007@acropolis.in', 'ADMIN')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

-- ------------------------------------------------------------------------------
-- RPC FUNCTIONS (Called by Frontend DB Service)
-- ------------------------------------------------------------------------------

-- 1. Admin Password Reset (updates auth.users encrypted password)
CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id uuid, new_password text)
RETURNS void AS $$
BEGIN
  -- Verify caller is an authorized Admin or Developer
  IF NOT EXISTS (
    SELECT 1 FROM public.whitelist 
    WHERE lower(email) = lower(auth.jwt() ->> 'email') 
      AND role IN ('ADMIN', 'DEVELOPER')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can reset passwords.';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Admin Delete User (deletes from auth.users, cascading to profiles & related data)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Verify caller is an authorized Admin or Developer
  IF NOT EXISTS (
    SELECT 1 FROM public.whitelist 
    WHERE lower(email) = lower(auth.jwt() ->> 'email') 
      AND role IN ('ADMIN', 'DEVELOPER')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can delete users.';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users (functions enforce their own whitelist check)
GRANT EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. AUTO-PROVISION PROFILES FOR ADMIN/DEVELOPER AUTH ACCOUNTS
-- ------------------------------------------------------------------------------
-- Whenever an admin/developer user is created in Supabase Auth (Dashboard or API),
-- this trigger automatically generates their public.profiles row so they can log in immediately.
CREATE OR REPLACE FUNCTION public.handle_admin_auth_user()
RETURNS trigger AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Look up if this email is in whitelist as ADMIN or DEVELOPER
  SELECT role INTO assigned_role
  FROM public.whitelist
  WHERE lower(email) = lower(NEW.email)
    AND role IN ('ADMIN', 'DEVELOPER')
  LIMIT 1;

  IF assigned_role IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
      assigned_role
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        role = EXCLUDED.role;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_admin_auth_user_created ON auth.users;
CREATE TRIGGER on_admin_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_auth_user();

-- Sync any admin/developer who was already created in auth.users before running this script:
INSERT INTO public.profiles (id, email, display_name, role)
SELECT u.id, u.email, split_part(u.email, '@', 1), w.role
FROM auth.users u
JOIN public.whitelist w ON lower(u.email) = lower(w.email)
WHERE w.role IN ('ADMIN', 'DEVELOPER')
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    role = EXCLUDED.role;

-- ------------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR ROW LEVEL SECURITY (Prevents Recursive Policy Evaluation)
-- ------------------------------------------------------------------------------
-- SECURITY DEFINER ensures these functions execute with database owner privileges
-- and completely BYPASS RLS on whitelist and profiles during evaluation, eliminating
-- the "infinite recursion detected in policy for relation whitelist" error.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.whitelist
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
      AND role IN ('ADMIN', 'DEVELOPER')
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND upper(role) IN ('ADMIN', 'DEVELOPER')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND upper(role) IN ('FACULTY', 'COORDINATOR', 'ADMIN', 'DEVELOPER')
  ) OR public.is_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;

-- ------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so script can be safely re-run
DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.whitelist;
DROP POLICY IF EXISTS "All authenticated users can read whitelist" ON public.whitelist;
DROP POLICY IF EXISTS "Only Admins and Developers can modify whitelist" ON public.whitelist;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.branches;
DROP POLICY IF EXISTS "All authenticated users can read branches" ON public.branches;
DROP POLICY IF EXISTS "Only Admins and Developers can modify branches" ON public.branches;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.batches;
DROP POLICY IF EXISTS "All authenticated users can read batches" ON public.batches;
DROP POLICY IF EXISTS "Only Admins and Developers can modify batches" ON public.batches;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.subjects;
DROP POLICY IF EXISTS "All authenticated users can read subjects" ON public.subjects;
DROP POLICY IF EXISTS "Only Admins and Developers can modify subjects" ON public.subjects;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.profiles;
DROP POLICY IF EXISTS "All authenticated users can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only Admins can delete profiles" ON public.profiles;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.assignments;
DROP POLICY IF EXISTS "Staff read/write assignments" ON public.assignments;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.coordinators;
DROP POLICY IF EXISTS "Staff read/write coordinators" ON public.coordinators;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.attendance;
DROP POLICY IF EXISTS "Students read own attendance, others read all" ON public.attendance;
DROP POLICY IF EXISTS "Only Staff can modify attendance" ON public.attendance;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.marks;
DROP POLICY IF EXISTS "Students read own marks, others read all" ON public.marks;
DROP POLICY IF EXISTS "Only Staff can modify marks" ON public.marks;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.notifications;
DROP POLICY IF EXISTS "Users read/write own notifications, admins read/write all" ON public.notifications;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.system_settings;
DROP POLICY IF EXISTS "All users can read system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can modify system_settings" ON public.system_settings;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.deleted_attendance;
DROP POLICY IF EXISTS "Staff read/write deleted_attendance" ON public.deleted_attendance;

DROP POLICY IF EXISTS "Allow authenticated users full access" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins read/write audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admin access to audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admin delete audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can create audit_logs" ON public.audit_logs;

-- 1. Whitelist Policies
CREATE POLICY "All authenticated users can read whitelist" 
ON public.whitelist FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only Admins and Developers can modify whitelist" 
ON public.whitelist FOR ALL TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 2. Branches, Batches & Subjects (Public Read, Admin/Dev Write)
CREATE POLICY "All authenticated users can read branches" 
ON public.branches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only Admins and Developers can modify branches" 
ON public.branches FOR ALL TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "All authenticated users can read batches" 
ON public.batches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only Admins and Developers can modify batches" 
ON public.batches FOR ALL TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "All authenticated users can read subjects" 
ON public.subjects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only Admins and Developers can modify subjects" 
ON public.subjects FOR ALL TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Profiles Policies
CREATE POLICY "All authenticated users can read profiles" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE TO authenticated 
USING (public.is_admin());

CREATE POLICY "Only Admins can insert profiles" 
ON public.profiles FOR INSERT TO authenticated 
WITH CHECK (public.is_admin());

CREATE POLICY "Only Admins can delete profiles" 
ON public.profiles FOR DELETE TO authenticated 
USING (public.is_admin());

-- 4. Attendance Policies
CREATE POLICY "Students read own attendance, others read all" 
ON public.attendance FOR SELECT TO authenticated 
USING (student_id = auth.uid() OR public.is_staff());

CREATE POLICY "Only Staff can modify attendance" 
ON public.attendance FOR ALL TO authenticated 
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- 5. Marks Policies
CREATE POLICY "Students read own marks, others read all" 
ON public.marks FOR SELECT TO authenticated 
USING (student_id = auth.uid() OR public.is_staff());

CREATE POLICY "Only Staff can modify marks" 
ON public.marks FOR ALL TO authenticated 
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- 6. Assignments & Coordinators
CREATE POLICY "Staff read/write assignments" 
ON public.assignments FOR ALL TO authenticated 
USING (public.is_staff())
WITH CHECK (public.is_staff());

CREATE POLICY "Staff read/write coordinators" 
ON public.coordinators FOR ALL TO authenticated 
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- 7. Notifications
CREATE POLICY "Users read/write own notifications, admins read/write all" 
ON public.notifications FOR ALL TO authenticated 
USING (
    to_user_id = auth.uid() 
    OR from_user_id = auth.uid() 
    OR public.is_staff()
)
WITH CHECK (
    to_user_id = auth.uid() 
    OR from_user_id = auth.uid() 
    OR public.is_staff()
);

-- 8. System Settings
CREATE POLICY "All users can read system_settings" 
ON public.system_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify system_settings" 
ON public.system_settings FOR ALL TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 9. Recycle Bin (Deleted Attendance)
CREATE POLICY "Staff read/write deleted_attendance" 
ON public.deleted_attendance FOR ALL TO authenticated 
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- 10. Audit Logs Policies
-- Any authenticated user can insert audit records (e.g. when marking attendance)
CREATE POLICY "System can create audit_logs" 
ON public.audit_logs FOR INSERT TO authenticated 
WITH CHECK (auth.role() = 'authenticated');

-- Only Admins and Developers can view full audit history
CREATE POLICY "Admin access to audit_logs" 
ON public.audit_logs FOR SELECT TO authenticated 
USING (public.is_admin());

CREATE POLICY "Admin delete audit_logs" 
ON public.audit_logs FOR DELETE TO authenticated 
USING (public.is_admin());


-- ------------------------------------------------------------------------------
-- PERFORMANCE INDEXES (Foreign Keys, Lookups & Report Accelerators)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_batches_branch_id ON public.batches(branch_id);

CREATE INDEX IF NOT EXISTS idx_profiles_branch_id ON public.profiles(branch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role_branch ON public.profiles(role, branch_id);
CREATE INDEX IF NOT EXISTS idx_profiles_enrollment ON public.profiles(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_profiles_roll_no ON public.profiles(roll_no);

CREATE INDEX IF NOT EXISTS idx_assignments_faculty_id ON public.assignments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_assignments_branch_id ON public.assignments(branch_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON public.assignments(subject_id);

CREATE INDEX IF NOT EXISTS idx_coordinators_faculty_id ON public.coordinators(faculty_id);
CREATE INDEX IF NOT EXISTS idx_coordinators_branch_id ON public.coordinators(branch_id);

CREATE INDEX IF NOT EXISTS idx_attendance_date_branch ON public.attendance(date, branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON public.attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_branch_id ON public.attendance(branch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_batch_id ON public.attendance(batch_id);
CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON public.attendance(marked_by);

CREATE INDEX IF NOT EXISTS idx_marks_student_id ON public.marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject_id ON public.marks(subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_faculty_id ON public.marks(faculty_id);

CREATE INDEX IF NOT EXISTS idx_notifications_to_user_id ON public.notifications(to_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_from_user_id ON public.notifications(from_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_to_user_status ON public.notifications(to_user_id, status);

CREATE INDEX IF NOT EXISTS idx_deleted_attendance_student_id ON public.deleted_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_deleted_attendance_subject_id ON public.deleted_attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_deleted_attendance_branch_id ON public.deleted_attendance(branch_id);
CREATE INDEX IF NOT EXISTS idx_deleted_attendance_marked_by ON public.deleted_attendance(marked_by);
CREATE INDEX IF NOT EXISTS idx_deleted_attendance_deleted_by ON public.deleted_attendance(deleted_by);

CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- ------------------------------------------------------------------------------
-- SUPABASE REALTIME CONFIGURATION
-- ------------------------------------------------------------------------------
-- Enables live updates for Admin Attendance Monitor
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
          AND schemaname = 'public' 
          AND tablename = 'attendance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- PERMISSIONS GRANTS
-- ------------------------------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated;
