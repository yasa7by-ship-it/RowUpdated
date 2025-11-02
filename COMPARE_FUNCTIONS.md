# مقارنة بين الدالة القديمة والحالية

## 🔍 الدالة القديمة: `get_daily_watchlist_data()`

### الملف: `migration_130_fix_watchlist_close_date.sql.txt`

```sql
CREATE FUNCTION public.get_daily_watchlist_data()
RETURNS TABLE (
    symbol text,
    stock_name text,
    last_close real,
    last_updated timestamptz,
    predicted_lo real,
    predicted_hi real,
    sma20 real,
    sma50 real,
    pattern_name text,
    bullish boolean,
    forecast_date date
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
    latest_forecast_date date;      -- آخر تاريخ توقع
    latest_indicator_date date;     -- آخر تاريخ مؤشرات
BEGIN
    -- تجد آخر تاريخ توقع (الغد)
    SELECT max(f.forecast_date) INTO latest_forecast_date FROM public.forecasts f;

    -- تجد آخر تاريخ مؤشرات قبل تاريخ التوقع (اليوم)
    SELECT max(ti.date) INTO latest_indicator_date 
    FROM public.technical_indicators ti 
    WHERE ti.date < latest_forecast_date;

    RETURN QUERY
    SELECT
        s.symbol,
        s.name AS stock_name,
        s.price AS last_close,
        s.last_updated,
        f.predicted_lo,
        f.predicted_hi,
        ti.sma20,
        ti.sma50,
        cp.pattern_name,
        cp.bullish,
        f.forecast_date
    FROM
        public.forecasts f                    -- ✅ تبدأ من التوقعات
    JOIN
        public.stocks s ON f.stock_symbol = s.symbol
    LEFT JOIN
        public.technical_indicators ti 
        ON f.stock_symbol = ti.stock_symbol 
        AND ti.date = latest_indicator_date    -- ✅ مؤشرات آخر يوم قبل التوقع
    LEFT JOIN
        (
            SELECT DISTINCT ON (cp_inner.stock_symbol) *
            FROM public.candle_patterns cp_inner
            WHERE cp_inner.date = latest_indicator_date
        ) cp ON f.stock_symbol = cp.stock_symbol
    WHERE
        f.forecast_date = latest_forecast_date  -- ✅ التوقعات لليوم التالي فقط
        AND s.is_tracked = true
    ORDER BY
        s.symbol;
END;
$$;
```

### منطق الدالة القديمة:
1. ✅ **تبدأ من `forecasts`** (جدول التوقعات)
2. ✅ **تجد آخر تاريخ توقع** = `latest_forecast_date` (الغد)
3. ✅ **تجد آخر تاريخ مؤشرات** = `latest_indicator_date` (اليوم، قبل التوقع)
4. ✅ **تربط فقط التوقعات** التي `forecast_date = latest_forecast_date`
5. ✅ **النتيجة:** توقعات لليوم التالي مع مؤشرات اليوم

---

## 🔍 الدالة الحالية: `get_the_coming_trend_data()`

### الملف: `migration_160_add_actual_range_to_watchlist.sql.txt`

