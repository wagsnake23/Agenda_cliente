"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Importar cn para combinar classes

interface TodayButtonProps {
  goToToday: () => void;
  formatToday: () => string;
  todayColors: { bg: string; text: string }; // Adicionar prop para as cores
}

const TodayButton: React.FC<TodayButtonProps> = ({ goToToday, formatToday, todayColors }) => {
  return (
    <div className="mt-2 text-center relative z-10">
      <Button
        onClick={goToToday}
        variant="ghost" // Adicionado para remover estilos padrão de fundo/texto
        className={cn(
          "text-xs md:text-sm font-semibold",
          "transition-all duration-300 cursor-pointer",
          "px-2 py-1 rounded-lg", // Alterado de py-0.5 para py-1
          "focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2",
          "outline-none", // Adicionado para remover qualquer contorno azul padrão do navegador
          todayColors.bg, // Usar a cor de fundo dinâmica
          todayColors.text, // Usar a cor do texto dinâmica
          "hover:bg-red-500 hover:text-white active:bg-red-600 active:text-white", // Mudar para vermelho no hover/active
          "shadow-3d-day" // Adicionado o efeito 3D aqui
        )}
      >
        <span>Hoje:</span> {formatToday()}
      </Button>
    </div>
  );
};

export default TodayButton;