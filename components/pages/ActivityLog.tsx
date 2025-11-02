// FIX: Import `useMemo` from React to resolve the 'Cannot find name' error.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { ActivityLogItem } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { SpinnerIcon, TrashIcon } from '../icons';
import LogDescription from './LogDescription';
import LogChange from './LogChange';
import ArchiveLogModal from './ArchiveLogModal';

// Debounce hook for search input
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const DateTimeFormat: React.FC<{ isoString: string }> = ({ isoString }) => {
    try {
        const date = new Date(isoString);
        // YYYY/MM/DD format
        const datePart = date.toLocaleDateString('en-CA').replace(/-/g, '/');
        // HH:MM:SS (24h) format
        const timePart = date.toLocaleTimeString('en-GB');
        return (
            <div className="flex flex-col">
                <span>{datePart}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{timePart}</span>
            </div>
        );
    } catch {
        return <>{isoString}</>;
    }
};

const ActionBadge: React.FC<{ action: string }> = ({ action }) => {
    const { t } = useLanguage();
    const colorClass = useMemo(() => {
        if (action.includes('ADD') || action.includes('CREATE')) return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        if (action.includes('REMOVE') || action.includes('DELETE')) return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        if (action.includes('CHANGE') || action.includes('UPDATE')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        if (action.includes('LOGIN')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }, [action]);

    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-md ${colorClass}`}>
            {t(`log_action_${action}`)}
        </span>
    );
};

const ActivityLog: React.FC = () => {
    const { t } = useLanguage();
    const { hasPermission } = useAuth();
    const [logs, setLogs] = useState<ActivityLogItem[]>([]);
    const [actionTypes, setActionTypes] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 20;

    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: rpcError } = await supabase.rpc('get_activity_logs', {
                page_num: currentPage,
                page_size: itemsPerPage,
                search_query: debouncedSearchTerm,
                filter_action: actionFilter,
                start_date_filter: startDate || null,
                end_date_filter: endDate || null
            });
            if (rpcError) throw rpcError;
            
            const results = (data as ActivityLogItem[]) || [];
            setLogs(results);

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
    }, [currentPage, debouncedSearchTerm, actionFilter, startDate, endDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    useEffect(() => {
        const fetchActionTypes = async () => {
            const { data, error } = await supabase.rpc('get_distinct_log_actions');
            if (data) {
                setActionTypes(data.map((item: any) => item.action));
            }
        };
        fetchActionTypes();
    }, []);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, actionFilter, startDate, endDate]);

    // Calculate pagination info
    const startIndex = logs.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0;
    const endIndex = logs.length > 0 ? Math.min(currentPage * itemsPerPage, logs[0]?.total_count || 0) : 0;
    const totalItems = logs.length > 0 ? (logs[0]?.total_count || 0) : 0;

    return (
        <div className="space-y-6">
            {/* Title and Archive Button Section */}
            <div className="flex justify-center">
                <div className="w-full max-w-2xl flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('activity_log')}</h1>
                    {hasPermission('truncate:activity_log') && (
                        <button
                            onClick={() => setIsArchiveModalOpen(true)}
                            className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            <TrashIcon className="w-4 h-4 mr-2" />
                            {t('archive_and_clear')}
                        </button>
                    )}
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
            
            {/* Search and Filters - Same width as table */}
            <div className="flex justify-center">
                <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <input
                            type="text"
                            placeholder={t('search_by_name_or_email')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value="">{t('all_actions')}</option>
                            {actionTypes.map(action => <option key={action} value={action}>{t(`log_action_${action}`)}</option>)}
                        </select>
                        <div>
                            <label htmlFor="start_date" className="sr-only">{t('start_date')}</label>
                            <input 
                                type="date" 
                                id="start_date" 
                                value={startDate} 
                                onChange={e => setStartDate(e.target.value)} 
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            />
                        </div>
                        <div>
                            <label htmlFor="end_date" className="sr-only">{t('end_date')}</label>
                            <input 
                                type="date" 
                                id="end_date" 
                                value={endDate} 
                                onChange={e => setEndDate(e.target.value)} 
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-8"><SpinnerIcon className="w-8 h-8" /></div>
            ) : error ? (
                <div className="flex justify-center">
                    <div className="w-full max-w-2xl p-4 bg-red-100 text-red-800 rounded-md">{error}</div>
                </div>
            ) : (
                /* Table - Same design as StockAnalysis */
                <div className="flex justify-center">
                    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[120px]">
                                            {t('date_time')}
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[120px]">
                                            {t('user')}
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[100px]">
                                            {t('action_type')}
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[150px]">
                                            {t('summary')}
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[120px]">
                                            {t('data_before')}
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[120px]">
                                            {t('data_after')}
                                        </th>
                                        <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[100px]">
                                            {t('ip_address')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {logs.length > 0 ? logs.map((log, index) => (
                                        <tr 
                                            key={log.id} 
                                            className={`group transition-all duration-200 ${
                                                index % 2 === 0 
                                                    ? 'bg-white dark:bg-gray-800' 
                                                    : 'bg-gray-50/50 dark:bg-gray-800/50'
                                            } hover:bg-blue-50 dark:hover:bg-gray-700/70 hover:shadow-md`}
                                        >
                                            <td className="px-2 py-2 whitespace-nowrap text-xs text-left rtl:text-right text-gray-600 dark:text-gray-300 align-top">
                                                <DateTimeFormat isoString={log.created_at} />
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap align-top">
                                                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200">{log.user_full_name || 'System'}</div>
                                                <div className="text-[10px] text-gray-500 dark:text-gray-400">{log.user_email || 'N/A'}</div>
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-xs text-left rtl:text-right align-top">
                                                <ActionBadge action={log.action} />
                                            </td>
                                            <td className="px-2 py-2 whitespace-normal text-xs text-left rtl:text-right text-gray-600 dark:text-gray-400 align-top">
                                                <LogDescription action={log.action} details={log.details} />
                                            </td>
                                            <td className="px-2 py-2 whitespace-normal text-xs text-left rtl:text-right text-gray-600 dark:text-gray-400 align-top">
                                                <LogChange action={log.action} details={log.details} type="before" />
                                            </td>
                                            <td className="px-2 py-2 whitespace-normal text-xs text-left rtl:text-right text-gray-600 dark:text-gray-400 align-top">
                                                <LogChange action={log.action} details={log.details} type="after" />
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap text-xs text-left rtl:text-right font-mono text-gray-500 dark:text-gray-400 align-top">
                                                {log.ip_address || 'N/A'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                                {t('no_logs_found')}
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
                                        <span className="font-semibold">{startIndex}</span> - <span className="font-semibold">{endIndex}</span> من <span className="font-semibold">{totalItems}</span>
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
            )}
            
            {isArchiveModalOpen && (
                <ArchiveLogModal
                    onClose={() => setIsArchiveModalOpen(false)}
                    onSuccess={() => {
                        setIsArchiveModalOpen(false);
                        fetchData();
                        setNotification({ type: 'success', message: t('log_archived_and_deleted') });
                        setTimeout(() => setNotification(null), 5000);
                    }}
                />
            )}
        </div>
    );
};

export default ActivityLog;