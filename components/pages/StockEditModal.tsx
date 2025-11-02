import React, { useState, useEffect } from 'react';
import type { Stock } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

interface StockEditModalProps {
  stock: Stock | null;
  onClose: () => void;
  onSave: (data: { symbol: string; name: string; is_tracked: boolean; }) => Promise<void>;
}

const StockEditModal: React.FC<StockEditModalProps> = ({ stock, onClose, onSave }) => {
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [isTracked, setIsTracked] = useState(true);
  
  useEffect(() => {
    if (stock) {
      setSymbol(stock.symbol);
      setName(stock.name);
      setIsTracked(stock.is_tracked);
    } else {
      // Reset form for new stock
      setSymbol('');
      setName('');
      setIsTracked(true);
    }
  }, [stock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const dataToSave = {
        symbol: symbol.toUpperCase().trim(),
        name: name.trim(),
        is_tracked: isTracked,
      };
      await onSave(dataToSave);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isNew = !stock;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xs" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Compact Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isNew ? t('add_new_stock') : t('edit_stock')}
            </h2>
          </div>
          
          {/* Compact Form Fields */}
          <div className="px-4 py-3 space-y-3">
            {error && (
              <div className="p-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="symbol" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('stock_symbol')}
              </label>
              <input 
                type="text" 
                id="symbol" 
                value={symbol} 
                onChange={e => setSymbol(e.target.value)} 
                required 
                disabled={!isNew}
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white uppercase" 
              />
            </div>
            
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('stock_name')}
              </label>
              <input 
                type="text" 
                id="name" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
              />
            </div>
            
            {/* Toggle - Compact */}
            <div className="flex items-center justify-between py-1">
              <label htmlFor="is_tracked" className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {t('tracking_status')}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {isTracked ? t('tracked') : t('not_tracked')}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={isTracked}
                    onChange={(e) => setIsTracked(e.target.checked)}
                  />
                  <div className="w-10 h-5 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
          
          {/* Compact Footer Buttons */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex justify-end items-center gap-2 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockEditModal;
