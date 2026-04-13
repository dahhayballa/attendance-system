-- Migration script pour Ajouter session_date

-- 1. On ajoute la colonne session_date de type DATE, vide pour les anciens (ou on peut les remplir manuellement si besoin plus tard).
ALTER TABLE public.attendance_logs ADD COLUMN IF NOT EXISTS session_date DATE;

-- Optionnel: Si vous voulez que toutes les anciennes absences aient au moins 
-- la date de leur création 'recorded_at' comme fallback initial :
UPDATE public.attendance_logs SET session_date = DATE(recorded_at) WHERE session_date IS NULL;

-- 2. Voilà, c'est fait ! La table est prête à recevoir les nouvelles dates parfaites.
