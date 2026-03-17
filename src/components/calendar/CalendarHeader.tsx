"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MONTHS, DAYS_OF_WEEK, getSeasonDataForDate } from "@/utils/calendar-utils";
import { cn } from "@/lib/utils";
import { useCalendarEventsContext } from "@/context/CalendarEventsContext";
import { getEventsForDate } from "@/hooks/use-calendar-events";
import { getDynamicHolidays, getNationalHolidays } from "@/lib/dynamicHolidays";

interface CalendarHeaderProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
  yearOptions: number[];
  isYearPopoverOpen: boolean;
  setIsYearPopoverOpen: (open: boolean) => void;
  goToToday: () => void;
  formatToday: () => string;
  todayColors: { bg: string; text: string };
  todayAppointmentsCount?: number;
  handleOpenTodayAppointments?: () => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  month,
  year,
  onMonthChange,
  onYearChange,
  handlePrevMonth,
  handleNextMonth,
  yearOptions,
  isYearPopoverOpen,
  setIsYearPopoverOpen,
  goToToday,
  formatToday,
  todayColors,
  todayAppointmentsCount = 0,
  handleOpenTodayAppointments,
}) => {
  const commandListRef = useRef<HTMLDivElement>(null);

  const { events: calendarEvents } = useCalendarEventsContext();

  // Gerar lista de feriados para o select (Sistema + Banco)
  const holidaysList = useMemo(() => {
    // 1. Gerar feriados do sistema específicos para o ano visualizado
    const systemEvents = [...getDynamicHolidays(year), ...getNationalHolidays(year)];

    // 2. Combinar com os eventos vindos do banco de dados (contexto)
    const allEvents = [...calendarEvents, ...systemEvents];

    const list: { date: string; name: string; emoji: string | null }[] = [];
    const daysInYear = 366;
    const seen = new Set<string>();

    for (let d = 0; d < daysInYear; d++) {
      const date = new Date(year, 0, d + 1);
      if (date.getFullYear() !== year) break;

      const dayEvents = getEventsForDate(allEvents, date);
      dayEvents
        .filter(e => e.type === 'holiday' || e.type === 'event')
        .forEach(e => {
          const dateStr = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const key = `${e.title}-${dateStr}`; // Deduplicar por nome no mesmo dia

          if (!seen.has(key)) {
            list.push({ date: dateStr, name: e.title, emoji: e.emoji });
            seen.add(key);
          }
        });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [year, calendarEvents]);

  // Gerar lista de aniversariantes para o select (a partir do banco)
  const birthdayList = useMemo(() => {
    return calendarEvents
      .filter(e => e.type === 'birthday')
      .map(e => ({
        name: e.title,
        month: Number(e.date.slice(5, 7)) - 1, // 0-indexed
        day: Number(e.date.slice(8, 10)),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [calendarEvents]);

  useEffect(() => {
    if (isYearPopoverOpen && commandListRef.current) {
      const selectedYearElement = commandListRef.current.querySelector(
        `[data-value="${year}"]`
      ) as HTMLElement;
      if (selectedYearElement) {
        selectedYearElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [isYearPopoverOpen, year]);

  return (
    <div className="w-full md:relative md:top-auto md:z-10 md:scale-[0.85] md:origin-top">
      <div className={cn(
        "flex flex-col lg:grid lg:grid-cols-3 gap-3 lg:gap-8 w-full transition-all duration-300 items-stretch"
      )}>

        {(() => {
          const today = new Date();
          const todayEvents = getEventsForDate(calendarEvents, today);
          const relevantEvent = todayEvents.find(e => e.type === 'holiday' || e.type === 'event');

          return (
            <div className={cn(
              "hidden lg:flex flex-col items-start justify-center w-full bg-transparent border-none shadow-none p-0"
            )}>
              <div className="w-full grid items-center" style={{ gridTemplateColumns: 'auto auto auto 1fr', gridTemplateRows: 'auto auto', gap: '0px 14px' }}>
                {/* Coluna 1: Dia da Semana e Numero (Sem Badge) */}
                <div className="flex flex-col items-start justify-center pt-0.5 border-r border-[#1e40af]/30 lg:border-[#1e40af]/50 pr-4 mr-1 h-full" style={{ gridRow: '1 / span 2', gridColumn: '1' }}>
                  <span className="text-[14px] lg:text-[17px] font-[800] text-[#1e293b] tracking-[1.5px] uppercase mb-[2px] select-none leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]">
                    {DAYS_OF_WEEK[today.getDay()]}
                  </span>
                  <span className="text-[32px] lg:text-[36px] font-[800] text-[#1e40af] leading-none tracking-tighter drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.2)]">
                    {String(today.getDate()).padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-end" style={{ gridColumn: '2', gridRow: '1' }}>
                  <span className="text-[14px] font-[700] tracking-[1.5px] uppercase text-[#1e40af] lg:text-[17px] leading-none mb-[1px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]">
                    {MONTHS[today.getMonth()].substring(0, 3)}
                  </span>
                </div>

                <div className="flex items-start" style={{ gridColumn: '2', gridRow: '2' }}>
                  <span className="text-[14px] lg:text-[17px] font-[800] text-[#1e293b] leading-none mt-[2px] drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]">
                    {today.getFullYear()}
                  </span>
                </div>

                {/* Sino de Notificações - Restaurado para span 2 */}
                <div style={{ gridColumn: '3', gridRow: '1 / span 2' }} className="flex items-center justify-center px-2">
                  <div
                    onClick={todayAppointmentsCount > 0 ? handleOpenTodayAppointments : undefined}
                    className={cn(
                      "relative transition-transform hidden lg:block",
                      todayAppointmentsCount > 0
                        ? "cursor-pointer hover:scale-110"
                        : "cursor-default opacity-50"
                    )}
                  >
                    <Bell
                      size={26}
                      color={todayAppointmentsCount > 0 ? "#1e40af" : "#94a3b8"}
                      strokeWidth={2.5}
                      className={cn(
                        todayAppointmentsCount > 0 && "filter drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]"
                      )}
                    />
                    {todayAppointmentsCount > 0 && (
                      <span className={cn(
                        "absolute -top-[11px] -right-[13px] text-white text-[11px] font-[800] rounded-full px-[7px] py-[2.5px]",
                        "animate-in zoom-in duration-300 flex items-center justify-center",
                        "bg-[radial-gradient(circle_at_30%_30%,#ff6b6b_0%,#ef4444_60%,#b91c1c_100%)]",
                        "shadow-[0_3px_6px_rgba(0,0,0,0.3),inset_0_1px_1.5px_rgba(255,255,255,0.5),inset_0_-1px_1.5px_rgba(0,0,0,0.3)]",
                        "border border-red-600/20"
                      )}>
                        {todayAppointmentsCount}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ gridColumn: '4', gridRow: '1 / span 2' }} className="flex justify-end items-center self-center lg:mt-[12px]">
                  <Button
                    onClick={goToToday}
                    variant="ghost"
                    className={cn(
                      "py-[8px] px-[24px] h-auto text-[13px] font-[700] uppercase tracking-[0.5px]",
                      "transition-all duration-200 cursor-pointer",
                      "rounded-[12px] outline-none border-none",
                      "bg-gradient-to-b from-[#1e40af] to-[#1e3a8a] text-white hover:brightness-110 flex items-center gap-2",
                      "shadow-[0_4px_0_#0f172a,inset_0_1px_0_rgba(255,255,255,0.2)] active:translate-y-[4px] active:shadow-none"
                    )}
                  >
                    <span>{getSeasonDataForDate(today.getMonth(), today.getDate()).emoji}</span>
                    HOJE
                  </Button>
                </div>
              </div>

              {/* Texto do Feriado/Evento - Alinhado à esquerda com o dia */}
              {relevantEvent && (
                <div className="flex items-center justify-start w-full pt-1.5">
                  <span className="text-[12px] md:text-[13px] italic text-[#64748b] font-medium leading-tight whitespace-normal text-left">
                    {relevantEvent.emoji && <span>{relevantEvent.emoji} </span>}
                    {relevantEvent.title}
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Card 2 - Navegação */}
        <div className={cn(
          "flex items-center justify-center gap-2 bg-transparent border-none shadow-none p-0 -mt-[5px] lg:mt-0"
        )}>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="h-9 w-10 lg:h-11 lg:w-11 transition-all duration-300 
                       bg-white border-gray-200 shadow-sm border rounded-[12px] lg:rounded-[12px]
                       hover:!bg-red-500 hover:!text-white active:!bg-red-600 active:!text-white
                       focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 
                       focus-visible:border-red-600 outline-none ring-0 shrink-0"
          >
            <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5" />
          </Button>

          <Select
            value={String(month)}
            onValueChange={(value) => onMonthChange(parseInt(value))}
          >
            <SelectTrigger
              className="flex-1 max-w-[200px] h-9 lg:h-11 justify-between font-bold text-sm md:text-[14px] lg:text-[15px] uppercase tracking-[0.5px] transition-all
                         bg-white border-gray-200 lg:border-[#e5e7eb] shadow-sm lg:shadow-[0_3px_6px_rgba(0,0,0,0.06)] border text-[#334155] rounded-[12px] lg:rounded-[12px]
                         focus:ring-0 focus:ring-offset-0 focus:border-gray-200 lg:focus:border-[#e5e7eb] outline-none
                         hover:!border-gray-300 lg:hover:shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="backdrop-blur-xl bg-popover/95 border border-white/20 z-50">
              {MONTHS.map((monthName, index) => (
                <SelectItem
                  key={index}
                  value={String(index)}
                  className="font-sans focus:!bg-red-500 hover:!bg-red-500 focus:!text-white 
                             data-[state=checked]:!bg-red-500 data-[state=checked]:!text-white
                             focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                >
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={isYearPopoverOpen} onOpenChange={setIsYearPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-[90px] lg:max-w-[110px] h-9 lg:h-11 justify-between font-bold text-sm md:text-[14px] lg:text-[15px] uppercase tracking-[0.5px] transition-all
                           bg-white border-gray-200 lg:border-[#e5e7eb] shadow-sm lg:shadow-[0_3px_6px_rgba(0,0,0,0.06)] border text-[#334155] rounded-[12px] lg:rounded-[12px]
                           focus:ring-0 focus:ring-offset-0 focus:border-gray-200 lg:focus:border-[#e5e7eb] outline-none
                           hover:!border-gray-300 lg:hover:shadow-[0_4px_10px_rgba(0,0,0,0.08)] shrink-0"
              >
                {year}
                <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[180px] p-0 backdrop-blur-xl bg-popover/95 border border-white/20">
              <Command>
                <CommandInput
                  placeholder="Digite o ano..."
                  className="placeholder:text-red-400 font-sans"
                  style={{ outline: "none", boxShadow: "none", borderColor: "transparent" }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onValueChange={(value) => {
                    const numericValue = value.replace(/\D/g, "");
                    if (numericValue.length === 4) {
                      const parsedYear = parseInt(numericValue);
                      if (parsedYear >= 1900 && parsedYear <= 2100) {
                        onYearChange(parsedYear);
                        setIsYearPopoverOpen(false);
                      }
                    }
                  }}
                />
                <CommandList ref={commandListRef}>
                  <CommandEmpty>Nenhum ano encontrado.</CommandEmpty>
                  <CommandGroup>
                    {yearOptions.map((yearOption) => (
                      <CommandItem
                        key={yearOption}
                        value={String(yearOption)}
                        onSelect={() => {
                          onYearChange(yearOption);
                          setIsYearPopoverOpen(false);
                        }}
                        className="font-sans focus:!bg-red-500 hover:!bg-red-500 focus:!text-white 
                                   focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
                      >
                        {yearOption}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-9 w-10 lg:h-11 lg:w-11 transition-all duration-300 
                       bg-white border-gray-200 shadow-sm border rounded-[12px] lg:rounded-[12px]
                       hover:!bg-red-500 hover:!text-white active:!bg-red-600 active:!text-white
                       focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2
                       focus-visible:border-red-600 outline-none ring-0 shrink-0"
          >
            <ChevronRight className="h-4 w-4 lg:h-5 w-5" />
          </Button>
        </div>

        {/* Card 3 - Filtros */}
        <div className={cn(
          "hidden lg:flex items-center justify-center w-full bg-transparent border-none shadow-none p-0"
        )}>
          <div className="flex justify-end items-center w-full gap-4">
            <Select
              key={`holiday-select-${month}-${year}`}
              onValueChange={(dateStr) => {
                const [y, m, d] = dateStr.split('-').map(Number);
                onMonthChange(m - 1);
                onYearChange(y);
              }}
            >
              <SelectTrigger
                className="w-[200px] h-11 justify-between font-bold text-[14px] lg:text-[14px] uppercase tracking-[0.5px] transition-all
                           bg-white border-gray-200 lg:border-[#e5e7eb] shadow-sm lg:shadow-[0_3px_6px_rgba(0,0,0,0.06)] border text-[#334155] lg:rounded-[12px]
                           focus:ring-0 focus:ring-offset-0 focus:border-[#e5e7eb] outline-none
                           hover:!border-gray-300 lg:hover:shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
              >
                <SelectValue placeholder={window.innerWidth >= 1024 ? "📅 FERIADOS" : "FERIADOS"} />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl bg-popover/95 border border-white/20 z-50 max-h-[300px]">
                {holidaysList.map((holiday, idx) => (
                  <SelectItem
                    key={`${holiday.date}-${idx}`}
                    value={holiday.date}
                    className="font-sans focus:!bg-red-500 hover:!bg-red-500 focus:!text-white"
                  >
                    <div className="flex items-center gap-2">
                      <span>{holiday.emoji || '📅'}</span>
                      <span>{holiday.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>
        </div>

        {/* Layout Mobile para os Filtros (Mantido oculto no desktop) */}
      </div>
    </div>
  );
};

export default CalendarHeader;