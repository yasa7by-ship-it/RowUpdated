import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpinnerIcon, CheckCircleIcon, XCircleIcon, InformationCircleIcon } from '../icons';

interface ProcessResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isLoading: boolean;
  result: string | number | null;
  error: string | null;
}

const ProcessResultModal: React.FC<ProcessResultModalProps> = ({ isOpen, onClose, title, isLoading, result, error }) => {
    const { t } = useLanguage();

    const parseSummaryResult = (res: string) => {
        const processedMatch = res.match(/Processed: (\d+)/);
        const errorsMatch = res.match(/(?:Errors|Errors\/Skipped): (\d+)/);
        const processed = processedMatch ? processedMatch[1] : 'N/A';
        const errors = errorsMatch ? errorsMatch[1] : 'N/A';
        return (
             <div className="space-y-3 w-full">
                <div className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <CheckCircleIcon className="w-8 h-8 text-green-500 shrink-0" />
                    <div>
                        <p className="font-semibold text-green-800 dark:text-green-200">{t('generation_complete_message')}</p>
                        <p className="text-sm text-green-700 dark:text-green-300">{t('process_summary')}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('processed_count')}</p>
                        <p className="text-3xl font-bold text-gray-800 dark:text-white">{processed}</p>
                    </div>
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('errors_skipped')}</p>
                        <p className="text-3xl font-bold text-gray-800 dark:text-white">{errors}</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderResult = () => {
        if (result === 'PROCESS_STARTED') {
            return (
                <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg w-full">
                    <InformationCircleIcon className="w-8 h-8 text-blue-500 shrink-0" />
                    <div>
                        <p className="font-semibold text-blue-800 dark:text-blue-200">{t('process_started_title')}</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">{t('process_started_message')}</p>
                    </div>
                </div>
            );
        }

        if (typeof result === 'string') {
            return parseSummaryResult(result);
        }
        if (typeof result === 'number') {
            return (
                <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                    <CheckCircleIcon className="w-8 h-8 text-green-500 shrink-0" />
                    <div>
                        <p className="font-semibold text-green-800 dark:text-green-200">{t('evaluation_complete_message').replace('{count}', String(result))}</p>
                    </div>
                </div>
            );
        }
        return null;
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
                </div>
                <div className="p-6 min-h-[150px] flex items-center justify-center">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center space-y-4">
                            <SpinnerIcon className="w-12 h-12 text-blue-500" />
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{t('running_process')}...</p>
                        </div>
                    ) : error ? (
                         <div className="flex items-start gap-4 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg w-full">
                            <XCircleIcon className="w-8 h-8 text-red-500 shrink-0" />
                            <div>
                                <p className="font-semibold text-red-800 dark:text-red-200">{t('process_failed')}</p>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1 font-mono break-all">{error}</p>
                            </div>
                        </div>
                    ) : (
                        renderResult()
                    )}
                </div>
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                    <button onClick={onClose} disabled={isLoading} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50">
                        {t('close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProcessResultModal;