export const PERFIL_LABELS: Record<string, string> = {
    administrador: 'Administrador',
    conferente: 'Conferente',
};

export const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    pendente: {
        label: 'Pendente',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
    aprovado: {
        label: 'Aprovado',
        className: 'bg-green-50 text-green-700 border-green-200',
    },
    recusado: {
        label: 'Recusado',
        className: 'bg-red-50 text-red-700 border-red-200',
    },
    cancelado: {
        label: 'Cancelado',
        className: 'bg-gray-50 text-gray-700 border-gray-200',
    },
};
