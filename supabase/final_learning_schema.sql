-- CareerSprint AI — FINAL learning schema setup
-- Your learning_* tables already exist. This script does NOT recreate them.

CREATE UNIQUE INDEX IF NOT EXISTS learner_profiles_user_id_unique
ON public.learner_profiles(user_id);

ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "learner_profiles_own" ON public.learner_profiles;
CREATE POLICY "learner_profiles_own" ON public.learner_profiles
FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

DROP POLICY IF EXISTS "learning_goals_own" ON public.learning_goals;
CREATE POLICY "learning_goals_own" ON public.learning_goals
FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

DROP POLICY IF EXISTS "learning_paths_own" ON public.learning_paths;
CREATE POLICY "learning_paths_own" ON public.learning_paths
FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

DROP POLICY IF EXISTS "learning_path_items_own" ON public.learning_path_items;
CREATE POLICY "learning_path_items_own" ON public.learning_path_items
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.learning_paths p WHERE p.id=path_id AND p.user_id=auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.learning_paths p WHERE p.id=path_id AND p.user_id=auth.uid())
);

DROP POLICY IF EXISTS "learning_progress_own" ON public.learning_progress;
CREATE POLICY "learning_progress_own" ON public.learning_progress
FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

DROP POLICY IF EXISTS "learning_resources_read" ON public.learning_resources;
DROP POLICY IF EXISTS "learning_resources_insert" ON public.learning_resources;
CREATE POLICY "learning_resources_read" ON public.learning_resources
FOR SELECT USING (true);
CREATE POLICY "learning_resources_insert" ON public.learning_resources
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "user_skills_own" ON public.user_skills;
CREATE POLICY "user_skills_own" ON public.user_skills
FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE INDEX IF NOT EXISTS learner_profiles_user_idx ON public.learner_profiles(user_id);
CREATE INDEX IF NOT EXISTS learning_goals_user_status_idx ON public.learning_goals(user_id,status);
CREATE INDEX IF NOT EXISTS learning_paths_user_idx ON public.learning_paths(user_id);
CREATE INDEX IF NOT EXISTS learning_path_items_path_sequence_idx ON public.learning_path_items(path_id,sequence);
CREATE INDEX IF NOT EXISTS learning_progress_user_item_idx ON public.learning_progress(user_id,path_item_id);
CREATE INDEX IF NOT EXISTS user_skills_user_idx ON public.user_skills(user_id);


-- ============================================================================
-- ACCOUNT PROFILE + THEME
-- ============================================================================
-- This table is the single account-settings source of truth. It is intentionally
-- separate from learner_profiles so learning data and account controls remain
-- easy to reason about. Run this migration once in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text NOT NULL DEFAULT 'Learner',
  theme text NOT NULL DEFAULT 'dark',
  total_xp integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Learner';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'dark';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_xp integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.profiles SET theme = 'dark' WHERE theme IS NULL OR theme NOT IN ('light','dark');
UPDATE public.profiles SET name = 'Learner' WHERE name IS NULL OR btrim(name) = '';
UPDATE public.profiles SET total_xp = 0 WHERE total_xp IS NULL;

ALTER TABLE public.profiles ALTER COLUMN name SET DEFAULT 'Learner';
ALTER TABLE public.profiles ALTER COLUMN name SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN theme SET DEFAULT 'dark';
ALTER TABLE public.profiles ALTER COLUMN theme SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN total_xp SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN total_xp SET NOT NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_theme_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_theme_check CHECK (theme IN ('light','dark'));

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS profiles_updated_at_idx ON public.profiles(updated_at);


-- Create the account row automatically for every email or Google signup.
CREATE OR REPLACE FUNCTION public.handle_new_veyra_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, theme)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data ->> 'name'), ''),
      NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'Learner'
    ),
    'dark'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_veyra ON auth.users;
CREATE TRIGGER on_auth_user_created_veyra
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_veyra_user();


-- ============================================================================
-- IDEMPOTENT XP ENGINE
-- ============================================================================
-- One award per user/item/source prevents double XP when a completion request
-- is retried. The RPC derives the authenticated user from auth.uid().
CREATE TABLE IF NOT EXISTS public.veyra_xp_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NULL,
  source text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0 AND amount <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS veyra_xp_awards_user_source_unique
ON public.veyra_xp_awards(user_id, source);

ALTER TABLE public.veyra_xp_awards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "veyra_xp_awards_own" ON public.veyra_xp_awards;
CREATE POLICY "veyra_xp_awards_own" ON public.veyra_xp_awards
FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.award_veyra_xp(
  p_amount integer,
  p_source text,
  p_item_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_total integer;
  v_inserted integer;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 500 THEN RAISE EXCEPTION 'Invalid XP amount'; END IF;
  IF p_source IS NULL OR btrim(p_source) = '' THEN RAISE EXCEPTION 'XP source is required'; END IF;

  INSERT INTO public.veyra_xp_awards(user_id, item_id, source, amount)
  VALUES(v_user, p_item_id, left(p_source,120), p_amount)
  ON CONFLICT (user_id, source) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  INSERT INTO public.profiles(id, email, name, theme, total_xp)
  VALUES(v_user, (SELECT email FROM auth.users WHERE id=v_user), 'Learner', 'dark', 0)
  ON CONFLICT (id) DO NOTHING;

  IF v_inserted = 1 THEN
    UPDATE public.profiles
    SET total_xp = total_xp + p_amount, updated_at = now()
    WHERE id = v_user
    RETURNING total_xp INTO v_total;
  ELSE
    SELECT total_xp INTO v_total FROM public.profiles WHERE id=v_user;
  END IF;

  RETURN COALESCE(v_total, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.award_veyra_xp(integer,text,uuid) TO authenticated;
