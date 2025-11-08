CREATE TABLE IF NOT EXISTS public.nasdaq_daily_snapshot (
  trading_date        DATE PRIMARY KEY,
  close_price         NUMERIC(12,2),
  change_points       NUMERIC(12,2),
  change_percent      NUMERIC(6,2),
  open_price          NUMERIC(12,2),
  high_price          NUMERIC(12,2),
  low_price           NUMERIC(12,2),
  volume              BIGINT,
  advancers_count     INTEGER,
  decliners_count     INTEGER,
  leading_sector      TEXT,
  lagging_sector      TEXT,
  headline            TEXT,
  headline_source     TEXT,
  heatmap_json        JSONB,
  sectors_json        JSONB,
  metadata_json       JSONB,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT now()
);

COMMENT ON TABLE public.nasdaq_daily_snapshot IS 'Stores end-of-day snapshot metrics for the NASDAQ index.';
COMMENT ON COLUMN public.nasdaq_daily_snapshot.heatmap_json IS 'JSON array describing top contributing symbols (e.g. symbol, weight, change_percent).';
COMMENT ON COLUMN public.nasdaq_daily_snapshot.sectors_json IS 'JSON array describing sector performance for the session.';
COMMENT ON COLUMN public.nasdaq_daily_snapshot.metadata_json IS 'Additional free-form metadata collected with the snapshot.';

CREATE INDEX IF NOT EXISTS idx_nasdaq_daily_snapshot_created_at
  ON public.nasdaq_daily_snapshot (created_at DESC);

CREATE OR REPLACE FUNCTION public.upsert_nasdaq_daily_snapshot(
  p_trading_date        DATE,
  p_close_price         NUMERIC,
  p_change_points       NUMERIC,
  p_change_percent      NUMERIC,
  p_open_price          NUMERIC,
  p_high_price          NUMERIC,
  p_low_price           NUMERIC,
  p_volume              BIGINT,
  p_advancers_count     INTEGER,
  p_decliners_count     INTEGER,
  p_leading_sector      TEXT,
  p_lagging_sector      TEXT,
  p_headline            TEXT,
  p_headline_source     TEXT,
  p_heatmap_json        JSONB,
  p_sectors_json        JSONB,
  p_metadata_json       JSONB
)
RETURNS public.nasdaq_daily_snapshot
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS
$$
DECLARE
  v_record public.nasdaq_daily_snapshot;
BEGIN
  INSERT INTO public.nasdaq_daily_snapshot AS s (
    trading_date,
    close_price,
    change_points,
    change_percent,
    open_price,
    high_price,
    low_price,
    volume,
    advancers_count,
    decliners_count,
    leading_sector,
    lagging_sector,
    headline,
    headline_source,
    heatmap_json,
    sectors_json,
    metadata_json,
    created_at
  ) VALUES (
    p_trading_date,
    p_close_price,
    p_change_points,
    p_change_percent,
    p_open_price,
    p_high_price,
    p_low_price,
    p_volume,
    p_advancers_count,
    p_decliners_count,
    p_leading_sector,
    p_lagging_sector,
    p_headline,
    p_headline_source,
    COALESCE(p_heatmap_json, '[]'::jsonb),
    COALESCE(p_sectors_json, '[]'::jsonb),
    COALESCE(p_metadata_json, '{}'::jsonb),
    now()
  )
  ON CONFLICT (trading_date) DO UPDATE
  SET close_price = EXCLUDED.close_price,
      change_points = EXCLUDED.change_points,
      change_percent = EXCLUDED.change_percent,
      open_price = EXCLUDED.open_price,
      high_price = EXCLUDED.high_price,
      low_price = EXCLUDED.low_price,
      volume = EXCLUDED.volume,
      advancers_count = EXCLUDED.advancers_count,
      decliners_count = EXCLUDED.decliners_count,
      leading_sector = EXCLUDED.leading_sector,
      lagging_sector = EXCLUDED.lagging_sector,
      headline = EXCLUDED.headline,
      headline_source = EXCLUDED.headline_source,
      heatmap_json = EXCLUDED.heatmap_json,
      sectors_json = EXCLUDED.sectors_json,
      metadata_json = EXCLUDED.metadata_json,
      created_at = now()
  RETURNING * INTO v_record;

  RETURN v_record;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_latest_nasdaq_snapshot()
RETURNS public.nasdaq_daily_snapshot
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS
$$
  SELECT s.*
  FROM public.nasdaq_daily_snapshot s
  ORDER BY s.trading_date DESC
  LIMIT 1;
$$;

GRANT SELECT ON public.nasdaq_daily_snapshot TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.nasdaq_daily_snapshot TO service_role;
GRANT EXECUTE ON FUNCTION public.get_latest_nasdaq_snapshot() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_nasdaq_daily_snapshot(
  DATE, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, BIGINT,
  INTEGER, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, JSONB
) TO service_role;
