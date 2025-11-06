import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCacheAndDataSource() {
  console.log('='.repeat(70));
  console.log('🔍 مراجعة مصدر البيانات لصفحة "آخر يوم"');
  console.log('='.repeat(70));
  console.log('');

  try {
    // 1. التحقق من آخر تاريخ في stocks.last_updated (المصدر الصحيح)
    console.log('1️⃣ آخر تاريخ في stocks.last_updated (المصدر الصحيح):');
    const { data: stocksData, error: stocksError } = await supabase
      .from('stocks')
      .select('last_updated')
      .not('last_updated', 'is', null)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
    
    if (!stocksError && stocksData) {
      const lastWorkDate = new Date(stocksData.last_updated).toISOString().split('T')[0];
      console.log(`   ✅ آخر تاريخ عمل صحيح: ${lastWorkDate}`);
    } else {
      console.log(`   ❌ خطأ: ${stocksError?.message || 'لا يوجد تاريخ'}`);
    }
    console.log('');

    // 2. التحقق من البيانات من get_daily_checklist (الدالة الحالية)
    console.log('2️⃣ البيانات من get_daily_checklist (الدالة الحالية):');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_daily_checklist');
    
    if (!rpcError && rpcData && rpcData.length > 0) {
      const displayedDate = rpcData[0].forecast_date;
      console.log(`   ✅ التاريخ المعروض: ${displayedDate}`);
      console.log(`   ✅ عدد السجلات: ${rpcData.length}`);
      
      // التحقق من التواريخ المختلفة
      const uniqueDates = [...new Set(rpcData.map(item => item.forecast_date))];
      console.log(`   📅 التواريخ المختلفة في البيانات: ${uniqueDates.join(', ')}`);
      
      if (uniqueDates.length > 1) {
        console.log(`   ⚠️  تحذير: يوجد أكثر من تاريخ في البيانات!`);
      }
    } else {
      console.log(`   ❌ خطأ: ${rpcError?.message || 'لا توجد بيانات'}`);
    }
    console.log('');

    // 3. التحقق من آخر تاريخ في forecast_check_history
    console.log('3️⃣ آخر تاريخ في forecast_check_history:');
    const { data: historyData, error: historyError } = await supabase
      .from('forecast_check_history')
      .select('forecast_date')
      .order('forecast_date', { ascending: false })
      .limit(1)
      .single();
    
    if (!historyError && historyData) {
      console.log(`   ✅ آخر تاريخ توقع: ${historyData.forecast_date}`);
    }
    console.log('');

    // 4. التحقق من آخر تاريخ في forecast_check_latest (المستخدم حالياً)
    console.log('4️⃣ آخر تاريخ في forecast_check_latest (المستخدم حالياً):');
    const { data: latestData, error: latestError } = await supabase
      .from('forecast_check_latest')
      .select('forecast_date')
      .order('forecast_date', { ascending: false })
      .limit(1)
      .single();
    
    if (!latestError && latestData) {
      console.log(`   ✅ آخر تاريخ في latest: ${latestData.forecast_date}`);
    } else {
      console.log(`   ⚠️  خطأ أو لا يوجد: ${latestError?.message || 'لا يوجد'}`);
    }
    console.log('');

    // 5. مقارنة التواريخ
    console.log('5️⃣ مقارنة التواريخ:');
    const lastWorkDate = stocksData?.last_updated ? new Date(stocksData.last_updated).toISOString().split('T')[0] : null;
    const rpcDate = rpcData && rpcData.length > 0 ? rpcData[0].forecast_date : null;
    const historyDate = historyData?.forecast_date || null;
    const latestDate = latestData?.forecast_date || null;
    
    console.log(`   📅 آخر تاريخ عمل (stocks.last_updated): ${lastWorkDate}`);
    console.log(`   📅 التاريخ المعروض (get_daily_checklist): ${rpcDate}`);
    console.log(`   📅 آخر تاريخ في forecast_check_history: ${historyDate}`);
    console.log(`   📅 آخر تاريخ في forecast_check_latest: ${latestDate}`);
    console.log('');
    
    if (rpcDate !== lastWorkDate) {
      console.log(`   ❌ المشكلة: التاريخ المعروض (${rpcDate}) مختلف عن آخر تاريخ عمل (${lastWorkDate})`);
      console.log(`   📌 السبب: الدالة get_daily_checklist() تأخذ من forecast_check_latest بدلاً من stocks.last_updated`);
    } else {
      console.log(`   ✅ التواريخ متطابقة`);
    }
    console.log('');

    // 6. التحقق من البيانات الصحيحة التي يجب عرضها
    console.log('6️⃣ البيانات الصحيحة التي يجب عرضها:');
    if (lastWorkDate) {
      const { data: correctData, error: correctError } = await supabase
        .from('forecast_check_history')
        .select('stock_symbol, hit_range')
        .eq('forecast_date', lastWorkDate);
      
      if (!correctError && correctData) {
        const { data: stocksAll, error: stocksAllError } = await supabase
          .from('stocks')
          .select('symbol, last_updated, price')
          .not('last_updated', 'is', null);
        
        if (!stocksAllError && stocksAll) {
          const matchingStocks = stocksAll.filter(s => {
            const date = s.last_updated ? new Date(s.last_updated).toISOString().split('T')[0] : null;
            return date === lastWorkDate;
          });
          
          const matchingForecasts = correctData.filter(f => {
            return matchingStocks.some(s => s.symbol === f.stock_symbol);
          });
          
          const total = matchingForecasts.length;
          const hits = matchingForecasts.filter(f => f.hit_range).length;
          const misses = total - hits;
          const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : 0;
          
          console.log(`   ✅ التاريخ الصحيح: ${lastWorkDate}`);
          console.log(`   ✅ عدد الأسهم: ${matchingStocks.length}`);
          console.log(`   ✅ عدد التوقعات: ${total}`);
          console.log(`   ✅ التوقعات الصحيحة: ${hits}`);
          console.log(`   ✅ التوقعات الخاطئة: ${misses}`);
          console.log(`   ✅ نسبة النجاح: ${hitRate}%`);
        }
      }
    }
    console.log('');

    // 7. ملخص المشكلة والحل
    console.log('='.repeat(70));
    console.log('📝 الملخص والحل:');
    console.log('='.repeat(70));
    console.log('');
    console.log('❌ المشكلة الحالية:');
    console.log('   1. الدالة get_daily_checklist() تأخذ آخر تاريخ من forecast_check_latest.forecast_date');
    console.log('   2. يجب أن تأخذ من stocks.last_updated');
    console.log('   3. الكاش في localStorage قد يكون قديماً');
    console.log('');
    console.log('✅ الحل:');
    console.log('   1. تنفيذ SQL Script: FIX_get_daily_checklist_use_stocks_date.sql');
    console.log('   2. مسح الكاش في المتصفح (localStorage)');
    console.log('   3. إعادة تحميل الصفحة');
    console.log('');
    console.log('🔧 خطوات التنفيذ:');
    console.log('   1. افتح Supabase Dashboard → SQL Editor');
    console.log('   2. انسخ والصق محتوى: FIX_get_daily_checklist_use_stocks_date.sql');
    console.log('   3. اضغط Run');
    console.log('   4. في المتصفح: F12 → Console → localStorage.clear()');
    console.log('   5. إعادة تحميل الصفحة');
    console.log('');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

checkCacheAndDataSource();

