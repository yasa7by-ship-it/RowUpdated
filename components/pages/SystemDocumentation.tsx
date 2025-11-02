import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { DatabaseDocumentation, TableDocumentation, FunctionDocumentation, PolicyDocumentation } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpinnerIcon } from '../icons';

const SystemDocumentation: React.FC = () => {
    const { t } = useLanguage();
    const [docs, setDocs] = useState<DatabaseDocumentation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.rpc('get_database_documentation');
            if (error) throw error;
            setDocs(data);
        } catch (err: any) {
            console.error("Failed to fetch documentation:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const generateTextContent = useCallback((docsData: DatabaseDocumentation): string => {
        let content = `SYSTEM DOCUMENTATION - Generated on ${new Date().toISOString()}\n`;
        content += "==================================================================\n\n";

        content += "## TABLES & VIEWS ##\n\n";
        if (docsData.tables?.length > 0) {
            docsData.tables.forEach(table => {
                content += `### TABLE: ${table.name} ###\n`;
                content += `Description: ${table.description || 'N/A'}\n\n`;
                content += "Columns:\n";
                content += "  - Name | Type | Nullable | Default | Description\n";
                content += "  - ---- | ---- | -------- | ------- | -----------\n";
                table.columns?.forEach(col => {
                    content += `  - ${col.name} | ${col.type} | ${col.nullable} | ${col.default || 'null'} | ${col.description || ''}\n`;
                });
                content += "\n---\n\n";
            });
        } else {
            content += "No tables found.\n\n";
        }

        content += "## USER-DEFINED FUNCTIONS ##\n\n";
        if (docsData.functions?.length > 0) {
            docsData.functions.forEach(func => {
                content += `### FUNCTION: ${func.name} ###\n`;
                content += `${func.definition}\n\n`;
                content += "---\n\n";
            });
        } else {
            content += "No user-defined functions found.\n\n";
        }

        content += "## ROW LEVEL SECURITY POLICIES ##\n\n";
        if (docsData.policies?.length > 0) {
            const policiesByTable = docsData.policies.reduce((acc, policy) => {
                acc[policy.table] = acc[policy.table] || [];
                acc[policy.table].push(policy);
                return acc;
            }, {} as Record<string, PolicyDocumentation[]>);

            Object.entries(policiesByTable).forEach(([tableName, policies]) => {
                content += `### POLICIES ON: ${tableName} ###\n\n`;
                policies.forEach(policy => {
                    content += `  - Name:       ${policy.name}\n`;
                    content += `    Command:    ${policy.command}\n`;
                    content += `    Definition: ${policy.definition || 'N/A'}\n`;
                    content += `    Check:      ${policy.with_check || 'N/A'}\n\n`;
                });
                content += "---\n\n";
            });
        } else {
            content += "No RLS policies found.\n\n";
        }

        return content;
    }, []);
    
    const handleDownload = () => {
        if (!docs) return;
        const textContent = generateTextContent(docs);
        const blob = new Blob([textContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system_documentation_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (loading) return (
        <div className="flex items-center justify-center p-8">
            <SpinnerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <span className="ml-3 rtl:mr-3 text-lg">{t('loading')}...</span>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg shadow-md">
            <p><strong>Error fetching documentation:</strong> {error}</p>
        </div>
    );
    
    const policiesByTable = docs?.policies.reduce((acc, policy) => {
        acc[policy.table] = acc[policy.table] || [];
        acc[policy.table].push(policy);
        return acc;
    }, {} as Record<string, PolicyDocumentation[]>);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('system_documentation')}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{t('documentation_intro')}</p>
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse">
                    <button onClick={fetchData} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                        {t('refresh')}
                    </button>
                    <button onClick={handleDownload} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                        {t('download_as_txt')}
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">{t('tables_and_views')}</h2>
                    <div className="space-y-4">
                        {docs?.tables?.map(table => (
                            <details key={table.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-md open:ring-2 open:ring-blue-500">
                                <summary className="p-4 font-semibold cursor-pointer">{table.name}</summary>
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-4">{table.description || t('no_description_available')}</p>
                                    <h4 className="font-semibold mb-2">{t('columns')}</h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-700">
                                                <tr>
                                                    <th className="p-2 text-left">{t('column_name')}</th>
                                                    <th className="p-2 text-left">{t('data_type')}</th>
                                                    <th className="p-2 text-left">{t('is_nullable')}</th>
                                                    <th className="p-2 text-left">{t('default_value')}</th>
                                                    <th className="p-2 text-left">{t('description')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {table.columns.map(col => (
                                                    <tr key={col.name} className="border-b border-gray-200 dark:border-gray-700">
                                                        <td className="p-2 font-mono">{col.name}</td>
                                                        <td className="p-2 font-mono">{col.type}</td>
                                                        <td className="p-2">{col.nullable}</td>
                                                        <td className="p-2 font-mono">{col.default || 'null'}</td>
                                                        <td className="p-2">{col.description || ''}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
                
                <section>
                    <h2 className="text-2xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">{t('user_defined_functions')}</h2>
                     <div className="space-y-4">
                        {docs?.functions?.map(func => (
                            <details key={func.name} className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                <summary className="p-4 font-semibold cursor-pointer">{func.name}</summary>
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                                    <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-xs font-mono overflow-x-auto"><code>{func.definition}</code></pre>
                                </div>
                            </details>
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">{t('rls_policies')}</h2>
                     <div className="space-y-4">
                        {/* FIX: Explicitly type the destructured `policies` variable to resolve the 'unknown' type error. */}
                        {policiesByTable && Object.entries(policiesByTable).map(([tableName, policies]: [string, PolicyDocumentation[]]) => (
                             <details key={tableName} className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                                <summary className="p-4 font-semibold cursor-pointer">{tableName}</summary>
                                <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                                    {policies.length > 0 ? policies.map(policy => (
                                        <div key={policy.name} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                            <p className="font-semibold">{policy.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400"><strong>{t('applies_to')}:</strong> {policy.command}</p>
                                            <div className="mt-2 text-sm space-y-1">
                                                <p><strong>{t('policy_definition')}:</strong> <code className="text-xs bg-gray-200 dark:bg-gray-600 p-1 rounded">{policy.definition || 'N/A'}</code></p>
                                                <p><strong>{t('check_expression')}:</strong> <code className="text-xs bg-gray-200 dark:bg-gray-600 p-1 rounded">{policy.with_check || 'N/A'}</code></p>
                                            </div>
                                        </div>
                                    )) : <p className="text-sm text-gray-500 italic">{t('no_policies_found')}</p>}
                                </div>
                            </details>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SystemDocumentation;