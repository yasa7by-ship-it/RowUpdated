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
  const { t, language } = useLanguage();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Compact Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {isNewUser ? t('add_new_user') : t('edit_user')}
            </h2>
          </div>
          
          {/* Compact Form Fields */}
          <div className="px-4 py-3 space-y-3">
            {error && (
              <div className="p-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs">
                {error}
              </div>
            )}
            
            {/* Name and Email in Grid */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label htmlFor="fullName" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('full_name')}
                </label>
                <input 
                  type="text" 
                  id="fullName" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  required
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {t('email')}
                </label>
                <input 
                  type="email" 
                  id="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  disabled={!isNewUser}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-700/50 dark:bg-gray-700 dark:border-gray-600 dark:text-white" 
                />
              </div>
            </div>

            {/* Password Fields in Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isNewUser ? t('password_initial') : t('new_password')}
                </label>
                <input 
                  type="password" 
                  id="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required={isNewUser} 
                  minLength={6}
                  placeholder={!isNewUser ? t('leave_blank_to_not_change') : ''}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  {isNewUser ? t('confirm_password') : t('confirm_new_password')}
                </label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required={isNewUser} 
                  minLength={6}
                  placeholder={!isNewUser ? t('leave_blank_to_not_change') : ''}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                />
              </div>
            </div>
            
            {/* Role Select */}
            <div>
              <label htmlFor="role" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {t('role')}
              </label>
              <select 
                id="role" 
                value={roleId ?? ''} 
                onChange={e => setRoleId(e.target.value)} 
                required
                className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="" disabled>{t('select_role')}</option>
                {roles.map(role => <option key={role.id} value={role.id}>{t(`role_${role.name}`)}</option>)}
              </select>
            </div>
          </div>
          
          {/* Compact Footer Buttons */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex justify-end items-center gap-2 border-t border-gray-200 dark:border-gray-700">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500 transition-colors"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;
