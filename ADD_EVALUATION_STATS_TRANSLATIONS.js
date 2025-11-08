// Script to add translations for evaluation statistics
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const translations = [
  { lang_id: 'en', key: 'last_run_stats', value: 'Last Run Statistics' },
  { lang_id: 'ar', key: 'last_run_stats', value: 'إحصائيات آخر تشغيل' },
  { lang_id: 'en', key: 'forecasts_processed', value: 'Forecasts Processed' },
  { lang_id: 'ar', key: 'forecasts_processed', value: 'عدد التوقعات المفحوصة' },
  { lang_id: 'en', key: 'stocks_processed', value: 'Stocks Processed' },
  { lang_id: 'ar', key: 'stocks_processed', value: 'عدد الأسهم المفحوصة' },
  { lang_id: 'en', key: 'last_run_time', value: 'Last Run Time' },
  { lang_id: 'ar', key: 'last_run_time', value: 'آخر مرة تم التشغيل' },
  { lang_id: 'en', key: 'running', value: 'Running...' },
  { lang_id: 'ar', key: 'running', value: 'جاري التشغيل...' }
];

async function addTranslations() {
  console.log('\n=== إضافة الترجمات ===\n');
  
  for (const trans of translations) {
    const { error } = await supabase
      .from('translations')
      .upsert(trans, { onConflict: 'lang_id,key' });
    
    if (error) {
      console.error(`❌ خطأ في إضافة ${trans.key}:`, error.message);
    } else {
      console.log(`✅ تمت إضافة: ${trans.key} (${trans.lang_id})`);
    }
  }
  
  console.log('\n✅ اكتملت إضافة الترجمات');
}

addTranslations().catch(console.error);

