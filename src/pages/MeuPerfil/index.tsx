import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/contexts/ToastProvider';
import {
    ArrowLeft, Camera, Loader2, Save, User, Briefcase, Hash,
    Calendar as CalendarIcon, Mail, Shield, CheckCircle, Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getCroppedImg } from '@/utils/cropImage';
import { validateImageFile, uploadAvatar, updateProfilePhoto } from '@/utils/uploadAvatar';
import { deleteOldAvatar } from '@/utils/deleteOldAvatar';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import ImageCropperModal from '@/components/ImageCropperModal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Area } from 'react-easy-crop';
import { PERFIL_LABELS } from '@/constants/labels';
import PasswordModal from './PasswordModal';

const profileSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório').min(3, 'Mínimo 3 caracteres'),
    apelido: z.string().optional().nullable(),
    cargo: z.string().min(1, 'Cargo é obrigatório'),
    matricula: z.string().min(1, 'Matrícula é obrigatória'),
    data_nascimento: z.string().optional().nullable(),
    escala: z.string().optional().nullable(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const ProfileSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-pulse w-full max-w-5xl mx-auto">
        <div className="md:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col items-center">
            <div className="w-[150px] h-[150px] sm:w-[160px] sm:h-[160px] rounded-2xl bg-slate-200 mb-6" />
            <div className="h-6 w-40 bg-slate-200 rounded-lg mb-3" />
            <div className="h-4 w-32 bg-slate-100 rounded-full mb-6" />
            <div className="flex gap-2 mb-8">
                <div className="h-6 w-24 bg-slate-100 rounded-full" />
                <div className="h-6 w-16 bg-slate-100 rounded-full" />
            </div>
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
        </div>
        <div className="md:col-span-7 bg-[#FAFAFA] rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6">
            <div className="h-5 w-48 bg-slate-200 rounded-lg mb-8" />
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="space-y-2">
                    <div className="h-4 w-32 bg-slate-100 rounded" />
                    <div className="h-12 w-full bg-slate-100 rounded-xl" />
                </div>
            ))}
            <div className="h-14 w-full bg-slate-200 rounded-xl mt-8" />
        </div>
    </div>
);

