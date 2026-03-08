"use client";

import { useState, useRef } from 'react';
import { SWIPE_THRESHOLD } from '@/utils/calendar-utils';

interface UseSwipeNavigationProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export const useSwipeNavigation = ({ onSwipeLeft, onSwipeRight }: UseSwipeNavigationProps) => {
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isSwiping = useRef(false); // Para diferenciar entre um toque e um arrastar

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    isSwiping.current = false; // Reseta o estado de arrastar
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
    // Se o movimento horizontal for maior que 10 pixels, consideramos que é um arrastar
    if (Math.abs(touchStartX.current - touchCurrentX.current) > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchCurrentX.current;

    // Só aciona o swipe se houve um arrastar (isSwiping) e a distância ultrapassou o limite
    if (isSwiping.current && Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        onSwipeRight(); // Swipe para a esquerda (mês seguinte)
      } else {
        onSwipeLeft(); // Swipe para a direita (mês anterior)
      }
    }
    // Reseta os valores
    touchStartX.current = 0;
    touchCurrentX.current = 0;
    isSwiping.current = false;
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};