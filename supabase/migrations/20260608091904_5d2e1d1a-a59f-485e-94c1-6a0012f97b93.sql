
-- Wipe orphan demo rows (no owner under the new model)
DELETE FROM public.project_tasks;

-- Drop permissive anon-friendly policies
DROP POLICY IF EXISTS "anyone can read project_tasks"   ON public.project_tasks;
DROP POLICY IF EXISTS "anyone can insert project_tasks" ON public.project_tasks;
DROP POLICY IF EXISTS "anyone can update project_tasks" ON public.project_tasks;
DROP POLICY IF EXISTS "anyone can delete project_tasks" ON public.project_tasks;

-- Add owner column scoped to auth.users
ALTER TABLE public.project_tasks
  ADD COLUMN user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX project_tasks_user_id_idx ON public.project_tasks (user_id, project_id, sort_order);

-- Lock down Data API grants to authenticated only
REVOKE ALL ON public.project_tasks FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_tasks TO authenticated;
GRANT ALL ON public.project_tasks TO service_role;

-- Per-user policies
CREATE POLICY "Users read their own tasks"
  ON public.project_tasks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own tasks"
  ON public.project_tasks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update their own tasks"
  ON public.project_tasks FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own tasks"
  ON public.project_tasks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
