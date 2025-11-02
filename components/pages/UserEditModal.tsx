import React, { useState, useEffect } from 'react';
import type { Role } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../services/supabaseClient';
import { ProfileWithRole } from './UserManagement';

interface UserEditModalProps {
  user: ProfileWithRole | null;
  roles: Role[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, roles, onClose, onSave }) => {
  const { t } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState<string | null>(null);
  

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setRoleId(user.role_id);
    } else {
      // Reset form for new user
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRoleId(null);
    }
     // Always clear password fields when modal opens
    setPassword('');
    setConfirmPassword('');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    const isNewUser = !user;
    
    // Validation for new password
    if (isNewUser || password) {
        if (password.length < 6) {
            setError(t('password_too_short'));
            setIsSaving(false);
            return;
        }
        if (password !== confirmPassword) {
            setError(t('passwords_do_not_match'));
            setIsSaving(false);
            return;
        }
    }


    try {
      const dataToSave: any = {
        full_name: fullName,
        role_id: roleId,
      };
      if (isNewUser) { // If new user
        dataToSave.email = email;
        dataToSave.password = password;
      } else if (password) { // If editing user and password is set
        dataToSave.password = password;
      }
      await onSave(dataToSave);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const isNewUser = !user;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full sm:max-w-md" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {isNewUser ? t('add_new_user') : t('edit_user')}
            </h2>
          </div>
          
          <div className="p-6 space-y-4">
            {error && <div className="p-3 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md text-sm">{error}</div>}
            
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('full_name')}</label>
              <input type="text" id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} required
                     className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={!isNewUser}
                     className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {isNewUser ? t('password_initial') : t('new_password')}
              </label>
              <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required={isNewUser} minLength={6}
                     className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {isNewUser ? t('confirm_password') : t('confirm_new_password')}
              </label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required={isNewUser} minLength={6}
                     className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('role')}</label>
              <select id="role" value={roleId ?? ''} onChange={e => setRoleId(e.target.value)} required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="" disabled>{t('select_role')}</option>
                {roles.map(role => <option key={role.id} value={role.id}>{t(`role_${role.name}`)}</option>)}
              </select>
            </div>
          </div>
          
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end items-center space-x-3 rtl:space-x-reverse">
            <button type="button" onClick={onClose} className="py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              {t('cancel')}
            </button>
            <button type="submit" disabled={isSaving}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50">
              {isSaving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;
