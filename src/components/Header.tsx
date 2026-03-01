import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LogIn, LogOut, Users, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import MobileMenu from './MobileMenu';

export const UserMenu = () => {
    const { profile, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const initials = profile?.nome
        ? profile.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    return (
        <div ref={ref} className="relative z-[102]">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white border border-white/10"
            >
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/20">
                    {profile?.foto_url ? (
                        <img src={profile.foto_url} alt={profile.nome} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-[11px] font-black">
                            {initials}
                        </div>
                    )}
                </div>
                <span className="text-sm font-bold hidden md:block max-w-[120px] truncate">
                    {profile?.nome?.split(' ')[0] || 'Usuário'}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 border-b border-gray-100">
                        <p className="font-bold text-slate-700 text-sm truncate">{profile?.nome}</p>
                        <p className="text-slate-400 text-xs truncate">{profile?.email}</p>
                    </div>

                    <button
                        onClick={() => { navigate('/meu-perfil'); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-medium"
                    >
                        <span className="text-[17px] drop-shadow-sm leading-none flex items-center">👤</span> Meu Perfil
                    </button>

                    <button
                        onClick={() => { navigate(`/agendamentos?usuario=${profile?.id}`); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-medium"
                    >
                        <span className="text-[17px] drop-shadow-sm leading-none flex items-center">🗓️</span> Minha Agenda
                    </button>

                    <div className="border-t border-gray-100">
                        <button
                            onClick={() => { signOut(); setOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
                        >
                            <LogOut size={15} /> Sair
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Header = () => {
    const { isAuthenticated, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleAgendar = () => {
        // Direcionar para home e disparar drawer caso esteja fora da home
        if (window.location.pathname !== '/') {
            navigate('/');
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent('open-agendamento-drawer'));
            }, 300);
        } else {
            window.dispatchEvent(new CustomEvent('open-agendamento-drawer'));
        }
    };

    return (
        <>
            {/* Barra de Título Institucional - Desktop Apenas */}
            <header className="hidden lg:flex fixed top-0 w-full h-[74px] bg-[#131C31] items-center z-[100] select-none shadow-[0_6px_20px_rgba(0,0,0,0.2)]">
                <div className="w-full max-w-[1600px] mx-auto px-8 flex items-center justify-between">
                    <div onClick={() => navigate('/')} className="flex items-center gap-4 cursor-pointer">
                        <img
                            src="/logo.png"
                            alt="Logo Calendário"
                            className="w-11 h-11 drop-shadow-lg object-contain pointer-events-auto filter brightness-[1.1]"
                        />
                        <h1
                            className="font-black tracking-normal text-white uppercase leading-none inline-flex items-center pointer-events-auto"
                            style={{
                                fontFamily: 'Inter, sans-serif',
                                filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.3)) drop-shadow(0px 4px 12px rgba(0,0,0,0.5))',
                            }}
                        >
                            <span className="text-[1.3rem]">CALENDÁRIO PRONTIDÃO</span>
                        </h1>
                    </div>

                    {/* Área de Auth - Alinhada à Direita */}
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <>
                                {/* Botão Agendar */}
                                <button
                                    onClick={handleAgendar}
                                    className="px-5 py-2 bg-[#FDE047] text-[#0B1221] font-black uppercase text-sm rounded-xl
                                     shadow-[0_4px_0_#A16207,0_8px_15px_rgba(0,0,0,0.3)]
                                     hover:bg-[#FACC15] hover:shadow-[0_2px_0_#A16207,0_4px_10px_rgba(0,0,0,0.3)]
                                     hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none
                                     transition-all duration-150 cursor-pointer"
                                >
                                    Agendar
                                </button>

                                {/* Agendamentos */}
                                <button
                                    onClick={() => navigate('/agendamentos')}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/10 transition-all"
                                >
                                    <CalendarIcon size={15} /> Agendamentos
                                </button>

                                {/* Admin Menu */}
                                {isAdmin && (
                                    <button
                                        onClick={() => navigate('/usuarios')}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/10 transition-all"
                                    >
                                        <Users size={15} /> Usuários
                                    </button>
                                )}

                                {/* Avatar Dropdown */}
                                <UserMenu />
                            </>
                        ) : (
                            <button
                                onClick={() => navigate('/auth')}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-sm rounded-xl shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] transition-all duration-150"
                            >
                                <LogIn size={16} /> Entrar
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Header Mobile/Tablet */}
            <header className="sticky top-0 z-50 w-full h-[60px] bg-[#EFF3F6] flex flex-row items-center justify-between mt-0 md:mt-0 mb-1 pl-2 pr-2 select-none lg:hidden md:relative md:z-auto md:h-auto overflow-hidden">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <div className="flex items-center gap-1.5 w-full max-w-[280px]">
                        <img
                            src="/logo.png"
                            alt="Logo Calendário"
                            className="w-10 h-10 md:w-12 md:h-12 object-contain ml-1 transition-transform duration-300 hover:scale-105 shrink-0"
                        />
                        <h1
                            className="text-[1.1rem] md:text-[1.6rem] font-black tracking-tight uppercase leading-none flex flex-row gap-1.5 select-none relative -left-[3px] md:-left-0"
                            style={{
                                background: 'linear-gradient(to bottom, #FF4D4D 0%, #D32F2F 50%, #8B0000 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                fontFamily: 'Inter, sans-serif',
                                filter: 'drop-shadow(1px 1px 0px rgba(0, 0, 0, 0.1))',
                            }}
                        >
                            <span>CALENDÁRIO</span>
                            <span>PRONTIDÃO</span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center shrink-0 w-12 justify-end">
                    <MobileMenu />
                </div>
            </header>
        </>
    );
};

export default Header;
