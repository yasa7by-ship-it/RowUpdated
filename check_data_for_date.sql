-- #############################################################################
-- #
-- # SCRIPT: Check Data Availability for Date 2025-10-31
-- #
-- # Purpose: This script checks if data exists in all tables for the date 2025-10-31
-- # to help diagnose why actual_low and actual_high are showing as N/A
-- #
-- #############################################################################

-- Check 1: Latest historical date
SELECT 'Latest historical_date' AS check_type, MAX(date) AS value FROM public.historical_data;

-- Check 2: Data in forecast_check_history for 2025-10-31
SELECT 
    'forecast_check_history for 2025-10-31' AS check_type,
    COUNT(*) AS record_count,
    COUNT(DISTINCT stock_symbol) AS unique_stocks
FROM public.forecast_check_history 
WHERE forecast_date = '2025-10-31';

-- Check 3: Sample records from forecast_check_history for 2025-10-31
SELECT 
    stock_symbol,
    forecast_date,
    actual_low,
    actual_high,
    predicted_lo,
    predicted_hi
FROM public.forecast_check_history 
WHERE forecast_date = '2025-10-31'
LIMIT 10;

-- Check 4: Data in forecast_check_latest
SELECT 
    'forecast_check_latest' AS check_type,
    COUNT(*) AS record_count,
    MIN(forecast_date) AS min_date,
    MAX(forecast_date) AS max_date
FROM public.forecast_check_latest;

-- Check 5: Sample records from forecast_check_latest
SELECT 
    stock_symbol,
    forecast_date,
    actual_low,
    actual_high,
    predicted_lo,
    predicted_hi
FROM public.forecast_check_latest
LIMIT 10;

-- Check 6: Data in historical_data for 2025-10-31
SELECT 
    'historical_data for 2025-10-31' AS check_type,
    COUNT(*) AS record_count,
    COUNT(DISTINCT stock_symbol) AS unique_stocks
FROM public.historical_data 
WHERE date = '2025-10-31';

-- Check 7: Sample records from historical_data for 2025-10-31
SELECT 
    stock_symbol,
    date,
    low,
    high,
    close
FROM public.historical_data 
WHERE date = '2025-10-31'
LIMIT 10;

-- Check 8: Test the function with latest date
SELECT * FROM public.get_the_coming_trend_data() LIMIT 5;

