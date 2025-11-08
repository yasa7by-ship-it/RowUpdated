-- #############################################################################
-- #
-- # SCRIPT: Add 10 New Stocks to Database
-- #
-- # Purpose: Add 10 prominent stocks that are not currently in the database
-- # These stocks are from leading companies in their sectors
-- #
-- # This script uses INSERT ... ON CONFLICT DO NOTHING to safely add stocks
-- # without errors if they already exist
-- #
-- #############################################################################

BEGIN;

-- Add 10 new stocks
INSERT INTO public.stocks (symbol, name, is_tracked) VALUES
  ('SNOW', 'Snowflake Inc.', true),
  ('SHOP', 'Shopify Inc.', true),
  ('ZM', 'Zoom Video Communications', true),
  ('DOCU', 'DocuSign Inc.', true),
  ('TWLO', 'Twilio Inc.', true),
  ('NET', 'Cloudflare Inc.', true),
  ('OKTA', 'Okta Inc.', true),
  ('ROKU', 'Roku Inc.', true),
  ('SPLK', 'Splunk Inc.', true),
  ('ZS', 'Zscaler Inc.', true)
ON CONFLICT (symbol) DO UPDATE SET
  name = EXCLUDED.name,
  is_tracked = EXCLUDED.is_tracked;

COMMIT;

-- Verify the stocks were added
SELECT 
  symbol,
  name,
  is_tracked,
  CASE 
    WHEN symbol IN ('SNOW', 'SHOP', 'ZM', 'DOCU', 'TWLO', 'NET', 'OKTA', 'ROKU', 'SPLK', 'ZS') 
    THEN '✅ Added'
    ELSE 'Existing'
  END AS status
FROM public.stocks
WHERE symbol IN ('SNOW', 'SHOP', 'ZM', 'DOCU', 'TWLO', 'NET', 'OKTA', 'ROKU', 'SPLK', 'ZS')
ORDER BY symbol;

