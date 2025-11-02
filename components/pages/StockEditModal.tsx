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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isNew ? t('add_new_stock') : t('edit_stock')}
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            {error && <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}
            
            <div>
              <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('stock_symbol')}</label>
              <input type="text" id="symbol" value={symbol} onChange={e => setSymbol(e.target.value)} required disabled={!isNew}
                     className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white uppercase" />
            </div>
            
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('stock_name')}</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required
                     className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            
            <div>
                <label htmlFor="is_tracked" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('tracking_status')}</label>
                <div className="mt-2 flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer"
                        checked={isTracked}
                        onChange={(e) => setIsTracked(e.target.checked)}
                        />
                        <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        <span className="ml-3 rtl:mr-3 text-sm font-medium text-gray-900 dark:text-gray-300">{isTracked ? t('tracked') : t('not_tracked')}</span>
                    </label>
                </div>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end items-center space-x-3 rtl:space-x-reverse">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              {t('cancel')}
            </button>
            <button type="submit" disabled={isSaving}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {isSaving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockEditModal;
