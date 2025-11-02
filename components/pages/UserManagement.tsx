import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Profile, Role } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { PlusIcon, PencilIcon, CheckBadgeIcon, SpinnerIcon } from '../icons';
import UserEditModal from './UserEditModal';

// This interface is needed because the Supabase query returns `roles` as an object, not an array.
export interface ProfileWithRole extends Omit<Profile, 'roles'> {
    roles: { name: string } | null;
}

const UserManagement: React.FC = () => {
  const { t } = useLanguage();
  const { profile: currentUserProfile, refetchProfile } = useAuth();
  const [profiles, setProfiles] = useState<ProfileWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ProfileWithRole | null>(null);
  const [activatingUserId, setActivatingUserId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const fetchData = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
        const [profilesRes, rolesRes] = await Promise.all([
            supabase.rpc('get_all_users_with_roles').abortSignal(signal),
            supabase.rpc('get_all_roles').abortSignal(signal)
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (rolesRes.error) throw rolesRes.error;

        setProfiles(profilesRes.data as unknown as ProfileWithRole[]);
        setRoles(rolesRes.data || []);
    } catch (fetchError: any) {
        if (fetchError.name !== 'AbortError') {
            console.error('Error fetching data:', fetchError);
            setError(fetchError.message);
        }
    } finally {
        if (!signal.aborted) {
            setLoading(false);
        }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => {
      controller.abort();
    };
  }, [fetchData]);

  const handleAddNewUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: ProfileWithRole) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleActivateUser = async (userToActivate: ProfileWithRole) => {
      setActivatingUserId(userToActivate.id);
      setNotification(null);
      const { error } = await supabase.rpc('manually_confirm_user', {
        user_id_to_confirm: userToActivate.id,
      });

      if (error) {
        console.error('Activation error:', error);
        setNotification({ type: 'error', message: t('user_activation_failed') });
      } else {
        setNotification({ type: 'success', message: t('user_activated_successfully') });
        const controller = new AbortController();
        fetchData(controller.signal); // Refresh the list
      }
      setActivatingUserId(null);
      setTimeout(() => setNotification(null), 5000);
  };

  const handleSaveUser = async (userData: any) => {
    if (!editingUser) { // Adding new user
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name,
          },
        },
      });

      if (error) {
        throw error;
      }
      
      if (data.user) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role_id: userData.role_id })
          .eq('id', data.user.id);
        
        if (updateError) {
          throw new Error(`User created, but failed to set role: ${updateError.message}`);
        }
      }

    } else { // Editing existing user
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: userData.full_name, role_id: userData.role_id })
        .eq('id', editingUser.id);
      
      if (profileError) {
        throw profileError;
      }
      
      if (userData.password) {
          const { error: passwordError } = await supabase.rpc('admin_update_user_password', {
              user_id_to_update: editingUser.id,
              new_password: userData.password
          });
          if (passwordError) {
              throw passwordError;
          }
      }
      
      if (currentUserProfile?.id === editingUser.id) {
          refetchProfile();
      }
    }
    
    const controller = new AbortController();
    fetchData(controller.signal);
  };


  if (loading) return (
    <div className="flex items-center justify-center p-8">
        <SpinnerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        <span className="ml-3 rtl:mr-3 text-lg">{t('loading')}...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 p-4 rounded-lg shadow-md">
        <p><strong>Error fetching data:</strong> {error}</p>
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('user_management')}</h1>
        <button
          onClick={handleAddNewUser}
          className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2" />
          {t('add_new_user')}
        </button>
      </div>

       {notification && (
          <div className={`mb-4 p-4 text-sm rounded-md ${
              notification.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
              {notification.message}
          </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('full_name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('email')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('role')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('status')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{profile.full_name || t('n_a')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{profile.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {profile.roles?.name ? t(`role_${profile.roles.name}`) : <span className="text-xs italic">{t('no_role')}</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {profile.email_confirmed_at ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {t('confirmed')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      {t('pending_confirmation')}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2 rtl:space-x-reverse">
                    {!profile.email_confirmed_at && (
                      <button 
                        onClick={() => handleActivateUser(profile)}
                        disabled={activatingUserId === profile.id}
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 disabled:opacity-50 disabled:cursor-wait"
                        title={t('activate_user')}
                      >
                        {activatingUserId === profile.id ? <SpinnerIcon /> : <CheckBadgeIcon className="w-5 h-5" />}
                      </button>
                    )}
                    <button 
                      onClick={() => handleEditUser(profile)} 
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={profile.id === currentUserProfile?.id && profiles.filter(p => p.roles?.name === 'Admin').length <= 1}
                      title={profile.id === currentUserProfile?.id && profiles.filter(p => p.roles?.name === 'Admin').length <= 1 ? t('cannot_edit_last_admin') : t('edit')}
                    >
                       <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && (
        <UserEditModal
          user={editingUser}
          roles={roles}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

export default UserManagement;
