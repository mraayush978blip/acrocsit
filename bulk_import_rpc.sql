-- ==============================================================================
-- HIGH-PERFORMANCE BULK IMPORT RPC FUNCTIONS FOR SUPABASE
-- Bypasses GoTrue /auth/v1/signup HTTP rate limits (429 Too Many Requests)
-- Imports 80+ Students or Faculty in 1-2 seconds with pre-confirmed auth accounts
-- ==============================================================================

-- Enable pgcrypto if not already enabled (standard in Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. BULK IMPORT STUDENTS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_bulk_import_students(students_data jsonb)
RETURNS jsonb AS $$
DECLARE
  caller_email text;
  s jsonb;
  v_user_id uuid;
  success_count int := 0;
  failed_count int := 0;
  error_list text[] := ARRAY[]::text[];
  v_email text;
  v_pass text;
BEGIN
  -- 1. Security Check: Only Admin or Developer
  caller_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  IF NOT EXISTS (
    SELECT 1 FROM public.whitelist 
    WHERE lower(email) = caller_email AND role IN ('ADMIN', 'DEVELOPER')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can bulk import students.';
  END IF;

  -- 2. Process each student in a fast SQL loop
  FOR s IN SELECT * FROM jsonb_array_elements(students_data)
  LOOP
    BEGIN
      v_email := lower(trim(coalesce(s->>'email', '')));
      v_pass := coalesce(s->>'password', 'password123');

      IF v_email = '' THEN
        failed_count := failed_count + 1;
        error_list := array_append(error_list, 'Missing email for: ' || coalesce(s->>'displayName', 'Unknown'));
        CONTINUE;
      END IF;

      -- Check if already exists in auth.users
      SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_email LIMIT 1;

      IF v_user_id IS NULL THEN
        -- Generate fresh UUID
        v_user_id := gen_random_uuid();

        -- Insert into auth.users (Pre-confirmed, instantly authenticable)
        INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at,
          role,
          aud
        ) VALUES (
          v_user_id,
          '00000000-0000-0000-0000-000000000000',
          v_email,
          crypt(v_pass, gen_salt('bf')),
          now(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          jsonb_build_object('display_name', s->>'displayName', 'role', 'STUDENT'),
          now(),
          now(),
          'authenticated',
          'authenticated'
        );

        -- Ensure auth.identities entry if table exists in this Supabase instance
        BEGIN
          INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
          ) VALUES (
            v_user_id::text,
            v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', v_email),
            'email',
            v_email,
            now(),
            now(),
            now()
          );
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      ELSE
        -- User already exists in auth: update password if needed
        IF v_pass <> '' THEN
          UPDATE auth.users 
          SET encrypted_password = crypt(v_pass, gen_salt('bf')),
              updated_at = now()
          WHERE id = v_user_id;
        END IF;
      END IF;

      -- Whitelist insertion
      INSERT INTO public.whitelist (email, role)
      VALUES (v_email, 'STUDENT')
      ON CONFLICT (email) DO NOTHING;

      -- Profiles upsert
      INSERT INTO public.profiles (
        id,
        email,
        display_name,
        role,
        branch_id,
        batch_id,
        enrollment_id,
        roll_no,
        mobile_no
      ) VALUES (
        v_user_id,
        v_email,
        s->>'displayName',
        'STUDENT',
        s->>'branchId',
        s->>'batchId',
        upper(coalesce(s->>'enrollmentId', '')),
        coalesce(s->>'rollNo', ''),
        coalesce(s->>'mobileNo', '')
      )
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        branch_id = EXCLUDED.branch_id,
        batch_id = EXCLUDED.batch_id,
        enrollment_id = EXCLUDED.enrollment_id,
        roll_no = EXCLUDED.roll_no,
        mobile_no = EXCLUDED.mobile_no;

      success_count := success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
      error_list := array_append(error_list, (coalesce(s->>'displayName', v_email) || ': ' || SQLERRM));
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', success_count,
    'failed', failed_count,
    'errors', error_list
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 2. BULK IMPORT FACULTY
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_bulk_import_faculty(faculty_data jsonb)
RETURNS jsonb AS $$
DECLARE
  caller_email text;
  f jsonb;
  v_user_id uuid;
  success_count int := 0;
  failed_count int := 0;
  error_list text[] := ARRAY[]::text[];
  v_email text;
  v_pass text;
BEGIN
  -- 1. Security Check: Only Admin or Developer
  caller_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  IF NOT EXISTS (
    SELECT 1 FROM public.whitelist 
    WHERE lower(email) = caller_email AND role IN ('ADMIN', 'DEVELOPER')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can bulk import faculty.';
  END IF;

  -- 2. Process each faculty
  FOR f IN SELECT * FROM jsonb_array_elements(faculty_data)
  LOOP
    BEGIN
      v_email := lower(trim(coalesce(f->>'email', '')));
      v_pass := coalesce(f->>'password', 'password123');

      IF v_email = '' THEN
        failed_count := failed_count + 1;
        error_list := array_append(error_list, 'Missing email for faculty: ' || coalesce(f->>'displayName', 'Unknown'));
        CONTINUE;
      END IF;

      -- Check if already exists in auth.users
      SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = v_email LIMIT 1;

      IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();

        INSERT INTO auth.users (
          id,
          instance_id,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at,
          role,
          aud
        ) VALUES (
          v_user_id,
          '00000000-0000-0000-0000-000000000000',
          v_email,
          crypt(v_pass, gen_salt('bf')),
          now(),
          '{"provider":"email","providers":["email"]}'::jsonb,
          jsonb_build_object('display_name', f->>'displayName', 'role', 'FACULTY'),
          now(),
          now(),
          'authenticated',
          'authenticated'
        );

        BEGIN
          INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            last_sign_in_at,
            created_at,
            updated_at
          ) VALUES (
            v_user_id::text,
            v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', v_email),
            'email',
            v_email,
            now(),
            now(),
            now()
          );
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      ELSE
        IF v_pass <> '' THEN
          UPDATE auth.users 
          SET encrypted_password = crypt(v_pass, gen_salt('bf')),
              updated_at = now()
          WHERE id = v_user_id;
        END IF;
      END IF;

      -- Whitelist insertion
      INSERT INTO public.whitelist (email, role)
      VALUES (v_email, 'FACULTY')
      ON CONFLICT (email) DO UPDATE SET role = 'FACULTY';

      -- Profiles upsert
      INSERT INTO public.profiles (
        id,
        email,
        display_name,
        role,
        roll_no
      ) VALUES (
        v_user_id,
        v_email,
        f->>'displayName',
        'FACULTY',
        coalesce(f->>'serialNo', '')
      )
      ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        roll_no = EXCLUDED.roll_no,
        role = 'FACULTY';

      success_count := success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
      error_list := array_append(error_list, (coalesce(f->>'displayName', v_email) || ': ' || SQLERRM));
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', success_count,
    'failed', failed_count,
    'errors', error_list
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users (functions enforce their own whitelist check)
GRANT EXECUTE ON FUNCTION public.admin_bulk_import_students(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bulk_import_faculty(jsonb) TO authenticated;
