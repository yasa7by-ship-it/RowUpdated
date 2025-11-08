// فحص الجداول: الأسهم، البيانات التاريخية، وفحص التوقعات
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUwNzk5NSwiZXhwIjoyMDc3MDgzOTk1fQ.KqC1XgG5HE8EfPWXAvcm2yaIN3FUfoxyTfdQeRDPJoY";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkStocksAndForecastsTables() {
  console.log('\n=== فحص الجداول: الأسهم، البيانات التاريخية، وفحص التوقعات ===\n');
  
  // 1. فحص جدول الأسهم
  console.log('📊 1. فحص جدول الأسهم (stocks)...\n');
  
  const { data: stocksData, error: stocksError } = await supabase
    .from('stocks')
    .select('*');
  
  if (stocksError) {
    console.log(`❌ خطأ: ${stocksError.message}`);
  } else {
    const totalStocks = stocksData?.length || 0;
    const trackedStocks = stocksData?.filter(s => s.is_tracked === true).length || 0;
    const untrackedStocks = totalStocks - trackedStocks;
    
    console.log(`✅ إجمالي الأسهم: ${totalStocks}`);
    console.log(`   - متتبع: ${trackedStocks}`);
    console.log(`   - غير متتبع: ${untrackedStocks}`);
    
    if (stocksData && stocksData.length > 0) {
      const oldestStock = stocksData.reduce((oldest, stock) => 
        new Date(stock.created_at) < new Date(oldest.created_at) ? stock : oldest
      );
      const newestStock = stocksData.reduce((newest, stock) => 
        new Date(stock.created_at) > new Date(newest.created_at) ? stock : newest
      );
      
      console.log(`   - أقدم سهم: ${oldestStock.symbol} (${oldestStock.created_at})`);
      console.log(`   - أحدث سهم: ${newestStock.symbol} (${newestStock.created_at})`);
      
      console.log('\n   عينة من آخر 10 أسهم:');
      stocksData
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10)
        .forEach((stock, index) => {
          console.log(`   ${index + 1}. ${stock.symbol} - ${stock.name} (${stock.is_tracked ? '✅ متتبع' : '❌ غير متتبع'})`);
        });
    }
  }
  
  console.log('\n');
  
  // 2. فحص جدول البيانات التاريخية
  console.log('📊 2. فحص جدول البيانات التاريخية (historical_data)...\n');
  
  const { count: historyCount, error: historyError } = await supabase
    .from('historical_data')
    .select('*', { count: 'exact', head: true });
  
  if (historyError) {
    console.log(`❌ خطأ: ${historyError.message}`);
  } else {
    console.log(`✅ إجمالي السجلات: ${historyCount}`);
    
    // الحصول على معلومات إضافية
    const { data: historyStats, error: statsError } = await supabase
      .rpc('get_historical_data_stats');
    
    if (!statsError && historyStats) {
      console.log(`   - عدد الأسهم الفريدة: ${historyStats.unique_stocks || 'غير متوفر'}`);
      console.log(`   - أقدم تاريخ: ${historyStats.oldest_date || 'غير متوفر'}`);
      console.log(`   - أحدث تاريخ: ${historyStats.newest_date || 'غير متوفر'}`);
    } else {
      // طريقة بديلة
      const { data: sampleData } = await supabase
        .from('historical_data')
        .select('stock_symbol, date')
        .order('date', { ascending: false })
        .limit(1);
      
      if (sampleData && sampleData.length > 0) {
        console.log(`   - أحدث تاريخ: ${sampleData[0].date}`);
      }
    }
  }
  
  console.log('\n');
  
  // 3. فحص جدول فحص التوقعات - التاريخ
  console.log('📊 3. فحص جدول فحص التوقعات - التاريخ (forecast_check_history)...\n');
  
  const { count: checkHistoryCount, error: checkHistoryError } = await supabase
    .from('forecast_check_history')
    .select('*', { count: 'exact', head: true });
  
  if (checkHistoryError) {
    console.log(`❌ خطأ: ${checkHistoryError.message}`);
  } else {
    console.log(`✅ إجمالي السجلات: ${checkHistoryCount}`);
    
    // إحصائيات دقة التوقعات
    const { data: accuracyData, error: accuracyError } = await supabase
      .from('forecast_check_history')
      .select('hit_range, abs_error, pct_error');
    
    if (!accuracyError && accuracyData) {
      const total = accuracyData.length;
      const hitCount = accuracyData.filter(r => r.hit_range === true).length;
      const missCount = total - hitCount;
      const hitRate = total > 0 ? ((hitCount / total) * 100).toFixed(2) : 0;
      const avgAbsError = accuracyData.reduce((sum, r) => sum + (r.abs_error || 0), 0) / total;
      const avgPctError = accuracyData.reduce((sum, r) => sum + (r.pct_error || 0), 0) / total;
      
      console.log(`   - إجمالي التوقعات المفحوصة: ${total}`);
      console.log(`   - صحيح (Hit): ${hitCount}`);
      console.log(`   - خطأ (Miss): ${missCount}`);
      console.log(`   - معدل الدقة: ${hitRate}%`);
      console.log(`   - متوسط الخطأ المطلق: ${avgAbsError.toFixed(2)}`);
      console.log(`   - متوسط الخطأ النسبي: ${(avgPctError * 100).toFixed(2)}%`);
    }
  }
  
  console.log('\n');
  
  // 4. فحص جدول فحص التوقعات - الأحدث
  console.log('📊 4. فحص جدول فحص التوقعات - الأحدث (forecast_check_latest)...\n');
  
  const { count: checkLatestCount, error: checkLatestError } = await supabase
    .from('forecast_check_latest')
    .select('*', { count: 'exact', head: true });
  
  if (checkLatestError) {
    console.log(`❌ خطأ: ${checkLatestError.message}`);
  } else {
    console.log(`✅ إجمالي السجلات: ${checkLatestCount}`);
    
    // إحصائيات دقة التوقعات الأحدث
    const { data: latestAccuracyData, error: latestAccuracyError } = await supabase
      .from('forecast_check_latest')
      .select('hit_range, abs_error, pct_error');
    
    if (!latestAccuracyError && latestAccuracyData) {
      const total = latestAccuracyData.length;
      const hitCount = latestAccuracyData.filter(r => r.hit_range === true).length;
      const missCount = total - hitCount;
      const hitRate = total > 0 ? ((hitCount / total) * 100).toFixed(2) : 0;
      
      console.log(`   - إجمالي التوقعات المفحوصة: ${total}`);
      console.log(`   - صحيح (Hit): ${hitCount}`);
      console.log(`   - خطأ (Miss): ${missCount}`);
      console.log(`   - معدل الدقة: ${hitRate}%`);
    }
  }
  
  console.log('\n');
  
  // 5. فحص جدول التوقعات
  console.log('📊 5. فحص جدول التوقعات (forecasts)...\n');
  
  const { count: forecastsCount, error: forecastsError } = await supabase
    .from('forecasts')
    .select('*', { count: 'exact', head: true });
  
  if (forecastsError) {
    console.log(`❌ خطأ: ${forecastsError.message}`);
  } else {
    console.log(`✅ إجمالي التوقعات: ${forecastsCount}`);
  }
  
  console.log('\n=== انتهى الفحص ===\n');
}

checkStocksAndForecastsTables().catch(console.error);

