import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <code className="text-xs bg-gray-100 dark:bg-gray-700 p-1 rounded-sm font-mono block max-w-xs overflow-x-auto whitespace-pre-wrap break-words">{String(children).substring(0, 200)}{String(children).length > 200 ? '...' : ''}</code>
);

const Highlight: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <strong className="font-semibold text-gray-800 dark:text-gray-200">{children}</strong>
);

const LogChange: React.FC<{ action: string; details: any; type: 'before' | 'after' }> = ({ action, details, type }) => {
    const { t } = useLanguage();

    if (!details) {
        return <span className="text-gray-400">N/A</span>;
    }

    let value: React.ReactNode = null;

    switch (action) {
        case 'USER_ROLE_CHANGED':
            const roleName = type === 'before' ? details.old_role_name : details.new_role_name;
            if (roleName) return <Highlight>{t(`role_${roleName}`)}</Highlight>;
            break;

        case 'APP_SETTING_CHANGED':
            value = type === 'before' ? details.old_value : details.new_value;
            // The value can be long (like SVG), so use the Code component.
            if (value) return <Code>{value}</Code>;
            break;
        
        // Other actions don't have before/after data
        default:
            break;
    }
    
    // Return placeholder if no value was found for this action/type
    return <span className="text-gray-400">N/A</span>;
};

export default LogChange;