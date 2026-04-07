-- Script pour Supabase SQL Editor
-- Automatisation du marquage des absences pour les professeurs non validés

-- 1. (Optionnel) Si 'recorded_by' est obligatoire dans vos tables, 
-- nous devons le rendre optionnel pour que le système puisse le laisser vide (NULL).
ALTER TABLE public.attendance_logs ALTER COLUMN recorded_by DROP NOT NULL;
ALTER TABLE public.schedules ALTER COLUMN recorded_by DROP NOT NULL;

-- 2. Activer l'extension pg_cron (Supabase la supporte nativement)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Créer la procédure PostgreSQL pour traiter les absences
CREATE OR REPLACE FUNCTION public.mark_ended_sessions_absent()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today_name text;
    current_time_val time;
    schedule_rec record;
BEGIN
    -- Obtenir l'heure actuelle. Vous pouvez ajouter '+ interval X hours' si votre base
    -- n'est pas sur le même fuseau horaire (ex: GMT, UTC).
    current_time_val := (now() AT TIME ZONE 'UTC')::time;
    
    -- Traduction du jour actuel de PostgreSQL (0-6) vers votre format français
    today_name := case extract(dow from current_date)
        when 0 then 'Dimanche'
        when 1 then 'Lundi'
        when 2 then 'Mardi'
        when 3 then 'Mercredi'
        when 4 then 'Jeudi'
        when 5 then 'Vendredi'
        when 6 then 'Samedi'
    end;

    -- Chercher toutes les sessions d'aujourd'hui qui sont terminées et toujours en 'pending'
    FOR schedule_rec IN 
        SELECT id 
        FROM public.schedules
        WHERE day = today_name
          AND time_end::time < current_time_val
          AND (status IS NULL OR status = 'pending')
    LOOP
        -- a) Mettre à jour la session dans schedules -> 'absent'
        UPDATE public.schedules 
        SET status = 'absent',
            recorded_by = NULL,
            recorded_at = now()
        WHERE id = schedule_rec.id;

        -- b) Créer le journal explicatif dans attendance_logs -> 'absent'
        INSERT INTO public.attendance_logs (schedule_id, recorded_by, status, recorded_at, reason)
        VALUES (schedule_rec.id, NULL, 'absent', now(), 'Absence marquée automatiquement (séance terminée sans pointage)');
    END LOOP;
END;
$$;

-- 4. Nettoyer l'ancienne tâche UNIQUEMENT si elle existe déjà (évite l'erreur XX000)
DO $$
BEGIN
  PERFORM cron.unschedule('auto-absent-job');
EXCEPTION WHEN others THEN
  -- Ignore l'erreur lors de la première création
END $$;

-- 5. Planifier l'exécution de la fonction toutes les 5 minutes
SELECT cron.schedule(
    'auto-absent-job',
    '*/5 * * * *', 
    'SELECT public.mark_ended_sessions_absent();'
);
