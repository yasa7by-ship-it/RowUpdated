import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../services/supabaseClient';
import { GoogleIcon, XMarkIcon, SpinnerIcon } from './icons';

interface SignUpModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      
      if (error) {
        throw error;
      }

      if (data.user && !data.session) {
        setLoading(false);
        setError(t('user_already_registered'));
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Sign up error:', err);
      if (err.message && err.message.toLowerCase().includes('user already registered')) {
          setError(t('user_already_registered'));
      } else {
          setError(t('signup_failed'));
      }
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
            setError(t('google_sign_in_failed') + `: ${error.message}`);
            setLoading(false);
        }
        // On success, Supabase redirects.
    };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('create_account')}</h2>
            <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
              <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
        <div className="p-6">
            <button
                type="button"
                onClick={signInWithGoogle}
                disabled={loading}
                className="w-full h-12 px-4 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
                <GoogleIcon className="w-5 h-5 mr-3 rtl:ml-3 rtl:mr-0" />
                {t('sign_up_with_google')}
            </button>
            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">{t('or_separator')}</span>
                </div>
            </div>
            <form onSubmit={handleSignUp} className="space-y-4">
                {error && <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}
                <div>
                  <label htmlFor="signUpFullName" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('full_name')}</label>
                  <input id="signUpFullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                         className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                         placeholder={t('full_name')} required />
                </div>
                <div>
                  <label htmlFor="signUpEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
                  <input id="signUpEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                         className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                         placeholder="your@email.com" required />
                </div>
                <div>
                  <label htmlFor="signUpPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('password')}</label>
                  <input id="signUpPassword" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
                         className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                         placeholder="••••••••" required />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('confirm_password')}</label>
                  <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={6}
                         className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                         placeholder="••••••••" required />
                </div>
                 <div className="pt-2 flex justify-end items-center space-x-3 rtl:space-x-reverse">
                    <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">{t('cancel')}</button>
                    <button type="submit" disabled={loading} className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center">
                      {loading && <SpinnerIcon className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />}
                      {loading ? t('loading') : t('sign_up')}
                    </button>
                  </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default SignUpModal;