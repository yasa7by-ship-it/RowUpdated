import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
// استخدام service role key للتنفيذ (إذا كان متاحاً)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeFix() {
  console.log('🔧 تنفيذ إصلاح دالة get_daily_checklist لاستخدام stocks.last_updated...\n');

  try {
    // قراءة SQL script
    const sqlScript = fs.readFileSync('./FIX_get_daily_checklist_use_stocks_date.sql', 'utf8');
    
    console.log('📝 SQL Script جاهز للتنفيذ');
    console.log('⚠️  يجب تنفيذه يدوياً في Supabase SQL Editor\n');
    console.log('═'.repeat(60));
    console.log(sqlScript);
    console.log('═'.repeat(60));
    
    // التحقق من الدالة الحالية
    console.log('\n🔍 التحقق من الدالة الحالية:');
    const { data: currentData, error: currentError } = await supabase
      .rpc('get_daily_checklist')
      .limit(1);
    
    if (currentError) {
      console.log(`   ⚠️ خطأ في الدالة الحالية: ${currentError.message}`);
    } else {
      console.log(`   ✅ الدالة تعمل - عدد السجلات: ${currentData?.length || 0}`);
      if (currentData && currentData.length > 0) {
        console.log(`   التاريخ المعروض حالياً: ${currentData[0].forecast_date}`);
      }
    }

    // التحقق من آخر تاريخ في stocks
    console.log('\n🔍 آخر تاريخ في stocks.last_updated:');
    const { data: stocksDate, error: stocksError } = await supabase
      .from('stocks')
      .select('last_updated')
      .not('last_updated', 'is', null)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
    
    if (!stocksError && stocksDate) {
      const lastWorkDate = new Date(stocksDate.last_updated).toISOString().split('T')[0];
      console.log(`   ✅ آخر تاريخ عمل: ${lastWorkDate}`);
      console.log(`\n📌 بعد تنفيذ SQL Script، يجب أن يكون التاريخ المعروض: ${lastWorkDate}`);
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

executeFix();

