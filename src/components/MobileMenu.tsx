import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCalendarMode } from '@/hooks/use-calendar-mode';
import { useMobileMenu } from '@/hooks/useMobileMenu';
import {
    Menu, X, LogOut, LogIn, LayoutDashboard
} from 'lucide-react';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

const MobileMenu = () => {
    const { isOpen, setIsOpen } = useMobileMenu();
    const { isAuthenticated, isAdmin, profile, signOut, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
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
        const event = new CustomEvent('open-global-agendamento-modal');
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
                className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 md:hidden text-[#E53935] hover:bg-red-50 rounded-lg transition-colors ml-1 relative -top-[1px]"
                aria-label="Abrir menu"
            >
                <div className="flex flex-col gap-[4.5px]">
                    <span className="w-6 h-[3px] bg-current rounded-full" />
                    <span className="w-6 h-[3px] bg-current rounded-full" />
                    <span className="w-6 h-[3px] bg-current rounded-full" />
                </div>
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
                <div className="px-5 py-6 bg-[#0B1221] flex flex-col relative">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-red-600 text-white hover:bg-red-700 rounded-full transition-colors shadow-lg z-10"
                    >
                        <X size={16} strokeWidth={3} />
                    </button>

                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl border-2 border-white/20 overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 shrink-0 flex items-center justify-center shadow-lg">
                            {profile?.foto_url ? (
                                <img src={profile.foto_url} alt={profile.nome} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-black text-xl">{isAuthenticated ? initials : 'U'}</span>
                            )}
                        </div>
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
                <div className="flex-1 overflow-y-auto py-3 px-3.5 flex flex-col gap-1.5 bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)]">

                    {/* Item 1: Escala */}
                    <div className="px-1 py-0.5 flex items-center justify-between">
                        <Select value={mode} onValueChange={(val) => { setMode(val as any); setIsOpen(false); }}>
                            <SelectTrigger className="w-full h-10 bg-white border-none shadow-none text-slate-700 font-bold text-sm px-2 hover:bg-slate-50 transition-colors focus:ring-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-[20px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)] drop-shadow-[0_4px_8px_rgba(0,0,0,0.1)]">⏱️</span>
                                    <div className="flex gap-1">
                                        <span>Escala</span>
                                        <SelectValue />
                                    </div>
                                </div>
                            </SelectTrigger>
                            <SelectContent className="z-[202]">
                                <SelectItem value="24x48" className="font-bold">🧑‍🚒 24x48 Horas</SelectItem>
                                <SelectItem value="12x36" className="font-bold">👮 12x36 Horas</SelectItem>
                                <SelectItem value="adm" className="font-bold">👔 Adm</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="h-px w-full bg-slate-100 my-0.5 rounded-full" />

                    {/* Autenticado ou Não */}
                    {isAuthenticated ? (
                        <>
                            {/* Item 2: Agendar */}
                            <button
                                onClick={handleAgendar}
                                className="flex items-center gap-3 px-4 py-2 w-full text-left text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-full transition-colors group"
                            >
                                <span className="text-[20px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] drop-shadow-[0_4px_10px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">📝</span>
                                <span className="font-bold text-sm">Agendar</span>
                            </button>

                            {/* Item 3: Agendamentos */}
                            <button
                                onClick={() => handleNav('/agendamentos')}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 w-full text-left rounded-full transition-all group",
                                    location.pathname === '/agendamentos'
                                        ? "bg-gradient-to-b from-[#fef08a] to-[#facc15] text-[#0B1221] shadow-[0_2px_0_#eab308] border border-[#eab308]/20"
                                        : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                                )}
                            >
                                <span className="text-[20px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] drop-shadow-[0_4px_10px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">📋</span>
                                <span className="font-bold text-sm">Agendamentos</span>
                            </button>

                            {/* Item 4: Meus Agendamentos */}
                            <button
                                onClick={() => handleNav(`/agendamentos?usuario=${profile?.id}`)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 w-full text-left rounded-full transition-all group",
                                    location.search.includes(`usuario=${profile?.id}`)
                                        ? "bg-gradient-to-b from-[#fef08a] to-[#facc15] text-[#0B1221] shadow-[0_2px_0_#eab308] border border-[#eab308]/20"
                                        : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                                )}
                            >
                                <span className="text-[20px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] drop-shadow-[0_4px_10px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">🗓️</span>
                                <span className="font-bold text-sm">Meus Agendamentos</span>
                            </button>

                            {/* Itens Admin */}
                            {isAdmin && (
                                <>
                                    {/* Item 5: Feriados e Eventos */}
                                    <button
                                        onClick={() => handleNav('/admin/calendario')}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2 w-full text-left rounded-full transition-all group",
                                            location.pathname === '/admin/calendario'
                                                ? "bg-gradient-to-b from-[#fef08a] to-[#facc15] text-[#0B1221] shadow-[0_2px_0_#eab308] border border-[#eab308]/20"
                                                : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                                        )}
                                    >
                                        <span className="text-[20px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] drop-shadow-[0_4px_10px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">📅</span>
                                        <span className="font-bold text-sm">Feriados e Eventos</span>
                                    </button>

                                    {/* Item 6: Usuários */}
                                    <button
                                        onClick={() => handleNav('/usuarios')}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2 w-full text-left rounded-full transition-all group",
                                            location.pathname.startsWith('/usuarios')
                                                ? "bg-gradient-to-b from-[#fef08a] to-[#facc15] text-[#0B1221] shadow-[0_2px_0_#eab308] border border-[#eab308]/20"
                                                : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                                        )}
                                    >
                                        <span className="text-[20px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] drop-shadow-[0_4px_10px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">👥</span>
                                        <span className="font-bold text-sm">Usuários</span>
                                    </button>
                                </>
                            )}

                            {/* Item 7: Meu Perfil */}
                            <button
                                onClick={() => handleNav('/meu-perfil')}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 w-full text-left rounded-full transition-all group",
                                    location.pathname === '/meu-perfil'
                                        ? "bg-gradient-to-b from-[#fef08a] to-[#facc15] text-[#0B1221] shadow-[0_2px_0_#eab308] border border-[#eab308]/20"
                                        : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                                )}
                            >
                                <span className="text-[20px] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)] drop-shadow-[0_4px_10px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform">👤</span>
                                <span className="font-bold text-sm">Meu Perfil</span>
                            </button>

                            <div className="h-px w-full bg-slate-100 my-0.5" />

                            {/* Item 8: Sair */}
                            <button
                                onClick={() => { signOut(); setIsOpen(false); }}
                                className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-full transition-colors group"
                            >
                                <LogOut size={22} className="group-hover:scale-110 transition-transform filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                                <span className="font-bold text-sm">Sair</span>
                            </button>
                        </>
                    ) : (
                        <div className="px-1 pt-2">
                            <button
                                onClick={() => handleNav('/auth')}
                                className="flex items-center justify-center gap-3 px-4 py-3 w-full rounded-2xl font-black uppercase text-sm text-[#0B1221] bg-gradient-to-b from-[#fef08a] to-[#facc15] shadow-[0_4px_0_#eab308] hover:brightness-110 active:translate-y-[4px] active:shadow-none transition-all duration-200 cursor-pointer"
                            >
                                <LogIn size={18} strokeWidth={3} className="filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]" />
                                <span>Entrar</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MobileMenu;
