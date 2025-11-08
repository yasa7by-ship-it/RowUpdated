// Script to check existing stocks in the database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://bojrgkiqsahuwufbkacm.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJvanJna2lxc2FodXd1ZmJrYWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDc5OTUsImV4cCI6MjA3NzA4Mzk5NX0.xnPnpbttZDkkNMkHYSGkA0UP-DCc7s70aa9X1KGGwQY";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkExistingStocks() {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('symbol, name')
      .order('symbol', { ascending: true });

    if (error) {
      console.error('Error fetching stocks:', error);
      return;
    }

    console.log('\n=== الأسهم الموجودة في قاعدة البيانات ===\n');
    console.log(`إجمالي عدد الأسهم: ${data.length}\n`);
    
    if (data.length > 0) {
      console.log('قائمة الأسهم:');
      data.forEach((stock, index) => {
        console.log(`${index + 1}. ${stock.symbol} - ${stock.name}`);
      });
      
      // Extract symbols for comparison
      const existingSymbols = data.map(s => s.symbol.toUpperCase());
      console.log('\n=== الرموز الموجودة (للمقارنة) ===');
      console.log(existingSymbols.join(', '));
    } else {
      console.log('لا توجد أسهم في قاعدة البيانات حالياً.');
    }
    
    return data;
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkExistingStocks();

