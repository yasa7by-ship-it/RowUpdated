import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearCacheAndVerify() {
  console.log('='.repeat(70));
  console.log('🔧 مسح الكاش والتحقق من البيانات');
  console.log('='.repeat(70));
  console.log('');

  try {
    // 1. التحقق من آخر تاريخ في stocks
    console.log('1️⃣ آخر تاريخ في stocks.last_updated:');
    const { data: stocksDate, error: stocksError } = await supabase
      .from('stocks')
      .select('last_updated')
      .not('last_updated', 'is', null)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
    
    const lastWorkDate = stocksDate?.last_updated ? new Date(stocksDate.last_updated).toISOString().split('T')[0] : null;
    console.log(`   ✅ آخر تاريخ عمل: ${lastWorkDate}`);
    console.log('');

    // 2. التحقق من البيانات من get_daily_checklist
    console.log('2️⃣ البيانات من get_daily_checklist:');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_daily_checklist');
    
    if (!rpcError && rpcData && rpcData.length > 0) {
      const displayedDate = rpcData[0].forecast_date;
      const total = rpcData.length;
      const hits = rpcData.filter(item => item.is_hit).length;
      const misses = total - hits;
      const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : 0;
      
      console.log(`   ✅ التاريخ المعروض: ${displayedDate}`);
      console.log(`   ✅ عدد السجلات: ${total}`);
      console.log(`   ✅ التوقعات الصحيحة: ${hits}`);
      console.log(`   ✅ التوقعات الخاطئة: ${misses}`);
      console.log(`   ✅ نسبة النجاح: ${hitRate}%`);
      
      if (displayedDate !== lastWorkDate) {
        console.log(`   ⚠️  تحذير: التاريخ المعروض (${displayedDate}) مختلف عن آخر تاريخ عمل (${lastWorkDate})`);
        console.log(`   📌 يجب تنفيذ SQL Script: FIX_get_daily_checklist_final.sql`);
      } else {
        console.log(`   ✅ التاريخ صحيح`);
      }
    } else {
      console.log(`   ❌ خطأ: ${rpcError?.message || 'لا توجد بيانات'}`);
    }
    console.log('');

    // 3. إرشادات مسح الكاش
    console.log('='.repeat(70));
    console.log('📝 خطوات مسح الكاش في المتصفح:');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. افتح المتصفح');
    console.log('2. اضغط F12 (فتح Developer Tools)');
    console.log('3. اذهب إلى Console');
    console.log('4. اكتب: localStorage.clear()');
    console.log('5. اضغط Enter');
    console.log('6. أعد تحميل الصفحة (F5 أو Ctrl+R)');
    console.log('');
    console.log('أو:');
    console.log('1. افتح المتصفح');
    console.log('2. اضغط F12');
    console.log('3. اذهب إلى Application → Storage → Local Storage');
    console.log('4. ابحث عن: stockAnalysisData-v2');
    console.log('5. احذف هذا المفتاح');
    console.log('6. أعد تحميل الصفحة');
    console.log('');

    // 4. SQL Script للتنفيذ
    console.log('='.repeat(70));
    console.log('📋 SQL Script للتنفيذ:');
    console.log('='.repeat(70));
    console.log('');
    console.log('1. افتح Supabase Dashboard → SQL Editor');
    console.log('2. انسخ والصق محتوى: FIX_get_daily_checklist_final.sql');
    console.log('3. اضغط Run');
    console.log('');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

clearCacheAndVerify();

