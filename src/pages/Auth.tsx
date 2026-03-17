"use client";

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/contexts/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { loginSchema, LoginInput } from '@/modules/auth/schemas';

const AuthPage: React.FC = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const { signIn, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccessToast, showErrorToast } = useToast();

    const from = (location.state as any)?.from?.pathname || '/';

    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, loading, navigate, from]);

    const loginForm = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const handleLogin = async (data: LoginInput) => {
        const { error } = await signIn(data.email, data.password);
        if (error) {
            showErrorToast(error.includes('Invalid login credentials')
                ? 'Email ou senha incorretos'
                : error
            );
        } else {
            showSuccessToast('Login realizado com sucesso!');
            navigate(from, { replace: true });
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetEmail) {
            showErrorToast('Informe seu e-mail para continuar.');
            return;
        }

        setIsResetting(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/auth?action=reset_password`,
            });
            if (error) throw error;

            showSuccessToast('Link de recuperação enviado para seu e-mail!');
            setShowResetModal(false);
            setResetEmail('');
        } catch (error: any) {
            showErrorToast(error.message || 'Erro ao enviar link de recuperação.');
        } finally {
            setIsResetting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#1e3a8a] via-[#111827] to-[#0b1221] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white md:bg-[linear-gradient(135deg,#1e3a8a_0%,#111827_50%,#0b1221_100%)] flex flex-col items-center justify-center p-4 select-none relative overflow-hidden">

            {/* Logo lateral esquerda superior como botão link */}
            <div className="absolute top-6 left-6 z-[60]">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-3 group transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                >
                    <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-md" />
                    <div className="flex items-center gap-2">
                         <h3
                            className="font-bold text-lg md:text-xl tracking-wider uppercase whitespace-nowrap flex gap-2"
                            style={{
                                textShadow: `
                                    0 1px 0 rgba(255,255,255,0.25),
                                    0 2px 4px rgba(0,0,0,0.25),
                                    0 6px 10px rgba(0,0,0,0.15)
                                `
                            }}
                        >
                            <span style={{ color: '#f87171', filter: 'saturate(1.2)' }}>CALENDÁRIO</span>
                            <span 
                                style={{ 
                                    background: 'linear-gradient(180deg, #ffffff 40%, #dbeafe 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    color: 'transparent'
                                }}
                            >
                                AGENDA
                            </span>
                        </h3>
                    </div>
                </button>
            </div>

            <div className="w-full max-w-[390px] relative z-10">
                {/* Card de Login - No Mobile fundo branco direto, no Desktop com Card */}
                <div className="bg-white md:bg-[#F8FAFC] md:rounded-[31px] md:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,1),inset_0_2px_10px_rgba(0,0,0,0.05)] overflow-hidden px-4 md:px-8 pt-3 md:pt-4 pb-6 md:pb-1 flex flex-col items-center md:border-[4px] md:border-white/60">

                    {/* Logo Principal */}
                    <img
                        src="/logo.png"
                        alt="Calendário"
                        className="w-20 md:w-20 h-20 md:h-20 drop-shadow-[0_10px_30px_rgba(37,99,235,0.3)] object-contain filter brightness-[1.1] mb-2 md:mb-1 transform hover:scale-105 transition-transform duration-500"
                    />

                    {/* Títulos com Gradiente Premium - Refletindo o Estilo da Home */}
                    <div className="text-center mb-8 md:mb-6">
                        <h1
                            className="font-black text-2xl uppercase tracking-wider flex flex-col items-center gap-1"
                            style={{
                                textShadow: '0 2px 10px rgba(0,0,0,0.15)'
                            }}
                        >
                            <span className="text-[#f87171]">CALENDÁRIO</span>
                            <span 
                                style={{ 
                                    background: 'linear-gradient(180deg, #1e3a8a 40%, #1e40af 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                    color: 'transparent'
                                }}
                            >
                                AGENDA
                            </span>
                        </h1>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="w-full space-y-5 md:space-y-2">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-slate-500 md:text-slate-700 text-[13px] font-bold ml-1 opacity-70">Email</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">📧</span>
                                <input
                                    {...loginForm.register('email')}
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="w-full h-12 md:h-12 pl-12 pr-4 rounded-2xl bg-[#E8F0FE] border border-slate-300 md:border-slate-300/50 text-slate-800 placeholder-slate-400 font-bold text-sm md:text-[15.5px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all shadow-sm"
                                />
                            </div>
                            {loginForm.formState.errors.email && (
                                <p className="text-red-500 text-[10px] font-bold mt-1 ml-2 uppercase tracking-tighter italic">
                                    {loginForm.formState.errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Senha */}
                        <div className="space-y-2">
                            <label className="text-slate-500 md:text-slate-700 text-[13px] font-bold ml-1 opacity-70">Senha</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔐</span>
                                <input
                                    {...loginForm.register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="w-full h-12 md:h-12 pl-12 pr-12 rounded-2xl bg-[#E8F0FE] border border-slate-300 md:border-slate-300/50 text-slate-800 placeholder-slate-400 font-bold text-sm md:text-[15.5px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {loginForm.formState.errors.password && (
                                <p className="text-red-500 text-[10px] font-bold mt-1 ml-2 uppercase tracking-tighter italic">
                                    {loginForm.formState.errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Botão Entrar Anterior (Texto e Ícones) */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loginForm.formState.isSubmitting}
                                className="w-full h-12 md:h-12 rounded-2xl bg-gradient-to-b from-[#E53935] to-[#B71C1C] hover:from-[#EF5350] hover:to-[#C62828] text-white font-black text-[17.5px] shadow-[0_4px_0_#991B1B,0_10px_20px_rgba(183,28,28,0.25)] active:translate-y-[4px] active:shadow-[0_1px_0_#991B1B] transition-all duration-150 disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-3 border border-white/10"
                            >
                                {loginForm.formState.isSubmitting ? (
                                    <><Loader2 size={24} className="animate-spin" /> Entrando...</>
                                ) : (
                                    <>🚀 Entrar</>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Esqueci a Senha */}
                    <button
                        type="button"
                        className="mt-8 md:mt-4 mb-4 md:mb-0 text-blue-900 font-black text-[14.5px] hover:text-blue-700 transition-all decoration-blue-900/30 underline-offset-4"
                        onClick={() => setShowResetModal(true)}
                    >
                        Esqueceu sua senha?
                    </button>

                    {/* Footer Desktop - Dentro do card */}
                    <div className="hidden md:block mt-7 text-[#475569] text-[10px] font-semibold uppercase tracking-wider">
                        © {new Date().getFullYear()} - Calendário Agenda - by Vagner
                    </div>
                </div>
            </div>

            {/* Footer Mobile específico pinado embaixo fora do card */}
            <div className="md:hidden fixed bottom-0 left-0 w-full text-center text-slate-400 text-[10px] font-black uppercase tracking-wider z-50 bg-gradient-to-t from-white via-white/90 to-transparent pt-6 pb-4">
                © {new Date().getFullYear()} - Calendário Agenda - by Vagner
            </div>

            {showResetModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-2">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowResetModal(false)} />
                    <div className="relative bg-gradient-to-br from-[#F4F9FF] to-[#E6F0FD] rounded-[24px] shadow-2xl border border-blue-200 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25),inset_0_1.5px_1px_white] p-6 md:p-8 w-[99%] md:w-full md:max-w-md z-10 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col items-center gap-4 mb-6 text-center">
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-200 shadow-[0_4px_0_#93c5fd] border border-blue-200 flex items-center justify-center shrink-0">
                                    <span className="text-xl">🔑</span>
                                </div>
                                <h3 className="text-[1.35rem] font-black text-slate-800 leading-tight">Recuperar Senha</h3>
                            </div>
                            <p className="text-slate-600 font-bold text-sm px-2 leading-relaxed">
                                Enviaremos um link seguro para o seu e-mail para você redefinir sua senha.
                            </p>
                        </div>

                        <form onSubmit={handleResetPassword}>
                            <div className="mb-6 space-y-2 text-left">
                                <label className="text-slate-500 text-[13px] font-bold ml-1">Email Cadastrado</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl">📧</span>
                                    <input
                                        type="email"
                                        required
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-bold placeholder-slate-400"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowResetModal(false)}
                                    className="flex-1 h-12 rounded-xl bg-slate-200 text-slate-600 font-bold text-[17px] border border-slate-300 shadow-[0_4px_0_#CBD5E1] hover:bg-slate-300 active:translate-y-[2px] active:shadow-none transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isResetting}
                                    className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-bold text-[17px] shadow-[0_4px_0_#1E3A8A] hover:bg-blue-700 active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-70 flex items-center justify-center"
                                >
                                    {isResetting ? <Loader2 size={18} className="animate-spin" /> : 'Enviar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;
