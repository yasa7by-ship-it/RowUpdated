import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Stock } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { PlusIcon, PencilIcon, SpinnerIcon, XMarkIcon } from '../icons';

type SortKey = keyof Pick<Stock, 'symbol' | 'name' | 'is_tracked'>;
type SortDirection = 'ascending' | 'descending';



const StockManagement: React.FC = () => {
  const { t } = useLanguage();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Form state for inline editing
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [isTracked, setIsTracked] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
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
    setSymbol('');
    setName('');
    setIsTracked(true);
    setFormError(null);
    setIsEditing(true);
  };

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock);
    setSymbol(stock.symbol);
    setName(stock.name);
    setIsTracked(stock.is_tracked);
    setFormError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingStock(null);
    setSymbol('');
    setName('');
    setIsTracked(true);
    setFormError(null);
  };
  
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    
    const trimmedSymbol = symbol.trim().toUpperCase();
    const trimmedName = name.trim();
    
    // Validation 1: Symbol
    if (!trimmedSymbol) {
      setFormError(t('symbol_required') || 'الرمز مطلوب');
      setIsSaving(false);
      return;
    }
    
    // Validate symbol format (1-10 uppercase letters/numbers only)
    if (trimmedSymbol.length < 1 || trimmedSymbol.length > 10 || !/^[A-Z0-9]+$/.test(trimmedSymbol)) {
      setFormError(t('invalid_symbol_format') || 'الرمز يجب أن يكون من 1-10 أحرف/أرقام فقط');
      setIsSaving(false);
      return;
    }

    // Check if symbol already exists (only for new stocks)
    if (!editingStock) {
      try {
        const { data, error: checkError } = await supabase
          .from('stocks')
          .select('symbol')
          .eq('symbol', trimmedSymbol)
          .maybeSingle();
        
        if (!checkError && data) {
          setFormError(t('symbol_already_exists') || 'الرمز موجود بالفعل');
          setIsSaving(false);
          return;
        }
      } catch (checkErr) {
        // Continue if check fails
      }
    }

    // Validation 2: Name
    if (!trimmedName) {
      setFormError(t('name_required') || 'الاسم مطلوب');
      setIsSaving(false);
      return;
    }
    
    if (trimmedName.length < 2) {
      setFormError(t('name_too_short') || 'الاسم يجب أن يكون حرفين على الأقل');
      setIsSaving(false);
      return;
    }
    
    if (trimmedName.length > 200) {
      setFormError(t('name_too_long') || 'الاسم طويل جداً (الحد الأقصى 200 حرف)');
      setIsSaving(false);
      return;
    }
    
    try {
      const stockData = {
        symbol: trimmedSymbol,
        name: trimmedName,
        is_tracked: isTracked,
      };
      
      const { error: upsertError } = await supabase
        .from('stocks')
        .upsert(stockData, { onConflict: 'symbol' });

      if (upsertError) {
        throw upsertError;
      }
      
      setNotification({ type: 'success', message: t('stock_saved_successfully') });
      setTimeout(() => setNotification(null), 5000);
      handleCancelEdit();
      fetchData(); // Refresh data
      setCurrentPage(1); // Go to first page to see changes
    } catch (err: any) {
      // Handle specific error messages
      let errorMessage = err.message || t('save_failed') || 'فشل الحفظ';
      
      if (err.message?.includes('duplicate') || err.message?.includes('already exists') || err.message?.includes('unique')) {
        errorMessage = t('symbol_already_exists') || 'الرمز موجود بالفعل';
      } else if (err.message?.includes('symbol')) {
        errorMessage = t('invalid_symbol_format') || 'الرمز غير صحيح';
      }
      
      setFormError(errorMessage);
    } finally {
      setIsSaving(false);
    }
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
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('stock_management')}</h1>
            <button
              onClick={handleAddNew}
              className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
              {t('add_new_stock')}
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="flex justify-center">
          <div className={`w-full max-w-2xl p-4 text-sm rounded-lg ${
              notification.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
              {notification.message}
          </div>
        </div>
      )}

      {/* Edit Form - Inline, above tools */}
      {isEditing && (
        <div className="flex justify-center">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSaveStock}>
              {/* Compact Header */}
              <div className="px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {editingStock ? t('edit_stock') : t('add_new_stock')}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              
              {/* Compact Form Fields */}
              <div className="px-4 py-3 space-y-2.5">
                {formError && (
                  <div className="p-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs">
                    {formError}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2">
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
                      disabled={!!editingStock}
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
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 flex justify-end items-center gap-2 border-t border-gray-200 dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={handleCancelEdit} 
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
      )}

      {/* Search and Filter Tools */}
      {!isEditing && (
        <div className="flex justify-center">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text"
                placeholder={t('search_stock_symbol_or_name')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <select
                value={trackingFilter}
                onChange={(e) => setTrackingFilter(e.target.value as any)}
                className="sm:w-auto min-w-[120px] px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">{t('all')}</option>
                <option value="tracked">{t('tracked')}</option>
                <option value="not_tracked">{t('not_tracked')}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[80px]">
                    <button 
                      onClick={() => requestSort('symbol')}
                      className="flex items-center gap-1 hover:text-nextrow-primary transition-all duration-200 font-semibold"
                    >
                      {t('stock_symbol')}
                      {sortConfig.key === 'symbol' && (
                        <span className="text-gray-400">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[150px]">
                    <button 
                      onClick={() => requestSort('name')}
                      className="flex items-center gap-1 hover:text-nextrow-primary transition-all duration-200 font-semibold"
                    >
                      {t('stock_name')}
                      {sortConfig.key === 'name' && (
                        <span className="text-gray-400">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[100px]">
                    <button 
                      onClick={() => requestSort('is_tracked')}
                      className="flex items-center gap-1 hover:text-nextrow-primary transition-all duration-200 font-semibold"
                    >
                      {t('tracking_status')}
                      {sortConfig.key === 'is_tracked' && (
                        <span className="text-gray-400">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[60px]">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedStocks.length > 0 ? paginatedStocks.map((stock, index) => (
                  <tr 
                    key={stock.symbol}
                    className={`group transition-all duration-200 ${
                      index % 2 === 0 
                        ? 'bg-white dark:bg-gray-800' 
                        : 'bg-gray-50/50 dark:bg-gray-800/50'
                    } hover:bg-blue-50 dark:hover:bg-gray-700/70 hover:shadow-md`}
                  >
                    <td className="px-2 py-2 whitespace-nowrap text-left">
                      <div className="text-xs font-semibold text-nextrow-primary hover:text-nextrow-primary/80 hover:underline transition-colors">
                        {stock.symbol}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-left">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {stock.name}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      {stock.is_tracked ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-700">
                          {t('tracked')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                          {t('not_tracked')}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(stock);
                        }} 
                        className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 transform hover:scale-110 text-blue-600 dark:text-blue-400"
                        title={t('edit')}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t('no_results_found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination - Same style as StockAnalysis */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-semibold">{Math.min(currentPage * itemsPerPage, processedStocks.length)}</span> من <span className="font-semibold">{processedStocks.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('previous')}
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                              currentPage === page
                                ? 'bg-nextrow-primary text-white'
                                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="text-gray-400 dark:text-gray-600">...</span>;
                      }
                      return null;
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {t('next')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockManagement;