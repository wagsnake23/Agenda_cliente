"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/contexts/ToastProvider';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const { showSuccessToast, showErrorToast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Verifica se o app já está instalado (para navegadores que suportam)
      if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
        setIsAppInstalled(true);
      } else {
        setIsAppInstalled(false);
      }
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null); // Limpa o prompt após a instalação
      showSuccessToast('Calendário Agenda instalado com sucesso!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Verifica o estado inicial de instalação
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsAppInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome !== 'accepted') {
        showErrorToast('Instalação recusada.');
      }
      setDeferredPrompt(null); // O prompt só pode ser usado uma vez
    }
  };

  if (!deferredPrompt || isAppInstalled) {
    return null; // Não mostra o botão se o prompt não estiver disponível ou o app já estiver instalado
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleInstallClick}
        className="bg-red-600 hover:bg-red-700 text-white shadow-lg flex items-center gap-2
                   transition-all duration-300 hover:scale-105 active:scale-95
                   focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
      >
        <Download className="h-4 w-4" />
        Instalar App
      </Button>
    </div>
  );
};

export default InstallPWAButton;