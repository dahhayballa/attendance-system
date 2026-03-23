-- ==========================================
-- SCHEMA : SCENARIOS ATTENDANCE SYSTEM
-- ==========================================

-- 1. جدول تعيينات المشرفين (Supervisor Assignments)
CREATE TABLE IF NOT EXISTS public.supervisor_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supervisor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assignment_type VARCHAR(50) NOT NULL CHECK (assignment_type IN ('class', 'subject', 'all')),
    assignment_value VARCHAR(255), -- '1BTSMEC A' أو 'Math' أو فارغ إذا كان الكل
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supervisor_id, assignment_type, assignment_value)
);

-- RLS for supervisor_assignments
ALTER TABLE public.supervisor_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage assignments" ON public.supervisor_assignments
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Supervisors can view their own assignments" ON public.supervisor_assignments
    FOR SELECT TO authenticated
    USING (current_setting('request.jwt.claims', true)::json->>'sub' = supervisor_id::text);

-- 2. جدول الإشعارات (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'absence', 'late', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view and manage all notifications" ON public.notifications
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- 3. Trigger & Function for Automatic Absence Notifications
CREATE OR REPLACE FUNCTION public.handle_attendance_notification()
RETURNS TRIGGER AS $$
DECLARE
    teacher_name VARCHAR(255);
    class_name VARCHAR(255);
    action_type VARCHAR(50);
BEGIN
    -- Only notify on absence or late
    IF NEW.status IN ('absent', 'late') THEN
        -- Get details from schedules table
        SELECT teacher, class INTO teacher_name, class_name
        FROM public.schedules
        WHERE id = NEW.schedule_id;
        
        IF NEW.status = 'absent' THEN
            action_type := 'تسجيل غياب';
        ELSE
            action_type := 'تسجيل تأخر';
        END IF;

        -- Insert notification
        INSERT INTO public.notifications (type, title, message)
        VALUES (
            NEW.status,
            action_type || ': ' || teacher_name,
            'تم ' || action_type || ' للأستاذ ' || teacher_name || ' في قسم ' || class_name
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_attendance_status_change ON public.attendance_logs;
CREATE TRIGGER on_attendance_status_change
    AFTER INSERT OR UPDATE ON public.attendance_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_attendance_notification();

-- 4. View for Current Sessions (الحصص الجارية)
-- To help the supervisor easily get current sessions based on their assignment
CREATE OR REPLACE VIEW public.current_sessions_view AS
SELECT s.*, 
       (SELECT COUNT(*) FROM public.attendance_logs al WHERE al.schedule_id = s.id) as logs_count,
       (SELECT status FROM public.attendance_logs al WHERE al.schedule_id = s.id ORDER BY recorded_at DESC LIMIT 1) as current_status
FROM public.schedules s
WHERE s.day = (
    CASE extract(dow from current_date)
        WHEN 0 THEN 'الأحد'
        WHEN 1 THEN 'الإثنين'
        WHEN 2 THEN 'الثلاثاء'
        WHEN 3 THEN 'الأربعاء'
        WHEN 4 THEN 'الخميس'
        WHEN 5 THEN 'الجمعة'
        WHEN 6 THEN 'السبت'
    END
);

-- 5. Function to fetch supervisor specific sessions
CREATE OR REPLACE FUNCTION public.get_supervisor_current_sessions(p_supervisor_id UUID)
RETURNS SETOF public.current_sessions_view AS $$
BEGIN
    RETURN QUERY
    SELECT csv.* FROM public.current_sessions_view csv
    WHERE EXISTS (
        SELECT 1 FROM public.supervisor_assignments sa 
        WHERE sa.supervisor_id = p_supervisor_id
        AND (
            sa.assignment_type = 'all' 
            OR (sa.assignment_type = 'class' AND sa.assignment_value = csv.class)
            OR (sa.assignment_type = 'subject' AND sa.assignment_value = csv.subject)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
