"use client";

import React, { useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
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
import { MONTHS } from "@/utils/calendar-utils";
import { cn } from "@/lib/utils";
import { useCalendarEventsContext } from "@/context/CalendarEventsContext";
import { getEventsForDate } from "@/hooks/use-calendar-events";

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
  scaleType: '24x48' | '12x36' | 'adm';
  setScaleType: (scale: '24x48' | '12x36' | 'adm') => void;
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
  scaleType,
  setScaleType,
}) => {
  const commandListRef = useRef<HTMLDivElement>(null);

  const { events: calendarEvents } = useCalendarEventsContext();

  // Gerar lista de feriados para o select (a partir do banco)
  const holidaysList = useMemo(() => {
    const list: { date: string; name: string; emoji: string | null }[] = [];
    const daysInYear = 366;
    for (let d = 0; d < daysInYear; d++) {
      const date = new Date(year, 0, d + 1);
      if (date.getFullYear() !== year) break;
      const dayEvents = getEventsForDate(calendarEvents, date);
      dayEvents
        .filter(e => e.type === 'holiday')
        .forEach(e => {
          const dateStr = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          list.push({ date: dateStr, name: e.title, emoji: e.emoji });
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

        <div className={cn(
          "hidden lg:flex flex-col items-center justify-center w-full bg-transparent border-none shadow-none p-0"
        )}>
          <div className="w-full grid items-center" style={{ gridTemplateColumns: 'auto 1fr auto', gridTemplateRows: '1fr 1fr', gap: '4px 12px' }}>
            <div className="border-r border-gray-200 lg:border-[#2563eb] pr-3 mr-1 flex items-center justify-center h-full" style={{ gridRow: '1 / span 2' }}>
              <span className="text-[44px] lg:text-[42px] font-[800] leading-[1] text-[#1f2937] px-1">{String(new Date().getDate()).padStart(2, '0')}</span>
            </div>

            <div className="self-end" style={{ gridColumn: '2', gridRow: '1' }}>
              <span className="text-[14px] font-[700] tracking-[1px] uppercase text-[#64748b] lg:text-[#1e40af]">
                {MONTHS[new Date().getMonth()].substring(0, 3)}
              </span>
            </div>

            <div className="self-start" style={{ gridColumn: '2', gridRow: '2' }}>
              <span className="text-[14px] lg:text-[13px] font-[600] text-[#94a3b8] lg:text-[#374151]">
                {new Date().getFullYear()}
              </span>
            </div>

            <div style={{ gridColumn: '3', gridRow: '1 / span 2' }} className="flex justify-end items-center self-center">
              <Button
                onClick={goToToday}
                variant="ghost"
                className={cn(
                  "py-[6px] px-[16px] h-auto text-[13px] font-[700] uppercase tracking-[0.5px]",
                  "transition-all duration-300 cursor-pointer",
                  "rounded-[8px] outline-none border-none",
                  "bg-clip-padding saturate-[1.05] border border-black/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] lg:shadow-[0_4px_10px_rgba(0,0,0,0.15)]",
                  todayColors.bg === 'bg-calendar-blue' && "bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white",
                  todayColors.bg === 'bg-calendar-green' && "bg-gradient-to-br from-[#2ecc71] to-[#27ae60] text-white",
                  todayColors.bg === 'bg-calendar-yellow' && "bg-gradient-to-br from-[#fde047] to-[#f59e0b] text-[#1A1A1A]",
                  "lg:bg-[#facc15] lg:text-[#111827] lg:hover:brightness-110",
                  scaleType === 'adm' && "bg-gradient-to-b from-[#fef08a] to-[#facc15] hover:from-[#fef08a] hover:to-[#facc15] text-[#0B1221] hover:!text-[#0B1221] shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:-translate-y-[1px] !border !border-[#facc15]/30 lg:shadow-[0_4px_12px_rgba(0,0_0,0.15)] lg:hover:-translate-y-[1px]"
                )}
              >
                HOJE
              </Button>
            </div>
          </div>
        </div>

        {/* Card 2 - Navegação */}
        <div className={cn(
          "flex items-center justify-center gap-2 bg-transparent border-none shadow-none p-0"
        )}>
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="h-9 w-10 lg:h-11 lg:w-11 transition-all duration-300 
                       bg-white border-gray-200 shadow-sm border rounded-[12px] lg:rounded-md
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
                         bg-white border-gray-200 lg:border-[#e5e7eb] shadow-sm lg:shadow-[0_3px_6px_rgba(0,0,0,0.06)] border text-[#334155] rounded-[12px] lg:rounded-[10px]
                         focus:ring-0 focus:ring-offset-0 focus:border-gray-200 lg:focus:border-[#e5e7eb]
                         focus-visible:border-red-600 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 
                         hover:!bg-red-500 hover:!text-white active:!bg-red-600 active:!text-white
                         data-[state=open]:!ring-2 data-[state=open]:!ring-red-600 data-[state=open]:!border-red-600"
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
                           bg-white border-gray-200 lg:border-[#e5e7eb] shadow-sm lg:shadow-[0_3px_6px_rgba(0,0,0,0.06)] border text-[#334155] rounded-[12px] lg:rounded-[10px]
                           focus-visible:border-red-600 
                           focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 
                           hover:!bg-red-500 hover:!text-white active:!bg-red-600 active:!text-white
                           data-[state=open]:!ring-2 data-[state=open]:!ring-red-600 data-[state=open]:!border-red-600 shrink-0"
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
                       bg-white border-gray-200 shadow-sm border rounded-[12px] lg:rounded-md
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
          <div className="flex justify-between items-center w-full gap-4">
            <Select
              key={`holiday-select-${month}-${year}`}
              onValueChange={(dateStr) => {
                const [y, m, d] = dateStr.split('-').map(Number);
                onMonthChange(m - 1);
                onYearChange(y);
              }}
            >
              <SelectTrigger
                className="w-full flex-1 h-11 justify-between font-bold text-[14px] lg:text-[14px] uppercase tracking-[0.5px] transition-all
                           bg-white border-gray-200 lg:border-[#e5e7eb] shadow-sm lg:shadow-[0_3px_6px_rgba(0,0,0,0.06)] border text-[#334155] lg:rounded-[10px]
                           focus-visible:border-red-600 focus-visible:ring-2 
                           focus-visible:ring-red-600 focus-visible:ring-offset-2 
                           hover:!bg-red-500 hover:!text-white active:!bg-red-600 active:!text-white"
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

            <Select
              value={scaleType}
              onValueChange={(val) => setScaleType(val as '24x48' | '12x36' | 'adm')}
            >
              <SelectTrigger
                className="w-full flex-1 h-11 justify-between font-bold text-[14px] lg:text-[14px] uppercase tracking-[0.4px] transition-all
                           bg-white border-gray-200 lg:border-[#e5e7eb] shadow-sm lg:shadow-[0_3px_6px_rgba(0,0,0,0.06)] border text-[#334155] lg:rounded-[10px]
                           focus-visible:border-red-600 focus-visible:ring-2 
                           focus-visible:ring-red-600 focus-visible:ring-offset-2 
                           hover:!bg-red-500 hover:!text-white active:!bg-red-600 active:!text-white"
              >
                <SelectValue placeholder={window.innerWidth >= 1024 ? "🔔 ESCALA" : "ESCALA"} />
              </SelectTrigger>
              <SelectContent className="backdrop-blur-xl bg-popover/95 border border-white/20 z-50">
                <SelectItem value="24x48" className="font-sans focus:!bg-red-500 hover:!bg-red-500 focus:!text-white">Escala 24x48</SelectItem>
                <SelectItem value="12x36" className="font-sans focus:!bg-red-500 hover:!bg-red-500 focus:!text-white">Escala 12x36</SelectItem>
                <SelectItem value="adm" className="font-sans focus:!bg-red-500 hover:!bg-red-500 focus:!text-white">Escala Adm</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Layout Mobile para os Filtros (Mantido oculto no desktop) */}
        <div className="flex flex-col gap-2 w-full lg:hidden">
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;