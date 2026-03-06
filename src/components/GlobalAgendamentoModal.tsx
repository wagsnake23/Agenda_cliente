"use client";

import { useState, useEffect } from 'react';
import DrawerAgendamento from './calendar/DrawerAgendamento';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const GlobalAgendamentoModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [agendamentoEditando, setAgendamentoEditando] = useState<any>(null);
    const { criar, atualizar, refetch } = useAgendamentos();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const handleOpen = (event: Event) => {
            const customEvent = event as CustomEvent;
            if (!isAuthenticated) {
                toast.error('Você precisa estar logado para agendar');
                return;
            }
            if (customEvent.detail?.mode === 'edit' && customEvent.detail?.agendamento) {
                setMode('edit');
                setAgendamentoEditando(customEvent.detail.agendamento);
            } else {
                setMode('create');
                setAgendamentoEditando(null);
            }
            setIsOpen(true);
        };

        window.addEventListener('open-global-agendamento-modal', handleOpen);
        return () => window.removeEventListener('open-global-agendamento-modal', handleOpen);
    }, [isAuthenticated]);

    const handleSave = async (novo: any) => {
        const { error } = await criar({
            data_inicial: novo.dataInicio,
            data_final: novo.dataFim,
            tipo_agendamento: novo.tipo,
            observacao: novo.observacao || null,
        });

        if (error) {
            toast.error(error);
        } else {
            toast.success('Agendamento criado com sucesso!');
            setIsOpen(false);
            window.dispatchEvent(new CustomEvent('agendamento-criado'));
        }
    };

    const handleUpdate = async (ag: any) => {
        if (!agendamentoEditando) return;
        const { error } = await atualizar(agendamentoEditando.id, {
            data_inicial: ag.dataInicio,
            data_final: ag.dataFim,
            tipo_agendamento: ag.tipo,
            dias: ag.totalDias,
            observacao: ag.observacao,
        });

        if (error) {
            toast.error(error);
        } else {
            toast.success('Agendamento atualizado com sucesso!');
            setIsOpen(false);
            window.dispatchEvent(new CustomEvent('agendamento-criado'));
        }
    };

    return (
        <DrawerAgendamento
            isOpen={isOpen}
            onClose={() => {
                setIsOpen(false);
                setTimeout(() => setAgendamentoEditando(null), 300);
            }}
            mode={mode}
            variant="modal"
            agendamentoExternoParaEdicao={agendamentoEditando}
            onSave={handleSave}
            onUpdate={handleUpdate}
            anchorRef={null as any}
        />
    );
};

export default GlobalAgendamentoModal;
