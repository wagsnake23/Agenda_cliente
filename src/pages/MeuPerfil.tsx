"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import {
    ArrowLeft, Camera, Loader2, Save, User, Briefcase, Hash,
    Calendar as CalendarIcon, Mail, Shield, CheckCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getCroppedImg } from '@/utils/cropImage';
import { validateImageFile, uploadAvatar, updateProfilePhoto } from '@/utils/uploadAvatar';
import { deleteOldAvatar } from '@/utils/deleteOldAvatar';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/lib/supabase';
import ImageCropperModal from '@/components/ImageCropperModal';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Area } from 'react-easy-crop';

// ────────────────────────────────────────────────────────────
// Schema Zod
// ────────────────────────────────────────────────────────────
const profileSchema = z.object({
    nome: z.string().min(1, 'Nome é obrigatório').min(3, 'Mínimo 3 caracteres'),
    cargo: z.string().min(1, 'Cargo é obrigatório'),
    matricula: z.string().min(1, 'Matrícula é obrigatória'),
    data_nascimento: z.string().optional().nullable(),
});

type ProfileForm = z.infer<typeof profileSchema>;

// ────────────────────────────────────────────────────────────
// Labels
// ────────────────────────────────────────────────────────────
const PERFIL_LABELS: Record<string, string> = {
    conferente: 'Conferente',
    administrador: 'Administrador',
};

// ────────────────────────────────────────────────────────────
// Skeleton de Carregamento
// ────────────────────────────────────────────────────────────
const ProfileSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-2xl bg-gray-200" />
                <div className="h-5 w-32 bg-gray-200 rounded-lg" />
                <div className="h-4 w-20 bg-gray-100 rounded-full" />
            </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="space-y-1.5">
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                    <div className="h-11 bg-gray-100 rounded-xl" />
                </div>
            ))}
        </div>
        <div className="h-12 bg-gray-200 rounded-xl" />
    </div>
);

