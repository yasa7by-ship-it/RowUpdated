-- #############################################################################
-- #
-- # SCRIPT: List All Functions in Database
-- #
-- # Purpose: This script lists all functions (RPC functions) in the database
-- # with their parameters, return types, and source code.
-- #
-- #############################################################################

-- List all functions with their details
SELECT 
    n.nspname AS schema_name,
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type,
    pg_get_functiondef(p.oid) AS function_definition,
    l.lanname AS language,
    CASE 
        WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
        WHEN p.provolatile = 's' THEN 'STABLE'
        WHEN p.provolatile = 'v' THEN 'VOLATILE'
    END AS volatility,
    CASE
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END AS security
FROM 
    pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_language l ON p.prolang = l.oid
WHERE 
    n.nspname = 'public'
    AND p.prokind = 'f'  -- Functions only (not procedures)
ORDER BY 
    p.proname;

-- Alternative: List only RPC functions (functions callable via Supabase RPC)
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type,
    CASE 
        WHEN p.provolatile = 's' THEN 'STABLE'
        WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
        ELSE 'VOLATILE'
    END AS volatility
FROM 
    pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE 
    n.nspname = 'public'
    AND p.prokind = 'f'
    AND p.proname LIKE 'get_%'  -- Functions starting with 'get_' (typical RPC pattern)
ORDER BY 
    p.proname;

-- Get full source code for a specific function (example: get_the_coming_trend_data)
SELECT 
    pg_get_functiondef(oid) AS function_source
FROM 
    pg_proc
WHERE 
    proname = 'get_the_coming_trend_data'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

