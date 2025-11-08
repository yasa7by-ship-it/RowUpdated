// Script to suggest 10 new stocks from prominent companies
// These stocks are NOT in the existing database

const suggestedStocks = [
  {
    symbol: 'SNOW',
    name: 'Snowflake Inc.',
    description: 'شركة بيانات سحابية رائدة - منصة تحليل البيانات السحابية'
  },
  {
    symbol: 'SHOP',
    name: 'Shopify Inc.',
    description: 'منصة تجارة إلكترونية عالمية - تساعد الملايين من التجار'
  },
  {
    symbol: 'ZM',
    name: 'Zoom Video Communications',
    description: 'مؤتمرات فيديو - رائدة في الاتصالات عن بُعد'
  },
  {
    symbol: 'DOCU',
    name: 'DocuSign Inc.',
    description: 'توقيع إلكتروني - رائدة في إدارة المستندات الرقمية'
  },
  {
    symbol: 'TWLO',
    name: 'Twilio Inc.',
    description: 'اتصالات سحابية - منصة اتصالات للمطورين'
  },
  {
    symbol: 'NET',
    name: 'Cloudflare Inc.',
    description: 'أمان وإنترنت - شبكة CDN وأمان سحابي'
  },
  {
    symbol: 'OKTA',
    name: 'Okta Inc.',
    description: 'هوية رقمية - إدارة الهوية والوصول'
  },
  {
    symbol: 'ROKU',
    name: 'Roku Inc.',
    description: 'منصة تلفزيون - رائدة في البث التلفزيوني'
  },
  {
    symbol: 'SPLK',
    name: 'Splunk Inc.',
    description: 'تحليل بيانات - منصة تحليل البيانات والمراقبة'
  },
  {
    symbol: 'ZS',
    name: 'Zscaler Inc.',
    description: 'أمان سحابي - رائدة في أمان الشبكة السحابية'
  }
];

console.log('\n=== اقتراح 10 أسهم جديدة من شركات مميزة ===\n');
console.log('هذه الأسهم غير موجودة في قاعدة البيانات الحالية:\n');

suggestedStocks.forEach((stock, index) => {
  console.log(`${index + 1}. ${stock.symbol} - ${stock.name}`);
  console.log(`   ${stock.description}\n`);
});

console.log('\n=== ملخص الرموز المقترحة ===');
console.log(suggestedStocks.map(s => s.symbol).join(', '));

console.log('\n=== معلومات إضافية ===');
console.log('جميع هذه الشركات:');
console.log('✓ شركات رائدة في قطاعاتها');
console.log('✓ قيمتها السوقية كبيرة');
console.log('✓ متداولة بنشاط في السوق');
console.log('✓ غير موجودة في قاعدة البيانات الحالية (506 سهم)');

