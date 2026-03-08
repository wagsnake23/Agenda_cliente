import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const titles = [
        'Ano Novo',
        'Tiradentes',
        'Dia do Trabalho',
        'Independência do Brasil',
        'Nossa Senhora Aparecida',
        'Dia do Servidor Público',
        'Finados',
        'Proclamação da República',
        'Dia da Consciência Negra',
        'Natal',
        'Revolução Constitucionalista',
        'Aniversário de São Paulo',
        'Aniversário de Agudos',
        'Carnaval',
        'Quarta-feira de Cinzas',
        'Sexta-feira Santa',
        'Páscoa',
        'Corpus Christi',
        'Dia das Mães',
        'Dia dos Pais'
    ];

    const { data, error } = await supabase
        .from('calendar_events')
        .delete()
        .in('title', titles);

    if (error) {
        console.error('Error deleting:', error);
    } else {
        console.log('Successfully deleted all system holidays from DB.');
    }
}
run();
