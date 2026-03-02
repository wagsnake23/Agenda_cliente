import { supabase } from '@/lib/supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB

/**
 * Valida o arquivo de imagem antes do upload.
 */
export function validateImageFile(file: File): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return 'Formato inválido. Use JPG, PNG ou WebP.';
    }
    if (file.size > MAX_SIZE_BYTES) {
        return 'Imagem muito grande. Limite: 5MB';
    }
    return null;
}

/**
 * Faz upload de um avatar para o Supabase Storage dentro de uma pasta do usuário.
 * Retorna O filePath e a URL pública.
 */
export async function uploadAvatar(userId: string, blob: Blob): Promise<{ publicUrl: string, filePath: string }> {
    const timestamp = Date.now();
    const fileName = `${userId}-${timestamp}.jpg`;

    // Pasta é o user.id para bater com a policy RLS "(storage.foldername(name))[1]"
    const filePath = `${userId}/${fileName}`;

    // Fazer upload (upsert para false para garantir a unicidade de histórico se necessário)
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false,
        });

    if (uploadError) {
        console.error('[uploadAvatar] Erro no upload:', uploadError);
        throw new Error(uploadError.message || 'Erro ao fazer upload da imagem');
    }

    // Buscar URL pública
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

    if (!data?.publicUrl) {
        throw new Error('Não foi possível obter a URL pública da imagem');
    }

    // Adicionar cache-busting
    const publicUrl = `${data.publicUrl}?t=${timestamp}`;

    return { publicUrl, filePath };
}

/**
 * Atualiza o campo foto_url na tabela profiles.
 */
export async function updateProfilePhoto(userId: string, fotoUrl: string): Promise<void> {
    const { error } = await supabase
        .from('profiles')
        .update({ foto_url: fotoUrl })
        .eq('id', userId);

    if (error) {
        console.error('[updateProfilePhoto] Erro ao atualizar perfil:', error);
        throw new Error(error.message || 'Erro ao atualizar foto no perfil');
    }
}
