import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Highlight: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <strong className="font-semibold text-gray-800 dark:text-gray-200">{children}</strong>
);

// Helper to render a translated string with React components as placeholders
const renderWithPlaceholders = (template: string, placeholders: Record<string, React.ReactNode>): React.ReactNode => {
    if (!template) return null;
    const regex = new RegExp(`({${Object.keys(placeholders).join('|')}})`, 'g');
    const parts = template.split(regex);

    return (
        <span>
            {parts.map((part, index) => {
                if (part.startsWith('{') && part.endsWith('}')) {
                    const key = part.slice(1, -1);
                    return <React.Fragment key={index}>{placeholders[key]}</React.Fragment>;
                }
                return part;
            })}
        </span>
    );
};

const LogDescription: React.FC<{ action: string; details: any }> = ({ action, details }) => {
    const { t } = useLanguage();

    if (!details) {
        return <span className="text-xs text-gray-600 dark:text-gray-400">{t(`log_action_${action}`)}</span>;
    }

    switch (action) {
        case 'USER_ROLE_CHANGED':
            return renderWithPlaceholders(t('log_summary_USER_ROLE_CHANGED'), {
                email: <Highlight>{details.target_user_email}</Highlight>
            });

        case 'ROLE_PERMISSION_ADDED':
            return renderWithPlaceholders(t('log_summary_ROLE_PERMISSION_ADDED'), {
                permission_action: <Highlight>{t(`perm_${details.permission_action.replace(':', '_')}`)}</Highlight>,
                role_name: <Highlight>{t(`role_${details.role_name}`)}</Highlight>
            });
            
        case 'ROLE_PERMISSION_REMOVED':
            return renderWithPlaceholders(t('log_summary_ROLE_PERMISSION_REMOVED'), {
                permission_action: <Highlight>{t(`perm_${details.permission_action.replace(':', '_')}`)}</Highlight>,
                role_name: <Highlight>{t(`role_${details.role_name}`)}</Highlight>
            });

        case 'APP_SETTING_CHANGED':
            return renderWithPlaceholders(t('log_summary_APP_SETTING_CHANGED'), {
                setting_key: <Highlight>{details.setting_key}</Highlight>
            });

        case 'USER_CREATED':
            return renderWithPlaceholders(t('log_summary_USER_CREATED'), {
                email: <Highlight>{details.email}</Highlight>
            });

        case 'USER_LOGIN_SUCCESS':
            return renderWithPlaceholders(t('log_summary_USER_LOGIN_SUCCESS'), {
                email: <Highlight>{details.email}</Highlight>
            });

        default:
            return <span className="text-xs text-gray-600 dark:text-gray-400">{t(`log_action_${action}`)}</span>;
    }
};

export default LogDescription;