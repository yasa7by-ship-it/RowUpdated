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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const [profilesRes, rolesRes] = await Promise.all([
            supabase.rpc('get_all_users_with_roles'),
            supabase.rpc('get_all_roles')
        ]);

        if (profilesRes.error) throw profilesRes.error;
        if (rolesRes.error) throw rolesRes.error;

        setProfiles(profilesRes.data as unknown as ProfileWithRole[]);
        setRoles(rolesRes.data || []);
    } catch (fetchError: any) {
        if (fetchError.name !== 'AbortError' && fetchError.message !== 'signal is aborted without reason') {
            console.error('Error fetching data:', fetchError);
            setError(fetchError.message || 'فشل تحميل البيانات');
        }
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
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
        fetchData(); // Refresh the list
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
    
    fetchData();
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
    <div className="space-y-6">
      {/* Title Section - مميز */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="relative mb-6">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent drop-shadow-lg text-center mb-2">
              {t('user_management')}
            </h1>
            <div className="flex justify-center">
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="flex justify-center">
          <div className={`w-full max-w-2xl p-4 text-sm rounded-lg ${
              notification.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
              {notification.message}
          </div>
        </div>
      )}

      {/* Add User Button - فوق الجدول */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <button
            onClick={handleAddNewUser}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-[1.02]"
          >
            <PlusIcon className="w-5 h-5" />
            {t('add_new_user')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600 sticky top-0 z-10">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[120px]">
                    {t('full_name')}
                  </th>
                  <th className="px-2 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[150px]">
                    {t('email')}
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[100px]">
                    {t('role')}
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[100px]">
                    {t('status')}
                  </th>
                  <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[80px]">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {profiles.map((profile, index) => (
                  <tr 
                    key={profile.id}
                    className={`group transition-all duration-200 ${
                      index % 2 === 0 
                        ? 'bg-white dark:bg-gray-800' 
                        : 'bg-gray-50/50 dark:bg-gray-800/50'
                    } hover:bg-blue-50 dark:hover:bg-gray-700/70 hover:shadow-md`}
                  >
                    <td className="px-2 py-2 whitespace-nowrap text-left">
                      <div className="text-xs font-semibold text-gray-900 dark:text-white">
                        {profile.full_name || t('n_a')}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-left">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {profile.email}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {profile.roles?.name ? t(`role_${profile.roles.name}`) : <span className="text-[10px] italic text-gray-400">{t('no_role')}</span>}
                      </div>
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      {profile.email_confirmed_at ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-700">
                          {t('confirmed')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700">
                          {t('pending_confirmation')}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!profile.email_confirmed_at && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivateUser(profile);
                            }}
                            disabled={activatingUserId === profile.id}
                            className="p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 transform hover:scale-110 text-green-600 dark:text-green-400 disabled:opacity-50 disabled:cursor-wait"
                            title={t('activate_user')}
                          >
                            {activatingUserId === profile.id ? (
                              <SpinnerIcon className="w-4 h-4" />
                            ) : (
                              <CheckBadgeIcon className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditUser(profile);
                          }} 
                          className="p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 transform hover:scale-110 text-blue-600 dark:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={profile.id === currentUserProfile?.id && profiles.filter(p => p.roles?.name === 'Admin').length <= 1}
                          title={profile.id === currentUserProfile?.id && profiles.filter(p => p.roles?.name === 'Admin').length <= 1 ? t('cannot_edit_last_admin') : t('edit')}
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                      {t('no_users_found') || 'لا توجد مستخدمين'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
