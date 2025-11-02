import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Stock } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { PlusIcon, PencilIcon, SpinnerIcon } from '../icons';
import StockEditModal from './StockEditModal';

type SortKey = keyof Pick<Stock, 'symbol' | 'name' | 'is_tracked'>;
type SortDirection = 'ascending' | 'descending';

const SortableHeader: React.FC<{
  sortKey: SortKey;
  label: string;
  sortConfig: { key: SortKey; direction: SortDirection };
  requestSort: (key: SortKey) => void;
}> = ({ sortKey, label, sortConfig, requestSort }) => {
  const isSorted = sortConfig.key === sortKey;
  const icon = isSorted ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '';
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
      <button onClick={() => requestSort(sortKey)} className="flex items-center gap-2">
        {label}
        <span className="text-gray-400">{icon}</span>
      </button>
    </th>
  );
};


const StockManagement: React.FC = () => {
  const { t } = useLanguage();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Filtering, Sorting, and Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [trackingFilter, setTrackingFilter] = useState<'all' | 'tracked' | 'not_tracked'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'symbol', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('stocks')
      .select('symbol, name, is_tracked')
      .order('symbol', { ascending: true });
    
    if (fetchError) {
      console.error('Error fetching stocks:', fetchError);
      setError(fetchError.message);
    } else {
      setStocks(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddNew = () => {
    setEditingStock(null);
    setIsModalOpen(true);
  };

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStock(null);
  };
  
  const handleSaveStock = async (stockData: { symbol: string; name: string; is_tracked: boolean; }) => {
    const { error: upsertError } = await supabase
        .from('stocks')
        .upsert(stockData, { onConflict: 'symbol' });

    if (upsertError) {
        throw upsertError;
    }
    
    setNotification({ type: 'success', message: t('stock_saved_successfully') });
    setTimeout(() => setNotification(null), 5000);
    fetchData(); // Refresh data
    setCurrentPage(1); // Go to first page to see changes
  };
  
  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const processedStocks = useMemo(() => {
    let sortableItems = [...stocks];

    // Filtering
    if (trackingFilter !== 'all') {
      sortableItems = sortableItems.filter(stock => 
        trackingFilter === 'tracked' ? stock.is_tracked === true : stock.is_tracked === false
      );
    }
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      sortableItems = sortableItems.filter(stock => 
        stock.symbol.toLowerCase().includes(lowercasedFilter) ||
        stock.name.toLowerCase().includes(lowercasedFilter)
      );
    }

    // Sorting
    sortableItems.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return sortableItems;
  }, [stocks, searchTerm, trackingFilter, sortConfig]);
  
  // Reset to first page whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, trackingFilter]);
  
  const totalPages = Math.ceil(processedStocks.length / itemsPerPage);
  const paginatedStocks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedStocks.slice(startIndex, startIndex + itemsPerPage);
  }, [processedStocks, currentPage]);


  if (loading) return (
    <div className="flex items-center justify-center p-8">
        <SpinnerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <span className="ml-3 rtl:mr-3 text-lg">{t('loading')}...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg shadow-md">
        <p><strong>Error fetching data:</strong> {error}</p>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('stock_management')}</h1>
        <button
          onClick={handleAddNew}
          className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
          {t('add_new_stock')}
        </button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input 
            type="text"
            placeholder={t('search_stock_symbol_or_name')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto sm:max-w-xs px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <select
            value={trackingFilter}
            onChange={(e) => setTrackingFilter(e.target.value as any)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
            <option value="all">{t('all')}</option>
            <option value="tracked">{t('tracked')}</option>
            <option value="not_tracked">{t('not_tracked')}</option>
        </select>
       </div>

       {notification && (
          <div className={`mb-4 p-4 text-sm rounded-md ${
              notification.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
              {notification.message}
          </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <SortableHeader sortKey="symbol" label={t('stock_symbol')} sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="name" label={t('stock_name')} sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="is_tracked" label={t('tracking_status')} sortConfig={sortConfig} requestSort={requestSort} />
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedStocks.length > 0 ? paginatedStocks.map((stock) => (
              <tr key={stock.symbol}>
                <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900 dark:text-white">{stock.symbol}</td>
                <td className="px-6 py-4 whitespace-nowrap text-base text-gray-600 dark:text-gray-300">{stock.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-base">
                  {stock.is_tracked ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {t('tracked')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                      {t('not_tracked')}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(stock)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200" title={t('edit')}>
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {t('no_results_found')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
         {totalPages > 1 && (
            <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('page_x_of_y').replace('{currentPage}', String(currentPage)).replace('{totalPages}', String(totalPages))}
                </span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                            className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">
                        {t('previous')}
                    </button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                             className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">
                        {t('next')}
                    </button>
                </div>
            </div>
        )}
      </div>
      
      {isModalOpen && (
        <StockEditModal
          stock={editingStock}
          onClose={handleCloseModal}
          onSave={handleSaveStock}
        />
      )}
    </div>
  );
};

export default StockManagement;