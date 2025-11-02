-- #############################################################################
-- #
-- # RESTORE: إعادة إنشاء جميع الدوال المحذوفة
-- #
-- # هذا السكربت يعيد إنشاء جميع الدوال التي تم حذفها في ملفات migration
-- # لاستخدامها في تطبيق آخر
-- #
-- #############################################################################

BEGIN;

-- ============================================================================
-- 1. get_daily_watchlist_data() - محذوفة في migration_149
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_daily_watchlist_data()
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
    latest_forecast_date date;
    latest_indicator_date date;
BEGIN
    SELECT max(f.forecast_date) INTO latest_forecast_date FROM public.forecasts f;
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
    FROM public.forecasts f
    JOIN public.stocks s ON f.stock_symbol = s.symbol
    LEFT JOIN public.technical_indicators ti 
        ON f.stock_symbol = ti.stock_symbol AND ti.date = latest_indicator_date
    LEFT JOIN (
        SELECT DISTINCT ON (cp_inner.stock_symbol) *
        FROM public.candle_patterns cp_inner
        WHERE cp_inner.date = latest_indicator_date
    ) cp ON f.stock_symbol = cp.stock_symbol
    WHERE f.forecast_date = latest_forecast_date
      AND s.is_tracked = true
    ORDER BY s.symbol;
END;
$$;
RAISE NOTICE 'SUCCESS: Restored function "get_daily_watchlist_data".';

-- ============================================================================
-- 2. truncate_activity_logs() - محذوفة في migration_144
-- ============================================================================
CREATE OR REPLACE FUNCTION public.truncate_activity_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_permission('truncate:activity_log') THEN
    RAISE EXCEPTION 'Insufficient permissions: You need the "truncate:activity_log" permission.';
  END IF;
  TRUNCATE TABLE public.activity_logs RESTART IDENTITY;
END;
$$;
RAISE NOTICE 'SUCCESS: Restored function "truncate_activity_logs".';

-- ============================================================================
-- 3. get_latest_forecast_date() - محذوفة في migration_053
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_latest_forecast_date()
RETURNS date
LANGUAGE sql STABLE AS $$
  SELECT max(forecast_date) FROM public.forecasts;
$$;
RAISE NOTICE 'SUCCESS: Restored function "get_latest_forecast_date".';

-- ============================================================================
-- 4. get_daily_analysis_summary(p_date date) - محذوفة في migration_053
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_daily_analysis_summary(p_date date)
RETURNS json
LANGUAGE sql STABLE AS $$
WITH daily_metrics AS (
    SELECT
        afm.hit_range,
        afm.predicted_price,
        afm.actual_close
    FROM public.audit_forecast_metrics afm
    WHERE afm.forecast_date = p_date AND afm.actual_close IS NOT NULL
)
SELECT json_build_object(
    'forecast_date', p_date,
    'total_forecasts', (SELECT count(*) FROM daily_metrics),
    'hits', (SELECT count(*) FROM daily_metrics WHERE hit_range = true),
    'misses', (SELECT count(*) FROM daily_metrics WHERE hit_range = false),
    'hit_rate', (SELECT avg(CASE WHEN hit_range = true THEN 1 ELSE 0 END) FROM daily_metrics),
    'mape', (SELECT avg(abs(predicted_price - actual_close) / actual_close) FROM daily_metrics WHERE actual_close > 0)
);
$$;
RAISE NOTICE 'SUCCESS: Restored function "get_daily_analysis_summary".';

-- ============================================================================
-- 5. get_daily_forecast_results(p_date date) - محذوفة في migration_053
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_daily_forecast_results(p_date date)
RETURNS TABLE (
    stock_symbol text,
    stock_name text,
    predicted_price real,
    predicted_lo real,
    predicted_hi real,
    actual_close real,
    actual_low real,
    actual_high real,
    is_hit boolean
)
LANGUAGE sql STABLE AS $$
SELECT
    afm.stock_symbol,
    s.name as stock_name,
    afm.predicted_price::real,
    afm.predicted_lo::real,
    afm.predicted_hi::real,
    afm.actual_close::real,
    hd.low as actual_low,
    hd.high as actual_high,
    afm.hit_range as is_hit
FROM public.audit_forecast_metrics afm
JOIN public.stocks s ON afm.stock_symbol = s.symbol
LEFT JOIN public.historical_data hd 
    ON afm.stock_symbol = hd.stock_symbol AND afm.forecast_date = hd.date
WHERE afm.forecast_date = p_date
ORDER BY afm.stock_symbol;
$$;
RAISE NOTICE 'SUCCESS: Restored function "get_daily_forecast_results".';

-- ============================================================================
-- 6. is_first_user() - محذوفة في migration_005
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_first_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, public
AS $$
    SELECT auth.uid() = (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1);
$$;
RAISE NOTICE 'SUCCESS: Restored function "is_first_user".';

-- ============================================================================
-- 7. get_trader_summary(text, date) - محذوفة في migration_125
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_trader_summary(p_symbol text, p_date date)
RETURNS public.trader_summaries
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM public.trader_summaries
  WHERE stock_symbol = p_symbol AND "date" = p_date
  LIMIT 1;
