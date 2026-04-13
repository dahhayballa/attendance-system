-- Script d'automatisation pour un emploi du temps permanent
-- Ce script réinitialise l'état de tous les cours à la fin de chaque semaine
-- pour que le même emploi du temps puisse être réutilisé la semaine suivante.

-- 1. Créer la fonction de réinitialisation
CREATE OR REPLACE FUNCTION public.reset_all_schedules_for_new_week()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Remet tous les cours de la base de données à l'état vierge (en attente)
    UPDATE public.schedules 
    SET status = 'pending',
        recorded_by = NULL,
        recorded_at = NULL;
END;
$$;

-- 2. Nettoyer l'ancienne tâche si elle existe (pour éviter une erreur)
DO $$
BEGIN
  PERFORM cron.unschedule('reset-weekly-schedules-job');
EXCEPTION WHEN others THEN
  -- Ignorer l'erreur si c'est la première fois
END $$;

-- 3. Planifier l'exécution automatique.
-- Par défaut, ici : Chaque Dimanche à 23h59 ('59 23 * * 0')
-- (0 = Dimanche, 1 = Lundi, 6 = Samedi)
-- Adaptez selon le début de votre semaine de cours !
SELECT cron.schedule(
    'reset-weekly-schedules-job',
    '59 23 * * 0', 
    'SELECT public.reset_all_schedules_for_new_week();'
);
