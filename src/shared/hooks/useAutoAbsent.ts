// src/shared/hooks/useAutoAbsent.ts
import { useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase/client';

const SCHOOL_TIMEZONE = 'Africa/Nouakchott';

const getLocalDayName = (): string => {
  const enDay = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: SCHOOL_TIMEZONE,
  }).format(new Date());
  const map: Record<string, string> = {
    Sunday: 'Dimanche', Monday: 'Lundi',    Tuesday: 'Mardi',
    Wednesday: 'Mercredi', Thursday: 'Jeudi', Friday: 'Vendredi', Saturday: 'Samedi',
  };
  return map[enDay] ?? enDay;
};

const getLocalTimeString = (): string => {
  // Retourne "HH:MM:SS" en heure locale de l'école
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: SCHOOL_TIMEZONE, hour12: false,
  }).format(new Date());
};

export const useAutoAbsent = (onDone?: () => void) => {
  const runAutoAbsent = useCallback(async () => {
    try {
      const todayDay   = getLocalDayName();   // ex: "Lundi"
      const nowTime    = getLocalTimeString(); // ex: "09:45:00"
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // ── 1. Sessions du jour dont time_end est déjà dépassé ──
      const { data: pastSchedules, error: schedErr } = await supabase
        .from('schedules')
        .select('id')
        .ilike('day', todayDay)
        .lt('time_end', nowTime); // time_end < maintenant

      if (schedErr || !pastSchedules?.length) return;

      const ids = pastSchedules.map(s => s.id);

      // ── 2. Déjà enregistré par un HUMAIN aujourd'hui ──
      const { data: humanLogs } = await supabase
        .from('attendance_logs')
        .select('schedule_id')
        .in('schedule_id', ids)
        .gte('recorded_at', todayStart.toISOString())
        .not('recorded_by', 'is', null);

      const alreadyByHuman = new Set(humanLogs?.map(l => l.schedule_id) ?? []);

      // ── 3. Déjà marqué auto-absent aujourd'hui ──
      const { data: autoLogs } = await supabase
        .from('attendance_logs')
        .select('schedule_id')
        .in('schedule_id', ids)
        .gte('recorded_at', todayStart.toISOString())
        .is('recorded_by', null)
        .eq('status', 'absent');

      const alreadyAutoAbsent = new Set(autoLogs?.map(l => l.schedule_id) ?? []);

      // ── 4. Sessions à marquer (ni humain, ni déjà auto) ──
      const toMark = ids.filter(
        id => !alreadyByHuman.has(id) && !alreadyAutoAbsent.has(id)
      );

      if (!toMark.length) return;

      // ── 5. Insertion des absences automatiques ──
      await supabase.from('attendance_logs').insert(
        toMark.map(schedule_id => ({
          schedule_id,
          status:      'absent',
          recorded_by: null, // NULL = système, pas un humain
          recorded_at: new Date().toISOString(),
          notes:       'Absence automatique — session terminée sans enregistrement',
        }))
      );

      // Rafraîchir les stats du dashboard si besoin
      onDone?.();

    } catch (err) {
      console.error('[AutoAbsent]', err);
    }
  }, [onDone]);

  useEffect(() => {
    runAutoAbsent(); // ← dès l'ouverture de l'app

    // Re-vérifie toutes les 5 minutes (au cas où une session se termine en cours de route)
    const interval = setInterval(runAutoAbsent, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [runAutoAbsent]);
};