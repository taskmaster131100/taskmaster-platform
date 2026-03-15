import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

const DB_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:HubIb1E6qF0Q3GoG@db.ktspxbucvfzaqyszpyso.supabase.co:5432/postgres';
const ADMIN_EMAILS = ['marcos@taskmaster.works', 'balmarcos131100@gmail.com', 'balmarcos@hotmail.com'];

async function getDb() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || '';
  if (allowedOrigin) res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const db = await getDb();

  try {
    const { userId, action, adminId } = req.body;

    if (!userId || !action) {
      return res.status(400).json({ error: 'userId and action (approve/reject) are required' });
    }
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'action must be "approve" or "reject"' });
    }

    // Verify admin is authorized
    if (adminId) {
      const adminResult = await db.query(
        'SELECT email, raw_user_meta_data FROM auth.users WHERE id = $1 LIMIT 1',
        [adminId]
      );
      if (adminResult.rows.length === 0) {
        return res.status(403).json({ error: 'Unauthorized: admin not found' });
      }
      const { email, raw_user_meta_data } = adminResult.rows[0];
      const role = raw_user_meta_data?.role;
      if (!ADMIN_EMAILS.includes(email) && role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    const now = new Date().toISOString();
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Update pending_approvals
    await db.query(
      `UPDATE public.pending_approvals SET status = $1, approved_by = $2, approved_at = $3 WHERE user_id = $4`,
      [newStatus, adminId || null, now, userId]
    );

    if (action === 'approve') {
      // Update auth.users metadata to mark as approved
      await db.query(
        `UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || $1::jsonb WHERE id = $2`,
        [JSON.stringify({ approved: true }), userId]
      );
      return res.status(200).json({ success: true, message: 'User approved successfully' });
    } else {
      return res.status(200).json({ success: true, message: 'User rejected' });
    }
  } catch (error: any) {
    console.error('Approve user error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  } finally {
    await db.end();
  }
}
