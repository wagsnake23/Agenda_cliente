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
import DrawerAgendamento, { Agendamento } from './calendar/DrawerAgendamento';
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

interface CalendarProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  goToToday: () => void;
  formatToday: () => string;
}

const Calendar = ({ month, year, onMonthChange, onYearChange, goToToday, formatToday }: CalendarProps) => {
  const today = new Date();
  const [isYearPopoverOpen, setIsYearPopoverOpen] = useState(false);
  const [highlightedDay, setHighlightedDay] = useState<number | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const { mode, setMode } = useCalendarMode();

  // Estados de Agendamento
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
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

      // Navegar para o mês inicial do período
      const startDate = new Date(period.start + 'T12:00:00');
      const startMonth = startDate.getMonth();
      const startYear = startDate.getFullYear();

      onMonthChange(startMonth);
      onYearChange(startYear);
    }
  };

  // Carregar do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('agendamentos');
    if (saved) {
      try {
        setAgendamentos(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar agendamentos:", e);
      }
    }
  }, []);

  const salvarAgendamento = (novo: Omit<Agendamento, 'id'>) => {
    const agendamento: Agendamento = {
      ...novo,
      id: Date.now().toString(),
    };
    const atualizados = [...agendamentos, agendamento];
    setAgendamentos(atualizados);
    localStorage.setItem('agendamentos', JSON.stringify(atualizados));
  };

  const excluirAgendamento = (id: string) => {
    const atualizados = agendamentos.filter(a => a.id !== id);
    setAgendamentos(atualizados);
    localStorage.setItem('agendamentos', JSON.stringify(atualizados));
  };

  const editarAgendamento = (editado: Agendamento) => {
    const atualizados = agendamentos.map(a => a.id === editado.id ? editado : a);
    setAgendamentos(atualizados);
    localStorage.setItem('agendamentos', JSON.stringify(atualizados));
  };

  const handleOpenCreateDrawer = () => {
    setDrawerMode('create');
    setSelectedDrawerDate(new Date().toISOString().split('T')[0]);
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

  // Sincroniza o destaque do calendário com o agendamento selecionado
  useEffect(() => {
    if (selectedAgendamentoId) {
      const ag = agendamentos.find(a => a.id === selectedAgendamentoId);
      if (ag) {
        setSelectedPeriod({ start: ag.dataInicio, end: ag.dataFim });
      }
    }
  }, [selectedAgendamentoId, agendamentos]);

  // Array otimizado para cobrir a faixa de anos do seletor (6 anos = 72 meses)
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

  const holidayMessages = useHolidayMessages(month, year);
  const moonPhases = useMoonPhases(month, year);

  useEffect(() => {
    setHighlightedDay(null);
  }, [month, year]);

  // Sincronizar carrossel quando o estado mudar (via Header)
  // Sincronizar carrossel quando o estado mudar (via Header)
  useEffect(() => {
    if (!api) return;

    if (isMobile) {
      // No mobile, o mês atual é sempre o índice 1 (central) do monthsToRender
      if (api.selectedScrollSnap() !== 1) {
        api.scrollTo(1, true); // true para pular animação se necessário
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

  // Atualizar estado quando o carrossel mudar (via drag/setas)
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const index = api.selectedScrollSnap();
      setCurrentSlide(index); // Rastrear slide atual

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
    return () => {
      api.off("select", onSelect);
    };
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
    window.addEventListener('open-agendamento-drawer', handleOpenDrawer);
    return () => window.removeEventListener('open-agendamento-drawer', handleOpenDrawer);
  }, []);

  return (
    <div className="w-full antialiased [font-smoothing:antialiased] [-moz-osx-font-smoothing:grayscale] transition-all duration-500 relative">
      <div className="w-full max-w-[1600px] mx-auto px-0 md:p-4 relative">
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
        />

        <div className="w-full relative overflow-visible pt-0 pb-0 md:pb-6 mt-0 lg:mt-0 lg:py-7">
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
            <CarouselContent className="w-full flex items-stretch cursor-grab active:cursor-grabbing">
              {monthsToRender.map((date, idx) => {
                const m = date.getMonth();
                const y = date.getFullYear();
                const isCurrent = m === month && y === year;

                // Detectar posição do card em relação ao centro visível
                const centerIndex = isMobile ? 1 : currentSlide + 1;
                const position = idx === centerIndex ? 'center' : idx === centerIndex - 1 ? 'left' : idx === centerIndex + 1 ? 'right' : 'far';

                return (
                  <CarouselItem
                    key={`${y}-${m}`}
                    className={cn(
                      "w-full basis-full shrink-0 grow-0 lg:basis-1/3 lg:pl-8 relative",
                      // Transições de opacidade mantidas, mas sem transforms que causem blur
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
                      selectedPeriod={selectedPeriod}
                    />
                  </CarouselItem>
                );
              })}
            </CarouselContent>

            {/* Drawer Independente - Fixo sobre a posição do primeiro card (Desktop) */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-[60] py-0 lg:py-0 px-0">
              <div className="relative w-full h-full max-w-[1600px] mx-auto">
                <div className={cn(
                  "hidden md:block absolute pointer-events-auto transition-all duration-500 ease-in-out",
                  "w-full h-full md:h-full lg:h-full",
                  "lg:w-[calc(100%/3-32px)] lg:left-[32px] lg:top-0", // Max height and top alignment
                  isDrawerOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                )}>
                  <DrawerAgendamento
                    isOpen={isDrawerOpen}
                    onClose={handleCloseDrawer}
                    mode={drawerMode}
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
              </div>
            </div>

            <CarouselPrevious
              onClick={() => api?.scrollPrev()}
              className="hidden lg:flex -left-16 h-12 w-12 border-none bg-white shadow-lg hover:bg-red-500 hover:text-white transition-colors"
            />
            <CarouselNext
              onClick={() => api?.scrollNext()}
              className="hidden lg:flex -right-16 h-12 w-12 border-none bg-white shadow-lg hover:bg-red-500 hover:text-white transition-colors"
            />
          </Carousel>

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

        <div className="max-w-[1600px] mx-auto w-full mt-4 lg:mt-[-20px] flex flex-col gap-4 lg:pb-16 lg:pl-8">
          <div className="flex flex-col lg:flex-row gap-2 md:gap-4 lg:gap-8 items-stretch">
            {/* 1º - Agendamentos */}
            <div className="w-full lg:flex-1 lg:min-w-[370px] order-1 lg:order-1 flex flex-col gap-4">
              <AgendamentosDisplay
                agendamentos={agendamentos}
                month={month}
                year={year}
                highlightedDay={highlightedDay}
                onViewAgendamento={handleOpenViewDrawer}
              />

              {/* Lista Mobile Inline (abaixo do card amarelo) */}
              <div className="md:hidden w-full">
                <DrawerAgendamento
                  isOpen={isDrawerOpen}
                  onClose={handleCloseDrawer}
                  mode={drawerMode}
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
            </div>

            {/* 2º e 3º - Feriados e Eventos + Fases da Lua */}
            <div className="w-full lg:flex-1 lg:min-w-[370px] order-2 lg:order-2 flex flex-col gap-2 md:gap-4 lg:gap-8">
              <div className={`w-full flex-1 ${holidayMessages.length === 0 ? 'hidden md:block' : ''}`}>
                <HolidayMessages messages={holidayMessages} highlightedDay={highlightedDay} month={month} />
              </div>
              <div className="w-full">
                <MoonPhasesDisplay moonPhases={moonPhases} month={month} />
              </div>
            </div>

            {/* 4º - Aniversariantes (SEM QUALQUER ALTERAÇÃO NA ESTRUTURA) */}
            <div className="w-full lg:flex-1 lg:min-w-[370px] order-3 lg:order-3">
              <BirthdayMessages month={month} year={year} highlightedDay={highlightedDay} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
