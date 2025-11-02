import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const AccessDenied: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md h-full">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">{t('access_denied')}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t('no_permission_message')}</p>
        </div>
    );
};

export default AccessDenied;