$$;
RAISE NOTICE 'SUCCESS: Restored function "get_trader_summary".';

-- ============================================================================
-- 8. save_trader_summary(text, date, text, text) - محذوفة في migration_125
-- ============================================================================
CREATE OR REPLACE FUNCTION public.save_trader_summary(
    p_symbol text,
    p_date date,
    p_summary_en text,
    p_summary_ar text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.trader_summaries (stock_symbol, "date", summary_en, summary_ar)
  VALUES (p_symbol, p_date, p_summary_en, p_summary_ar)
  ON CONFLICT (stock_symbol, "date") DO UPDATE SET
    summary_en = p_summary_en,
    summary_ar = p_summary_ar,
    created_at = now();
END;
$$;
RAISE NOTICE 'SUCCESS: Restored function "save_trader_summary".';

-- ============================================================================
-- 9. generate_and_cache_all_trader_summaries(date) - محذوفة في migration_125
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_and_cache_all_trader_summaries(p_date date DEFAULT (CURRENT_DATE - INTERVAL '1 day'))
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    stock_record RECORD;
    indicators_record RECORD;
    prompt TEXT;
    gemini_api_key TEXT;
    api_url TEXT;
    response JSONB;
    summary_json JSONB;
    summary_en_text TEXT;
    summary_ar_text TEXT;
    processed_count INT := 0;
    error_count INT := 0;
    error_messages TEXT := '';
BEGIN
    SELECT decrypted_secret INTO gemini_api_key FROM vault.decrypted_secrets WHERE name = 'GEMINI_API_KEY';
    IF gemini_api_key IS NULL OR gemini_api_key = '' THEN
        RAISE EXCEPTION 'GEMINI_API_KEY secret not found in Vault.';
    END IF;

    api_url := 'https://aistudio.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=' || gemini_api_key;

    FOR stock_record IN
        SELECT s.symbol, s.price FROM public.stocks s WHERE s.is_tracked = true
    LOOP
        BEGIN
            SELECT * INTO indicators_record
            FROM public.technical_indicators ti
            WHERE ti.stock_symbol = stock_record.symbol AND ti.date = p_date
            LIMIT 1;

            IF FOUND AND indicators_record.rsi IS NOT NULL AND indicators_record.macd_cross IS NOT NULL AND stock_record.price IS NOT NULL THEN
                prompt := format(
                    'You are an expert stock market analyst providing a concise summary for a trader. '
                    'Generate a 3-point summary in both English and Arabic, formatted as a JSON object with "en" and "ar" keys. '
                    'Data: Current Price: %s, SMA20: %s, SMA50: %s, SMA200: %s, MACD Cross Signal: %s, RSI (14): %s. '
                    'Your output must be ONLY the JSON object.',
                    stock_record.price,
                    indicators_record.sma20,
                    indicators_record.sma50,
                    indicators_record.sma200,
                    indicators_record.macd_cross,
                    indicators_record.rsi
                );
                
                SELECT content::jsonb INTO response
                FROM pg_net.http_post(
                    url := api_url,
                    headers := '{"Content-Type": "application/json"}',
                    body := jsonb_build_object(
                        'contents', jsonb_build_array(jsonb_build_object('parts', jsonb_build_array(jsonb_build_object('text', prompt)))),
                        'generationConfig', jsonb_build_object('response_mime_type', 'application/json')
                    )
                ) AS content;
                
                summary_json := (response -> 'candidates' -> 0 -> 'content' -> 'parts' -> 0 ->> 'text')::jsonb;
                summary_en_text := summary_json ->> 'en';
                summary_ar_text := summary_json ->> 'ar';
                
                IF summary_en_text IS NOT NULL AND summary_ar_text IS NOT NULL THEN
                    PERFORM public.save_trader_summary(stock_record.symbol, p_date, summary_en_text, summary_ar_text);
                    processed_count := processed_count + 1;
                ELSE
                    error_count := error_count + 1;
                    error_messages := error_messages || stock_record.symbol || ': Malformed response; ';
                END IF;
            ELSE
                error_count := error_count + 1;
                error_messages := error_messages || stock_record.symbol || ': Missing data; ';
            END IF;
        EXCEPTION
            WHEN others THEN
                error_count := error_count + 1;
                error_messages := error_messages || stock_record.symbol || ': ' || SQLERRM || '; ';
        END;
    END LOOP;

    RETURN 'Summary generation complete. Processed: ' || processed_count || ', Errors: ' || error_count || '. Errors: ' || error_messages;
END;
$$;
RAISE NOTICE 'SUCCESS: Restored function "generate_and_cache_all_trader_summaries".';

COMMIT;

-- #############################################################################
-- # ملاحظات:
-- #
-- # 1. generate_all_daily_summaries() - لم يتم العثور على تعريفها في ملفات migration
-- #    (تم حذفها فقط في migration_122)
-- #
-- # 2. evaluate_and_save_forecasts() بدون parameters - النسخة الأصلية غير موجودة
-- #    (يوجد فقط النسخة مع default parameter)
-- #
-- #############################################################################

