import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadAvatar, updateProfilePhoto } from '@/utils/uploadAvatar';
import { deleteOldAvatar } from '@/utils/deleteOldAvatar';
import { useToast } from '@/contexts/ToastProvider';

interface UseUpdateProfileProps {
    userId: string;
    onSuccess: (publicUrl: string) => void;
}

export function useUpdateProfile({ userId, onSuccess }: UseUpdateProfileProps) {
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const { showSuccessToast, showErrorToast } = useToast();

    const handleAvatarUpload = useCallback(async (blob: Blob) => {
        if (!userId) return;

        setUploadingPhoto(true);

        // Armazenar qual era a foto anterior (para limpeza se sucesso)
        let oldFotoUrl: string | null = null;
        let newFilePath: string | null = null;

        try {
            // 1. Obter snapshot da foto de perfil antiga real no banco antes de sobrepor
            const { data: profileData, error: profileErr } = await supabase
                .from('profiles')
                .select('foto_url')
                .eq('id', userId)
                .single();

            if (!profileErr && profileData) {
                oldFotoUrl = profileData.foto_url;
            }

            // 2. Upload para a Storage (bucket avatars/userId/arquivo.jpg)
            const { publicUrl, filePath } = await uploadAvatar(userId, blob);
            newFilePath = filePath;

            // 3. Atualizar a tabela profiles conectada
            await updateProfilePhoto(userId, publicUrl);

            // Se tudo ocorreu bem até aqui, deletamos o arquivo antigo de forma silenciosa
            if (oldFotoUrl) {
                // A deleção não deve quebrar a UI em caso de erro individual
                await deleteOldAvatar(oldFotoUrl);
            }

            // 4. Executar hook local de callback (ex: updateProfile no AuthContext)
            onSuccess(publicUrl);
            showSuccessToast('Foto de perfil atualizada com sucesso!');

        } catch (error: any) {
            console.error('[handleAvatarUpload] Falha no fluxo:', error);

            // Tratamento de erro seguro:
            // Rollback — Se o Supabase upload ocorreu com sucesso mas salvar no Profiles quebrou,
            // vamos excluir a nova imagem enviada (limpeza manual) para evitar arquivo órfão
            if (newFilePath) {
                await supabase.storage.from('avatars').remove([newFilePath]);
                console.log('[Rollback] Nova imagem removida devido à falha no update do profile.');
            }

            showErrorToast(error.message || 'Erro inesperado ao salvar a foto.');
            throw error;
        } finally {
            setUploadingPhoto(false);
        }

    }, [userId, onSuccess]);

    return {
        handleAvatarUpload,
        uploadingPhoto,
    };
}
