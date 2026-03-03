import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCalendarMode } from '@/hooks/use-calendar-mode';
import { useMobileMenu } from '@/hooks/useMobileMenu';
import {
    Menu, X, LogOut
} from 'lucide-react';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

const MobileMenu = () => {
    const { isOpen, setIsOpen } = useMobileMenu();
    const { isAuthenticated, isAdmin, profile, signOut, loading } = useAuth();
    const navigate = useNavigate();
    const { mode, setMode } = useCalendarMode();

    const modeMap = {
        '24x48': '24H',
        '12x36': '12H',
        'adm': '8H'
    };

    const handleNav = (path: string) => {
        navigate(path);
        setIsOpen(false);
    };

    const handleAgendar = () => {
        const event = new CustomEvent('open-agendamento-drawer');
        window.dispatchEvent(event);
        setIsOpen(false);
    };

    const initials = profile?.nome
        ? profile.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 md:hidden text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors ml-1"
                aria-label="Abrir menu"
            >
                <Menu size={24} />
            </button>

            {/* Overlay Escuro */}
            <div
                className={cn(
                    "fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] md:hidden transition-opacity duration-300",
                    isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* Menu Lateral Deslizante */}
            <div
                className={cn(
                    "fixed top-0 right-0 h-full w-[280px] bg-white z-[201] md:hidden flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-in-out",
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Topo / Header do Menu */}
                <div className="px-5 py-6 bg-[#0B1221] flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl border-2 border-white/20 overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 shrink-0 flex items-center justify-center shadow-lg">
                            {profile?.foto_url ? (
                                <img src={profile.foto_url} alt={profile.nome} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-black text-xl">{isAuthenticated ? initials : 'U'}</span>
                            )}
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 flex items-center justify-center bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                        >
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-base">Carregando...</span>
                            <span className="text-white/60 text-xs font-medium mt-0.5">Verificando sessão...</span>
                        </div>
                    ) : isAuthenticated ? (
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-base truncate">{profile?.nome || 'Usuário'}</span>
                            <span className="text-white/60 text-xs font-medium truncate mt-0.5">{profile?.email}</span>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-base">Visitante</span>
                            <span className="text-white/60 text-xs font-medium mt-0.5">Faça login para mais recursos</span>
                        </div>
                    )}
                </div>

                {/* Lista de Itens */}
                <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2">

                    {/* Item 1: Escala */}
                    <div className="px-1 py-1 flex items-center justify-between">
                        <Select value={mode} onValueChange={(val) => { setMode(val as any); setIsOpen(false); }}>
                            <SelectTrigger className="w-full h-11 bg-white border-none shadow-none text-slate-700 font-bold text-sm px-2 hover:bg-slate-50 transition-colors focus:ring-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg drop-shadow-sm">⏱️</span>
                                    <div className="flex gap-1">
                                        <span>Escala</span>
                                        <SelectValue />
                                    </div>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="z-[202]">
                                <SelectItem value="24x48" className="font-bold">24x48 Horas</SelectItem>
                                <SelectItem value="12x36" className="font-bold">12x36 Horas</SelectItem>
                                <SelectItem value="adm" className="font-bold">Adm</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-px w-full bg-slate-100 my-1 rounded-full" />

                    {/* Autenticado ou Não */}
                    {isAuthenticated ? (
                        <>
                            {/* Item 2: Agendar */}
                            <button
                                onClick={handleAgendar}
                                className="flex items-center gap-3 px-4 py-[10px] w-full text-left text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors group"
                            >
                                <span className="text-lg drop-shadow-sm group-hover:scale-110 transition-transform">📝</span>
                                <span className="font-bold text-sm">Agendar</span>
                            </button>

                            {/* Item 3: Agendamentos */}
                            <button
                                onClick={() => handleNav('/agendamentos')}
                                className="flex items-center gap-3 px-4 py-[10px] w-full text-left text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors group"
                            >
                                <span className="text-lg drop-shadow-sm group-hover:scale-110 transition-transform">📋</span>
                                <span className="font-bold text-sm">Agendamentos</span>
                            </button>

                            {/* Item 4: Meus Agendamentos */}
                            <button
                                onClick={() => handleNav(`/agendamentos?usuario=${profile?.id}`)}
                                className="flex items-center gap-3 px-4 py-[10px] w-full text-left text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors group"
                            >
                                <span className="text-lg drop-shadow-sm group-hover:scale-110 transition-transform">🗓️</span>
                                <span className="font-bold text-sm">Meus Agendamentos</span>
                            </button>

                            {/* Itens Admin */}
                            {isAdmin && (
                                <>
                                    {/* Item 5: Feriados e Eventos */}
                                    <button
                                        onClick={() => handleNav('/admin/calendario')}
                                        className="flex items-center gap-3 px-4 py-[10px] w-full text-left text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors group"
                                    >
                                        <span className="text-lg drop-shadow-sm group-hover:scale-110 transition-transform">📅</span>
                                        <span className="font-bold text-sm">Feriados e Eventos</span>
                                    </button>

                                    {/* Item 6: Usuários */}
                                    <button
                                        onClick={() => handleNav('/usuarios')}
                                        className="flex items-center gap-3 px-4 py-[10px] w-full text-left text-slate-700 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors group"
                                    >
                                        <span className="text-lg drop-shadow-sm group-hover:scale-110 transition-transform">👥</span>
                                        <span className="font-bold text-sm">Usuários</span>
                                    </button>
                                </>
                            )}

                            {/* Item 7: Meu Perfil */}
                            <button
                                onClick={() => handleNav('/meu-perfil')}
                                className="flex items-center gap-3 px-4 py-[10px] w-full text-left text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors group"
                            >
                                <span className="text-lg drop-shadow-sm group-hover:scale-110 transition-transform">👤</span>
                                <span className="font-bold text-sm">Meu Perfil</span>
                            </button>

                            <div className="h-px w-full bg-slate-200 my-1" />

                            {/* Item 8: Sair */}
                            <button
                                onClick={() => { signOut(); setIsOpen(false); }}
                                className="flex items-center gap-3 px-4 py-[10px] w-full text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
                            >
                                <LogOut size={20} className="group-hover:scale-110 transition-transform" />
                                <span className="font-bold text-sm">Sair</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => handleNav('/auth')}
                            className="flex items-center gap-3 px-4 py-[10px] w-full text-left text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors group"
                        >
                            <span className="text-lg drop-shadow-sm group-hover:scale-110 transition-transform">🔑</span>
                            <span className="font-bold text-sm">Entrar</span>
                        </button>
                    )}

                </div>
            </div>
        </>
    );
};

export default MobileMenu;
