"use client";

import { useState, useMemo, useEffect } from 'react';
import { addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import CalendarHeader from './calendar/CalendarHeader';
import TodayButton from './calendar/TodayButton';
import HolidayMessages from './calendar/HolidayMessages';
import BirthdayMessages from './calendar/BirthdayMessages';
import MoonPhasesDisplay from './calendar/MoonPhasesDisplay';
import AgendamentosDisplay from './calendar/AgendamentosDisplay';
import { useCalendarData } from '@/hooks/use-calendar-data';
import { useCalendarMode } from '@/hooks/use-calendar-mode';
import { useHolidayMessages } from '@/hooks/use-holiday-messages';
import { useMoonPhases } from '@/hooks/use-moon-phases';
import CalendarCard from './calendar/CalendarCard';
import DrawerAgendamento, { Agendamento as DrawerAgendamentoType } from './calendar/DrawerAgendamento';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/contexts/ToastProvider';
import { useCalendarEventsContext } from '@/context/CalendarEventsContext';
import { supabase } from '@/lib/supabase';
import { dedupeById } from '@/utils/dedupeById';

interface CalendarProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  goToToday: () => void;
  formatToday: () => string;
}

// Converter do formato Supabase para o formato do DrawerAgendamento
const toDrawerFormat = (ag: ReturnType<typeof useAgendamentos>['agendamentos'][number]): DrawerAgendamentoType => ({
  id: ag.id,
  userId: ag.user_id,
  dataInicio: ag.data_inicial,
  dataFim: ag.data_final,
  tipo: ag.tipo_agendamento,
  totalDias: ag.dias,
  status: ag.status || 'pendente',
  observacao: ag.observacao || undefined,
  userName: ag.profiles?.apelido || ag.profiles?.nome || undefined,
  userPhoto: ag.profiles?.foto_url || undefined,
  createdAt: ag.created_at,
  approvedAt: ag.approved_at,
  cancelledAt: ag.cancelled_at,
  rejectedAt: ag.rejected_at,
});

