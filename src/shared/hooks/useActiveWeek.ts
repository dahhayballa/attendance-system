import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase/client';

export interface WeekData {
  id: string;
  name: string;
  start_date: string;
}

export const useActiveWeek = () => {
  const [activeWeek, setActiveWeek] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveWeek = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('weeks')
        .select('id, name, start_date')
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveWeek(data);
      setError(null);
    } catch (err: any) {
      console.error('[useActiveWeek] Erreur:', err);
      setError('Erreur lors du chargement de la semaine active');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveWeek();
  }, [fetchActiveWeek]);

  return { activeWeek, loading, error, refetchActiveWeek: fetchActiveWeek };
};
