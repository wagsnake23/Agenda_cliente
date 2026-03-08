"use client";

import React from 'react';

interface BrasilFlagIconProps {
  size?: number; // Tamanho em pixels
  className?: string; // Classes adicionais do Tailwind
}

const BrasilFlagIcon: React.FC<BrasilFlagIconProps> = ({ size = 16, className }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Bandeira do Brasil"
    >
      {/* Fundo verde */}
      <rect width="24" height="24" fill="#00923F"/>
      {/* Losango amarelo */}
      <path d="M12 2L2 12L12 22L22 12L12 2Z" fill="#FFCC29"/>
      {/* Círculo azul */}
      <circle cx="12" cy="12" r="5" fill="#002776"/>
    </svg>
  );
};

export default BrasilFlagIcon;