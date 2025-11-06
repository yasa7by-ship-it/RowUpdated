import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
// محاولة استخدام service role key إذا كان متاحاً
// لكن للأسف، Supabase لا يدعم تنفيذ SQL مباشرة عبر REST API
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeFix() {
  console.log('🔧 محاولة تنفيذ FIX_get_daily_checklist_use_stocks_date.sql...\n');

  try {
    // قراءة SQL script
    const sqlScript = fs.readFileSync('./FIX_get_daily_checklist_use_stocks_date.sql', 'utf8');
    
    // تقسيم SQL إلى أوامر منفصلة
    // إزالة التعليقات و BEGIN/COMMIT و RAISE NOTICE
    const cleanSQL = sqlScript
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n')
      .replace(/BEGIN;/g, '')
      .replace(/COMMIT;/g, '')
      .replace(/RAISE NOTICE[^;]*;/g, '')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.includes('--'));

    console.log(`📝 تم قراءة SQL Script (${cleanSQL.length} أمر)\n`);

    // محاولة تنفيذ كل أمر على حدة
    // لكن للأسف، Supabase REST API لا يدعم تنفيذ DDL مباشرة
    // يجب التنفيذ عبر SQL Editor في Supabase Dashboard
    
    console.log('⚠️  Supabase لا يدعم تنفيذ SQL مباشرة عبر REST API');
    console.log('📋 يجب تنفيذ SQL Script يدوياً في Supabase SQL Editor\n');
    console.log('═'.repeat(70));
    console.log('📝 الخطوات:');
    console.log('1. افتح: https://supabase.com/dashboard');
    console.log('2. اختر مشروعك');
    console.log('3. اذهب إلى: SQL Editor');
    console.log('4. اضغط: New Query');
    console.log('5. انسخ والصق محتوى الملف: FIX_get_daily_checklist_use_stocks_date.sql');
    console.log('6. اضغط: Run (أو Ctrl+Enter)');
    console.log('═'.repeat(70));
    console.log('\n📄 محتوى SQL Script:\n');
    console.log('─'.repeat(70));
    console.log(sqlScript);
    console.log('─'.repeat(70));
    
    // التحقق من الدالة الحالية قبل التحديث
    console.log('\n🔍 التحقق من الدالة الحالية...\n');
    const { data: beforeData, error: beforeError } = await supabase
      .rpc('get_daily_checklist')
      .limit(1);
    
    if (!beforeError && beforeData && beforeData.length > 0) {
      console.log(`✅ الدالة تعمل حالياً`);
      console.log(`   التاريخ المعروض: ${beforeData[0].forecast_date}`);
      console.log(`   عدد السجلات: ${beforeData.length}`);
    } else {
      console.log(`⚠️  خطأ في الدالة الحالية: ${beforeError?.message || 'لا توجد بيانات'}`);
    }

    // التحقق من آخر تاريخ في stocks
    console.log('\n🔍 آخر تاريخ في stocks.last_updated...\n');
    const { data: stocksDate, error: stocksError } = await supabase
      .from('stocks')
      .select('last_updated')
      .not('last_updated', 'is', null)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
    
    if (!stocksError && stocksDate) {
      const lastWorkDate = new Date(stocksDate.last_updated).toISOString().split('T')[0];
      console.log(`✅ آخر تاريخ عمل: ${lastWorkDate}`);
      console.log(`\n📌 بعد تنفيذ SQL Script، يجب أن يكون التاريخ المعروض: ${lastWorkDate}`);
    }

    console.log('\n✅ انتهى التحضير');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

executeFix();

