import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { UserNote } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpinnerIcon } from '../icons';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

const UserNotesManagement: React.FC = () => {
    const { t } = useLanguage();
    const [notes, setNotes] = useState<UserNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_all_user_notes', {
                page_num: currentPage,
                page_size: itemsPerPage,
                search_query: debouncedSearchTerm
            });
            if (rpcError) throw rpcError;
            
            const results = (data as UserNote[]) || [];
            setNotes(results);

            if (results.length > 0) {
                setTotalPages(Math.ceil(results[0].total_count / itemsPerPage));
            } else {
                setTotalPages(1);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm]);
    
    const handleExport = () => {
        const header = ["Date", "User", "Email", "Note"].join(",");
        const rows = notes.map(note => [
            `"${new Date(note.created_at).toLocaleString()}"`,
            `"${note.user_full_name || ''}"`,
            `"${note.user_email || ''}"`,
            `"${(note.note_content || '').replace(/"/g, '""')}"`
        ].join(","));
        
        const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "user_notes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>User Notes</title>');
            printWindow.document.write('<style>body{font-family:sans-serif;} table{width:100%; border-collapse:collapse;} th,td{border:1px solid #ddd; padding:8px; text-align:left;} th{background-color:#f2f2f2;}</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(`<h1>${t('manage_user_notes')}</h1>`);
            printWindow.document.write('<table><thead><tr>');
            printWindow.document.write(`<th>${t('submission_date')}</th><th>${t('submitted_by')}</th><th>${t('email')}</th><th>${t('note_content')}</th>`);
            printWindow.document.write('</tr></thead><tbody>');
            notes.forEach(note => {
                printWindow.document.write('<tr>');
                printWindow.document.write(`<td>${new Date(note.created_at).toLocaleString()}</td>`);
                printWindow.document.write(`<td>${note.user_full_name || ''}</td>`);
                printWindow.document.write(`<td>${note.user_email || ''}</td>`);
                printWindow.document.write(`<td>${note.note_content}</td>`);
                printWindow.document.write('</tr>');
            });
            printWindow.document.write('</tbody></table>');
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('manage_user_notes')}</h1>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">{t('export_csv')}</button>
                    <button onClick={handlePrint} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">{t('print')}</button>
                </div>
            </div>
            
            <div className="mb-4">
                <input
                    type="text"
                    placeholder={t('search_notes')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-8"><SpinnerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" /></div>
            ) : error ? (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg shadow-md">
                    <p><strong>Error fetching data:</strong> {error}</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('submitted_by')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('submission_date')}</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('note_content')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {notes.length > 0 ? notes.map(note => (
                                    <tr key={note.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{note.user_full_name}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">{note.user_email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(note.created_at).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300"><p className="max-w-xl whitespace-pre-wrap">{note.note_content}</p></td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="text-center py-8 text-gray-500 dark:text-gray-400">{t('no_results_found')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                     {totalPages > 1 && (
                        <div className="p-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {t('page_x_of_y').replace('{currentPage}', String(currentPage)).replace('{totalPages}', String(totalPages))}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">{t('previous')}</button>
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">{t('next')}</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserNotesManagement;
