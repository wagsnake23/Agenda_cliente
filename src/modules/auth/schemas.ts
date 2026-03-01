import { z } from 'zod';

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email é obrigatório')
        .email('Email inválido'),
    password: z
        .string()
        .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const signupSchema = z.object({
    nome: z
        .string()
        .min(1, 'Nome é obrigatório')
        .min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z
        .string()
        .min(1, 'Email é obrigatório')
        .email('Email inválido'),
    password: z
        .string()
        .min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z
        .string()
        .min(1, 'Confirme sua senha'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
});

export const profileSchema = z.object({
    nome: z
        .string()
        .min(1, 'Nome é obrigatório')
        .min(3, 'Nome deve ter no mínimo 3 caracteres'),
    data_nascimento: z
        .string()
        .optional()
        .nullable(),
    cargo: z
        .string()
        .optional()
        .nullable(),
    matricula: z
        .string()
        .optional()
        .nullable(),
});

export const agendamentoSchema = z.object({
    data_inicial: z
        .string()
        .min(1, 'Data inicial é obrigatória'),
    data_final: z
        .string()
        .min(1, 'Data final é obrigatória'),
    tipo_agendamento: z
        .string()
        .min(1, 'Tipo de agendamento é obrigatório'),
    observacao: z
        .string()
        .max(100, 'Observação deve ter no máximo 100 caracteres')
        .optional()
        .nullable(),
}).refine((data) => {
    if (!data.data_inicial || !data.data_final) return true;
    return new Date(data.data_final) >= new Date(data.data_inicial);
}, {
    message: 'Data final não pode ser anterior à data inicial',
    path: ['data_final'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type AgendamentoInput = z.infer<typeof agendamentoSchema>;
