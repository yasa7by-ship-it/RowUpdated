import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bojrgkiqsahuwufbkacm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDates() {
  console.log('🔍 التحقق من التواريخ: stocks.last_updated vs forecast_check_history.forecast_date\n');

  try {
    // 1. آخر تاريخ في stocks.last_updated
    const { data: stocksData, error: stocksError } = await supabase
      .from('stocks')
      .select('last_updated')
      .not('last_updated', 'is', null)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
    
    const lastWorkDate = stocksData?.last_updated ? new Date(stocksData.last_updated).toISOString().split('T')[0] : null;
    console.log(`1️⃣ آخر تاريخ عمل (stocks.last_updated): ${lastWorkDate}\n`);

    // 2. آخر تاريخ في forecast_check_history
    const { data: historyDate, error: historyError } = await supabase
      .from('forecast_check_history')
      .select('forecast_date')
      .order('forecast_date', { ascending: false })
      .limit(1)
      .single();
    
    const lastForecastDate = historyDate?.forecast_date || null;
    console.log(`2️⃣ آخر تاريخ توقع (forecast_check_history.forecast_date): ${lastForecastDate}\n`);

    // 3. عدد الأسهم لكل تاريخ في stocks.last_updated
    console.log('3️⃣ عدد الأسهم لكل تاريخ في stocks.last_updated:');
    const { data: allStocks, error: stocksCountError } = await supabase
      .from('stocks')
      .select('last_updated')
      .not('last_updated', 'is', null);
    
    if (!stocksCountError && allStocks) {
      const dateCounts = {};
      allStocks.forEach(s => {
        const date = s.last_updated ? new Date(s.last_updated).toISOString().split('T')[0] : null;
        if (date) {
          dateCounts[date] = (dateCounts[date] || 0) + 1;
        }
      });
      
      Object.entries(dateCounts)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .forEach(([date, count]) => {
          console.log(`   ${date}: ${count} سهم`);
        });
    }
    console.log('');

    // 4. التحقق من التوقعات التي لها نفس تاريخ آخر يوم عمل
    if (lastWorkDate) {
      console.log(`4️⃣ التوقعات التي لها نفس تاريخ آخر يوم عمل (${lastWorkDate}):`);
      
      const { data: matchingForecasts, error: matchError } = await supabase
        .from('forecast_check_history')
        .select('hit_range')
        .eq('forecast_date', lastWorkDate);
      
      if (!matchError && matchingForecasts) {
        const total = matchingForecasts.length;
        const hits = matchingForecasts.filter(f => f.hit_range).length;
        const misses = total - hits;
        const hitRate = total > 0 ? ((hits / total) * 100).toFixed(2) : 0;
        
        console.log(`   إجمالي: ${total}`);
        console.log(`   صحيحة: ${hits}`);
        console.log(`   خاطئة: ${misses}`);
        console.log(`   نسبة النجاح: ${hitRate}%`);
      } else {
        console.log(`   ⚠️ لا توجد توقعات لهذا التاريخ`);
      }
      console.log('');
    }

    // 5. التحقق من الأسهم التي لها نفس تاريخ آخر يوم عمل
    if (lastWorkDate) {
      console.log(`5️⃣ الأسهم التي لها نفس تاريخ آخر يوم عمل (${lastWorkDate}):`);
      
      const { data: matchingStocks, error: stocksMatchError } = await supabase
        .from('stocks')
        .select('symbol, last_updated, price')
        .not('last_updated', 'is', null);
      
      if (!stocksMatchError && matchingStocks) {
        const matching = matchingStocks.filter(s => {
          const date = s.last_updated ? new Date(s.last_updated).toISOString().split('T')[0] : null;
          return date === lastWorkDate;
        });
        
        console.log(`   عدد الأسهم: ${matching.length}`);
        console.log(`   عدد الأسهم مع سعر: ${matching.filter(s => s.price != null).length}`);
        console.log(`   عدد الأسهم بدون سعر: ${matching.filter(s => s.price == null).length}`);
      }
      console.log('');
    }

    // 6. التحقق من التوقعات التي لها نفس تاريخ آخر يوم عمل لكل سهم
    if (lastWorkDate) {
      console.log(`6️⃣ التحقق من تطابق التوقعات مع الأسهم:`);
      
      const { data: allForecasts, error: allForecastsError } = await supabase
        .from('forecast_check_history')
        .select('stock_symbol, forecast_date')
        .eq('forecast_date', lastWorkDate);
      
      const { data: allStocks2, error: allStocksError } = await supabase
        .from('stocks')
        .select('symbol, last_updated')
        .not('last_updated', 'is', null);
      
      if (!allForecastsError && !allStocksError && allForecasts && allStocks2) {
        const forecastSymbols = new Set(allForecasts.map(f => f.stock_symbol));
        const stockSymbols = new Set(allStocks2
          .filter(s => {
            const date = s.last_updated ? new Date(s.last_updated).toISOString().split('T')[0] : null;
            return date === lastWorkDate;
          })
          .map(s => s.symbol));
        
        console.log(`   عدد التوقعات: ${forecastSymbols.size}`);
        console.log(`   عدد الأسهم: ${stockSymbols.size}`);
        
        const onlyInForecasts = [...forecastSymbols].filter(s => !stockSymbols.has(s));
        const onlyInStocks = [...stockSymbols].filter(s => !forecastSymbols.has(s));
        
        if (onlyInForecasts.length > 0) {
          console.log(`   ⚠️ رموز في التوقعات فقط: ${onlyInForecasts.slice(0, 5).join(', ')}${onlyInForecasts.length > 5 ? '...' : ''}`);
        }
        if (onlyInStocks.length > 0) {
          console.log(`   ⚠️ رموز في الأسهم فقط: ${onlyInStocks.slice(0, 5).join(', ')}${onlyInStocks.length > 5 ? '...' : ''}`);
        }
        if (onlyInForecasts.length === 0 && onlyInStocks.length === 0) {
          console.log(`   ✅ جميع الرموز متطابقة`);
        }
      }
    }

    console.log('\n✅ انتهى التحقق');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

verifyDates();

