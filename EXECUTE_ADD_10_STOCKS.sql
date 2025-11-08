-- #############################################################################
-- # SCRIPT: Create RPC Function to Add Stocks and Execute It
-- # Purpose: Create a secure RPC function to add stocks, then use it
-- #############################################################################

BEGIN;

-- Step 1: Create RPC function to add stocks (with SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.add_stocks_batch(p_stocks jsonb)
RETURNS TABLE(symbol text, name text, added boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stock_record jsonb;
  result_symbol text;
  result_name text;
  result_added boolean;
BEGIN
  -- Loop through each stock in the JSON array
  FOR stock_record IN SELECT * FROM jsonb_array_elements(p_stocks)
  LOOP
    result_symbol := stock_record->>'symbol';
    result_name := stock_record->>'name';
    
    -- Insert or update the stock
    INSERT INTO public.stocks (symbol, name, is_tracked)
    VALUES (
      result_symbol,
      result_name,
      COALESCE((stock_record->>'is_tracked')::boolean, true)
    )
    ON CONFLICT (symbol) DO UPDATE SET
      name = EXCLUDED.name,
      is_tracked = EXCLUDED.is_tracked;
    
    result_added := true;
    
    -- Return the result
    RETURN QUERY SELECT result_symbol, result_name, result_added;
  END LOOP;
END;
$$;

COMMIT;

-- Step 2: Call the function to add the 10 stocks
SELECT * FROM public.add_stocks_batch('[
  {"symbol": "SNOW", "name": "Snowflake Inc.", "is_tracked": true},
  {"symbol": "SHOP", "name": "Shopify Inc.", "is_tracked": true},
  {"symbol": "ZM", "name": "Zoom Video Communications", "is_tracked": true},
  {"symbol": "DOCU", "name": "DocuSign Inc.", "is_tracked": true},
  {"symbol": "TWLO", "name": "Twilio Inc.", "is_tracked": true},
  {"symbol": "NET", "name": "Cloudflare Inc.", "is_tracked": true},
  {"symbol": "OKTA", "name": "Okta Inc.", "is_tracked": true},
  {"symbol": "ROKU", "name": "Roku Inc.", "is_tracked": true},
  {"symbol": "SPLK", "name": "Splunk Inc.", "is_tracked": true},
  {"symbol": "ZS", "name": "Zscaler Inc.", "is_tracked": true}
]'::jsonb);

-- Step 3: Verify the stocks were added
SELECT 
  symbol,
  name,
  is_tracked,
  '✅ Added' AS status
FROM public.stocks
WHERE symbol IN ('SNOW', 'SHOP', 'ZM', 'DOCU', 'TWLO', 'NET', 'OKTA', 'ROKU', 'SPLK', 'ZS')
ORDER BY symbol;

