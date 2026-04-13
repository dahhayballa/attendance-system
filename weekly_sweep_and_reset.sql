-- Script Ultime: Marquage des absences en fin de semaine et remise à zéro.

-- 1. On nettoie les anciennes tâches pour éviter les conflits (l'ancien 5 minutes et l'ancien reset)
DO $$
BEGIN
  PERFORM cron.unschedule('auto-absent-job');
  PERFORM cron.unschedule('reset-weekly-schedules-job');
  PERFORM cron.unschedule('weekly-sweep-and-reset');
EXCEPTION WHEN others THEN
END $$;

-- 2. Fonction principale qui fait le balayage (sweep) et le reset
CREATE OR REPLACE FUNCTION public.process_end_of_week_and_reset()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Étape : Remise à zéro totale de l'emploi du temps
    -- On remet TOUT l'emploi du temps à "pending" pour que ça reparte à zéro le Lundi matin !
    UPDATE public.schedules 
    SET status = 'pending',
        recorded_by = NULL,
        recorded_at = NULL;
END;
$$;

-- 3. Planifier cette grande fonction UNE SEULE FOIS par semaine (Dimanche à 23h59)
SELECT cron.schedule(
    'weekly-sweep-and-reset',
    '59 23 * * 0', 
    'SELECT public.process_end_of_week_and_reset();'
);
