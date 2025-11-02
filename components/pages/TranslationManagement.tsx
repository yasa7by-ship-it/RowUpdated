import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { PencilIcon, SpinnerIcon } from '../icons';

interface TranslationRow {
  key: string;
  value_en: string | null;
  value_ar: string | null;
}

type SortKey = 'key' | 'value_en' | 'value_ar';
type SortDirection = 'ascending' | 'descending';


const TranslationManagement: React.FC = () => {
  const { t, refetchTranslations } = useLanguage();
  const [allTranslations, setAllTranslations] = useState<TranslationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingRows, setEditingRows] = useState<Record<string, { value_en: string; value_ar: string }>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'key', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase.rpc('get_all_translations_for_management');
    if (fetchError) {
      console.error('Error fetching translations:', fetchError);
      setError(fetchError.message);
    } else {
      setAllTranslations((data as TranslationRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEdit = (key: string, value_en: string | null, value_ar: string | null) => {
    setEditingRows(prev => ({ ...prev, [key]: { value_en: value_en || '', value_ar: value_ar || '' } }));
  };

  const handleCancel = (key: string) => {
    setEditingRows(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  };

  const handleSave = async (key: string) => {
    setSavingKey(key);
    setNotification(null);
    const editedRow = editingRows[key];
    if (!editedRow) {
        setSavingKey(null);
        return;
    }

    const upserts = [
        { lang_id: 'en', key: key, value: editedRow.value_en },
        { lang_id: 'ar', key: key, value: editedRow.value_ar }
    ];

    const { error: upsertError } = await supabase.from('translations').upsert(upserts, { onConflict: 'lang_id,key' });

    if (upsertError) {
      setNotification({ type: 'error', message: t('translation_save_failed') });
    } else {
      setNotification({ type: 'success', message: t('translation_saved_successfully') });
      setAllTranslations(prev => prev.map(t => t.key === key ? { ...t, ...editedRow } : t));
      handleCancel(key);
      refetchTranslations(); // Globally update translations
    }
    setSavingKey(null);
    setTimeout(() => setNotification(null), 5000);
  };
  
  const handleEditingChange = (key: string, field: 'value_en' | 'value_ar', value: string) => {
      setEditingRows(prev => ({
          ...prev,
          [key]: {
              ...prev[key],
              [field]: value
          }
      }))
  }

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const processedTranslations = useMemo(() => {
    let filteredItems = [...allTranslations];
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.key.toLowerCase().includes(lowercasedFilter) ||
        item.value_en?.toLowerCase().includes(lowercasedFilter) ||
        item.value_ar?.toLowerCase().includes(lowercasedFilter)
      );
    }

    filteredItems.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });

    return filteredItems;
  }, [allTranslations, searchTerm, sortConfig]);
  
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);
  
  const totalPages = Math.ceil(processedTranslations.length / itemsPerPage);
  const paginatedTranslations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedTranslations.slice(startIndex, startIndex + itemsPerPage);
  }, [processedTranslations, currentPage]);

  if (loading) return <div className="flex items-center justify-center p-8"><SpinnerIcon className="w-8 h-8" /></div>;
  if (error) return <div className="p-4 bg-red-100 text-red-800 rounded-md">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Title Section */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('translation_management')}</h1>
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

      {/* Search Tool */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <input 
            type="text"
            placeholder={t('search_by_key_or_value')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[150px]">
                    <button 
                      onClick={() => requestSort('key')}
                      className="flex items-center gap-1 hover:text-nextrow-primary transition-all duration-200 font-semibold"
                    >
                      {t('translation_key')}
                      {sortConfig.key === 'key' && (
                        <span className="text-gray-400">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[200px]">
                    <button 
                      onClick={() => requestSort('value_en')}
                      className="flex items-center gap-1 hover:text-nextrow-primary transition-all duration-200 font-semibold"
                    >
                      {t('english_translation')}
                      {sortConfig.key === 'value_en' && (
                        <span className="text-gray-400">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[200px]">
                    <button 
                      onClick={() => requestSort('value_ar')}
                      className="flex items-center gap-1 hover:text-nextrow-primary transition-all duration-200 font-semibold"
                    >
                      {t('arabic_translation')}
                      {sortConfig.key === 'value_ar' && (
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
                {paginatedTranslations.map((row, index) => {
                  const isEditing = !!editingRows[row.key];
                  const isSaving = savingKey === row.key;
                  return (
                    <tr 
                      key={row.key} 
                      className={`group transition-all duration-200 ${
                        index % 2 === 0 
                          ? 'bg-white dark:bg-gray-800' 
                          : 'bg-gray-50/50 dark:bg-gray-800/50'
                      } ${isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-blue-50 dark:hover:bg-gray-700/70 hover:shadow-md`}
                    >
                      <td className="px-2 py-2 whitespace-nowrap text-left">
                        <div className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-300">
                          {row.key}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-left">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <div>
                              <label className="text-[10px] text-gray-500 dark:text-gray-400">{t('original_value')}</label>
                              <p className="text-xs text-gray-600 dark:text-gray-400 p-1.5 bg-gray-100 dark:bg-gray-900/50 rounded min-h-[2rem] whitespace-pre-wrap">{row.value_en || ' '}</p>
                            </div>
                            <div>
                              <label className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{t('new_value')}</label>
                              <textarea
                                value={editingRows[row.key].value_en}
                                onChange={(e) => handleEditingChange(row.key, 'value_en', e.target.value)}
                                className="w-full p-1.5 text-xs border border-blue-400 rounded-md dark:bg-gray-700 focus:ring-1 focus:ring-blue-500 resize-none"
                                rows={Math.max(2, Math.min(4, (editingRows[row.key].value_en || '').split('\n').length))}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs whitespace-pre-wrap text-gray-600 dark:text-gray-400">{row.value_en}</p>
                        )}
                      </td>
                      <td className="px-2 py-2 text-left" dir="rtl">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <div>
                              <label className="text-[10px] text-gray-500 dark:text-gray-400">{t('original_value')}</label>
                              <p className="text-xs text-gray-600 dark:text-gray-400 p-1.5 bg-gray-100 dark:bg-gray-900/50 rounded min-h-[2rem] whitespace-pre-wrap">{row.value_ar || ' '}</p>
                            </div>
                            <div>
                              <label className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{t('new_value')}</label>
                              <textarea
                                value={editingRows[row.key].value_ar}
                                onChange={(e) => handleEditingChange(row.key, 'value_ar', e.target.value)}
                                className="w-full p-1.5 text-xs border border-blue-400 rounded-md dark:bg-gray-700 focus:ring-1 focus:ring-blue-500 resize-none"
                                dir="rtl"
                                rows={Math.max(2, Math.min(4, (editingRows[row.key].value_ar || '').split('\n').length))}
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs whitespace-pre-wrap text-gray-600 dark:text-gray-400">{row.value_ar}</p>
                        )}
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => handleSave(row.key)} 
                              disabled={isSaving} 
                              className="px-2 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center gap-1 transition-colors"
                            >
                              {isSaving ? <SpinnerIcon className="w-3 h-3" /> : t('save')}
                            </button>
                            <button 
                              onClick={() => handleCancel(row.key)} 
                              className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-md transition-colors"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleEdit(row.key, row.value_en, row.value_ar)} 
                            className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 transform hover:scale-110 text-blue-600 dark:text-blue-400"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {paginatedTranslations.length === 0 && (
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
                  <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-semibold">{Math.min(currentPage * itemsPerPage, processedTranslations.length)}</span> من <span className="font-semibold">{processedTranslations.length}</span>
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

export default TranslationManagement;
