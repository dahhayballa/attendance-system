import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../../shared/components/layout/Layout';
import { usersService } from '../../../services/supabase/users.service';
import { useToast } from '../../../shared/hooks/useToast';
import { User } from '../../../types';
import {
  Users, UserPlus, Search, Edit3, UserMinus, Eye, ShieldAlert, BadgeInfo
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'supervisor' as 'supervisor' | 'surveillance'
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getUsers();
      setUsers(data as User[]);
    } catch (error: any) {
      toast.error(t('admin.usersManagement.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({ id: '', name: '', email: '', password: '', role: 'supervisor' });
    setModalMode('add');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setFormData({
      id: user.id || '',
      name: user.name || '',
      email: user.email || '',
      password: '', // On n'édite pas le password existant
      role: (user.role as 'supervisor' | 'surveillance') || 'supervisor'
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm(t('admin.usersManagement.deleteConfirm'))) return;
    try {
      await usersService.deactivateUser(id);
      toast.success(t('admin.usersManagement.deleteSuccess'));
      loadUsers();
    } catch (error) {
      toast.error(t('admin.usersManagement.error'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (modalMode === 'add') {
        if (!formData.email || !formData.password || !formData.name) {
          toast.error("Tous les champs sont requis");
          return;
        }
        await usersService.createUser({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role
        });
        toast.success(t('admin.usersManagement.saveSuccess'));
      } else {
        await usersService.updateUser(formData.id, {
          name: formData.name,
          role: formData.role
        });
        toast.success(t('admin.usersManagement.saveSuccess'));
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (error: any) {
      toast.error(error.message || t('admin.usersManagement.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout>
      <div className="space-y-6 pb-8" dir={i18n.language.startsWith('ar') ? 'rtl' : 'ltr'}>
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-orange-50 to-white p-6 rounded-2xl border border-orange-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-orange-100/50 p-3 rounded-xl border border-orange-200">
              <Users className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                {t('admin.usersManagement.title')}
              </h1>
              <p className="text-sm font-medium text-gray-500 mt-1">
                {t('admin.usersManagement.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all font-bold w-full md:w-auto"
          >
            <UserPlus size={18} />
            {t('admin.usersManagement.addUser')}
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4 relative">
          <div className="relative w-full md:w-96">
            <div className={`absolute inset-y-0 ${i18n.language.startsWith('ar') ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className={`block w-full ${i18n.language.startsWith('ar') ? 'pr-10' : 'pl-10'} pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium text-gray-700`}
              placeholder={t('admin.usersManagement.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-gray-50 px-4 py-2.5 rounded-lg w-full md:w-auto justify-center">
             <BadgeInfo className="w-4 h-4 text-orange-400" />
             <span>Total : {filteredUsers.length}</span>
          </div>
        </div>

        {/* DATA GRID */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-orange-500">
            <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredUsers.length === 0 ? (
                <div className="col-span-full py-20 text-center text-gray-400 font-medium">
                  {t('admin.reports.noData')}
                </div>
            ) : (
              filteredUsers.map(user => (
                <div key={user.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-100 transition-all duration-300 group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                         <span className="font-black text-xl text-gray-400">{user.name?.charAt(0).toUpperCase() || '?'}</span>
                      </div>
                      <div className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 ${
                        user.role === 'supervisor' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                         {user.role === 'supervisor' ? <ShieldAlert className="w-3 h-3" /> : <Eye className="w-3 h-3"/>}
                         {user.role === 'supervisor' ? t('admin.usersManagement.roleSupervisor') : t('admin.usersManagement.roleSurveillance')}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-black text-gray-900 group-hover:text-orange-600 transition-colors truncate">{user.name || 'Sans Nom'}</h3>
                    <p className="text-sm font-medium text-gray-400 truncate mt-0.5">{user.email}</p>
                  </div>

                  <div className="flex gap-2 mt-6 pt-4 border-t border-gray-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                       onClick={() => handleOpenEdit(user)}
                       className="flex-1 bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-orange-600 py-2 rounded-xl text-xs font-bold transition-colors flex justify-center items-center gap-1.5"
                    >
                      <Edit3 size={14} /> Éditer
                    </button>
                    <button 
                       onClick={() => handleDeactivate(user.id)}
                       className="flex-1 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-500 py-2 rounded-xl text-xs font-bold transition-colors flex justify-center items-center gap-1.5"
                    >
                      <UserMinus size={14} /> Désactiver
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in border border-gray-100" dir={i18n.language.startsWith('ar') ? 'rtl' : 'ltr'}>
             <div className="px-6 py-5 bg-gradient-to-r from-orange-50 to-white border-b border-orange-100 flex items-center gap-3">
                <div className="bg-orange-100 p-2 rounded-xl text-orange-600">
                   {modalMode === 'add' ? <UserPlus className="w-5 h-5" /> : <Edit3 className="w-5 h-5"/>}
                </div>
                <h3 className="text-lg font-black text-gray-900 mt-1">
                   {modalMode === 'add' ? t('admin.usersManagement.addUser') : 'Modifier l\'utilisateur'}
                </h3>
             </div>

             <form onSubmit={handleSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('admin.usersManagement.formName')}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    placeholder="ex: Ahmed Ali"
                  />
               </div>

               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('admin.usersManagement.formEmail')}</label>
                  <input
                    type="email"
                    required
                    disabled={modalMode === 'edit'} // Ne pas changer l'email en edit (complexe cote Auth)
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all disabled:opacity-50"
                    placeholder="admin@example.com"
                  />
               </div>

               {modalMode === 'add' && (
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('admin.usersManagement.formPassword')}</label>
                    <input
                      type="password"
                      required={modalMode === 'add'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <p className="text-[10px] text-gray-400 font-medium mt-1.5">{t('admin.usersManagement.formPasswordHelp')}</p>
                 </div>
               )}

               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('admin.usersManagement.formRole')}</label>
                  <div className="grid grid-cols-2 gap-3">
                     <button
                        type="button"
                        onClick={() => setFormData({...formData, role: 'supervisor'})}
                        className={`py-3 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all
                           ${formData.role === 'supervisor' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                        `}
                     >
                        <ShieldAlert className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">{t('admin.usersManagement.roleSupervisor')}</span>
                     </button>
                     <button
                        type="button"
                        onClick={() => setFormData({...formData, role: 'surveillance'})}
                        className={`py-3 px-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all
                           ${formData.role === 'surveillance' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                        `}
                     >
                        <Eye className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">{t('admin.usersManagement.roleSurveillance')}</span>
                     </button>
                  </div>
               </div>

               <div className="flex gap-3 pt-6 mt-2 border-t border-gray-100">
                 <button
                   type="button"
                   onClick={() => setIsModalOpen(false)}
                   className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-xl transition-colors text-sm"
                 >
                   {t('admin.usersManagement.cancel')}
                 </button>
                 <button
                   type="submit"
                   disabled={submitting}
                   className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all text-sm disabled:opacity-50"
                 >
                   {submitting ? '...' : t('admin.usersManagement.save')}
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default UsersManagementPage;