const Calendar = ({ month, year, onMonthChange, onYearChange, goToToday, formatToday }: CalendarProps) => {
  const today = new Date();
  const [isYearPopoverOpen, setIsYearPopoverOpen] = useState(false);
  const [highlightedDay, setHighlightedDay] = useState<number | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const { mode, setMode } = useCalendarMode();
  const { isAuthenticated } = useAuth();
  const { events: calendarEvents, setEvents } = useCalendarEventsContext();
  const { showSuccessToast, showErrorToast } = useToast();

  // Hook de agendamentos do Supabase
  const { agendamentos: agendamentosDB, criar, excluir, atualizar, loading: loadingAgendamentos, refetch, setAgendamentos } = useAgendamentos();

  // Converter para o formato que o Drawer e CalendarCard esperam.
  // A deduplicação é responsabilidade exclusiva do hook useAgendamentos.
  // Este useMemo é uma transformção pura de formato, sem lógica de integridade.
  const agendamentos = useMemo(() => agendamentosDB.map(toDrawerFormat), [agendamentosDB]);

  // Estados do Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'view'>('create');
  const [selectedDrawerDate, setSelectedDrawerDate] = useState<string | undefined>();
  const [selectedAgendamentoId, setSelectedAgendamentoId] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<{ start: string, end: string } | null>(null);

  const toggleHighlightPeriod = (period: { start: string, end: string } | null) => {
    if (!period) {
      setSelectedPeriod(null);
      return;
    }
    if (selectedPeriod?.start === period.start && selectedPeriod?.end === period.end) {
      setSelectedPeriod(null);
    } else {
      setSelectedPeriod(period);
      const startDate = new Date(period.start + 'T12:00:00');
      onMonthChange(startDate.getMonth());
      onYearChange(startDate.getFullYear());
    }
  };

  const salvarAgendamento = async (novo: Omit<DrawerAgendamentoType, 'id'>) => {
    if (!isAuthenticated) {
      showErrorToast('Você precisa estar logado para agendar');
      return;
    }

    const { error } = await criar({
      data_inicial: novo.dataInicio,
      data_final: novo.dataFim,
      tipo_agendamento: novo.tipo,
      observacao: novo.observacao || null,
    });

    if (error) {
      showErrorToast(error);
    } else {
      showSuccessToast('Agendamento criado com sucesso!');
    }
  };

  const excluirAgendamento = async (id: string) => {
    const { error } = await excluir(id);
    if (error) {
      showErrorToast('Erro ao excluir agendamento');
    } else {
      showSuccessToast('Agendamento excluído!');
    }
  };

  const editarAgendamento = async (editado: DrawerAgendamentoType) => {
    // Calcular dias
    const start = new Date(editado.dataInicio);
    const end = new Date(editado.dataFim);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const dias = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const { error } = await atualizar(editado.id, {
      data_inicial: editado.dataInicio,
      data_final: editado.dataFim,
      tipo_agendamento: editado.tipo,
      dias,
      observacao: editado.observacao || null,
    });

    if (error) {
      showErrorToast('Erro ao editar agendamento');
    } else {
      showSuccessToast('Agendamento atualizado!');
    }
  };

  const handleEditRequest = (ag: DrawerAgendamentoType) => {
    window.dispatchEvent(
      new CustomEvent('open-global-agendamento-modal', {
        detail: { mode: 'edit', agendamento: ag }
      })
    );
  };

  const handleOpenCreateDrawer = () => {
    if (!isAuthenticated) {
      showErrorToast('Você precisa estar logado para agendar');
      return;
    }
    setDrawerMode('create');
    setSelectedDrawerDate(undefined);
    setIsDrawerOpen(true);
  };

  const handleOpenViewDrawer = (date: string, agendamentoId?: string) => {
    setDrawerMode('view');
    setSelectedDrawerDate(date);
    setSelectedAgendamentoId(agendamentoId || null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedPeriod(null);
    setSelectedAgendamentoId(null);
  };

  useEffect(() => {
    if (selectedAgendamentoId) {
      const ag = agendamentos.find(a => a.id === selectedAgendamentoId);
      if (ag) {
        setSelectedPeriod({ start: ag.dataInicio, end: ag.dataFim });
      }
    }
  }, [selectedAgendamentoId, agendamentos]);

  const baseDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear() - 2, 0, 1);
  }, []);

  const monthsArray = useMemo(() => {
    return Array.from({ length: 120 }).map((_, i) =>
      addMonths(baseDate, i)
    );
  }, [baseDate]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const monthsToRender = useMemo(() => {
    if (isMobile) {
      return [
        subMonths(new Date(year, month, 1), 1),
        new Date(year, month, 1),
        addMonths(new Date(year, month, 1), 1)
      ];
    }
    return monthsArray;
  }, [isMobile, monthsArray, month, year]);

  const { todayColors } = useCalendarData({
    month: today.getMonth(),
    year: today.getFullYear(),
    today,
    mode
  });

  const holidayMessages = useHolidayMessages(month, year, calendarEvents);
  const moonPhases = useMoonPhases(month, year);

  const hasAgendamentos = useMemo(() => {
    return agendamentos.some(ag => {
      const inicio = new Date(ag.dataInicio + 'T12:00:00');
      const fim = new Date(ag.dataFim + 'T12:00:00');
      const dateStart = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
      const dateEnd = new Date(fim.getFullYear(), fim.getMonth(), 1);
      const current = new Date(year, month, 1);
      return current >= dateStart && current <= dateEnd;
    });
  }, [agendamentos, month, year]);

  useEffect(() => {
    setHighlightedDay(null);
  }, [month, year]);

  // Notificações de hoje (Sino)
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const todayAppointmentsCount = useMemo(() => {
    return agendamentos.filter(ag => ag.dataInicio === todayStr).length;
  }, [agendamentos, todayStr]);

  const handleOpenTodayAppointmentsBell = () => {
    handleOpenViewDrawer(todayStr);
  };

  useEffect(() => {
    if (!api) return;

    if (isMobile) {
      if (api.selectedScrollSnap() !== 1) {
        api.scrollTo(1, true);
      }
      return;
    }

    const targetIndex = monthsArray.findIndex(
      (d) => d.getMonth() === month && d.getFullYear() === year
    );

    if (targetIndex !== -1) {
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const desiredIndex = isDesktop ? Math.max(0, targetIndex - 1) : targetIndex;
      const currentIndex = api.selectedScrollSnap();
      if (desiredIndex !== currentIndex) {
        api.scrollTo(desiredIndex);
      }
    }
  }, [api, month, year, monthsArray, isMobile]);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const index = api.selectedScrollSnap();
      setCurrentSlide(index);

      const scrollArray = isMobile ? monthsToRender : monthsArray;
      const isDesktop = !isMobile;
      const effectiveIndex = isDesktop ? Math.min(scrollArray.length - 1, index + 1) : index;
      const selectedDate = scrollArray[effectiveIndex];

      if (!selectedDate) return;

      const newMonth = selectedDate.getMonth();
      const newYear = selectedDate.getFullYear();

      if (newMonth !== month || newYear !== year) {
        onMonthChange(newMonth);
        onYearChange(newYear);
      }
    };

    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api, monthsArray, monthsToRender, month, year, isMobile]);

  const yearOptions = useMemo(() => {
    const currentYearRef = new Date().getFullYear();
    const years = [];
    for (let i = currentYearRef - 2; i <= currentYearRef + 3; i++) {
      years.push(i);
    }
    return years;
  }, []);

  const handlePrevMonth = () => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      const prevDate = subMonths(new Date(year, month, 1), 1);
      onMonthChange(prevDate.getMonth());
      onYearChange(prevDate.getFullYear());
    } else {
      api?.scrollPrev();
    }
  };

  const handleNextMonth = () => {
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      const nextDate = addMonths(new Date(year, month, 1), 1);
      onMonthChange(nextDate.getMonth());
      onYearChange(nextDate.getFullYear());
    } else {
      api?.scrollNext();
    }
  };

  const handleGoToToday = () => {
    goToToday();
  };

  const handleDayClick = (day: number) => {
    setHighlightedDay(day);
  };

  useEffect(() => {
    const handleOpenDrawer = () => handleOpenCreateDrawer();
    const handleGlobalCreated = () => refetch();

    window.addEventListener('open-agendamento-drawer', handleOpenDrawer);
    window.addEventListener('agendamento-criado', handleGlobalCreated);

    return () => {
      window.removeEventListener('open-agendamento-drawer', handleOpenDrawer);
      window.removeEventListener('agendamento-criado', handleGlobalCreated);
    };
  }, [isAuthenticated, refetch]);

  // ---> INÍCIO: SETUP SUPABASE REALTIME <---
  useEffect(() => {
    const channel = supabase.channel("calendar-realtime");

    async function atualizarEventosDoDia(payload: any) {
      if (payload.eventType === "DELETE") {
        setEvents((prev: any) => prev.filter((e: any) => e.id !== payload.old.id));
        return;
      }

      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        const { data, error } = await supabase
          .from("calendar_events")
          .select("*")
          .eq("id", payload.new.id)
          .single();

        if (error || !data) {
          console.error("Erro ao buscar evento completo pro realtime:", error);
          return;
        }

        const newEvent = { ...data, is_system: false };

        if (payload.eventType === "INSERT") {
          setEvents((prev: any) => {
            if (prev.some((e: any) => e.id === newEvent.id)) return prev;
            return [...prev, newEvent];
          });
        }
        if (payload.eventType === "UPDATE") {
          setEvents((prev: any) => prev.map((e: any) => (e.id === newEvent.id ? newEvent : e)));
        }
      }
    }

    async function atualizarCardAgendamentos(payload: any) {
      if (payload.eventType === "DELETE") {
        setAgendamentos((prev: any) => prev.filter((a: any) => a.id !== payload.old.id));
        return;
      }

      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        const { data, error } = await supabase
          .from("agendamentos")
          .select(`
            *,
            profiles:user_id (
              id, nome, apelido, email, foto_url, cargo, matricula, perfil
            )
          `)
          .eq("id", payload.new.id)
          .single();

        if (error || !data) {
          console.error("Erro ao buscar agendamento completo pro realtime:", error);
          return;
        }

        if (payload.eventType === "INSERT") {
          // dedupeById garante que o Realtime não crie duplicatas em relação ao insert otimista
          setAgendamentos((prev: any) =>
            dedupeById([...prev, data]).sort(
              (a: any, b: any) => new Date(a.data_inicial).getTime() - new Date(b.data_inicial).getTime()
            )
          );
        }
        if (payload.eventType === "UPDATE") {
          // dedupeById garante que o mapa de updates não introduza duplicatas
          setAgendamentos((prev: any) =>
            dedupeById(prev.map((a: any) => (a.id === data.id ? data : a)))
          );
        }
      }
    }

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agendamentos" },
        (payload) => {
          if (process.env.NODE_ENV === 'development') console.log("Realtime agendamentos:", payload);
          atualizarCardAgendamentos(payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calendar_events" },
        (payload) => {
          if (process.env.NODE_ENV === 'development') console.log("Realtime eventos:", payload);
          atualizarEventosDoDia(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setEvents, setAgendamentos]);
  // ---> FIM: SETUP SUPABASE REALTIME <---

  return (
    <div className="w-full antialiased [font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale] transition-all duration-500 relative">
      <section
        className={cn(
          "w-full lg:w-screen lg:relative lg:left-1/2 lg:right-1/2 lg:-ml-[50vw] lg:-mr-[50vw]",
          "pt-0 lg:pt-[84px] pb-0 lg:pb-[9px] mb-0.5 lg:mb-0 lg:max-w-full",
          "bg-transparent lg:bg-[linear-gradient(180deg,#c9d8ec_0%,#dbeafe_60%,#eef4ff_100%)]",
          "lg:border-t-[3px] lg:border-[#2563eb]",
          "lg:shadow-[0_12px_28px_rgba(0,0,0,0.08)]"
        )}
      >
        <div className="w-full max-w-[1600px] mx-auto px-0 lg:px-[60px]">
          <CalendarHeader
            month={month}
            year={year}
            onMonthChange={onMonthChange}
            onYearChange={onYearChange}
            handlePrevMonth={handlePrevMonth}
            handleNextMonth={handleNextMonth}
            yearOptions={yearOptions}
            isYearPopoverOpen={isYearPopoverOpen}
            setIsYearPopoverOpen={setIsYearPopoverOpen}
            goToToday={handleGoToToday}
            formatToday={formatToday}
            todayColors={todayColors}
            scaleType={mode}
            setScaleType={setMode}
            todayAppointmentsCount={todayAppointmentsCount}
            handleOpenTodayAppointments={handleOpenTodayAppointmentsBell}
          />
        </div>
      </section>

      <div className="w-full max-w-[1600px] mx-auto px-0 md:p-4 relative md:mt-0 md:transition-transform md:duration-500 md:scale-[0.85] md:origin-top md:-mb-[7%]">

        {/* Mobile Flex Container para garantir 12px exatos de gap vertical entre os blocos (Card e Conteúdo) */}
        <div className="flex flex-col gap-3 lg:block w-full">
          <div className="w-full relative overflow-visible pt-0 pb-0 md:pb-6 mt-1.5 lg:mt-0 lg:py-7">
            <Carousel
              setApi={setApi}
              opts={{
                align: typeof window !== 'undefined' && window.innerWidth < 1024 ? "center" : "start",
                containScroll: "trimSnaps",
                dragFree: false,
                slidesToScroll: 1,
                duration: 22
              }}
              className="w-full relative px-0"
            >
              <CarouselContent className="w-full flex items-stretch gap-8 cursor-grab active:cursor-grabbing">
                {monthsToRender.map((date, idx) => {
                  const m = date.getMonth();
                  const y = date.getFullYear();
                  const isCurrent = m === month && y === year;

                  const centerIndex = isMobile ? 1 : currentSlide + 1;
                  const position = idx === centerIndex ? 'center' : idx === centerIndex - 1 ? 'left' : idx === centerIndex + 1 ? 'right' : 'far';

                  return (
                    <CarouselItem
                      key={`${y}-${m}`}
                      className={cn(
                        "w-full basis-full shrink-0 grow-0 lg:basis-[calc((100%-4rem)/3)] relative",
                        "transition-opacity duration-450 ease-out",
                        position === 'center' ? "opacity-100 z-20" : "opacity-100 z-[5]"
                      )}
                      style={{
                        opacity: 1,
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                      }}
                    >
                      <CalendarCard
                        month={m}
                        year={y}
                        today={today}
                        onDayClick={isCurrent ? handleDayClick : () => { }}
                        goToToday={goToToday}
                        formatToday={formatToday}
                        isCenter={position === 'center'}
                        position={position}
                        mode={mode}
                        agendamentos={agendamentos}
                        onViewAgendamento={handleOpenViewDrawer}
                        onOpenCreateDrawer={handleOpenCreateDrawer}
                        selectedPeriod={selectedPeriod}
                        calendarEvents={calendarEvents}
                      />
                    </CarouselItem>
                  );
                })}
              </CarouselContent>

              <CarouselPrevious
                onClick={() => api?.scrollPrev()}
                className="hidden lg:flex -left-16 h-12 w-12 border-none bg-white shadow-lg hover:bg-red-500 hover:text-white transition-colors"
              />
              <CarouselNext
                onClick={() => api?.scrollNext()}
                className="hidden lg:flex -right-16 h-12 w-12 border-none bg-white shadow-lg hover:bg-red-500 hover:text-white transition-colors"
              />
            </Carousel>

            {/* Drawer de Visualização (Desktop: Sobre o primeiro card | Mobile: Abaixo do Carrossel) */}
            <div className={cn(
              "z-[100] transition-all duration-300",
              "lg:absolute lg:top-2 lg:left-0 lg:w-[calc((100%-4rem)/3)] lg:h-[calc(100%-92px)]",
              "w-full h-auto mt-4 px-0",
              (drawerMode === 'view' && isDrawerOpen) ? "opacity-100 pointer-events-auto block" : "opacity-0 pointer-events-none hidden"
            )}>
              <DrawerAgendamento
                isOpen={isDrawerOpen && drawerMode === 'view'}
                onClose={handleCloseDrawer}
                mode="view"
                variant="drawer"
                initialDate={selectedDrawerDate}
                agendamentosNoDia={agendamentos.filter(a => a.dataInicio <= (selectedDrawerDate || '') && a.dataFim >= (selectedDrawerDate || ''))}
                todosAgendamentos={agendamentos}
                onSave={salvarAgendamento}
                onDelete={excluirAgendamento}
                onUpdate={editarAgendamento}
                anchorRef={null as any}
                selectedPeriod={selectedPeriod}
                onSelectPeriod={toggleHighlightPeriod}
                selectedAgendamentoId={selectedAgendamentoId}
                setSelectedAgendamentoId={setSelectedAgendamentoId}
                onEditRequest={handleEditRequest}
              />
            </div>

            {/* Modal de Criação (Centralizado) */}
            <DrawerAgendamento
              isOpen={isDrawerOpen && drawerMode === 'create'}
              onClose={handleCloseDrawer}
              mode="create"
              variant="modal"
              initialDate={selectedDrawerDate}
              agendamentosNoDia={agendamentos.filter(a => a.dataInicio <= (selectedDrawerDate || '') && a.dataFim >= (selectedDrawerDate || ''))}
              todosAgendamentos={agendamentos}
              onSave={salvarAgendamento}
              onDelete={excluirAgendamento}
              onUpdate={editarAgendamento}
              anchorRef={null as any}
              selectedPeriod={selectedPeriod}
              onSelectPeriod={toggleHighlightPeriod}
              selectedAgendamentoId={selectedAgendamentoId}
              setSelectedAgendamentoId={setSelectedAgendamentoId}
            />

            {/* Indicadores de bolinhas */}
            <div className="hidden lg:flex justify-center gap-3 mt-6 lg:mt-6 mb-4">
              {[-1, 0, 1].map((offset) => {
                const date = addMonths(new Date(year, month, 1), offset);
                return (
                  <button
                    key={offset}
                    onClick={() => {
                      onMonthChange(date.getMonth());
                      onYearChange(date.getFullYear());
                    }}
                    className={cn(
                      "h-2.5 rounded-full transition-all duration-300",
                      offset === 0
                        ? "w-12 bg-[#C62828] shadow-[0_4px_12px_rgba(198,40,40,0.3)]"
                        : "w-2.5 bg-gray-300 hover:bg-gray-400"
                    )}
                  />
                );
              })}
            </div>
          </div>

          <div className="max-w-[1600px] mx-auto w-full mt-0 lg:mt-[-20px] flex flex-col gap-3 lg:gap-0 lg:pb-16">
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-8 items-stretch">
              {/* 1º - Agendamentos */}
              <div className={cn(
                "w-full lg:flex-1 lg:min-w-[370px] order-1 lg:order-1 flex flex-col gap-3",
                !hasAgendamentos && "hidden md:flex"
              )}>
                <AgendamentosDisplay
                  agendamentos={agendamentos}
                  month={month}
                  year={year}
                  highlightedDay={highlightedDay}
                  onViewAgendamento={handleOpenViewDrawer}
                />
              </div>

              {/* 2º e 3º - Feriados e Fases da Lua */}
              <div className="contents lg:flex lg:w-full lg:flex-1 lg:min-w-[370px] lg:flex-col lg:order-2 lg:gap-8 gap-3">
                <div className={`w-full flex-1 order-2 lg:order-none ${holidayMessages.length === 0 ? 'hidden md:block' : ''}`}>
                  <HolidayMessages messages={holidayMessages} highlightedDay={highlightedDay} month={month} year={year} />
                </div>
                <div className="w-full order-4 lg:order-none">
                  <MoonPhasesDisplay moonPhases={moonPhases} month={month} year={year} />
                </div>
              </div>

              {/* 4º - Aniversariantes */}
              <div className="w-full lg:flex-1 lg:min-w-[370px] order-3 lg:order-3">
                <BirthdayMessages month={month} year={year} highlightedDay={highlightedDay} calendarEvents={calendarEvents} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <DrawerAgendamento
        isOpen={isDrawerOpen && drawerMode === 'create'}
        onClose={handleCloseDrawer}
        mode="create"
        variant="modal"
        initialDate={selectedDrawerDate}
        agendamentosNoDia={agendamentos.filter(a => a.dataInicio <= (selectedDrawerDate || '') && a.dataFim >= (selectedDrawerDate || ''))}
        todosAgendamentos={agendamentos}
        onSave={salvarAgendamento}
        onDelete={excluirAgendamento}
        onUpdate={editarAgendamento}
        anchorRef={null as any}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={toggleHighlightPeriod}
        selectedAgendamentoId={selectedAgendamentoId}
        setSelectedAgendamentoId={setSelectedAgendamentoId}
      />
    </div>
  );
};

export default Calendar;
