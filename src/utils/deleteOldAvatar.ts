import { supabase } from '@/lib/supabase';

/**
 * Remove a foto de perfil antiga do bucket avatars.
 * Recebe a URL pública antiga para extrair o filePath.
 */
export async function deleteOldAvatar(oldFotoUrl: string | null): Promise<void> {
    if (!oldFotoUrl) return;

    try {
        // Exemplo da URL pública:
        // https://nomedoprojeto.supabase.co/storage/v1/object/public/avatars/uuid/uuid-timestamp.jpg?t=123

        // 1. Limpar a URL removendo possível cache-busting (?t=...)
        const urlWithoutQuery = oldFotoUrl.split('?')[0];

        // 2. Extrair o filePath (o que vem depois de /avatars/)
        const parts = urlWithoutQuery.split('/avatars/');
        if (parts.length < 2) {
            console.warn('[deleteOldAvatar] URL não contém formato esperado do bucket:', oldFotoUrl);
            return;
        }

        const filePath = parts[1]; // Ex: uuid/uuid-timestamp.jpg

        if (!filePath) return;

        // 3. Deletar usando o filePath correto
        const { error } = await supabase.storage.from('avatars').remove([filePath]);

        if (error) {
            console.error('[deleteOldAvatar] Falha ao deletar avatar antigo:', error.message);
        } else {
            console.log('[deleteOldAvatar] Avatar antigo removido com sucesso:', filePath);
        }
    } catch (err) {
        console.error('[deleteOldAvatar] Erro no processamento de deleção:', err);
    }
}