const MeuPerfil: React.FC = () => {
    const { profile, user, loading: authLoading, updateProfile } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { saving, saveProfile } = useProfile();
    const { showSuccessToast, showErrorToast } = useToast();

    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    const form = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        values: {
            nome: profile?.nome || '',
            apelido: profile?.apelido || '',
            cargo: profile?.cargo || '',
            matricula: profile?.matricula || '',
            data_nascimento: profile?.data_nascimento || '',
            escala: profile?.escala || '',
        },
    });

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;

        const validationError = validateImageFile(file);
        if (validationError) {
            showErrorToast(validationError);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setRawImageSrc(objectUrl);
        setShowCropper(true);
    }, [showErrorToast]);

    const handleCropConfirm = useCallback(async (croppedArea: Area) => {
        if (!rawImageSrc || !user) return;
        setUploadingPhoto(true);

        try {
            const { data: profileData } = await supabase.from('profiles').select('foto_url').eq('id', user.id).single();
            const oldFotoUrl = profileData?.foto_url;
            const blob = await getCroppedImg(rawImageSrc, croppedArea);
            const { publicUrl, filePath } = await uploadAvatar(user.id, blob);

            try {
                await updateProfilePhoto(user.id, publicUrl);
            } catch (updateErr: any) {
                await supabase.storage.from('avatars').remove([filePath]);
                throw updateErr;
            }

            updateProfile({ foto_url: publicUrl });
            setLocalAvatarUrl(publicUrl);
            showSuccessToast('Foto atualizada com sucesso!');

            if (oldFotoUrl) {
                deleteOldAvatar(oldFotoUrl).catch(e => console.error('Erro silent ao deletar', e));
            }
            setShowCropper(false);
        } catch (err: any) {
            showErrorToast(err?.message || 'Erro ao salvar foto.');
        } finally {
            setUploadingPhoto(false);
            if (rawImageSrc) {
                URL.revokeObjectURL(rawImageSrc);
                setRawImageSrc(null);
            }
        }
    }, [rawImageSrc, user, updateProfile, showSuccessToast, showErrorToast]);

    const handleCropCancel = useCallback(() => {
        setShowCropper(false);
        if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
        setRawImageSrc(null);
    }, [rawImageSrc]);

    const handleSave = async (data: ProfileForm) => {
        const { error } = await saveProfile(data as any);
        if (error) {
            showErrorToast(error);
        } else {
            updateProfile({
                nome: data.nome.trim(),
                apelido: data.apelido?.trim() || null,
                cargo: data.cargo.trim() || null,
                matricula: data.matricula.trim() || null,
                data_nascimento: data.data_nascimento || null,
                escala: data.escala || null,
            });
            showSuccessToast('Perfil atualizado com sucesso!');
        }
    };

    const handleUpdatePassword = async (newPassword: string) => {
        if (newPassword.length < 6) {
            showErrorToast('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            showSuccessToast('Senha alterada com sucesso!');
            setShowPasswordModal(false);
        } catch (err: any) {
            showErrorToast(err.message || 'Erro ao alterar senha');
        } finally {
            setChangingPassword(false);
        }
    };

    const avatarUrl = localAvatarUrl || profile?.foto_url || null;
    const initials = profile?.nome ? profile.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'U';

    return (
        <div className="min-h-screen bg-[#EFF3F6] flex flex-col items-center justify-start p-2 lg:p-0 md:gap-y-2 overflow-x-hidden md:overflow-visible text-slate-800">
            <Header />
            {showCropper && rawImageSrc && (
                <ImageCropperModal imageSrc={rawImageSrc} onConfirm={handleCropConfirm} onCancel={handleCropCancel} uploading={uploadingPhoto} />
            )}

            <div className="w-full h-full lg:pt-[74px]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-0 pb-8 md:py-8">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-4 md:mb-8">
                        <button onClick={() => navigate(-1)} className="hidden md:flex w-10 h-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm">
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">👤 Meu Perfil</h2>
                    </div>

                    {authLoading ? (<ProfileSkeleton />) : (
                        <form onSubmit={form.handleSubmit(handleSave)} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col items-center text-center">
                                <div className="relative group cursor-pointer mb-5" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-blue-50 flex items-center justify-center">
                                        {avatarUrl ? (<img src={avatarUrl} alt="Foto" className="w-full h-full object-cover" />) : (<span className="text-4xl font-black text-blue-600">{initials}</span>)}
                                    </div>
                                    <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                                        <Camera size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
                                </div>

                                <h2 className="font-bold text-slate-800 text-[20px] mb-1">{profile?.nome}</h2>
                                <p className="text-slate-500 text-[13px] mb-4">{profile?.email}</p>
                                <div className="flex gap-2 mb-8">
                                    <span className="px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">
                                        {PERFIL_LABELS[profile?.perfil || 'conferente']}
                                    </span>
                                </div>

                                <button type="button" onClick={() => setShowPasswordModal(true)} className="w-full h-11 rounded-xl bg-gradient-to-b from-orange-400 to-orange-600 text-white font-black uppercase text-xs tracking-widest shadow-[0_4px_0_#c2410c] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2">
                                    <Lock size={16} /> Alterar Senha
                                </button>
                            </div>

                            <div className="md:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2 space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Nome Completo</label>
                                        <input {...form.register('nome')} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:border-blue-500 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Apelido</label>
                                        <input {...form.register('apelido')} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Matrícula</label>
                                        <input {...form.register('matricula')} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Cargo</label>
                                        <input {...form.register('cargo')} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold uppercase text-slate-500 ml-1">Escala Preferida</label>
                                        <select {...form.register('escala')} className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm outline-none">
                                            <option value="">Não Definida</option>
                                            <option value="Adm">👔 Adm</option>
                                            <option value="12x36">👮 12x36</option>
                                            <option value="24x48">🧑‍🚒 24x48</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={saving} className="w-full h-12 mt-10 rounded-xl bg-blue-600 text-white font-black uppercase text-sm shadow-[0_4px_0_#1E3A8A] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-2">
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : '💾 Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
            <Footer className="hidden md:block" />
            <PasswordModal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} onConfirm={handleUpdatePassword} loading={changingPassword} />
        </div>
    );
};

export default MeuPerfil;
