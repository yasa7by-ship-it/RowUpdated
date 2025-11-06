import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLastDayData() {
  console.log('🔍 التحقق من بيانات صفحة "آخر يوم"...\n');

  try {
    // 1. التحقق من آخر تاريخ متاح في forecast_check_history (المصدر الصحيح)
    console.log('1️⃣ آخر تاريخ متاح في forecast_check_history:');
    const { data: latestDateHistory, error: dateHistoryError } = await supabase
      .from('forecast_check_history')
      .select('forecast_date')
      .order('forecast_date', { ascending: false })
      .limit(1)
      .single();
    
    if (dateHistoryError) {
      console.log(`   ⚠️ خطأ في forecast_check_history: ${dateHistoryError.message}`);
    } else {
      console.log(`   ✅ التاريخ: ${latestDateHistory?.forecast_date}`);
    }

    // التحقق من آخر تاريخ في forecast_check_latest (المستخدم حالياً)
    console.log('\n   آخر تاريخ متاح في forecast_check_latest:');
    const { data: latestDateLatest, error: dateLatestError } = await supabase
      .from('forecast_check_latest')
      .select('forecast_date')
      .order('forecast_date', { ascending: false })
      .limit(1)
      .single();
    
    if (dateLatestError) {
      console.log(`   ⚠️ خطأ في forecast_check_latest: ${dateLatestError.message}`);
    } else {
      console.log(`   التاريخ: ${latestDateLatest?.forecast_date}`);
      
      // مقارنة التواريخ
      if (latestDateHistory && latestDateLatest) {
        if (latestDateHistory.forecast_date !== latestDateLatest.forecast_date) {
          console.log(`   ⚠️ ⚠️ ⚠️ التواريخ مختلفة! history=${latestDateHistory.forecast_date}, latest=${latestDateLatest.forecast_date}`);
        } else {
          console.log(`   ✅ التواريخ متطابقة`);
        }
      }
    }
    console.log('');

    // 2. التحقق من الإحصائيات
    console.log('2️⃣ الإحصائيات:');
    const { data: stats, error: statsError } = await supabase
      .rpc('get_daily_checklist');
    
    if (statsError) throw statsError;
    
    const total = stats.length;
    const hits = stats.filter(item => item.is_hit).length;
    const misses = total - hits;
    const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : 0;
    
    console.log(`   إجمالي التوقعات: ${total}`);
    console.log(`   التوقعات الصحيحة: ${hits}`);
    console.log(`   التوقعات الخاطئة: ${misses}`);
    console.log(`   نسبة النجاح: ${hitRate}%\n`);

    // 3. التحقق من البيانات الناقصة
    console.log('3️⃣ البيانات الناقصة:');
    const incompleteData = stats.filter(item => 
      !item.actual_low || 
      !item.actual_high || 
      !item.predicted_lo || 
      !item.predicted_hi
    );
    
    if (incompleteData.length > 0) {
      console.log(`   ⚠️ يوجد ${incompleteData.length} سجل ببيانات ناقصة:`);
      incompleteData.slice(0, 5).forEach(item => {
        console.log(`      - ${item.stock_symbol}: actual_low=${item.actual_low}, actual_high=${item.actual_high}, predicted_lo=${item.predicted_lo}, predicted_hi=${item.predicted_hi}`);
      });
    } else {
      console.log('   ✅ جميع البيانات كاملة');
    }
    console.log('');

    // 4. التحقق من منطق hit_range
    console.log('4️⃣ التحقق من منطق hit_range:');
    let mismatchCount = 0;
    stats.slice(0, 20).forEach(item => {
      if (item.actual_low && item.actual_high && item.predicted_lo && item.predicted_hi) {
        const calculatedHit = (item.actual_low <= item.predicted_hi && item.actual_high >= item.predicted_lo);
        if (item.is_hit !== calculatedHit) {
          mismatchCount++;
          if (mismatchCount <= 5) {
            console.log(`   ⚠️ ${item.stock_symbol}: hit_range=${item.is_hit}, calculated=${calculatedHit}`);
          }
        }
      }
    });
    
    if (mismatchCount === 0) {
      console.log('   ✅ منطق hit_range صحيح');
    } else {
      console.log(`   ⚠️ يوجد ${mismatchCount} سجل بمنطق غير متطابق`);
    }
    console.log('');

    // 5. الإحصائيات من forecast_check_history (المصدر الصحيح)
    console.log('5️⃣ الإحصائيات من forecast_check_history (المصدر الصحيح):');
    const latestDate = latestDateHistory?.forecast_date || latestDateLatest?.forecast_date;
    
    if (latestDate) {
      const { data: historyStats, error: historyError } = await supabase
        .from('forecast_check_history')
        .select('hit_range')
        .eq('forecast_date', latestDate);
      
      if (!historyError && historyStats) {
        const historyTotal = historyStats.length;
        const historyHits = historyStats.filter(item => item.hit_range).length;
        const historyMisses = historyTotal - historyHits;
        const historyHitRate = historyTotal > 0 ? ((historyHits / historyTotal) * 100).toFixed(2) : 0;
        
        console.log(`   التاريخ: ${latestDate}`);
        console.log(`   إجمالي التوقعات: ${historyTotal}`);
        console.log(`   التوقعات الصحيحة: ${historyHits}`);
        console.log(`   التوقعات الخاطئة: ${historyMisses}`);
        console.log(`   نسبة النجاح: ${historyHitRate}%`);
        
        // مقارنة
        console.log('\n   📊 المقارنة:');
        console.log(`   forecast_check_latest: ${total} سجلات، ${hitRate}% نسبة النجاح`);
        console.log(`   forecast_check_history: ${historyTotal} سجلات، ${historyHitRate}% نسبة النجاح`);
        
        if (total !== historyTotal || hits !== historyHits) {
          console.log(`   ⚠️ ⚠️ ⚠️ البيانات مختلفة!`);
          console.log(`   الفرق في العدد: ${Math.abs(total - historyTotal)}`);
          console.log(`   الفرق في التوقعات الصحيحة: ${Math.abs(hits - historyHits)}`);
        } else {
          console.log('   ✅ البيانات متطابقة');
        }
      } else if (historyError) {
        console.log(`   ⚠️ خطأ: ${historyError.message}`);
      }
    }
    console.log('');

    console.log('✅ انتهى التحقق');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

// تشغيل التحقق
checkLastDayData();

