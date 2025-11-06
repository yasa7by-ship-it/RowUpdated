import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStocksLastUpdated() {
  console.log('🔍 التحقق من آخر تاريخ عمل من جدول stocks...\n');

  try {
    // 1. آخر تاريخ تحديث في جدول stocks
    console.log('1️⃣ آخر تاريخ تحديث في جدول stocks:');
    const { data: stocksData, error: stocksError } = await supabase
      .from('stocks')
      .select('last_updated')
      .not('last_updated', 'is', null)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
    
    if (stocksError) {
      console.log(`   ⚠️ خطأ: ${stocksError.message}`);
    } else {
      const lastWorkDate = stocksData?.last_updated ? new Date(stocksData.last_updated).toISOString().split('T')[0] : null;
      console.log(`   ✅ آخر تاريخ عمل: ${lastWorkDate}`);
    }

    // 2. الحصول على جميع التواريخ المختلفة في stocks.last_updated
    console.log('\n2️⃣ جميع التواريخ المختلفة في stocks.last_updated:');
    const { data: allDates, error: datesError } = await supabase
      .from('stocks')
      .select('last_updated')
      .not('last_updated', 'is', null);
    
    if (!datesError && allDates) {
      const uniqueDates = [...new Set(allDates.map(s => s.last_updated ? new Date(s.last_updated).toISOString().split('T')[0] : null))].filter(Boolean).sort().reverse();
      console.log(`   التواريخ: ${uniqueDates.slice(0, 5).join(', ')}${uniqueDates.length > 5 ? '...' : ''}`);
      console.log(`   عدد التواريخ المختلفة: ${uniqueDates.length}`);
      console.log(`   آخر تاريخ: ${uniqueDates[0]}`);
    }

    // 3. عدد الأسهم لكل تاريخ
    console.log('\n3️⃣ عدد الأسهم لكل تاريخ:');
    if (!datesError && allDates) {
      const dateCounts = {};
      allDates.forEach(s => {
        const date = s.last_updated ? new Date(s.last_updated).toISOString().split('T')[0] : null;
        if (date) {
          dateCounts[date] = (dateCounts[date] || 0) + 1;
        }
      });
      
      const sortedDates = Object.entries(dateCounts)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 5);
      
      sortedDates.forEach(([date, count]) => {
        console.log(`   ${date}: ${count} سهم`);
      });
    }

    // 4. آخر تاريخ في forecast_check_history للمقارنة
    console.log('\n4️⃣ آخر تاريخ في forecast_check_history (للمقارنة):');
    const { data: historyDate, error: historyError } = await supabase
      .from('forecast_check_history')
      .select('forecast_date')
      .order('forecast_date', { ascending: false })
      .limit(1)
      .single();
    
    if (!historyError && historyDate) {
      console.log(`   التاريخ: ${historyDate.forecast_date}`);
    }

    // 5. التحقق من البيانات التي ستُستخدم في الصفحة
    console.log('\n5️⃣ البيانات التي يجب عرضها في الصفحة:');
    const lastWorkDate = stocksData?.last_updated ? new Date(stocksData.last_updated).toISOString().split('T')[0] : null;
    
    if (lastWorkDate) {
      // الحصول على التوقعات التي لها نفس تاريخ آخر يوم عمل
      const { data: forecasts, error: forecastError } = await supabase
        .from('forecast_check_history')
        .select('hit_range')
        .eq('forecast_date', lastWorkDate);
      
      if (!forecastError && forecasts) {
        const total = forecasts.length;
        const hits = forecasts.filter(f => f.hit_range).length;
        const misses = total - hits;
        const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : 0;
        
        console.log(`   التاريخ: ${lastWorkDate}`);
        console.log(`   إجمالي التوقعات: ${total}`);
        console.log(`   التوقعات الصحيحة: ${hits}`);
        console.log(`   التوقعات الخاطئة: ${misses}`);
        console.log(`   نسبة النجاح: ${hitRate}%`);
      } else if (forecastError) {
        console.log(`   ⚠️ لا توجد توقعات لهذا التاريخ: ${lastWorkDate}`);
      }
    }

    console.log('\n✅ انتهى التحقق');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

checkStocksLastUpdated();

