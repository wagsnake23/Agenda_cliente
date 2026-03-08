"use client";

import { useState, useEffect, useRef } from 'react';
import Calendar from '@/components/Calendar';
import { format } from 'date-fns';
import InstallPWAButton from '@/components/InstallPWAButton';
import { useCalendarMode } from '@/hooks/use-calendar-mode';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from '@/components/Header';

const Index = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const navigate = useNavigate();
  const { profile, isAuthenticated } = useAuth();
  const { setMode } = useCalendarMode();

  // Sincronizar escala do perfil ao carregar
  useEffect(() => {
    if (isAuthenticated && profile?.escala) {
      const savedEscala = profile.escala;
      // Mapear se necessário (ex: 'Adm' -> 'adm')
      if (savedEscala === 'Adm') {
        setMode('adm');
      } else if (savedEscala === '12x36' || savedEscala === '24x48') {
        setMode(savedEscala);
      }
    }
  }, [isAuthenticated, profile?.escala, setMode]);

  const handleMonthChange = (newMonth: number) => {
    setCurrentMonth(newMonth);
  };

  const handleYearChange = (newYear: number) => {
    setCurrentYear(newYear);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const formatToday = () => {
    return format(today, 'dd/MM/yyyy');
  };

  return (
    <>
      <div className="min-h-screen bg-[#EFF3F6] lg:bg-[linear-gradient(180deg,#f1f5f9_0%,#e2e8f0_100%)] flex flex-col items-stretch justify-start px-[10px] py-2 lg:p-0 gap-y-2 overflow-x-hidden">
        <Header />

        {/* Wrapper de Escala apenas para Desktop - Aplica o padding-top p/ header fixo lg:pt-0 agora, compensado no Calendar */}
        <div className="w-full flex flex-col items-stretch justify-start">

          <main className="w-full flex flex-col items-stretch">
            <Calendar
              month={currentMonth}
              year={currentYear}
              onMonthChange={handleMonthChange}
              onYearChange={handleYearChange}
              goToToday={goToToday}
              formatToday={formatToday}
            />
          </main>


          <InstallPWAButton />
        </div>

        <footer className="w-full mt-auto bg-[#0F172A] py-8 border-t border-gray-800 shadow-2xl relative z-10">
          <div className="w-full max-w-[1600px] mx-auto px-0 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
            {/* Lado Esquerdo */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="w-10 h-10 opacity-90 drop-shadow-md" />
                <h3
                  className="font-black text-base md:text-lg tracking-wider text-white uppercase whitespace-nowrap"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                  }}
                >
                  CALENDÁRIO AGENDA
                </h3>
              </div>
              <p className="text-gray-400 text-xs md:text-sm font-medium opacity-80 max-w-[300px]">
                Calendário digital de organização de escala operacional
              </p>
            </div>

            {/* Lado Direito */}
            <div className="flex flex-col items-center md:items-end gap-1.5">
              <span className="text-gray-400 text-xs font-semibold tracking-wide uppercase">
                © 2026 — CALENDÁRIO AGENDA
              </span>

              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                <span>Design by</span>
                <a
                  href="https://api.whatsapp.com/send?phone=5514991188921&text=Olá!%20Tenho%20interesse%20no%20Calendário%20Prontidão.%20Podemos%20conversar?"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                  style={{ color: '#25D366' }}
                >
                  BM Vagner
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Index;