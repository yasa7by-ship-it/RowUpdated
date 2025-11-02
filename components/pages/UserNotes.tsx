import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { SpinnerIcon } from '../icons';

const UserNotes: React.FC = () => {
    const { t } = useLanguage();
    const [noteContent, setNoteContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteContent.trim()) return;

        setIsSaving(true);
        setNotification(null);

        const { error } = await supabase.rpc('submit_user_note', {
            p_note_content: noteContent
        });

        if (error) {
            setNotification({ type: 'error', message: t('note_submission_failed') + `: ${error.message}` });
        } else {
            setNotification({ type: 'success', message: t('note_submitted_successfully') });
            setNoteContent(''); // Clear the textarea on success
        }

        setIsSaving(false);
        setTimeout(() => setNotification(null), 5000);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('submit_your_notes')}</h1>
            
            {notification && (
                <div className={`mb-4 p-4 text-sm rounded-md ${
                    notification.type === 'success'
                        ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                    {notification.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <label htmlFor="note-content" className="sr-only">{t('write_your_notes_here')}</label>
                <textarea
                    id="note-content"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder={t('write_your_notes_here')}
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                />
                <div className="mt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving || !noteContent.trim()}
                        className="flex items-center justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {isSaving && <SpinnerIcon className="w-5 h-5 mr-2 rtl:ml-2" />}
                        {isSaving ? t('saving') : t('save_and_send')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserNotes;
