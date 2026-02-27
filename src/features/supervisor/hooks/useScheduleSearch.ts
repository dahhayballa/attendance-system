import { useState, useCallback, useEffect } from 'react';
import { searchSchedulesByTeacher } from '../../../services/supabase/schedule.service';
import { Schedule } from '../../../types';

export const useScheduleSearch = () => {
    const [query, setQuery] = useState<string>('');
    const [results, setResults] = useState<Schedule[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        try {
            setIsSearching(true);
            setError(null);
            const data = await searchSchedulesByTeacher(searchQuery);
            setResults(data || []);
        } catch (err: any) {
            console.error('Search error:', err);
            setError('حدث خطأ أثناء البحث عن الحصص');
            setResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            search(query);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, search]);

    return {
        query,
        setQuery,
        results,
        setResults,
        isSearching,
        error
    };
};
