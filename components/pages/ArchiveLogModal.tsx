import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpinnerIcon, CheckCircleIcon, TrashIcon } from '../icons';

interface ArchiveLogModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ArchiveLogModal: React.FC<ArchiveLogModalProps> = ({ onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [period, setPeriod] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordCount, setRecordCount] = useState(0);

  const handleGenerateArchive = async () => {
    if (!period) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('export_activity_logs', { p_older_than_months: period }).single();
      if (rpcError) throw rpcError;

      const { file_content, record_count } = data;

      if (record_count === 0) {
        setError(t('no_logs_to_archive_for_period'));
        setIsLoading(false);
        return;
      }

      setRecordCount(record_count);

      // Trigger download
      const blob = new Blob([file_content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `activity_log_archive_older_than_${period}_months_${dateStr}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStep(2);
    } catch (err: any) {
      setError(t('archive_generation_failed') + `: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!period) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc('delete_activity_logs', { p_older_than_months: period });
      if (rpcError) throw rpcError;
      onSuccess();
    } catch (err: any) {
       setError(t('deletion_failed') + `: ${err.message}`);
       // If deletion fails, stay on this step to show the error
    } finally {
        setIsLoading(false);
    }
  }

  const renderStep1 = () => (
    <>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('archive_and_clear_log')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('archive_period_select_desc')}</p>
      </div>
      <div className="p-6 space-y-4">
        {error && <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}
        <fieldset>
          <legend className="sr-only">Archiving Period</legend>
          <div className="space-y-2">
            {[1, 3, 6].map(month => (
              <label key={month} className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-600 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-400 dark:has-[:checked]:bg-blue-900/30 dark:has-[:checked]:border-blue-700">
                <input type="radio" name="period" value={month} checked={period === month} onChange={() => setPeriod(month)} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"/>
                <span className="ml-3 rtl:mr-3 text-sm font-medium text-gray-900 dark:text-gray-200">{t(month === 1 ? 'older_than_1_month' : 'older_than_x_months').replace('{count}', String(month))}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
       <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end items-center space-x-3 rtl:space-x-reverse">
        <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">{t('cancel')}</button>
        <button onClick={handleGenerateArchive} disabled={!period || isLoading} className="py-2 px-4 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50 flex items-center">
            {isLoading && <SpinnerIcon className="w-4 h-4 mr-2" />}
            {isLoading ? t('saving') : t('generate_archive')}
        </button>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
        <div className="p-6 text-center flex flex-col items-center">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('archive_downloaded')}</h2>
            {error && <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}
            <p className="text-base text-gray-600 dark:text-gray-300 mt-2 max-w-sm">{t('archive_download_confirm_desc').replace('{count}', String(recordCount))}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end items-center space-x-3 rtl:space-x-reverse">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">{t('cancel')}</button>
            <button onClick={handleDelete} disabled={isLoading} className="py-2 px-4 bg-red-600 text-white rounded-md text-sm disabled:opacity-50 flex items-center">
                {isLoading && <SpinnerIcon className="w-4 h-4 mr-2" />}
                <TrashIcon className="w-5 h-5 mr-2" />
                {t('delete_records_confirm').replace('{count}', String(recordCount))}
            </button>
        </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg flex flex-col" onClick={e => e.stopPropagation()}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </div>
    </div>
  );
};

export default ArchiveLogModal;
