import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../../../shared/components/layout/Layout';
import { usersService } from '../../../services/supabase/users.service';
import { useToast } from '../../../shared/hooks/useToast';
import { User } from '../../../types';
import {
  Users, UserPlus, Edit3, UserMinus, Eye, ShieldAlert, 
  History, Clock, CheckCircle2, XCircle, X, AlertCircle,
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm] = useState('');
  const [roleFilter] = useState<'all' | 'supervisor' | 'surveillance'>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [submitting, setSubmitting] = useState(false);

  // Activity Modal states
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  
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
      const data = await usersService.getUsersWithLastActivity();
      setUsers(data);
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

  const handleOpenEdit = (user: any) => {
    setFormData({
      id: user.id || '',
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: (user.role as 'supervisor' | 'surveillance') || 'supervisor'
    });
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleOpenActivity = async (user: any) => {
    setSelectedUser(user);
    setIsActivityModalOpen(true);
    try {
        setLoadingActivity(true);
        const data = await usersService.getUserRecentActivity(user.id);
        setUserActivity(data);
    } catch (error) {
        toast.error(t('admin.usersManagement.errorActivity', 'Impossible de charger l\'activité'));
    } finally {
        setLoadingActivity(false);
    }
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

  const handleReactivate = async (user: User) => {
    if (!window.confirm(t('admin.usersManagement.reactivateConfirm', 'Voulez-vous réactiver cet utilisateur ?'))) return;
    try {
      await usersService.reactivateUser(user.id, user.name || '');
      toast.success(t('admin.usersManagement.reactivateSuccess', 'Réactivé avec succès'));
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
          toast.error(t('admin.usersManagement.fieldsRequired', 'Tous les champs sont requis'));
          return;
        }

        // Check if email already exists
        const exists = await usersService.checkEmailExists(formData.email);
        if (exists) {
            toast.error(t('admin.usersManagement.emailExists', 'Cet email est déjà utilisé par un autre compte'));
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

  const filteredUsers = users.filter(u => {
    const matchesSearch = (
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <Layout>
      <div className="space-y-5 pb-8 animate-in fade-in duration-700" dir={i18n.language.startsWith('ar') ? 'rtl' : 'ltr'}>
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gray-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="flex items-center gap-3 relative z-10 text-left">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-950 border border-gray-100">
               <Users size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-950 tracking-tight leading-tight">
                {t('admin.usersManagement.title')}
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                {t('admin.usersManagement.subtitle')}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl shadow-sm hover:bg-black transition-all font-black text-xs uppercase tracking-widest w-full lg:w-auto relative z-10 active:scale-95"
          >
            <UserPlus size={15} />
            {t('admin.usersManagement.addUser')}
          </button>
        </div>

        {/* TOOL        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white p-3.5 rounded-3xl shadow-sm border border-gray-100">
          <div className="md:col-span-6 relative">
            <div className={`absolute inset-y-0 ${i18n.language.startsWith('ar') ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className={`block w-full ${i18n.language.startsWith('ar') ? 'pr-9' : 'pl-9'} ltr:pr-4 rtl:pl-4 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-200 focus:border-gray-400 transition-all font-bold text-gray-800`}
              placeholder={t('admin.usersManagement.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
 
          <div className="md:col-span-4 flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
             <Filter className="w-3.5 h-3.5 mx-2 text-gray-400" />
             <div className="flex flex-1 gap-1">
                {(['all', 'supervisor', 'surveillance'] as const).map(role => (
                   <button
                     key={role}
                     onClick={() => setRoleFilter(role)}
                     className={`flex-1 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all
                        ${roleFilter === role ? 'bg-white text-gray-950 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}
                     `}
                   >
                     {role === 'all' ? t('common.all') : t(`admin.usersManagement.role${role.charAt(0).toUpperCase() + role.slice(1)}`)}
                   </button>
                ))}
             </div>
          </div>
 
          <div className="md:col-span-2 flex items-center gap-2 text-[10px] font-black text-gray-950 bg-gray-50 border border-gray-100 px-4 py-2 rounded-xl w-full justify-center uppercase tracking-widest">
             <BadgeInfo className="w-4 h-4 text-gray-400" />
             <span>{filteredUsers.length}</span>
          </div>
        </div>  </div>

        {/* DATA GRID */}
        {loading ? (
          <div className="flex justify-center items-center py-24 text-gray-900">
             <div className="w-8 h-8 border-4 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUsers.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-3xl border border-gray-100">
                  <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-gray-200 border border-gray-100">
                     <Users size={24} />
                  </div>
                  <h3 className="text-gray-950 font-black uppercase tracking-widest text-xs mb-1">{t('admin.reports.noResults')}</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">{t('admin.usersManagement.searchPlaceholder')}</p>
                </div>
            ) : (
              filteredUsers.map(user => (
                <div key={user.id} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm hover:bg-gray-50/30 transition-all duration-300 group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-5">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm overflow-hidden flex-shrink-0">
                         <span className="font-black text-xl text-gray-300">{(user.name?.replace('[DÉSACTIVÉ] ', '').charAt(0).toUpperCase()) || '?'}</span>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <div className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 border shadow-sm ${
                            user.role === 'supervisor' ? 'bg-gray-900 text-white border-gray-950' : 'bg-white text-gray-950 border-gray-100'
                        }`}>
                            {user.role === 'supervisor' ? <ShieldAlert size={10} /> : <Eye size={10}/>}
                            {t(`admin.usersManagement.role${user.role.charAt(0).toUpperCase() + user.role.slice(1)}`)}
                        </div>
                        {user.name?.startsWith('[DÉSACTIVÉ]') && (
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest border border-rose-100">
                             {t('admin.usersManagement.statusDeactivated', 'Désactivé')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-base font-black text-gray-950 group-hover:text-indigo-600 transition-colors truncate mb-0.5 uppercase tracking-tight">
                      {user.name?.replace('[DÉSACTIVÉ] ', '').replace('[DÉSACTIVÉ]', '') || t('admin.usersManagement.noName', 'Sans Nom')}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 truncate mb-4 uppercase tracking-widest">{user.email}</p>
                    
                    <div className="bg-gray-50/50 rounded-2xl p-3.5 border border-gray-50 space-y-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">{t('admin.liveDashboard.recentActivity')}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${user.last_activity ? 'text-gray-950' : 'text-gray-300'}`}>
                                {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : t('admin.logs.never', 'Jamais')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-gray-400">
                                <History size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">{t('admin.usersManagement.lastCheckin', 'Dernier pointage')}</span>
                            </div>
                            <span className="text-[9px] font-black text-gray-950 uppercase tracking-widest">
                                {user.last_activity ? new Date(user.last_activity).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                            </span>
                        </div>
                    </div>
                          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-50">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => handleOpenActivity(user)}
                            className="flex-1 bg-white border border-gray-100 text-gray-950 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all flex justify-center items-center gap-1.5 shadow-sm active:scale-95"
                        >
                            <History size={12} /> {t('admin.usersManagement.seeActivity', 'Voir activité')}
                        </button>
                        <button 
                            onClick={() => handleOpenEdit(user)}
                            className="bg-gray-50 text-gray-400 py-2 px-3 rounded-xl hover:text-gray-950 transition-all hover:bg-gray-100 border border-transparent hover:border-gray-200"
                            title={t('common.edit')}
                        >
                            <Edit3 size={14} />
                        </button>
                    </div>
 
                    {user.name?.startsWith('[DÉSACTIVÉ]') ? (
                      <button 
                         onClick={() => handleReactivate(user)}
                         className="w-full bg-emerald-500 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex justify-center items-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <CheckCircle2 size={12} /> {t('admin.usersManagement.statusReactivate', 'Réactiver le compte')}
                      </button>
                    ) : (
                      <button 
                         onClick={() => handleDeactivate(user.id)}
                         className="w-full bg-white border border-rose-100 text-rose-500 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all flex justify-center items-center gap-1.5 group/btn active:scale-95"
                      >
                        <UserMinus size={12} className="group-hover/btn:scale-125 transition-transform" /> {t('admin.usersManagement.statusDeactivate', "Désactiver l'accès")}
                      </button>
                    )}
                  </div>                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* MODAL (Add/Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300 border border-gray-100" dir={i18n.language.startsWith('ar') ? 'rtl' : 'ltr'}>
             <div className="px-6 py-5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center border border-gray-900">
                        {modalMode === 'add' ? <UserPlus size={20} /> : <Edit3 size={20}/>}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-950 uppercase tracking-tight">
                            {modalMode === 'add' ? t('admin.usersManagement.addUser') : t('admin.usersManagement.editUser', 'Modifier Compte')}
                        </h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{t('admin.usersManagement.configSubtitle', 'Configuration des accès')}</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-950 transition-all">
                    <X size={15} />
                </button>
             </div>

             <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="space-y-4">
                  <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{t('admin.usersManagement.colName')}</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        placeholder={t('admin.usersManagement.namePlaceholder', 'Prénom et Nom')}
                      />
                  </div>

                  <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{t('admin.usersManagement.colEmail')}</label>
                      <input
                        type="email"
                        required
                        disabled={modalMode === 'edit'}
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
                        placeholder="email@example.com"
                      />
                  </div>

                  {modalMode === 'add' && (
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{t('admin.usersManagement.colPassword')}</label>
                        <input
                          type="password"
                          required={modalMode === 'add'}
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          placeholder={t('admin.usersManagement.passwordPlaceholder', '6 caractères min.')}
                          minLength={6}
                        />
                    </div>
                  )}

                  <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">{t('admin.usersManagement.colRole')}</label>
                      <div className="grid grid-cols-2 gap-4">
                         <button
                            type="button"
                            onClick={() => setFormData({...formData, role: 'supervisor'})}
                            className={`py-4 px-4 rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all duration-300
                               ${formData.role === 'supervisor' ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-indigo-200'}
                            `}
                         >
                            <ShieldAlert size={28} className={formData.role === 'supervisor' ? 'text-white' : 'text-indigo-200'} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-center">{t('admin.usersManagement.roleSupervisor')}<br/><span className="opacity-60 lowercase font-medium">{t('admin.usersManagement.roleSupervisorDesc', 'Contrôle Profs')}</span></span>
                         </button>
                         <button
                            type="button"
                            onClick={() => setFormData({...formData, role: 'surveillance'})}
                            className={`py-4 px-4 rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all duration-300
                               ${formData.role === 'surveillance' ? 'bg-emerald-600 border-emerald-500 text-white shadow-xl shadow-emerald-100 ring-4 ring-emerald-50' : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-emerald-200'}
                            `}
                         >
                            <Eye size={28} className={formData.role === 'surveillance' ? 'text-white' : 'text-emerald-200'} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-center">{t('admin.usersManagement.roleSurveillance')}<br/><span className="opacity-60 lowercase font-medium">{t('admin.usersManagement.roleSurveillanceDesc', 'Contrôle Elèves')}</span></span>
                         </button>
                      </div>
                  </div>
               </div>

               <div className="flex gap-4 pt-6">
                 <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-200 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                 >
                   {submitting ? t('common.loading') : modalMode === 'add' ? t('admin.usersManagement.addUser') : t('common.save')}
                 </button>
                 <button
                   type="button"
                   onClick={() => setIsModalOpen(false)}
                   className="flex-1 py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold rounded-2xl transition-all uppercase tracking-widest text-xs"
                 >
                   {t('common.cancel')}
                 </button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* ACTIVITY MODAL */}
      {isActivityModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gray-950/40 backdrop-blur-sm" onClick={() => setIsActivityModalOpen(false)} />
              <div className="relative bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 border border-gray-100" dir={i18n.language.startsWith('ar') ? 'rtl' : 'ltr'}>
                  <div className="px-6 py-5 bg-gray-950 text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                              <History size={18} className="text-orange-400" />
                          </div>
                          <div className={i18n.language.startsWith('ar') ? 'text-right' : 'text-left'}>
                              <h3 className="text-lg font-black uppercase tracking-tight">{selectedUser?.name?.replace('[DÉSACTIVÉ] ', '')}</h3>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('admin.usersManagement.activityLogTitle', 'Journal des 20 dernières saisies')}</p>
                          </div>
                      </div>
                      <button onClick={() => setIsActivityModalOpen(false)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-rose-500 transition-all">
                          <X size={15} />
                      </button>
                  </div>
                  
                  <div className="p-8 max-h-[60vh] overflow-y-auto">
                      {loadingActivity ? (
                          <div className="py-20 text-center">
                              <div className="w-8 h-8 border-4 border-gray-100 border-t-gray-950 rounded-full animate-spin mx-auto mb-4"></div>
                              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">{t('common.loading')}</p>
                          </div>
                      ) : userActivity.length === 0 ? (
                          <div className="py-20 text-center bg-gray-50/50 rounded-3xl border border-gray-100">
                              <AlertCircle size={32} className="mx-auto text-gray-200 mb-4" />
                              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">{t('admin.liveDashboard.noRecords')}</p>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              {userActivity.map((log) => (
                                  <div key={log.id} className="flex items-center gap-3 p-3 bg-white border border-gray-50 rounded-[1.5rem] hover:bg-gray-50 transition-all group">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
                                          log.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                          log.status === 'absent' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                      }`}>
                                          {log.status === 'present' ? <CheckCircle2 size={15}/> : log.status === 'absent' ? <XCircle size={15}/> : <Clock size={15}/>}
                                      </div>
                                      <div className={`flex-1 min-w-0 ${i18n.language.startsWith('ar') ? 'text-right' : 'text-left'}`}>
                                          <div className="flex justify-between items-start">
                                              <p className="font-black text-gray-950 text-xs truncate uppercase tracking-tight">{log.schedule?.teacher}</p>
                                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{new Date(log.recorded_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{log.schedule?.class} • {log.schedule?.subject}</p>
                                      </div>
                                      <div className={`px-2 py-0.5 rounded-xl text-[8px] font-black uppercase tracking-widest border shadow-sm shrink-0 ${
                                          log.status === 'present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                          log.status === 'absent' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                      }`}>
                                          {t(`admin.liveDashboard.status${log.status.charAt(0).toUpperCase() + log.status.slice(1)}`)}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-center text-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest max-w-sm text-center">
                          {t('admin.usersManagement.activityDisclaimer', 'Ce journal reflète les opérations de pointage effectuées en temps réel.')}
                      </p>
                  </div>
              </div>
          </div>
      )}
    </Layout>
  );
};

export default UsersManagementPage;
