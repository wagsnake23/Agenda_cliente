"use client";

import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { holidayEmojis } from "@/utils/calendar-utils";
import BrasilFlagIcon from "@/components/BrasilFlagIcon";
import { cn } from "@/lib/utils";
import { useCalendarMode } from "@/hooks/use-calendar-mode";

interface CalendarDayProps {
  dayData: {
    day: number;
    isToday: boolean;
    colors: { bg: string; text: string };
    isHoliday: boolean;
    holidayName?: string;
    isBirthday?: boolean;
    birthdayName?: string;
    specialEmojiName?: string;
    specialEmojiIcon?: string;
    isWeekend: boolean;
  } | null;
  onDayClick: (day: number) => void;
  agendamentos?: any[];
  onViewAgendamento?: (date: string) => void;
  month?: number;
  year?: number;
  selectedPeriod?: { start: string, end: string } | null;
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  dayData,
  onDayClick,
  agendamentos = [],
  onViewAgendamento,
  month,
  year,
  selectedPeriod,
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { mode } = useCalendarMode();

  if (!dayData || month === undefined || year === undefined) {
    return <div className="w-full h-full rounded-[13px]" />;
  }

  // Formatar data do dia atual para comparação
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayData.day).padStart(2, '0')}`;

  // Verificar se há agendamentos começando hoje
  const temAgendamentoHoje = agendamentos.some(a => a.dataInicio === dateStr);

  // Verificar se o dia está no período selecionado para destaque
  const isSelected = !!(selectedPeriod && dateStr >= selectedPeriod.start && dateStr <= selectedPeriod.end);

  const isSpecialDay =
    dayData.isHoliday || dayData.isBirthday || dayData.specialEmojiIcon || temAgendamentoHoje || isSelected;

  const handleClick = (e: React.MouseEvent) => {
    // Se estiver selecionado, permite clicar para ver detalhes se houver agendamento, 
    // ou apenas segue o fluxo normal
    if (temAgendamentoHoje && onViewAgendamento) {
      e.stopPropagation();
      onViewAgendamento(dateStr);
      return;
    }

    if (!isSpecialDay) return;

    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);

    onDayClick(dayData.day);
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 1024 && isSpecialDay && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2,
      });
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => setIsHovered(false);

  const birthdayEmoji = dayData.isBirthday ? "🎂" : null;
  const renderBrasilFlagComponent =
    dayData.isHoliday && dayData.holidayName === "Independência do Brasil";
  const otherEmoji = dayData.isHoliday
    ? holidayEmojis[dayData.holidayName!]
    : dayData.specialEmojiIcon;

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={cn(
        // Estrutura fixa
        "relative w-full h-full flex items-center justify-center",
        "rounded-[13px]",
        "text-sm md:text-base font-semibold",
        "bg-clip-padding saturate-[1.05]",

        // Transições SEGURAS (sem border-radius)
        "transition-[background-color,color,box-shadow,transform,filter,opacity] duration-200 ease-out",

        // Estabilidade GPU
        "will-change-[background-color,box-shadow,transform]",

        // Base 3D
        "shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.1)]",

        // Higlight de período selecionado (Regras do Usuário)
        isSelected && "bg-[#FFFDDF] border border-orange-400/60 shadow-[0_0_12px_rgba(251,146,60,0.4)] z-10",

        // =========================
        // MODO ADM
        // =========================
        mode === "adm"
          ? dayData.isWeekend || dayData.isHoliday
            ? "border border-red-300/45"
            : "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12),inset_0_1.5px_1px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.1)]"
          : !isSelected && "border-none",

        // =========================
        // CORES DE FUNDO
        // =========================
        !isSelected && (
          dayData.colors.bg === "bg-calendar-blue"
            ? "bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8]"
            : dayData.colors.bg === "bg-calendar-green"
              ? "bg-gradient-to-br from-[#2ecc71] to-[#27ae60]"
              : dayData.colors.bg === "bg-calendar-yellow"
                ? "bg-gradient-to-br from-[#fde047] to-[#f59e0b]"
                : dayData.colors.bg
        ),

        // 👇 COR DO TEXTO PRESERVADA
        isSelected ? "text-black drop-shadow-none" : dayData.colors.text,

        // =========================
        // DIA DE HOJE
        // =========================
        dayData.isToday &&
        cn(
          "ring-2 ring-inset ring-[#C62828] z-10",
          mode !== "adm" &&
          "shadow-[0_8px_16px_-4px_rgba(198,40,40,0.25)]",
          "md:font-black"
        ),

        // Interações
        isClicked && "opacity-90",
        !isClicked &&
        isSpecialDay &&
        "hover:scale-[1.02] hover:brightness-[1.05] cursor-pointer"
      )}
      style={{
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
      }}
    >
      <div className="flex flex-col items-center justify-center relative">
        {temAgendamentoHoje && (
          <span
            className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] md:text-[12px] leading-none animate-in zoom-in-50 duration-300"
            title="Agendamento"
          >
            🏖️
          </span>
        )}
        <span className="tracking-[0.3px]">
          {String(dayData.day).padStart(2, "0")}
        </span>
      </div>

      {birthdayEmoji && (
        <span className="absolute bottom-0.5 left-0.5 text-xs md:text-sm leading-none text-inherit">
          {birthdayEmoji}
        </span>
      )}

      {renderBrasilFlagComponent ? (
        <span className="absolute bottom-0.5 right-0.5 leading-none text-inherit">
          <BrasilFlagIcon size={12} />
        </span>
      ) : (
        otherEmoji && (
          <span className="absolute bottom-0.5 right-0.5 text-xs md:text-sm leading-none text-inherit">
            {otherEmoji}
          </span>
        )
      )}

      {/* TOOLTIP DESKTOP */}
      {isHovered &&
        isSpecialDay &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none transition-opacity duration-200"
            style={{
              top: `${coords.top - 10}px`,
              left: `${coords.left}px`,
              transform: "translateX(-50%) translateY(-100%)",
            }}
          >
            <div className="relative bg-white text-gray-700 text-[14px] font-bold py-2.5 px-4 rounded-xl shadow-lg border border-gray-300 whitespace-nowrap">
              {dayData.isBirthday && (
                <div className="flex items-center gap-2">
                  <span>🎂</span>
                  <span>{dayData.birthdayName}</span>
                </div>
              )}

              {dayData.isHoliday && (
                <div className="flex items-center gap-2 text-red-700">
                  {dayData.holidayName === "Independência do Brasil" ? (
                    <BrasilFlagIcon size={14} />
                  ) : (
                    <span>
                      {holidayEmojis[dayData.holidayName!] || ""}
                    </span>
                  )}
                  <span>{dayData.holidayName}</span>
                </div>
              )}

              {dayData.specialEmojiIcon && !dayData.isHoliday && (
                <div className="flex items-center gap-2">
                  <span>{dayData.specialEmojiIcon}</span>
                  <span>{dayData.specialEmojiName}</span>
                </div>
              )}

              {/* Seta do Balão */}
              <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-gray-300 shadow-[2px_2px_2px_-1px_rgba(0,0,0,0.05)]" />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default React.memo(CalendarDay);
