"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, LogIn, UserPlus, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { loginSchema, signupSchema, LoginInput, SignupInput } from '@/modules/auth/schemas';
import { Toaster } from 'sonner';

const AuthPage: React.FC = () => {
    const [tab, setTab] = useState<'login' | 'signup'>('login');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { signIn, signUp, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = (location.state as any)?.from?.pathname || '/';

    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, loading, navigate, from]);

    // --- Login Form ---
    const loginForm = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    // --- Signup Form ---
    const signupForm = useForm<SignupInput>({
        resolver: zodResolver(signupSchema),
        defaultValues: { nome: '', email: '', password: '', confirmPassword: '' },
    });

    const handleLogin = async (data: LoginInput) => {
        const { error } = await signIn(data.email, data.password);
        if (error) {
            toast.error(error.includes('Invalid login credentials')
                ? 'Email ou senha incorretos'
                : error
            );
        } else {
            toast.success('Login realizado com sucesso!');
            navigate(from, { replace: true });
        }
    };

    const handleSignup = async (data: SignupInput) => {
        const { error } = await signUp(data.email, data.password, data.nome);
        if (error) {
            if (error.includes('already registered')) {
                toast.error('Este email já está cadastrado');
            } else {
                toast.error(error);
            }
        } else {
            toast.success('Conta criada com sucesso! Verifique seu email para ativar.');
            setTab('login');
            signupForm.reset();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EFF3F6] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[linear-gradient(135deg,#0B1221_0%,#1a2a4a_50%,#0B1221_100%)] flex items-center justify-center p-4 relative overflow-hidden">
            <Toaster richColors position="top-center" />

            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-800/5 rounded-full blur-3xl" />
            </div>

            {/* Logo lateral esquerda superior como botão link */}
            <div className="absolute top-6 left-6 z-[60]">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 group transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                >
                    <img src="/logo-bombeiros.png" alt="Brasão" className="w-10 h-10 object-contain drop-shadow-md" />
                    <div className="flex flex-col items-start">
                        <span className="text-white font-black text-sm uppercase tracking-[2px] leading-tight">Bombeiros</span>
                        <span className="text-white font-black text-sm uppercase tracking-[2px] leading-tight">Agudos</span>
                    </div>
                </button>
            </div>

            <div className="w-full max-w-[420px] relative z-10">
                {/* Logo Header */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <img src="/logo.png" alt="Calendario" className="w-20 h-20 drop-shadow-[0_10px_30px_rgba(37,99,235,0.4)] object-contain filter brightness-[1.1] mb-4 transform hover:scale-110 transition-transform duration-500" />

                    <h1 className="text-white font-black text-2xl uppercase tracking-[3px] drop-shadow-md">
                        Calendário de Prontidão
                    </h1>
                </div>

                {/* Card Principal */}
                <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setTab('login')}
                            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${tab === 'login'
                                ? 'text-white bg-white/10 border-b-2 border-blue-400'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            <LogIn size={16} />
                            Entrar
                        </button>
                        <button
                            onClick={() => setTab('signup')}
                            className={`flex-1 py-4 flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wider transition-all duration-200 ${tab === 'signup'
                                ? 'text-white bg-white/10 border-b-2 border-blue-400'
                                : 'text-white/40 hover:text-white/70'
                                }`}
                        >
                            <UserPlus size={16} />
                            Criar Conta
                        </button>
                    </div>

                    <div className="p-6 md:p-8">
                        {/* LOGIN FORM */}
                        {tab === 'login' && (
                            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
                                <div>
                                    <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">📧</span>
                                        <input
                                            {...loginForm.register('email')}
                                            type="email"
                                            placeholder="seu@email.com"
                                            autoComplete="email"
                                            className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#F8FAFC] border border-white/10 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium"
                                        />
                                    </div>
                                    {loginForm.formState.errors.email && (
                                        <p className="text-red-400 text-xs mt-1 ml-1">{loginForm.formState.errors.email.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                                        Senha
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">🔐</span>
                                        <input
                                            {...loginForm.register('password')}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            className="w-full h-12 pl-11 pr-12 rounded-xl bg-[#F8FAFC] border border-white/10 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all text-sm font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {loginForm.formState.errors.password && (
                                        <p className="text-red-400 text-xs mt-1 ml-1">{loginForm.formState.errors.password.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loginForm.formState.isSubmitting}
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white font-black uppercase tracking-wider text-sm shadow-[0_8px_20px_rgba(37,99,235,0.35)] hover:shadow-[0_12px_24px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-blue-400/30"
                                >
                                    {loginForm.formState.isSubmitting ? (
                                        <><Loader2 size={18} className="animate-spin" /> Entrando...</>
                                    ) : (
                                        <><span className="text-lg">🚀</span> Entrar</>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* SIGNUP FORM */}
                        {tab === 'signup' && (
                            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                                <div>
                                    <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                                        Nome Completo
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">👤</span>
                                        <input
                                            {...signupForm.register('nome')}
                                            type="text"
                                            placeholder="Seu nome completo"
                                            autoComplete="name"
                                            className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#F8FAFC] border border-white/10 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium"
                                        />
                                    </div>
                                    {signupForm.formState.errors.nome && (
                                        <p className="text-red-400 text-xs mt-1 ml-1">{signupForm.formState.errors.nome.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">📧</span>
                                        <input
                                            {...signupForm.register('email')}
                                            type="email"
                                            placeholder="seu@email.com"
                                            autoComplete="email"
                                            className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#F8FAFC] border border-white/10 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium"
                                        />
                                    </div>
                                    {signupForm.formState.errors.email && (
                                        <p className="text-red-400 text-xs mt-1 ml-1">{signupForm.formState.errors.email.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                                        Senha
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">🔐</span>
                                        <input
                                            {...signupForm.register('password')}
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            className="w-full h-12 pl-11 pr-12 rounded-xl bg-[#F8FAFC] border border-white/10 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {signupForm.formState.errors.password && (
                                        <p className="text-red-400 text-xs mt-1 ml-1">{signupForm.formState.errors.password.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-white/70 text-xs font-bold uppercase tracking-wider mb-1.5 ml-1">
                                        Confirmar Senha
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">🔐</span>
                                        <input
                                            {...signupForm.register('confirmPassword')}
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            className="w-full h-12 pl-11 pr-12 rounded-xl bg-[#F8FAFC] border border-white/10 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all text-sm font-medium"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {signupForm.formState.errors.confirmPassword && (
                                        <p className="text-red-400 text-xs mt-1 ml-1">{signupForm.formState.errors.confirmPassword.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={signupForm.formState.isSubmitting}
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black uppercase tracking-wider text-sm shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_24px_rgba(16,185,129,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {signupForm.formState.isSubmitting ? (
                                        <><Loader2 size={18} className="animate-spin" /> Criando conta...</>
                                    ) : (
                                        <><UserPlus size={16} /> Criar Conta</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <p className="text-center text-white/30 text-xs mt-6">
                    © 2026 Bombeiros Agudos — Calendário Prontidão
                </p>
            </div>
        </div>
    );
};

export default AuthPage;
