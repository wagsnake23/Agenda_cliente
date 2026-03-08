-- Trigger to automatically set timestamps based on status changes
-- Prevents business logic from relying solely on frontend/client calls

CREATE OR REPLACE FUNCTION handle_agendamento_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if status has changed
    IF (OLD.status IS NULL OR OLD.status <> NEW.status) THEN
        IF (NEW.status = 'aprovado') THEN
            NEW.approved_at = NOW();
        ELSIF (NEW.status = 'cancelado') THEN
            NEW.cancelled_at = NOW();
        ELSIF (NEW.status = 'recusado') THEN
            NEW.rejected_at = NOW();
        END IF;

        -- Reset status to 'pendente' if dates change and user is not admin
        -- (This part requires checking user role, which is harder in basic SQL triggers without auth.uid())
        -- For now, we handle status date automation.
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to agendamentos table
DROP TRIGGER IF EXISTS on_agendamento_status_change ON agendamentos;
CREATE TRIGGER on_agendamento_status_change
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION handle_agendamento_status_change();

-- Add indices for performance (Ação 25 & 26)
CREATE INDEX IF NOT EXISTS idx_agendamentos_user_id ON agendamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_inicial ON agendamentos(data_inicial);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_is_active ON calendar_events(is_active);
