import React, { useState, useEffect } from 'react';
import { supabase, setSessionPersistence } from '../services/supabaseClient';
import { useLanguage } from '../../contexts/LanguageContext';
import { GoogleIcon, SpinnerIcon } from './icons';
import SignUpModal from './SignUpModal';

const LoginCard: React.FC = () => {
    const { t } = useLanguage();
    const [loading, setLoading] = useState(false);
    
    const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('session-persistence') === 'true');
    const [email, setEmail] = useState(() => {
        const isRemembered = localStorage.getItem('session-persistence') === 'true';
        return (isRemembered && localStorage.getItem('rememberedEmail')) || '';
    });

    const [password, setPassword] = useState('');
    const [notification, setNotification] = useState<{ type: 'info' | 'error', message: string } | null>(null);
    const [isSignUpModalOpen, setSignUpModalOpen] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);
        try {
          setSessionPersistence(rememberMe);

          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;

          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }

          setPassword('');
        } catch (error: any) {
           const errorMessage = (error.message || '').toLowerCase();
           if (errorMessage.includes('email not confirmed') || errorMessage.includes('invalid refresh token')) {
              setNotification({ type: 'info', message: t('email_not_confirmed_message') });
          } else {
              setNotification({ type: 'error', message: error.error_description || error.message || t('login_failed') });
          }
          setTimeout(() => setNotification(null), 5000);
        } finally {
          setLoading(false);
        }
    };
    
    const signInWithGoogle = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
        if (error) {
            setNotification({ type: 'error', message: t('google_sign_in_failed') + `: ${error.message}` });
            setLoading(false);
        }
        // On success, Supabase redirects.
    };

    return (
        <>
            {isSignUpModalOpen && <SignUpModal onClose={() => setSignUpModalOpen(false)} onSuccess={() => setNotification({ type: 'info', message: t('signup_success') })} />}
            <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">{t('site_title')}</h2>
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">{t('landing_page_description')}</p>
                {notification && (
                    <div className={`mb-4 p-3 text-sm rounded-md text-center ${
                        notification.type === 'info'
                            ? 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                        {notification.message}
                    </div>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="sr-only">{t('email')}</label>
                        <input type="email" id="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('email')}
                               className="w-full h-12 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                    <div>
                        <label htmlFor="password" className="sr-only">{t('password')}</label>
                        <input type="password" id="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                               className="w-full h-12 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                                 className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500" />
                          <label htmlFor="remember-me" className="ml-2 rtl:mr-2 rtl:ml-0 block text-sm text-gray-700 dark:text-gray-300">
                            {t('remember_me')}
                          </label>
                        </div>
                    </div>
                    <button type="submit" disabled={loading}
                            className="w-full h-12 px-4 flex items-center justify-center border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors">
                        {loading ? <SpinnerIcon className="w-5 h-5" /> : t('login')}
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">{t('or_separator')}</span>
                    </div>
                </div>
                
                <div>
                    <button
                        type="button"
                        onClick={signInWithGoogle}
                        disabled={loading}
                        className="w-full h-12 px-4 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                    >
                        <GoogleIcon className="w-5 h-5 mr-3" />
                        {t('sign_in_with_google')}
                    </button>
                </div>
                
                <p className="mt-6 text-center text-sm">
                    <button onClick={() => setSignUpModalOpen(true)} className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                        {t('create_new_account')}
                    </button>
                </p>
            </div>
        </>
    );
};

export default LoginCard;