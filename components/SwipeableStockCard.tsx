import React from 'react';
import { StarIcon, ArrowUpIcon, ArrowDownIcon } from './icons';
import type { DailyWatchlistItem } from '../types';

interface SwipeableStockCardProps {
  item: DailyWatchlistItem;
  isFavorite: (symbol: string) => boolean;
  toggleFavorite: (symbol: string) => void;
  onCardClick: () => void;
  t: (key: string) => string;
  formatNumber: (num: number | null | undefined, options?: Intl.NumberFormatOptions) => string;
}

const SwipeableStockCard: React.FC<SwipeableStockCardProps> = ({
  item,
  isFavorite,
  toggleFavorite,
  onCardClick,
  t,
  formatNumber,
}) => {
  const isFav = isFavorite(item.symbol);

  // Get price change indicator
  const priceChange = item.daily_change ?? 0;
  const priceChangePercent = item.daily_change_percent ?? 0;
  const isPositive = priceChange >= 0;

  // RSI status
  const rsi = item.rsi ?? 0;
  const getRsiColor = () => {
    if (rsi > 70) return { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40' };
    if (rsi < 30) return { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40' };
    return { color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/40' };
  };
  const rsiStyle = getRsiColor();

  return (
    <div
      className="relative w-full h-[calc(100vh-200px)] min-h-[600px] rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-gray-700/50 shadow-2xl cursor-pointer"
      onClick={onCardClick}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-black"></div>
      
      {/* Glow effects */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-pink-500/20 blur-2xl opacity-50"></div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col p-6 md:p-8">
        {/* Header - Stock Symbol & Favorite */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(item.symbol);
                }}
                className={`p-3 rounded-2xl transition-all transform active:scale-90 ${
                  isFav 
                    ? 'text-yellow-400 bg-yellow-400/20 shadow-lg shadow-yellow-400/30' 
                    : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'
                }`}
              >
                <StarIcon className={`w-7 h-7 ${isFav ? 'fill-current' : ''}`} />
              </button>
              <div>
                <h2 className="text-5xl md:text-6xl font-black text-white mb-2 drop-shadow-2xl">
                  {item.symbol}
                </h2>
                <p className="text-gray-400 text-lg font-medium">{item.stock_name || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Price & Change - Large & Prominent */}
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
              {t('column_price_date')}
            </span>
          </div>
          <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm rounded-2xl p-5 border border-gray-600/30 mb-3">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl md:text-5xl font-black text-white">
                ${formatNumber(item.last_price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {priceChange !== 0 && (
                <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-lg ${
                  isPositive ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}>
                  {isPositive ? <ArrowUpIcon className="w-5 h-5" /> : <ArrowDownIcon className="w-5 h-5" />}
                  <span>{isPositive ? '+' : ''}{formatNumber(priceChangePercent)}%</span>
                </div>
              )}
            </div>
            {item.indicator_date && (
              <p className="text-gray-400 text-sm mt-2">
                {new Date(item.indicator_date + 'T00:00:00Z').toLocaleDateString('en-CA', { timeZone: 'UTC' })}
              </p>
            )}
          </div>
        </div>

        {/* Key Indicators - Colorful & Clear */}
        <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
          {/* RSI Indicator */}
          <div className={`relative ${rsiStyle.bg} border-2 ${rsiStyle.border} rounded-2xl p-4 backdrop-blur-sm overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-current/10 to-transparent blur-xl opacity-50"></div>
            <div className="relative z-10">
              <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wide">RSI</p>
              <p className={`text-3xl font-black ${rsiStyle.color} mb-1`}>
                {formatNumber(rsi, { maximumFractionDigits: 1 })}
              </p>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full ${rsi > 70 ? 'bg-red-500' : rsi < 30 ? 'bg-green-500' : 'bg-gray-500'} transition-all`}
                  style={{ width: `${Math.min(100, rsi)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* MACD Indicator */}
          <div className={`relative bg-blue-500/20 border-2 border-blue-500/40 rounded-2xl p-4 backdrop-blur-sm overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent blur-xl opacity-50"></div>
            <div className="relative z-10">
              <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wide">MACD</p>
              <div className="space-y-1">
                <p className="text-white text-lg font-bold">
                  {formatNumber(item.macd, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {item.macd_signal && (
                  <p className="text-blue-400 text-sm">
                    Signal: {formatNumber(item.macd_signal, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actual Range - Red */}
          <div className="relative bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/40 rounded-2xl p-4 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-red-500/10 blur-xl"></div>
            <div className="relative z-10">
              <p className="text-xs text-red-400 mb-2 font-bold uppercase tracking-wide">{t('column_actual_range')}</p>
              <div className="space-y-1">
                <p className="text-red-400 text-2xl font-black">
                  {formatNumber(Math.min(item.actual_low ?? 0, item.actual_high ?? 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-green-400 text-2xl font-black">
                  {formatNumber(Math.max(item.actual_low ?? 0, item.actual_high ?? 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Expected Range - Green */}
          <div className="relative bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/40 rounded-2xl p-4 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-green-500/10 blur-xl"></div>
            <div className="relative z-10">
              <p className="text-xs text-green-400 mb-2 font-bold uppercase tracking-wide">{t('column_expected_range')}</p>
              <div className="space-y-1">
                <p className="text-red-400 text-2xl font-black">
                  {formatNumber(Math.min(item.next_predicted_lo ?? 0, item.next_predicted_hi ?? 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-green-400 text-2xl font-black">
                  {formatNumber(Math.max(item.next_predicted_lo ?? 0, item.next_predicted_hi ?? 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tap to View Details Hint */}
        <div className="text-center pt-4 border-t border-gray-700/50">
          <p className="text-gray-500 text-sm font-medium animate-pulse">
            👆 {t('view_details') || 'Tap to view full details'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SwipeableStockCard;

