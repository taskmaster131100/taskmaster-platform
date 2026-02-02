/*
  # Bootstrap organization for new account owners

  Problem:
  - RLS policies require an existing admin membership to manage organizations.
  - First-time users can end up with no organization and no ability to invite.

  Solution:
  - Provide a SECURITY DEFINER function that creates a new organization and
    links the current authenticated user as admin.
  - Allow authenticated users to execute it.
*/

CREATE OR REPLACE FUNCTION bootstrap_organization(org_name text)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  IF org_name IS NULL OR length(trim(org_name)) = 0 THEN
    org_name := 'Minha Organização';
  END IF;

  -- Only bootstrap if user has no org yet
  IF EXISTS(SELECT 1 FROM user_organizations WHERE user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', true, 'skipped', true);
  END IF;

  INSERT INTO organizations (name)
  VALUES (trim(org_name))
  RETURNING id INTO v_org_id;

  INSERT INTO user_organizations (user_id, organization_id, role)
  VALUES (v_user_id, v_org_id, 'admin');

  RETURN jsonb_build_object('success', true, 'organization_id', v_org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION bootstrap_organization(text) TO authenticated;
