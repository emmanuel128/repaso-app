-- Add RLS policies to allow user registration
-- This migration fixes the 403 error when creating user profiles

-- Allow users to insert their own profile during registration
create policy profiles_self_insert on profiles for insert with check (id = current_user_id());

-- Allow users to insert their own user_tenant record during registration
-- This is needed for the initial tenant assignment during signup
create policy ut_self_insert on user_tenants for insert with check (user_id = current_user_id());