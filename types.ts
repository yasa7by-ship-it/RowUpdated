

import { Type } from '@google/genai';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role_id: string | null;
  email_confirmed_at: string | null;
  preferred_language: Language;
  // This nested structure is what we fetch from Supabase
  roles: {
    name: string;
    permissions: {
      action: string;
    }[];
  } | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface Permission {
  id: string;
  action: string;
  description: string | null;
}

export interface RolePermission {
    role_id: string;
    permission_id: string;
}

export type AnnouncementType = 'info' | 'warning' | 'success' | 'error';

export interface GlobalAnnouncement {
    id: number;
    title: { [key: string]: string }; // For JSONB: { en: 'Title', ar: 'عنوان' }
    message: { [key: string]: string }; // For JSONB
    type: AnnouncementType;
    start_date: string; // ISO 8601 string
    end_date: string;   // ISO 8601 string
    is_enabled: boolean;
    created_at: string;
}

// FIX: Added the missing Advertisement interface to resolve import errors.
export interface Advertisement {
    id: number;
    title: { [key: string]: string }; // For JSONB: { en: 'Title', ar: 'عنوان' }
    advertiser_name: { [key: string]: string } | null; // For JSONB
    image_url: string | null;
    target_url: string | null;
    placement: string;
    start_date: string; // ISO 8601 string
    end_date: string;   // ISO 8601 string
    is_enabled: boolean;
    created_at: string;
}

export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';

export type Translations = {
  [key: string]: string;
};

export type AppSettings = {
  [key: string]: string;
};

// --- App Navigation Types ---
export type PageName = 'landing' | 'dashboard' | 'users' | 'roles' | 'announcements' | 'system_documentation' | 'stock_analysis' | 'daily_watchlist' | 'stock_management' | 'translations' | 'stock_details' | 'activity_log' | 'user_notes' | 'user_notes_management' | 'forecast_accuracy';
export type PageState = PageName | { page: 'stock_details'; symbol: string };


// --- System Documentation Types ---

export interface ColumnDocumentation {
    name: string;
    type: string;
    nullable: 'YES' | 'NO';
    default: string | null;
    description: string | null;
}

export interface TableDocumentation {
    name: string;
    description: string | null;
    columns: ColumnDocumentation[];
}

export interface FunctionDocumentation {
    name: string;
    definition: string;
}

export interface PolicyDocumentation {
    table: string;
    name: string;
    command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
    definition: string | null;
    with_check: string | null;
}

export interface DatabaseDocumentation {
    tables: TableDocumentation[];
    functions: FunctionDocumentation[];
    policies: PolicyDocumentation[];
}

// --- Stock Analysis Types ---
export interface DailyChecklistItem {
  stock_symbol: string;
  stock_name: string;
  last_updated: string | null;
  price: number | null;
  actual_low: number;
  actual_high: number;
  predicted_lo: number;
  predicted_hi: number;
  is_hit: boolean;
  forecast_date: string;
}

export interface DailyWatchlistItem {
  // Stock info
  symbol: string;
  stock_name: string;
  last_price: number | null;
  daily_change: number | null;
  daily_change_percent: number | null;
  
  // Next upcoming forecast
  next_forecast_date: string | null;
  next_predicted_lo: number | null;
  next_predicted_hi: number | null;
  
  // Latest technical indicators
  indicator_date: string | null;
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
  sma20: number | null;
  sma50: number | null;

  // Latest candle pattern
  pattern_name: string | null;
  bullish: boolean | null;
  
  // Actual price range from historical_data
  actual_low: number | null;
  actual_high: number | null;
}


// --- NEW Stock Management Type ---
export interface Stock {
  symbol: string;
  name: string;
  is_tracked: boolean;
  price?: number | null;
  change?: number | null;
  change_percent?: number | null;
  volume?: number | null;
  market_cap?: number | null;
  last_updated?: string | null;
}


// --- OLD / UNUSED TYPES ---
export interface StockListItem {
    symbol: string;
    name: string;
}

export interface StockDetails {
    symbol: string;
    name: string;
    price: number;
    change: number;
    change_percent: number;
    volume: number;
    market_cap: number;
    last_updated: string;
    is_tracked: boolean;
}

export interface HistoricalData {
    id: number;
    stock_symbol: string;
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface TechnicalIndicators {
    id: number;
    stock_symbol: string;
    date: string;
    rsi: number | null;
    macd: number | null;
    macd_signal: number | null;
    macd_histogram: number | null;
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
    ema12: number | null;
    ema26: number | null;
    boll_upper: number | null;
    boll_middle: number | null;
    boll_lower: number | null;
    stochastic_k: number | null;
    stochastic_d: number | null;
    williams_r: number | null;
    volatility_20: number | null;
    atr14: number | null;
    macd_cross: number | null;
    rsi_zone: number | null;
}

export interface CandlePattern {
    id: number;
    stock_symbol: string;
    date: string;
    pattern_name: string;
    bullish: boolean;
    confidence: number;
}

export interface Forecast {
    id: number;
    stock_symbol: string;
    forecast_date: string;
    predicted_price: number;
    predicted_lo: number;
    predicted_hi: number;
    confidence: number;
}

export interface ForecastHistory {
    run_id: number;
    stock_symbol: string;
    forecast_date: string;
    predicted_price: number;
    actual_close: number;
    hit_range: boolean;
}

export interface StockDeepDive {
    details: StockDetails;
    historical_data: HistoricalData[];
    technical_indicators: TechnicalIndicators[];
    candle_patterns: CandlePattern[];
    latest_forecast: Forecast | null;
    forecast_history: ForecastHistory[];
}

// --- Stock Details Page Types ---

export interface ForecastCheckHistoryItem {
    stock_symbol: string;
    forecast_date: string;
    predicted_price: number | null;
    predicted_lo: number;
    predicted_hi: number;
    actual_low: number;
    actual_high: number;
    actual_close: number | null;
    hit_range: boolean;
    abs_error: number | null;
    pct_error: number | null;
    confidence: number | null;
    created_at: string;
}

export interface StockDetailsPageData {
    details: Stock | null;
    next_forecast: Forecast | null;
    historical_data: HistoricalData[];
    latest_indicators: TechnicalIndicators | null;
    forecast_history: ForecastCheckHistoryItem[];
    recent_patterns: CandlePattern[];
}

// --- NEW Activity Log Type ---
export interface ActivityLogItem {
  id: number;
  created_at: string;
  user_full_name: string | null;
  user_email: string | null;
  action: string;
  ip_address: string | null;
  details: any; // JSONB
  total_count: number;
}

// --- NEW User Notes Types ---
export interface UserNote {
  id: number;
  created_at: string;
  user_id: string;
  note_content: string;
  user_full_name: string | null; // From JOIN
  user_email: string | null; // From JOIN
  total_count: number; // For pagination
}