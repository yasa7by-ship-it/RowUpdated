import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Highlight: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <strong className="font-semibold text-gray-800 dark:text-gray-200">{children}</strong>
);

// Helper function to format JSON values professionally
const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    
    // If it's already a string, check if it's JSON
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            // If it's an object, extract meaningful parts
            if (typeof parsed === 'object' && parsed !== null) {
                return formatObject(parsed);
            }
            return value;
        } catch {
            // Not JSON, return as is
            return value;
        }
    }
    
    // If it's an object, format it
    if (typeof value === 'object') {
        return formatObject(value);
    }
    
    // For other types, convert to string
    return String(value);
};

// Format object values to show only key information
const formatObject = (obj: any): string => {
    if (Array.isArray(obj)) {
        return `[${obj.length} items]`;
    }
    
    // If it's a translation object (has 'en' and/or 'ar' keys)
    if (obj.en !== undefined || obj.ar !== undefined) {
        const parts: string[] = [];
        if (obj.en) parts.push(`EN: ${truncateText(obj.en, 30)}`);
        if (obj.ar) parts.push(`AR: ${truncateText(obj.ar, 30)}`);
        return parts.join(' | ');
    }
    
    // For other objects, show keys count or first few key-value pairs
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    if (keys.length <= 2) {
        return keys.map(k => `${k}: ${truncateText(String(obj[k]), 20)}`).join(', ');
    }
    return `{${keys.length} fields}`;
};

// Truncate text to max length
const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
};

const ValueDisplay: React.FC<{ value: any }> = ({ value }) => {
    const { t } = useLanguage();
    const [isExpanded, setIsExpanded] = useState(false);
    const formatted = formatValue(value);
    const isLong = formatted.length > 60;

    if (!isLong) {
        return (
            <span className="text-xs text-gray-600 dark:text-gray-400 break-words leading-relaxed">
                {formatted}
            </span>
        );
    }

    return (
        <div className="space-y-1">
            <span className="text-xs text-gray-600 dark:text-gray-400 break-words leading-relaxed">
                {isExpanded ? formatted : `${formatted.substring(0, 60)}...`}
            </span>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline focus:outline-none transition-colors"
                title={isExpanded ? t('show_less') || 'عرض أقل' : t('show_more') || 'عرض المزيد'}
            >
                {isExpanded ? (t('show_less') || 'عرض أقل') : (t('show_more') || 'عرض المزيد')}
            </button>
        </div>
    );
};

const LogChange: React.FC<{ action: string; details: any; type: 'before' | 'after' }> = ({ action, details, type }) => {
    const { t } = useLanguage();

    if (!details) {
        return <span className="text-xs text-gray-400">N/A</span>;
    }

    let value: any = null;

    switch (action) {
        case 'USER_ROLE_CHANGED':
            const roleName = type === 'before' ? details.old_role_name : details.new_role_name;
            if (roleName) {
                return (
                    <span className="text-xs">
                        <Highlight>{t(`role_${roleName}`)}</Highlight>
                    </span>
                );
            }
            break;

        case 'APP_SETTING_CHANGED':
            value = type === 'before' ? details.old_value : details.new_value;
            if (value !== null && value !== undefined) {
                return (
                    <div className="max-w-[200px]">
                        <ValueDisplay value={value} />
                    </div>
                );
            }
            break;
        
        // Other actions don't have before/after data
        default:
            break;
    }
    
    // Return placeholder if no value was found for this action/type
    return <span className="text-xs text-gray-400">N/A</span>;
};

export default LogChange;