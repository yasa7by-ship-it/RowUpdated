import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../services/supabaseClient';
import type { Role, Permission, RolePermission } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { SparklesIcon } from '../icons';

const RoleManagement: React.FC = () => {
  const { t } = useLanguage();
  const { refetchProfile } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Map<string, Set<string>>>(new Map());
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const fetchData = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try {
        const { data, error } = await supabase
          .rpc('get_role_management_data')
          .abortSignal(signal)
          .single<{ roles: Role[]; permissions: Permission[]; role_permissions: RolePermission[] }>();

        if (error) throw error;

        const { roles: rolesData = [], permissions: permsData = [], role_permissions: rolePermsData = [] } = data ?? {};
        
        setRoles(Array.isArray(rolesData) ? rolesData : []);
        setPermissions(Array.isArray(permsData) ? permsData : []);
        
        const rolePermsMap = new Map<string, Set<string>>();
        (Array.isArray(rolePermsData) ? rolePermsData : []).forEach((rp) => {
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

  // Map permission action to page name for display
  const getPageNameFromPermission = (action: string): string => {
    // Map permissions to page names
    const pageMap: Record<string, string> = {
      'view:nasdaq_snapshot': 'nasdaq_snapshot',
      'view:daily_watchlist': 'daily_watchlist',
      'view:stock_analysis': 'stock_analysis',
      'view:forecast_accuracy': 'forecast_accuracy',
      'view:forecast_history_analysis': 'forecast_history_analysis',
      'view:dashboard': 'dashboard',
    };
    
    return pageMap[action] || action;
  };

  // Filter and search permissions
  const filteredPermissions = useMemo(() => {
    if (!selectedRole) return [];
    
    // Remove duplicates by action (keep first occurrence)
    const uniquePermissions = Array.from(
      new Map<string, Permission>(permissions.map((p) => [p.action, p])).values()
    );
    
    // Sort permissions: main pages first, then by display_order if available, then alphabetically
    const sortedPermissions = [...uniquePermissions].sort((a, b) => {
      // Main pages order
      const mainPagesOrder: Record<string, number> = {
        'view:nasdaq_snapshot': 0,
        'view:daily_watchlist': 1,
        'view:stock_analysis': 2,
        'view:forecast_accuracy': 3,
        'view:forecast_history_analysis': 4,
        'view:dashboard': 5,
      };
      
      const aOrder = mainPagesOrder[a.action] || ((a as any).display_order ?? 999);
      const bOrder = mainPagesOrder[b.action] || ((b as any).display_order ?? 999);
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // If same order, sort alphabetically by translated name
      const pageNameA = getPageNameFromPermission(a.action);
      const pageNameB = getPageNameFromPermission(b.action);
      const nameA = t(pageNameA) || a.action;
      const nameB = t(pageNameB) || b.action;
      return nameA.localeCompare(nameB);
    });
    
    let filtered = sortedPermissions.filter(permission => {
      // Get display name: use page name if it's a main page, otherwise use permission translation
      const pageName = getPageNameFromPermission(permission.action);
      const isMainPage = pageName !== permission.action;
      const displayName = isMainPage 
        ? (t(pageName) || permission.action)
        : (t(`perm_${permission.action.replace(':', '_')}`) || permission.action);
      const permissionDesc = t(`perm_${permission.action.replace(':', '_')}_desc`) || '';
      const searchLower = searchTerm.toLowerCase();
      
      if (searchTerm && !displayName.toLowerCase().includes(searchLower) && !permissionDesc.toLowerCase().includes(searchLower)) {
        return false;
      }
      
      // Enabled/Disabled filter
      const isEnabled = rolePermissions.get(selectedRole.id)?.has(permission.id) || false;
      if (filterEnabled === 'enabled' && !isEnabled) return false;
      if (filterEnabled === 'disabled' && isEnabled) return false;
      
      return true;
    });
    
    return filtered;
  }, [permissions, selectedRole, searchTerm, filterEnabled, rolePermissions, t]);

  // Pagination
  const totalPages = useMemo(() => {
    return Math.ceil(filteredPermissions.length / itemsPerPage);
  }, [filteredPermissions.length]);

  const paginatedPermissions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPermissions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPermissions, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEnabled, selectedRole]);

  // Get role name translation
  const getRoleName = (roleName: string) => {
    const roleKey = `role_${roleName.toLowerCase()}`;
    return t(roleKey) || roleName;
  };

  // Get role description translation
  const getRoleDescription = (role: Role) => {
    const roleDescKey = `role_${role.name.toLowerCase()}_desc`;
    const translatedDesc = t(roleDescKey);
    if (translatedDesc && translatedDesc !== roleDescKey) {
      return translatedDesc;
    }
    // Fallback to role.description if no translation found
    return role.description || '';
  };
  
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">{t('loading')}...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{t('role_management')}</h1>
      
      {/* Role Selection - Sidebar */}
      <div className="mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-lg font-semibold mb-3">{t('roles')}</h2>
          <div className="flex flex-wrap gap-2">
            {roles.map(role => (
              <button 
                key={role.id}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedRole?.id === role.id 
                    ? 'bg-blue-600 text-white dark:bg-blue-500' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {getRoleName(role.name)}
              </button>
            ))}
          </div>
          {selectedRole && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {getRoleDescription(selectedRole)}
            </p>
          )}
        </div>
      </div>

      {/* Permissions Table */}
      {selectedRole ? (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
            {t('permissions_for_role').replace('{roleName}', getRoleName(selectedRole.name))}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Search and Filters Tools - Always visible */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search Input */}
                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder={t('search_by_key_or_value') || 'ابحث بالصلاحية...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-nextrow-primary focus:border-nextrow-primary dark:bg-gray-700 dark:text-white text-sm"
                  />
                  <SparklesIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                
                {/* Enabled/Disabled Filter Buttons */}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-md p-1">
                  <button
                    onClick={() => setFilterEnabled('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      filterEnabled === 'all'
                        ? 'bg-gray-200 dark:bg-gray-600 text-nextrow-primary dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {t('all')}
                  </button>
                  <button
                    onClick={() => setFilterEnabled('enabled')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      filterEnabled === 'enabled'
                        ? 'bg-gray-200 dark:bg-gray-600 text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {t('enabled') || 'مفعل'}
                  </button>
                  <button
                    onClick={() => setFilterEnabled('disabled')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      filterEnabled === 'disabled'
                        ? 'bg-gray-200 dark:bg-gray-600 text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {t('disabled') || 'معطل'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[300px]">
                      {t('permission_name') || 'اسم الصلاحية'}
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[400px]">
                      {t('description') || 'الوصف'}
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-widest min-w-[100px]">
                      {t('status') || 'الحالة'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedPermissions.map((permission, index) => {
                    const permissionKey = `perm_${permission.action.replace(':', '_')}`;
                    const pageName = getPageNameFromPermission(permission.action);
                    const isMainPage = pageName !== permission.action;
                    // Use page name for main pages, otherwise use permission translation
                    const displayName = isMainPage 
                      ? (t(pageName) || permission.action)
                      : (t(permissionKey) || permissionKey);
                    const isEnabled = rolePermissions.get(selectedRole.id)?.has(permission.id) || false;
                    const isDisabled = selectedRole.name === 'Admin';
                    
                    return (
                      <tr 
                        key={permission.id}
                        className={`group transition-all duration-200 ${
                          index % 2 === 0 
                            ? 'bg-white dark:bg-gray-800' 
                            : 'bg-gray-50/50 dark:bg-gray-800/50'
                        } hover:bg-blue-50 dark:hover:bg-gray-700/70`}
                      >
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {displayName}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {t(`${permissionKey}_desc`) || permission.description || ''}
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer"
                              checked={isEnabled}
                              onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                              disabled={isDisabled}
                            />
                            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] rtl:after:left-auto rtl:after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50"></div>
                          </label>
                        </td>
                      </tr>
                    );
                  })}
                  {paginatedPermissions.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                        {t('no_data_available')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredPermissions.length)}</span> {t('of')} <span className="font-semibold">{filteredPermissions.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('previous')}
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                currentPage === page
                                  ? 'bg-nextrow-primary text-white'
                                  : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return <span key={page} className="text-gray-400 dark:text-gray-600">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('next')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">{t('select_role_to_manage')}</p>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
