import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLastDayData() {
  console.log('='.repeat(70));
  console.log('📊 مراجعة البيانات في صفحة "آخر يوم" (Last Day)');
  console.log('='.repeat(70));
  console.log('');

  try {
    // 1. التحقق من آخر تاريخ في stocks.last_updated
    console.log('1️⃣ آخر تاريخ في stocks.last_updated (تاريخ آخر يوم عمل):');
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
    } else {
      console.log(`   ❌ خطأ: ${stocksError?.message || 'لا يوجد تاريخ'}`);
    }
    console.log('');

    // 2. التحقق من آخر تاريخ في forecast_check_history
    console.log('2️⃣ آخر تاريخ في forecast_check_history:');
    const { data: historyDate, error: historyError } = await supabase
      .from('forecast_check_history')
      .select('forecast_date')
      .order('forecast_date', { ascending: false })
      .limit(1)
      .single();
    
    if (!historyError && historyDate) {
      console.log(`   ✅ آخر تاريخ توقع: ${historyDate.forecast_date}`);
    } else {
      console.log(`   ❌ خطأ: ${historyError?.message || 'لا يوجد تاريخ'}`);
    }
    console.log('');

    // 3. التحقق من البيانات الحالية من get_daily_checklist
    console.log('3️⃣ البيانات الحالية من get_daily_checklist (RPC Function):');
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_daily_checklist');
    
    if (!rpcError && rpcData) {
      console.log(`   ✅ عدد السجلات: ${rpcData.length}`);
      if (rpcData.length > 0) {
        const firstRecord = rpcData[0];
        console.log(`   ✅ التاريخ المعروض: ${firstRecord.forecast_date}`);
        console.log(`   ✅ مثال على السجل الأول:`);
        console.log(`      - الرمز: ${firstRecord.stock_symbol}`);
        console.log(`      - الاسم: ${firstRecord.stock_name}`);
        console.log(`      - السعر: ${firstRecord.price}`);
        console.log(`      - تاريخ آخر تحديث: ${firstRecord.last_updated || 'N/A'}`);
        
        // حساب الإحصائيات
        const total = rpcData.length;
        const hits = rpcData.filter(item => item.is_hit).length;
        const misses = total - hits;
        const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : 0;
        
        console.log('');
        console.log(`   📊 الإحصائيات:`);
        console.log(`      - إجمالي التوقعات: ${total}`);
        console.log(`      - التوقعات الصحيحة: ${hits}`);
        console.log(`      - التوقعات الخاطئة: ${misses}`);
        console.log(`      - نسبة النجاح: ${hitRate}%`);
      }
    } else {
      console.log(`   ❌ خطأ: ${rpcError?.message || 'لا توجد بيانات'}`);
    }
    console.log('');

    // 4. التحقق من البيانات الصحيحة (يجب أن تأتي من stocks.last_updated)
    console.log('4️⃣ البيانات الصحيحة (من stocks.last_updated):');
    const lastWorkDate = stocksDate?.last_updated ? new Date(stocksDate.last_updated).toISOString().split('T')[0] : null;
    
    if (lastWorkDate) {
      // الحصول على التوقعات التي لها نفس تاريخ آخر يوم عمل
      const { data: correctData, error: correctError } = await supabase
        .from('forecast_check_history')
        .select('stock_symbol, hit_range')
        .eq('forecast_date', lastWorkDate);
      
      if (!correctError && correctData) {
        // الحصول على الأسهم التي لها نفس تاريخ آخر يوم عمل
        const { data: stocksData, error: stocksCheckError } = await supabase
          .from('stocks')
          .select('symbol, last_updated, price')
          .not('last_updated', 'is', null);
        
        if (!stocksCheckError && stocksData) {
          const matchingStocks = stocksData.filter(s => {
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
          
          console.log(`   ✅ التاريخ: ${lastWorkDate}`);
          console.log(`   ✅ عدد الأسهم: ${matchingStocks.length}`);
          console.log(`   ✅ عدد التوقعات المطابقة: ${total}`);
          console.log(`   📊 الإحصائيات الصحيحة:`);
          console.log(`      - إجمالي التوقعات: ${total}`);
          console.log(`      - التوقعات الصحيحة: ${hits}`);
          console.log(`      - التوقعات الخاطئة: ${misses}`);
          console.log(`      - نسبة النجاح: ${hitRate}%`);
        }
      }
    }
    console.log('');

    // 5. مقارنة البيانات الحالية مع البيانات الصحيحة
    console.log('5️⃣ مقارنة البيانات:');
    if (rpcData && lastWorkDate) {
      const rpcDate = rpcData[0]?.forecast_date || null;
      const rpcTotal = rpcData.length;
      const rpcHits = rpcData.filter(item => item.is_hit).length;
      const rpcHitRate = rpcTotal > 0 ? ((rpcHits / rpcTotal) * 100).toFixed(2) : 0;
      
      console.log(`   التاريخ المعروض حالياً: ${rpcDate}`);
      console.log(`   التاريخ الصحيح: ${lastWorkDate}`);
      
      if (rpcDate === lastWorkDate) {
        console.log(`   ✅ التاريخ صحيح`);
      } else {
        console.log(`   ❌ التاريخ غير صحيح - يجب تحديث الدالة`);
      }
      
      console.log(`   إجمالي التوقعات: ${rpcTotal}`);
      console.log(`   نسبة النجاح: ${rpcHitRate}%`);
    }
    console.log('');

    // 6. ملخص
    console.log('='.repeat(70));
    console.log('📝 الملخص:');
    console.log('='.repeat(70));
    console.log('');
    console.log('🔍 البيانات المعروضة في الصفحة:');
    console.log('   1. تاريخ آخر يوم عمل: يأخذ من checklistData[0].forecast_date');
    console.log('   2. إجمالي التوقعات: checklistData.length');
    console.log('   3. التوقعات الصحيحة: checklistData.filter(item => item.is_hit).length');
    console.log('   4. التوقعات الخاطئة: total - hits');
    console.log('   5. نسبة النجاح: (hits / total) * 100');
    console.log('');
    console.log('📊 مصدر البيانات:');
    console.log('   - Frontend: StockAnalysis.tsx → supabase.rpc("get_daily_checklist")');
    console.log('   - Database: get_daily_checklist() → vw_Last_dayCheckList');
    console.log('   - View: vw_Last_dayCheckList → forecast_check_latest + stocks');
    console.log('');
    console.log('⚠️  المشكلة الحالية:');
    console.log('   - الدالة تأخذ آخر تاريخ من forecast_check_latest.forecast_date');
    console.log('   - يجب أن تأخذ من stocks.last_updated');
    console.log('');
    console.log('✅ الحل:');
    console.log('   - تنفيذ SQL Script: FIX_get_daily_checklist_use_stocks_date.sql');
    console.log('   - هذا سيحدّث الدالة لاستخدام stocks.last_updated');
    console.log('');

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

verifyLastDayData();

