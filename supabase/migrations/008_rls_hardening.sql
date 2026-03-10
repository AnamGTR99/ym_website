-- 008_rls_hardening.sql
-- Harden RLS policies across all tables [HUGO-24]

-- =============================================
-- profiles: Prevent users from escalating their own role
-- The existing update policy allows users to update any column on their row.
-- Replace with a policy that also checks the role hasn't changed.
-- =============================================

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile (no role change)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

-- =============================================
-- tracks: Add explicit WITH CHECK for admin insert/update
-- The existing "for all" policy with USING works for SELECT/DELETE,
-- but INSERT/UPDATE also need WITH CHECK for new row validation.
-- =============================================

drop policy if exists "Admins can do anything with tracks" on public.tracks;

create policy "Admins can manage tracks"
  on public.tracks for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =============================================
-- track_product_map: Same WITH CHECK fix for admin policy
-- =============================================

drop policy if exists "Admins can modify track-product mappings" on public.track_product_map;

create policy "Admins can manage track-product mappings"
  on public.track_product_map for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =============================================
-- entitlements: Same WITH CHECK fix
-- =============================================

drop policy if exists "Admins can manage entitlements" on public.entitlements;

create policy "Admins can manage entitlements"
  on public.entitlements for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- =============================================
-- subscriptions: Add admin write access (currently read-only)
-- Service role handles writes, but admin should also be able to manage
-- =============================================

create policy "Admins can manage subscriptions"
  on public.subscriptions for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
