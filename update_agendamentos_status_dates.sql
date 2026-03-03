-- Para que as datas de status funcionem (conforme você pediu para exibir), 
-- o banco precisa dessas colunas. Execute no Editor SQL:
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
