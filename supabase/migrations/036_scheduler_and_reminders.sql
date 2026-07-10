-- Migration 036: Scheduler and Reminders Enhancement
-- Adds standalone scheduled messages and reminders features from Kodelr CRM

-- ============================================
-- SCHEDULED MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('image', 'video', 'audio', 'document', 'sticker')),
    scheduled_at TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
    sent_at TIMESTAMPTZ,
    wamid TEXT, -- WhatsApp Message ID after sending
    error_message TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB, -- { type: 'daily'|'weekly'|'monthly', interval: 1, days: [1,2,3] }
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_scheduled_messages_account ON public.scheduled_messages(account_id);
CREATE INDEX idx_scheduled_messages_status ON public.scheduled_messages(status);
CREATE INDEX idx_scheduled_messages_scheduled_at ON public.scheduled_messages(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_scheduled_messages_contact ON public.scheduled_messages(contact_id);

-- Row Level Security
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view scheduled messages in their account"
    ON public.scheduled_messages FOR SELECT
    USING (public.is_account_member(account_id));

CREATE POLICY "Users can create scheduled messages in their account"
    ON public.scheduled_messages FOR INSERT
    WITH CHECK (
        public.is_account_member(account_id) AND
        account_id IN (SELECT account_id FROM public.account_members WHERE member_id = auth.uid())
    );

CREATE POLICY "Users can update scheduled messages in their account"
    ON public.scheduled_messages FOR UPDATE
    USING (public.is_account_member(account_id));

CREATE POLICY "Users can delete scheduled messages in their account"
    ON public.scheduled_messages FOR DELETE
    USING (public.is_account_member(account_id));

-- ============================================
-- REMINDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    reminder_at TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed', 'expired')),
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    color TEXT DEFAULT '#3B82F6', -- Tailwind blue-500
    notify_via_push BOOLEAN DEFAULT TRUE,
    notify_via_email BOOLEAN DEFAULT FALSE,
    notify_via_whatsapp BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_reminders_account ON public.reminders(account_id);
CREATE INDEX idx_reminders_status ON public.reminders(status);
CREATE INDEX idx_reminders_reminder_at ON public.reminders(reminder_at) WHERE status = 'pending';
CREATE INDEX idx_reminders_contact ON public.reminders(contact_id);
CREATE INDEX idx_reminders_conversation ON public.reminders(conversation_id);
CREATE INDEX idx_reminders_created_by ON public.reminders(created_by);

-- Row Level Security
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view reminders in their account"
    ON public.reminders FOR SELECT
    USING (public.is_account_member(account_id));

CREATE POLICY "Users can create reminders in their account"
    ON public.reminders FOR INSERT
    WITH CHECK (
        public.is_account_member(account_id) AND
        account_id IN (SELECT account_id FROM public.account_members WHERE member_id = auth.uid())
    );

CREATE POLICY "Users can update reminders in their account"
    ON public.reminders FOR UPDATE
    USING (public.is_account_member(account_id));

CREATE POLICY "Users can delete reminders in their account"
    ON public.reminders FOR DELETE
    USING (public.is_account_member(account_id));

-- ============================================
-- TRIGGER FUNCTION FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for scheduled_messages
DROP TRIGGER IF EXISTS update_scheduled_messages_updated_at ON public.scheduled_messages;
CREATE TRIGGER update_scheduled_messages_updated_at
    BEFORE UPDATE ON public.scheduled_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers for reminders
DROP TRIGGER IF EXISTS update_reminders_updated_at ON public.reminders;
CREATE TRIGGER update_reminders_updated_at
    BEFORE UPDATE ON public.reminders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get pending scheduled messages due for sending
CREATE OR REPLACE FUNCTION public.get_due_scheduled_messages()
RETURNS TABLE (
    id UUID,
    account_id UUID,
    contact_id UUID,
    message_text TEXT,
    media_url TEXT,
    media_type TEXT,
    scheduled_at TIMESTAMPTZ,
    timezone TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.id,
        sm.account_id,
        sm.contact_id,
        sm.message_text,
        sm.media_url,
        sm.media_type,
        sm.scheduled_at,
        sm.timezone
    FROM public.scheduled_messages sm
    WHERE sm.status = 'pending'
      AND sm.scheduled_at <= NOW()
    ORDER BY sm.scheduled_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get due reminders
CREATE OR REPLACE FUNCTION public.get_due_reminders()
RETURNS TABLE (
    id UUID,
    account_id UUID,
    contact_id UUID,
    conversation_id UUID,
    title TEXT,
    description TEXT,
    reminder_at TIMESTAMPTZ,
    priority TEXT,
    notify_via_push BOOLEAN,
    notify_via_email BOOLEAN,
    notify_via_whatsapp BOOLEAN,
    created_by UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.account_id,
        r.contact_id,
        r.conversation_id,
        r.title,
        r.description,
        r.reminder_at,
        r.priority,
        r.notify_via_push,
        r.notify_via_email,
        r.notify_via_whatsapp,
        r.created_by
    FROM public.reminders r
    WHERE r.status = 'pending'
      AND r.reminder_at <= NOW()
    ORDER BY r.reminder_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a reminder
CREATE OR REPLACE FUNCTION public.complete_reminder(reminder_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_account_id UUID;
BEGIN
    -- Get account_id for permission check
    SELECT account_id INTO v_account_id FROM public.reminders WHERE id = reminder_id;
    
    -- Check permission
    IF NOT public.is_account_member(v_account_id) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    
    -- Update reminder
    UPDATE public.reminders
    SET 
        status = 'completed',
        is_completed = TRUE,
        completed_at = NOW(),
        completed_by = auth.uid()
    WHERE id = reminder_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel a scheduled message
CREATE OR REPLACE FUNCTION public.cancel_scheduled_message(message_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_account_id UUID;
BEGIN
    -- Get account_id for permission check
    SELECT account_id INTO v_account_id FROM public.scheduled_messages WHERE id = message_id;
    
    -- Check permission
    IF NOT public.is_account_member(v_account_id) THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    
    -- Update message
    UPDATE public.scheduled_messages
    SET status = 'cancelled'
    WHERE id = message_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE public.scheduled_messages IS 'Stores individual scheduled WhatsApp messages with optional recurrence';
COMMENT ON TABLE public.reminders IS 'Standalone reminders system with multiple notification channels';
COMMENT ON COLUMN public.scheduled_messages.recurrence_pattern IS 'JSON object defining recurrence: {type: "daily"|"weekly"|"monthly", interval: number, days: number[], end_date: timestamp}';
COMMENT ON COLUMN public.reminders.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN public.reminders.color IS 'Custom color for visual categorization in UI';