// ────────────────────────────────────────────────────────────
// Componente Principal
// ────────────────────────────────────────────────────────────
const MeuPerfil: React.FC = () => {
    const { profile, user, loading: authLoading, updateProfile } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { saving, saveProfile } = useProfile();

    // Estado do crop
    const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
    const [showCropper, setShowCropper] = useState(false);

    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Preview local (exibido imediatamente após crop)
    const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

    const form = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        values: {
            nome: profile?.nome || '',
            cargo: profile?.cargo || '',
            matricula: profile?.matricula || '',
            data_nascimento: profile?.data_nascimento || '',
        },
    });

    // ── Selecionar arquivo → abrir cropper ────────────────────
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Limpar o input para permitir re-selecionar o mesmo arquivo
        e.target.value = '';

        if (!file) return;

        const validationError = validateImageFile(file);
        if (validationError) {
            toast.error(validationError);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setRawImageSrc(objectUrl);
        setShowCropper(true);
    }, []);

    // ── Confirmar corte → upload → atualizar UI ──────────────
    const handleCropConfirm = useCallback(async (croppedArea: Area) => {
        if (!rawImageSrc || !user) return;

        setUploadingPhoto(true);

        try {
            // 1. Obter snapshot da foto de perfil antiga
            const { data: profileData } = await supabase
                .from('profiles')
                .select('foto_url')
                .eq('id', user.id)
                .single();
            const oldFotoUrl = profileData?.foto_url;

            // 2. Transforma Blob
            const blob = await getCroppedImg(rawImageSrc, croppedArea);

            // 3. Faz Upload com nome novo p/ o supabase storage
            const { publicUrl, filePath } = await uploadAvatar(user.id, blob);

            try {
                // 4. Update BD Profile
                await updateProfilePhoto(user.id, publicUrl);
            } catch (updateErr: any) {
                // Rollback manual via Supabase Storage
                await supabase.storage.from('avatars').remove([filePath]);
                throw updateErr;
            }

            // 5. Sucesso - Atualizar UI local
            updateProfile({ foto_url: publicUrl });
            setLocalAvatarUrl(publicUrl);
            toast.success('Foto atualizada com sucesso!');

            // 6. Limpar antigo (Assíncrono sem travar UI)
            if (oldFotoUrl) {
                deleteOldAvatar(oldFotoUrl).catch(e => console.error('Erro silent ao deletar', e));
            }

            // UI limpa de imediato
            setShowCropper(false);

        } catch (err: any) {
            console.error('[handleCropConfirm] Erro completo:', err);
            toast.error(err?.message || 'Erro inesperado ao alterar a foto.');
        } finally {
            // Em qualquer cenário, cancela o "Enviando"
            setUploadingPhoto(false);
            if (rawImageSrc) {
                URL.revokeObjectURL(rawImageSrc);
                setRawImageSrc(null);
            }
        }
    }, [rawImageSrc, user, updateProfile]);

    const handleCropCancel = useCallback(() => {
        setShowCropper(false);
        if (rawImageSrc) URL.revokeObjectURL(rawImageSrc);
        setRawImageSrc(null);
    }, [rawImageSrc]);

    // ── Salvar dados do perfil ────────────────────────────────
    const handleSave = async (data: ProfileForm) => {
        const { error } = await saveProfile(data as any);
        if (error) {
            toast.error(error);
        } else {
            // Atualizar estado global otimisticamente
            updateProfile({
                nome: data.nome.trim(),
                cargo: data.cargo.trim() || null,
                matricula: data.matricula.trim() || null,
                data_nascimento: data.data_nascimento || null,
            });
            toast.success('Perfil atualizado com sucesso!');
        }
    };

    // URL do avatar a exibir (prioridade: preview local > profile.foto_url)
    const avatarUrl = localAvatarUrl || profile?.foto_url || null;
    const initials = profile?.nome
        ? profile.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    return (
        <div className="min-h-screen bg-[#EFF3F6] flex flex-col">
            <Toaster richColors position="top-center" />

            {/* Cropper Modal */}
            {showCropper && rawImageSrc && (
                <ImageCropperModal
                    imageSrc={rawImageSrc}
                    onConfirm={handleCropConfirm}
                    onCancel={handleCropCancel}
                    uploading={uploadingPhoto}
                />
            )}
            {/* Header Global */}
            <Header />

            <div className="w-full lg:pt-[74px]">
                <div className="max-w-2xl mx-auto px-4 py-8">
                    {/* Cabeçalho do Módulo Interno */}
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            👤 Meu Perfil
                        </h2>
                    </div>

                    {authLoading ? (
                        <ProfileSkeleton />
                    ) : (
                        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">

                            {/* ── Card: Avatar + Info ──────────────────────── */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex flex-col items-center gap-4">

                                    {/* Avatar */}
                                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <div
                                            className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] bg-blue-50 transition-transform duration-300 group-hover:scale-[1.03]"
                                            title="Clique para alterar foto"
                                        >
                                            {avatarUrl ? (
                                                <img
                                                    src={avatarUrl}
                                                    alt="Foto de perfil"
                                                    className="w-full h-full object-cover"
                                                    onError={() => setLocalAvatarUrl(null)}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                                                    <span className="text-3xl font-black text-blue-600 select-none">
                                                        {initials}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Overlay hover */}
                                        <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-1">
                                                {uploadingPhoto ? (
                                                    <Loader2 size={20} className="text-white animate-spin" />
                                                ) : (
                                                    <>
                                                        <Camera size={20} className="text-white drop-shadow" />
                                                        <span className="text-white text-[9px] font-bold uppercase tracking-wider drop-shadow">
                                                            Alterar
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Botão câmera */}
                                        <div className="absolute bottom-0.5 right-0.5 w-8 h-8 rounded-full bg-blue-600 border-2 border-white text-white flex items-center justify-center shadow-md pointer-events-none">
                                            {uploadingPhoto ? (
                                                <Loader2 size={13} className="animate-spin" />
                                            ) : (
                                                <Camera size={13} />
                                            )}
                                        </div>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                    </div>

                                    {/* Info de perfil */}
                                    <div className="text-center">
                                        <h2 className="font-black text-slate-800 text-lg leading-tight">
                                            {profile?.nome}
                                        </h2>
                                        <p className="text-slate-400 text-xs mt-0.5">{profile?.email}</p>
                                        <div className="flex items-center justify-center gap-2 mt-2">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${profile?.perfil === 'administrador'
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                <Shield size={9} className="inline mr-1" />
                                                {PERFIL_LABELS[profile?.perfil || 'conferente']}
                                            </span>
                                            {profile?.ativo && (
                                                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                                    <CheckCircle size={9} className="inline mr-1" />
                                                    Ativo
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Instrução de upload */}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingPhoto}
                                        className="text-blue-600 text-xs font-semibold hover:text-blue-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                                    >
                                        <Camera size={12} />
                                        {uploadingPhoto ? 'Enviando foto...' : 'Alterar foto de perfil'}
                                    </button>
                                    <p className="text-slate-400 text-[10px] -mt-2">JPG, PNG ou WebP · máx. 5MB</p>
                                </div>
                            </div>

                            {/* ── Card: Dados Pessoais ─────────────────────── */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                                <h3 className="font-bold text-slate-600 uppercase text-xs tracking-widest border-b border-gray-100 pb-3">
                                    Informações Pessoais
                                </h3>

                                {/* Nome */}
                                <div>
                                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                                        Nome Completo <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                        <input
                                            {...form.register('nome')}
                                            type="text"
                                            placeholder="Seu nome completo"
                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all placeholder-slate-300"
                                        />
                                    </div>
                                    {form.formState.errors.nome && (
                                        <p className="text-red-500 text-xs mt-1 ml-1">
                                            {form.formState.errors.nome.message}
                                        </p>
                                    )}
                                </div>

                                {/* Email (não editável) */}
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 pointer-events-none" />
                                        <input
                                            type="email"
                                            value={profile?.email || ''}
                                            readOnly
                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm font-medium cursor-not-allowed"
                                        />
                                    </div>
                                    <p className="text-slate-400 text-[10px] mt-1 ml-1">
                                        O email não pode ser alterado
                                    </p>
                                </div>

                                {/* Data de Nascimento */}
                                <div>
                                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                                        Data de Nascimento
                                    </label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                        <input
                                            {...form.register('data_nascimento')}
                                            type="date"
                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all"
                                        />
                                    </div>
                                    {form.formState.errors.data_nascimento && (
                                        <p className="text-red-500 text-xs mt-1 ml-1">
                                            {form.formState.errors.data_nascimento.message}
                                        </p>
                                    )}
                                </div>

                                {/* Cargo */}
                                <div>
                                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                                        Cargo <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                        <input
                                            {...form.register('cargo')}
                                            type="text"
                                            placeholder="Ex: Soldado BM, Cabo BM, Sargento BM..."
                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all placeholder-slate-300"
                                        />
                                    </div>
                                    {form.formState.errors.cargo && (
                                        <p className="text-red-500 text-xs mt-1 ml-1">
                                            {form.formState.errors.cargo.message}
                                        </p>
                                    )}
                                </div>

                                {/* Matrícula */}
                                <div>
                                    <label className="block text-slate-500 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                                        Matrícula <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                                        <input
                                            {...form.register('matricula')}
                                            type="text"
                                            placeholder="Número de matrícula"
                                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all placeholder-slate-300"
                                        />
                                    </div>
                                    {form.formState.errors.matricula && (
                                        <p className="text-red-500 text-xs mt-1 ml-1">
                                            {form.formState.errors.matricula.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* ── Botão Salvar ─────────────────────────────── */}
                            <button
                                type="submit"
                                disabled={saving || uploadingPhoto}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black uppercase tracking-wider text-sm shadow-[0_8px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_12px_24px_rgba(37,99,235,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <><Loader2 size={18} className="animate-spin" /> Salvando...</>
                                ) : (
                                    <><Save size={16} /> Salvar Alterações</>
                                )}
                            </button>

                        </form>
                    )}
                </div>
            </div>
            {/* Footer exibido apenas em desktop */}
            <Footer className="hidden md:block" />
        </div>
    );
};

export default MeuPerfil;
