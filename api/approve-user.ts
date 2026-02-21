import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ktspxbucvfzaqyszpyso.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server configuration error: missing service key' });
  }

  try {
    const { userId, action, adminId } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ error: 'userId and action (approve/reject) are required' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve" or "reject"' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Verify admin is authorized
    if (adminId) {
      const { data: adminData } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', adminId)
        .single();

      if (!adminData || adminData.role !== 'owner') {
        return res.status(403).json({ error: 'Only organization owners can approve users' });
      }
    }

    if (action === 'approve') {
      // Update pending_approvals status
      await supabase
        .from('pending_approvals')
        .update({ 
          status: 'approved', 
          approved_by: adminId,
          approved_at: new Date().toISOString() 
        })
        .eq('user_id', userId);

      // Update user metadata to mark as approved
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { approved: true }
      });

      return res.status(200).json({ success: true, message: 'User approved successfully' });
    } else {
      // Reject
      await supabase
        .from('pending_approvals')
        .update({ 
          status: 'rejected', 
          approved_by: adminId,
          approved_at: new Date().toISOString() 
        })
        .eq('user_id', userId);

      return res.status(200).json({ success: true, message: 'User rejected' });
    }
  } catch (error: any) {
    console.error('Approve user error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
