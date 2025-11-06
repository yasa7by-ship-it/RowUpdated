import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLatestRanges() {
  console.log('='.repeat(70));
  console.log('🔍 التحقق من بيانات النطاق الفعلي والمتوقع من forecast_check_history');
  console.log('='.repeat(70));
  console.log('');

  try {
    // 1. التحقق من آخر تاريخ في forecast_check_history
    console.log('1️⃣ آخر تاريخ في forecast_check_history:');
    const { data: historyDate, error: historyError } = await supabase
      .from('forecast_check_history')
      .select('forecast_date')
      .order('forecast_date', { ascending: false })
      .limit(1)
      .single();
    
    if (!historyError && historyDate) {
      console.log(`   ✅ آخر تاريخ: ${historyDate.forecast_date}`);
    }
    console.log('');

    // 2. التحقق من الدالة الجديدة (إذا كانت موجودة)
    console.log('2️⃣ اختبار الدالة get_latest_ranges_from_history:');
    const { data: newData, error: newError } = await supabase
      .rpc('get_latest_ranges_from_history');
    
    if (!newError && newData) {
      console.log(`   ✅ عدد الأسهم: ${newData.length}`);
      if (newData.length > 0) {
        console.log(`   ✅ مثال على البيانات:`);
        const sample = newData[0];
        console.log(`      - الرمز: ${sample.stock_symbol}`);
        console.log(`      - التاريخ: ${sample.forecast_date}`);
        console.log(`      - النطاق الفعلي: ${sample.actual_low} - ${sample.actual_high}`);
        console.log(`      - النطاق المتوقع: ${sample.predicted_lo} - ${sample.predicted_hi}`);
      }
    } else {
      console.log(`   ⚠️  الدالة غير موجودة بعد: ${newError?.message || 'يجب تنفيذ SQL Script'}`);
    }
    console.log('');

    // 3. التحقق من البيانات المباشرة من forecast_check_history
    console.log('3️⃣ البيانات المباشرة من forecast_check_history (أحدث سجل لكل سهم):');
    const { data: directData, error: directError } = await supabase
      .from('forecast_check_history')
      .select('stock_symbol, forecast_date, actual_low, actual_high, predicted_lo, predicted_hi')
      .not('actual_low', 'is', null)
      .not('actual_high', 'is', null)
      .not('predicted_lo', 'is', null)
      .not('predicted_hi', 'is', null)
      .order('forecast_date', { ascending: false })
      .limit(10);
    
    if (!directError && directData) {
      console.log(`   ✅ عدد السجلات: ${directData.length}`);
      console.log(`   ✅ أمثلة على البيانات:`);
      directData.slice(0, 3).forEach((item, index) => {
        console.log(`      ${index + 1}. ${item.stock_symbol}:`);
        console.log(`         التاريخ: ${item.forecast_date}`);
        console.log(`         النطاق الفعلي: ${item.actual_low} - ${item.actual_high}`);
        console.log(`         النطاق المتوقع: ${item.predicted_lo} - ${item.predicted_hi}`);
      });
    }
    console.log('');

    // 4. التحقق من عدد الأسهم المختلفة التي لها بيانات
    console.log('4️⃣ عدد الأسهم المختلفة التي لها بيانات كاملة:');
    const { data: uniqueStocks, error: uniqueError } = await supabase
      .from('forecast_check_history')
      .select('stock_symbol')
      .not('actual_low', 'is', null)
      .not('actual_high', 'is', null)
      .not('predicted_lo', 'is', null)
      .not('predicted_hi', 'is', null);
    
    if (!uniqueError && uniqueStocks) {
      const symbols = [...new Set(uniqueStocks.map(s => s.stock_symbol))];
      console.log(`   ✅ عدد الأسهم: ${symbols.length}`);
    }
    console.log('');

    // 5. ملخص
    console.log('='.repeat(70));
    console.log('📝 الملخص:');
    console.log('='.repeat(70));
    console.log('');
    console.log('✅ تم إنشاء SQL Script: FIX_get_latest_ranges_from_history.sql');
    console.log('✅ تم تحديث الكود في ForecastAccuracy.tsx');
    console.log('');
    console.log('📋 خطوات التنفيذ:');
    console.log('1. افتح Supabase Dashboard → SQL Editor');
    console.log('2. انسخ والصق محتوى: FIX_get_latest_ranges_from_history.sql');
    console.log('3. اضغط Run');
    console.log('4. أعد تحميل الصفحة');
    console.log('');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

verifyLatestRanges();

