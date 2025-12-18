/*
  # Create Invite Code Increment Function
  
  ## Purpose
  Safely increment used_count for invite codes after successful registration.
  
  ## Security
  - Allows authenticated users to increment codes they're using
  - Prevents decrementing (only positive increments)
  - Atomic operation (prevents race conditions)
  
  ## Usage
  Called from RegisterForm after successful user signup.
*/

-- Create function to increment invite code usage
CREATE OR REPLACE FUNCTION increment_invite_code_usage(invite_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE invite_codes
  SET used_count = used_count + 1
  WHERE code = invite_code
    AND used_count < max_uses;
END;
$$;

-- Grant execute to authenticated users (for post-registration)
GRANT EXECUTE ON FUNCTION increment_invite_code_usage(TEXT) TO authenticated;

-- Grant execute to anon users (for registration flow)
GRANT EXECUTE ON FUNCTION increment_invite_code_usage(TEXT) TO anon;