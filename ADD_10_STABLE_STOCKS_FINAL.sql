-- إضافة 10 أسهم لشركات مستقرة
INSERT INTO public.stocks (symbol, name, is_tracked) VALUES
  ('NOV', 'NOV Inc.', true),
  ('FTI', 'TechnipFMC plc', true),
  ('HES', 'Hess Corporation', true),
  ('MRO', 'Marathon Oil Corporation', true),
  ('OVV', 'Ovintiv Inc.', true),
  ('PR', 'Permian Resources Corporation', true),
  ('MTDR', 'Matador Resources Company', true),
  ('SM', 'SM Energy Company', true),
  ('SWN', 'Southwestern Energy Company', true),
  ('RRC', 'Range Resources Corporation', true)
ON CONFLICT (symbol) DO UPDATE SET
  name = EXCLUDED.name,
  is_tracked = EXCLUDED.is_tracked;

-- التحقق
SELECT symbol, name, is_tracked FROM public.stocks 
WHERE symbol IN ('NOV', 'FTI', 'HES', 'MRO', 'OVV', 'PR', 'MTDR', 'SM', 'SWN', 'RRC')
ORDER BY symbol;