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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('translation_management')}</h1>
      <div className="mb-4">
        <input 
            type="text"
            placeholder={t('search_by_key_or_value')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
      </div>
      {notification && <div className={`mb-4 p-4 text-sm rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{notification.message}</div>}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <SortableHeader sortKey="key" label={t('translation_key')} sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="value_en" label={t('english_translation')} sortConfig={sortConfig} requestSort={requestSort} />
              <SortableHeader sortKey="value_ar" label={t('arabic_translation')} sortConfig={sortConfig} requestSort={requestSort} />
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedTranslations.map((row) => {
              const isEditing = !!editingRows[row.key];
              const isSaving = savingKey === row.key;
              return (
                <tr key={row.key} className={isEditing ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600 dark:text-gray-300 align-top">{row.key}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-800 dark:text-gray-200 w-1/3">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400">{t('original_value')}</label>
                          <p className="text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-md min-h-[2.5rem] whitespace-pre-wrap">{row.value_en || ' '}</p>
                        </div>
                        <div>
                          <label className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{t('new_value')}</label>
                          <textarea
                            value={editingRows[row.key].value_en}
                            onChange={(e) => handleEditingChange(row.key, 'value_en', e.target.value)}
                            className="w-full p-2 border border-blue-400 rounded-md dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                            rows={Math.max(2, (editingRows[row.key].value_en || '').split('\n').length)}
                          />
                        </div>
                      </div>
                    ) : (<p className="whitespace-pre-wrap">{row.value_en}</p>)}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-800 dark:text-gray-200 w-1/3" dir="rtl">
                     {isEditing ? (
                        <div className="flex flex-col gap-2">
                            <div>
                                <label className="text-xs text-gray-500 dark:text-gray-400">{t('original_value')}</label>
                                <p className="text-sm text-gray-600 dark:text-gray-400 p-2 bg-gray-100 dark:bg-gray-900/50 rounded-md min-h-[2.5rem] whitespace-pre-wrap">{row.value_ar || ' '}</p>
                            </div>
                            <div>
                                <label className="text-xs text-blue-600 dark:text-blue-400 font-semibold">{t('new_value')}</label>
                                <textarea
                                    value={editingRows[row.key].value_ar}
                                    onChange={(e) => handleEditingChange(row.key, 'value_ar', e.target.value)}
                                    className="w-full p-2 border border-blue-400 rounded-md dark:bg-gray-700 focus:ring-2 focus:ring-blue-500"
                                    dir="rtl"
                                    rows={Math.max(2, (editingRows[row.key].value_ar || '').split('\n').length)}
                                />
                            </div>
                        </div>
                    ) : (<p className="whitespace-pre-wrap">{row.value_ar}</p>)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleSave(row.key)} disabled={isSaving} className="py-1 px-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center">{isSaving ? <SpinnerIcon className="w-4 h-4" /> : t('save')}</button>
                        <button onClick={() => handleCancel(row.key)} className="py-1 px-3 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">{t('cancel')}</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEdit(row.key, row.value_en, row.value_ar)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"><PencilIcon className="w-5 h-5" /></button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {totalPages > 1 && (
            <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('page_x_of_y').replace('{currentPage}', String(currentPage)).replace('{totalPages}', String(totalPages))}</span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">{t('previous')}</button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">{t('next')}</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TranslationManagement;
