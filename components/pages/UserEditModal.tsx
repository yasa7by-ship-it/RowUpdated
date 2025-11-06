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
  
  // Form state - initialize empty
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [roleId, setRoleId] = useState<string | null>(null);

  // Reset form when user changes (including when opening for new user)
  useEffect(() => {
    // Always reset error when modal state changes
    setError(null);
    
    if (user) {
      // Editing existing user - populate fields
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setRoleId(user.role_id || null);
      // Always clear password fields for editing
      setPassword('');
      setConfirmPassword('');
    } else {
      // Adding new user - ensure all fields are empty
      setFullName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRoleId(null);
    }
  }, [user]);

  // Email validation regex
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if email already exists
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking email:', error);
        return false;
      }
      
      return data !== null;
    } catch (err) {
      console.error('Error checking email:', err);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    const isNewUser = !user;
    
    // Validation 1: Full name
    const trimmedFullName = fullName.trim();
    if (!trimmedFullName || trimmedFullName.length < 2) {
      setError(t('full_name_required') || 'الاسم الكامل مطلوب (على الأقل حرفان)');
      setIsSaving(false);
      return;
    }

    // Validation 2: Email (for new users)
    if (isNewUser) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) {
        setError(t('email_required') || 'البريد الإلكتروني مطلوب');
        setIsSaving(false);
        return;
      }
      
      if (!validateEmail(trimmedEmail)) {
        setError(t('invalid_email') || 'البريد الإلكتروني غير صحيح');
        setIsSaving(false);
        return;
      }

      // Check if email already exists
      const emailExists = await checkEmailExists(trimmedEmail);
      if (emailExists) {
        setError(t('email_already_exists') || 'البريد الإلكتروني مستخدم بالفعل');
        setIsSaving(false);
        return;
      }
    }

    // Validation 3: Role selection
    if (!roleId) {
      setError(t('role_required') || 'يجب اختيار صلاحية');
      setIsSaving(false);
      return;
    }

    // Validation 4: Password (for new users or when changing password)
    if (isNewUser || password) {
      if (password.length < 6) {
        setError(t('password_too_short') || 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        setIsSaving(false);
        return;
      }
      
      if (password.length > 72) {
        setError(t('password_too_long') || 'كلمة المرور طويلة جداً (الحد الأقصى 72 حرف)');
        setIsSaving(false);
        return;
      }

      if (password !== confirmPassword) {
        setError(t('passwords_do_not_match') || 'كلمات المرور غير متطابقة');
        setIsSaving(false);
        return;
      }

      // Optional: Password strength validation (at least one letter and one number)
      if (isNewUser && !/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        setError(t('password_weak') || 'كلمة المرور يجب أن تحتوي على حرف ورقم على الأقل');
        setIsSaving(false);
        return;
      }
    }

    try {
      const dataToSave: any = {
        full_name: trimmedFullName,
        role_id: roleId,
      };
      if (isNewUser) { // If new user
        dataToSave.email = email.trim().toLowerCase();
        dataToSave.password = password;
      } else if (password) { // If editing user and password is set
        dataToSave.password = password;
      }
      await onSave(dataToSave);
      onClose();
    } catch (err: any) {
      // Handle specific error messages
      let errorMessage = err.message || t('save_failed') || 'فشل الحفظ';
      
      if (err.message?.includes('User already registered') || err.message?.includes('already registered')) {
        errorMessage = t('email_already_exists') || 'البريد الإلكتروني مستخدم بالفعل';
      } else if (err.message?.includes('Invalid email')) {
        errorMessage = t('invalid_email') || 'البريد الإلكتروني غير صحيح';
      } else if (err.message?.includes('Password')) {
        errorMessage = t('password_invalid') || 'كلمة المرور غير صحيحة';
      }
      
      setError(errorMessage);
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
