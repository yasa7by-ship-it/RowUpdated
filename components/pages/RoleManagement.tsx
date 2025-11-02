import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Role, Permission, RolePermission } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

const RoleManagement: React.FC = () => {
  const { t } = useLanguage();
  const { refetchProfile } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Map<string, Set<string>>>(new Map());
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try {
        const { data, error } = await supabase.rpc('get_role_management_data').abortSignal(signal).single();

        if (error) throw error;
        
        const { roles: rolesData, permissions: permsData, role_permissions: rolePermsData } = data as any;
        
        setRoles(rolesData || []);
        setPermissions(permsData || []);
        
        const rolePermsMap = new Map<string, Set<string>>();
        (rolePermsData || []).forEach((rp: RolePermission) => {
            if (!rolePermsMap.has(rp.role_id)) {
                rolePermsMap.set(rp.role_id, new Set());
            }
            rolePermsMap.get(rp.role_id)!.add(rp.permission_id);
        });
        setRolePermissions(rolePermsMap);

        if (rolesData && rolesData.length > 0) {
          setSelectedRole(rolesData[0]);
        }
    } catch (error: any) {
        if (error.name !== 'AbortError') {
             console.error("Error fetching role management data:", error);
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
    }
  }, [fetchData]);

  const handlePermissionChange = async (permissionId: string, isChecked: boolean) => {
    if (!selectedRole) return;
    
    if (isChecked) {
      await supabase.from('role_permissions').insert({ role_id: selectedRole.id, permission_id: permissionId });
    } else {
      await supabase.from('role_permissions').delete().match({ role_id: selectedRole.id, permission_id: permissionId });
    }
    
    const newMap = new Map(rolePermissions);
    const perms = new Set<string>(newMap.get(selectedRole.id) as Iterable<string> || []);
    if(isChecked) perms.add(permissionId);
    else perms.delete(permissionId);
    newMap.set(selectedRole.id, perms);
    setRolePermissions(newMap);

    refetchProfile();
  };
  
  if (loading) return <div>{t('loading')}...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('role_management')}</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-3">{t('roles')}</h2>
            <ul>
              {roles.map(role => (
                <li key={role.id}>
                  <button onClick={() => setSelectedRole(role)}
                    className={`w-full text-left px-4 py-2 rounded-md text-sm ${selectedRole?.id === role.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    {role.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="md:w-2/3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            {selectedRole ? (
              <>
                <h2 className="text-xl font-semibold">
                  {t('permissions_for_role').replace('{roleName}', selectedRole.name)}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">{selectedRole.description}</p>
                <div className="space-y-4">
                  {permissions.map(permission => {
                      const permissionKey = `perm_${permission.action.replace(':', '_')}`;
                      return (
                        <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{t(permissionKey)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t(`${permissionKey}_desc`)}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer"
                              checked={rolePermissions.get(selectedRole.id)?.has(permission.id) || false}
                              onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                              // Disable editing Admin role's core permissions
                              disabled={selectedRole.name === 'Admin'}
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                          </label>
                        </div>
                      );
                  })}
                </div>
              </>
            ) : <p>{t('select_role_to_manage')}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
