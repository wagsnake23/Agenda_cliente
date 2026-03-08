import React from 'react';
import { Trash2, Edit2, Shield, CheckCircle, XCircle } from 'lucide-react';
import { Profile } from '@/modules/auth/types';
import { PERFIL_LABELS } from '@/constants/labels';

interface UserListProps {
    users: Profile[];
    loading: boolean;
    onEdit: (user: Profile) => void;
    onDelete: (id: string) => void;
}

const UserList: React.FC<UserListProps> = ({ users, loading, onEdit, onDelete }) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse tracking-tighter">Carregando usuários...</p>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-100 p-20 flex flex-col items-center text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <Shield size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nenhum usuário encontrado</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Tente ajustar seu filtro de busca.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((profile) => (
                <div
                    key={profile.id}
                    className="group relative bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300"
                >
                    <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border-2 border-white shadow-md">
                                {profile.foto_url ? (
                                    <img src={profile.foto_url} alt={profile.nome} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-black text-xl">
                                        {profile.nome.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${profile.ativo ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                {profile.ativo ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 pr-10">
                            <h4 className="font-black text-slate-800 text-sm sm:text-base leading-tight truncate tracking-tight">{profile.nome}</h4>
                            <p className="text-slate-400 text-[11px] truncate mb-3">{profile.email}</p>

                            <div className="flex flex-wrap gap-1.5">
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 ${profile.perfil === 'administrador' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                    <Shield size={10} />
                                    {PERFIL_LABELS[profile.perfil]}
                                </span>
                                {profile.cargo && (
                                    <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-50 text-slate-600 border border-slate-100 truncate max-w-[120px]">
                                        {profile.cargo}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                        <button
                            onClick={() => onEdit(profile)}
                            className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 shadow-sm flex items-center justify-center transition-all active:scale-90 border border-amber-100"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={() => onDelete(profile.id)}
                            className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white shadow-sm flex items-center justify-center transition-all active:scale-90 border border-red-100"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UserList;
