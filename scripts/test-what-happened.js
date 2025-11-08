import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const serviceRole = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY';

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const summary = await supabase.rpc('get_what_happened_summary');
  console.log('Summary error:', summary.error);
  console.log('Summary example:', summary.data ? summary.data.slice(0, 1) : null);

  const details = await supabase.rpc('get_what_happened_stock_details', { p_symbol: 'AAPL' });
  console.log('Details error:', details.error);
  console.log('Details keys:', details.data ? Object.keys(details.data) : null);
}

main().catch((err) => {
  console.error(err);
});


