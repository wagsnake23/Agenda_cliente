import React, { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
                className="flex items-center gap-3 px-[14px] py-[6px] rounded-xl bg-[#2d3f63] hover:bg-[#3a5585] transition-all duration-200 ease-in-out text-white border border-white/[0.08]"
            >
                <div className="w-[34px] h-[34px] rounded-full overflow-hidden border border-white/20">
                    {profile?.foto_url ? (
                        <img src={profile.foto_url} alt={profile.nome} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-[11px] font-black">
                            {initials}
                        </div>
                    )}
                </div>
                <span className="text-[14px] font-medium hidden md:block max-w-[120px] truncate">
                    {profile?.nome?.split(' ')[0] || 'Usuário'}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 border-b border-gray-100">
                        <p className="font-bold text-slate-700 text-sm truncate">{profile?.nome}</p>
                        <p className="text-slate-400 text-xs truncate">{profile?.email}</p>
                    </div>

                    <button
                        onClick={() => { navigate('/meu-perfil'); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-bold text-left whitespace-nowrap"
                    >
                        <span className="w-5 flex justify-center shrink-0 text-[17px] drop-shadow-sm leading-none">👤</span> Meu Perfil
                    </button>

                    <button
                        onClick={() => { navigate(`/agendamentos?usuario=${profile?.id}`); setOpen(false); }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm font-bold text-left whitespace-nowrap"
                    >
                        <span className="w-5 flex justify-center shrink-0 text-[17px] drop-shadow-sm leading-none">🗓️</span> Meus Agendamentos
                    </button>

                    <div className="border-t border-gray-100">
                        <button
                            onClick={() => { signOut(); setOpen(false); }}
                            className="w-full flex items-center gap-3 px-3.5 py-2.5 text-red-500 hover:bg-red-50 transition-colors text-sm font-bold text-left whitespace-nowrap"
                        >
                            <div className="w-5 flex justify-center shrink-0">
                                <LogOut size={16} />
                            </div> Sair
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Header = () => {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleAgendar = () => {
        window.dispatchEvent(new CustomEvent('open-global-agendamento-modal'));
    };

    return (
        <>
            {/* Barra de Título Institucional - Desktop Apenas */}
            <header className="hidden lg:flex fixed top-0 w-full h-[64px] bg-gradient-to-r from-[#1e2a44] to-[#243552] items-center z-[100] select-none shadow-[0_4px_14px_rgba(0,0,0,0.25)]">
                <div className="w-full max-w-[1600px] mx-auto px-8 flex items-center justify-between">
                    <div onClick={() => navigate('/')} className="flex items-center gap-4 cursor-pointer">
                        <img
                            src="/logo.png"
                            alt="Logo Calendário"
                            className="w-14 h-14 drop-shadow-lg object-contain pointer-events-auto filter brightness-[1.1]"
                        />
                        <h1
                            className="font-black md:text-[1.15rem] tracking-wider text-white uppercase leading-none inline-flex items-center pointer-events-auto"
                            style={{
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                            }}
                        >
                            CALENDÁRIO AGENDA
                        </h1>
                    </div>

                    {/* Área de Auth - Alinhada à Direita */}
                    <div className="flex items-center gap-6">
                        {/* Enquanto auth carrega, não exibir nenhum botão (evita flash de estado incorreto) */}
                        {!loading && (
                            isAuthenticated ? (
                                <>
                                    {/* Links do Menu */}
                                    <div className="flex items-center gap-2">
                                        {/* Admin Menu */}
                                        {isAdmin && (
                                            <button
                                                onClick={() => navigate('/usuarios')}
                                                className={`px-[14px] py-2 lg:py-2.5 rounded-lg text-[14px] font-bold transition-all duration-300 ease-in-out relative group ${location.pathname.startsWith('/usuarios')
                                                    ? 'text-[#fef9c3] drop-shadow-[0_0_8px_rgba(254,249,195,0.4)]'
                                                    : 'text-white/90 hover:text-white hover:bg-white/[0.08]'
                                                    }`}
                                            >
                                                Usuários
                                                {location.pathname.startsWith('/usuarios') && (
                                                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#fef08a] to-transparent rounded-full shadow-[0_0_12px_rgba(254,240,138,0.5)] animate-in fade-in slide-in-from-bottom-1 duration-500" />
                                                )}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => navigate('/admin/calendario')}
                                            className={`px-[14px] py-2 lg:py-2.5 rounded-lg text-[14px] font-bold transition-all duration-300 ease-in-out relative group ${location.pathname.startsWith('/admin/calendario')
                                                ? 'text-[#fef9c3] drop-shadow-[0_0_8px_rgba(254,249,195,0.4)]'
                                                : 'text-white/90 hover:text-white hover:bg-white/[0.08]'
                                                }`}
                                        >
                                            Feriados e Eventos
                                            {location.pathname.startsWith('/admin/calendario') && (
                                                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#fef08a] to-transparent rounded-full shadow-[0_0_12px_rgba(254,240,138,0.5)] animate-in fade-in slide-in-from-bottom-1 duration-500" />
                                            )}
                                        </button>

                                        {/* Agendamentos */}
                                        <button
                                            onClick={() => navigate('/agendamentos')}
                                            className={`px-[14px] py-2 lg:py-2.5 rounded-lg text-[14px] font-bold transition-all duration-300 ease-in-out relative group ${location.pathname === '/agendamentos'
                                                ? 'text-[#fef9c3] drop-shadow-[0_0_8px_rgba(254,249,195,0.4)]'
                                                : 'text-white/90 hover:text-white hover:bg-white/[0.08]'
                                                }`}
                                        >
                                            Agendamentos
                                            {location.pathname === '/agendamentos' && (
                                                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#fef08a] to-transparent rounded-full shadow-[0_0_12px_rgba(254,240,138,0.5)] animate-in fade-in slide-in-from-bottom-1 duration-500" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Botão Agendar */}
                                    <button
                                        onClick={handleAgendar}
                                        className="px-5 py-2 rounded-xl lg:rounded-2xl font-black uppercase text-sm text-[#0B1221] bg-gradient-to-b from-[#fef08a] to-[#facc15] shadow-[0_4px_0_#eab308] hover:brightness-110 active:translate-y-[4px] active:shadow-none transition-all duration-200 cursor-pointer flex items-center gap-2 border-none ring-0 outline-none"
                                    >
                                        <span className="relative top-[-1px]">📝</span> Agendar
                                    </button>

                                    {/* Avatar Dropdown */}
                                    <UserMenu />
                                </>
                            ) : (
                                <button
                                    onClick={() => navigate('/auth')}
                                    className="px-5 py-2 rounded-xl lg:rounded-2xl font-black uppercase text-sm text-[#0B1221] bg-gradient-to-b from-[#fef08a] to-[#facc15] shadow-[0_4px_0_#eab308] hover:brightness-110 active:translate-y-[4px] active:shadow-none transition-all duration-200 cursor-pointer flex items-center gap-2 border-none ring-0 outline-none"
                                >
                                    <LogIn size={16} strokeWidth={3} /> Entrar
                                </button>
                            )
                        )}
                    </div>
                </div>
            </header>

            {/* Header Mobile/Tablet */}
            <header className="sticky top-0 z-50 w-full h-[60px] bg-[#eef4ff] flex flex-row items-center justify-between mt-0 md:mt-0 mb-1 pl-1 pr-2 select-none lg:hidden md:relative md:z-auto md:h-auto overflow-hidden">
                <div className="flex items-center cursor-pointer relative -top-[1px]" onClick={() => navigate('/')}>
                    <div className="flex items-center gap-4 w-full max-w-[320px]">
                        <img
                            src="/logo.png"
                            alt="Logo Calendário"
                            className="w-12 h-12 md:w-14 md:h-14 object-contain transition-transform duration-300 hover:scale-105 shrink-0"
                        />
                        <h1
                            className="text-[1.1rem] md:text-[1.6rem] font-black tracking-wider uppercase leading-none flex flex-row gap-1.5 select-none relative -left-[3px] md:-left-0 text-[#C62828]"
                            style={{
                                textShadow: '0 1px 0 rgba(0,0,0,0.15)'
                            }}
                        >
                            <span>CALENDÁRIO</span>
                            <span>AGENDA</span>
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
