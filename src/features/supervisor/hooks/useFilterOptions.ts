import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase/client';

interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

interface FilterOptionsData {
    days: FilterOption[];
    classes: FilterOption[];
    teachers: FilterOption[];
    subjects: FilterOption[];
    rooms: FilterOption[];
    specializations: FilterOption[];
    timeSlots: FilterOption[];
    loading: boolean;
    error: string | null;
}

const DAYS: FilterOption[] = [
    { value: 'الأحد', label: 'الأحد' },
    { value: 'الإثنين', label: 'الإثنين' },
    { value: 'الثلاثاء', label: 'الثلاثاء' },
    { value: 'الأربعاء', label: 'الأربعاء' },
    { value: 'الخميس', label: 'الخميس' },
    { value: 'الجمعة', label: 'الجمعة' },
    { value: 'السبت', label: 'السبت' },
];

const TIME_SLOTS: FilterOption[] = [
    { value: '08:00', label: '08:00 - 09:00' },
    { value: '09:00', label: '09:00 - 10:00' },
    { value: '10:00', label: '10:00 - 11:00' },
    { value: '11:00', label: '11:00 - 12:00' },
    { value: '12:00', label: '12:00 - 13:00' },
    { value: '13:00', label: '13:00 - 14:00' },
    { value: '14:00', label: '14:00 - 15:00' },
    { value: '15:00', label: '15:00 - 16:00' },
    { value: '16:00', label: '16:00 - 17:00' },
    { value: '17:00', label: '17:00 - 18:00' },
];

/**
 * Hook qui récupère toutes les options de filtrage distinctes depuis Supabase.
 * Les résultats sont mis en cache pour éviter les requêtes répétées.
 */
export const useFilterOptions = (): FilterOptionsData => {
    const [state, setState] = useState<FilterOptionsData>({
        days: DAYS,
        classes: [],
        teachers: [],
        subjects: [],
        rooms: [],
        specializations: [],
        timeSlots: TIME_SLOTS,
        loading: true,
        error: null,
    });

    const fetchOptions = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select('class, teacher, subject, room');

            if (error) throw error;

            // Extraire les valeurs distinctes avec comptages
            const classMap = new Map<string, number>();
            const teacherMap = new Map<string, number>();
            const subjectMap = new Map<string, number>();
            const roomMap = new Map<string, number>();
            const specSet = new Set<string>();

            (data || []).forEach((row: any) => {
                if (row.class) classMap.set(row.class, (classMap.get(row.class) || 0) + 1);
                if (row.teacher) teacherMap.set(row.teacher, (teacherMap.get(row.teacher) || 0) + 1);
                if (row.subject) subjectMap.set(row.subject, (subjectMap.get(row.subject) || 0) + 1);
                if (row.room) roomMap.set(row.room, (roomMap.get(row.room) || 0) + 1);
                // Déduire la spécialisation du nom de la classe (ex: "1BTSMEC A" → "MEC")
                const specMatch = row.class?.match(/BTS(\w+)/i);
                if (specMatch) specSet.add(specMatch[1].toUpperCase());
            });

            const toOptions = (map: Map<string, number>): FilterOption[] =>
                Array.from(map.entries())
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([value, count]) => ({ value, label: value, count }));

            setState(prev => ({
                ...prev,
                classes: toOptions(classMap),
                teachers: toOptions(teacherMap),
                subjects: toOptions(subjectMap),
                rooms: toOptions(roomMap),
                specializations: Array.from(specSet).sort().map(s => ({ value: s, label: s })),
                loading: false,
                error: null,
            }));
        } catch (err: any) {
            console.error('[useFilterOptions] Erreur:', err);
            setState(prev => ({ ...prev, loading: false, error: 'فشل في تحميل خيارات الفلترة' }));
        }
    }, []);

    useEffect(() => {
        fetchOptions();
    }, [fetchOptions]);

    return state;
};