```sql
CREATE OR REPLACE FUNCTION public.get_the_coming_trend_data()
RETURNS TABLE (
    symbol TEXT,
    stock_name TEXT,
    last_price REAL,
    daily_change REAL,
    daily_change_percent REAL,
    next_forecast_date DATE,
    next_predicted_lo REAL,
    next_predicted_hi REAL,
    indicator_date DATE,
    rsi REAL,
    macd REAL,
    macd_signal REAL,
    sma20 REAL,
    sma50 REAL,
    pattern_name TEXT,
    bullish BOOLEAN,
    actual_low REAL,
    actual_high REAL
)
LANGUAGE plpgsql STABLE AS $$
DECLARE
    latest_historical_date DATE;
BEGIN
    -- تجد آخر تاريخ في historical_data
    SELECT MAX(date) INTO latest_historical_date FROM public.historical_data;

    RETURN QUERY
    SELECT
        s.symbol,
        s.name AS stock_name,
        s.price AS last_price,
        s.change AS daily_change,
        s.change_percent AS daily_change_percent,
        nf.forecast_date AS next_forecast_date,
        nf.predicted_lo AS next_predicted_lo,
        nf.predicted_hi AS next_predicted_hi,
        ti.date AS indicator_date,
        ti.rsi::real,
        ti.macd::real,
        ti.macd_signal::real,
        ti.sma20::real,
        ti.sma50::real,
        cp.pattern_name,
        cp.bullish,
        COALESCE(
            fch.actual_low::real, 
            fcl.actual_low::real, 
            hd.low::real
        ) AS actual_low,
        COALESCE(
            fch.actual_high::real, 
            fcl.actual_high::real, 
            hd.high::real
        ) AS actual_high
    FROM public.stocks s                          -- ❌ تبدأ من الأسهم
    LEFT JOIN LATERAL (
        SELECT *
        FROM public.forecasts
        WHERE stock_symbol = s.symbol 
          AND forecast_date > latest_historical_date  -- ❌ أي توقع بعد آخر يوم
        ORDER BY forecast_date ASC
        LIMIT 1
    ) nf ON true
    LEFT JOIN public.technical_indicators ti 
        ON s.symbol = ti.stock_symbol 
        AND ti.date = latest_historical_date      -- ❌ مؤشرات آخر يوم في historical_data
    LEFT JOIN LATERAL (
        SELECT fch_inner.actual_low, fch_inner.actual_high, fch_inner.forecast_date
        FROM public.forecast_check_history fch_inner
        WHERE fch_inner.stock_symbol = s.symbol
        ORDER BY 
            CASE WHEN fch_inner.forecast_date = latest_historical_date THEN 0 ELSE 1 END,
            fch_inner.forecast_date DESC
        LIMIT 1
    ) fch ON true
    LEFT JOIN public.forecast_check_latest fcl 
        ON s.symbol = fcl.stock_symbol 
        AND fch.forecast_date IS NULL
    LEFT JOIN public.historical_data hd 
        ON s.symbol = hd.stock_symbol 
        AND hd.date = latest_historical_date
        AND fch.forecast_date IS NULL
        AND fcl.stock_symbol IS NULL
    LEFT JOIN LATERAL (
        SELECT cp_inner.pattern_name, cp_inner.bullish
        FROM public.candle_patterns cp_inner
        WHERE cp_inner.stock_symbol = s.symbol 
          AND cp_inner.date = latest_historical_date
        ORDER BY cp_inner.confidence DESC NULLS LAST
        LIMIT 1
    ) cp ON true
    WHERE s.is_tracked = true
    ORDER BY s.symbol;
END;
$$;
```

### منطق الدالة الحالية:
1. ❌ **تبدأ من `stocks`** (جدول الأسهم)
2. ❌ **تجد آخر تاريخ في `historical_data`** = `latest_historical_date`
3. ❌ **تبحث عن أي توقع** بعد آخر يوم (`forecast_date > latest_historical_date`)
4. ❌ **مؤشرات آخر يوم في `historical_data`**
5. ❌ **النتيجة:** جميع الأسهم مع أول توقع متاح (قد لا يكون لليوم التالي!)

---

## 📊 الفرق الرئيسي:

| الجانب | الدالة القديمة ✅ | الدالة الحالية ❌ |
|--------|-------------------|-------------------|
| **نقطة البداية** | `forecasts` (التوقعات) | `stocks` (الأسهم) |
| **التاريخ المرجعي** | آخر تاريخ توقع (`latest_forecast_date`) | آخر تاريخ في `historical_data` |
| **المؤشرات** | آخر يوم **قبل** التوقع | آخر يوم في `historical_data` |
| **التوقعات** | فقط توقعات **اليوم التالي** (`forecast_date = latest_forecast_date`) | **أي توقع قادم** (`forecast_date > latest_historical_date`) |
| **النتيجة** | أسهم لديها توقعات لليوم التالي | جميع الأسهم (حتى بدون توقعات) |

---

## 🎯 المشكلة في الدالة الحالية:

1. ❌ **تعيد جميع الأسهم** حتى لو لم يكن لديها توقعات لليوم التالي
2. ❌ **تستخدم `historical_data`** كمرجع بدلاً من `forecasts`
3. ❌ **لا تضمن** أن التوقعات المعروضة هي لليوم التالي بالضبط
4. ❌ **مؤشرات قد تكون قديمة** إذا كان `historical_data` ليس محدثاً

---

## ✅ لماذا الدالة القديمة أفضل:

1. ✅ **تبدأ من التوقعات** = تضمن وجود توقعات فعلياً
2. ✅ **توقعات لليوم التالي فقط** = دقة أعلى
3. ✅ **مؤشرات آخر يوم قبل التوقع** = أحدث مؤشرات متاحة
4. ✅ **النتيجة:** فقط الأسهم التي لديها توقعات لليوم التالي

---

## 💡 التوصية:

**إعادة استخدام منطق الدالة القديمة** مع إضافة:
- `actual_low` و `actual_high` من `forecast_check_history`
- `rsi`, `macd`, `macd_signal` (المؤشرات الإضافية)
- `daily_change`, `daily_change_percent` (من جدول `stocks`)

