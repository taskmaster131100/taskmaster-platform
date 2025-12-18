#!/usr/bin/env node

/**
 * Export Invite Codes to CSV
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function exportInviteCodes() {
  console.log('Fetching invite codes...');

  try {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('code, max_uses, used_count, expires_at, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const csvHeader = 'Code,Type,Max Uses,Used Count,Status,Expires At,Created At\n';
    const csvRows = data.map(code => {
      const type = code.code.includes('TEAM') ? 'Team' : code.code.includes('VIP') ? 'VIP' : 'Standard';
      const status = code.used_count >= code.max_uses ? 'Exhausted' : 'Available';
      const expiresAt = code.expires_at ? new Date(code.expires_at).toISOString().split('T')[0] : 'Never';
      const createdAt = new Date(code.created_at).toISOString().split('T')[0];
      return `${code.code},${type},${code.max_uses},${code.used_count},${status},${expiresAt},${createdAt}`;
    }).join('\n');

    const outputDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `invite-codes-${timestamp}.csv`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, csvHeader + csvRows, 'utf-8');

    console.log(`✅ Export completed: ${filepath}`);
    console.log(`Total Codes: ${data.length}`);
    console.log(`Available: ${data.filter(c => c.used_count < c.max_uses).length}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

exportInviteCodes();
