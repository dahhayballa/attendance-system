import { useState, useEffect, useRef, useCallback } from 'react';
import { useFilterOptions } from '../hooks/useFilterOptions';
import type { FilterOptions } from '../types';
import {
    Search, X, Calendar, Building, BookOpen,
    MapPin, Wrench, Filter, Bookmark, Plus, Trash2
} from 'lucide-react';

/* ═══════════ Types ═══════════ */

interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

interface FilterConfig {
    id: keyof FilterOptions;
    label: string;
    icon: React.ReactNode;
    options: FilterOption[];
    placeholder: string;
}

interface SavedFilter {
    id: string;
    name: string;
    filters: Partial<FilterOptions>;
}

interface AdvancedFiltersProps {
    filters: Partial<FilterOptions>;
    onFiltersChange: (filters: Partial<FilterOptions>) => void;
    onReset: () => void;
    className?: string;
}

const STORAGE_KEY = 'supervisor_saved_filters';

/* ═══════════ Component ═══════════ */

const AdvancedFilters = ({ filters, onFiltersChange, onReset, className = '' }: AdvancedFiltersProps) => {
    const options = useFilterOptions();
    const [searchText, setSearchText] = useState('');
    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
    const [showSaveInput, setShowSaveInput] = useState(false);
    const [saveName, setSaveName] = useState('');
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Charger les filtres sauvegardés depuis localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) setSavedFilters(JSON.parse(stored));
        } catch { /* ignore */ }
    }, []);

    // Sauvegarder dans localStorage
    const persistSaved = useCallback((list: SavedFilter[]) => {
        setSavedFilters(list);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }, []);

    // Immediate filter update (for dropdowns)
    const setFilter = useCallback((key: keyof FilterOptions, value: string) => {
        onFiltersChange({ ...filters, [key]: value });
    }, [filters, onFiltersChange]);

    // Search debounce
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            onFiltersChange({ ...filters, teacher: searchText });
        }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchText]);

    // Active filter count
    const activeCount = Object.values(filters).filter(v => v && v !== '').length;

    // Save current filters
    const handleSave = () => {
        if (!saveName.trim()) return;
        const newFilter: SavedFilter = {
            id: Date.now().toString(),
            name: saveName.trim(),
            filters: { ...filters },
        };
        persistSaved([...savedFilters, newFilter]);
        setSaveName('');
        setShowSaveInput(false);
    };

    // Delete saved filter
    const deleteSaved = (id: string) => {
        persistSaved(savedFilters.filter(f => f.id !== id));
    };

    // Apply saved filter
    const applySaved = (saved: SavedFilter) => {
        onFiltersChange(saved.filters);
        setSearchText(saved.filters.teacher || '');
    };

    // Build filter config
    const filterConfigs: FilterConfig[] = [
        { id: 'day', label: 'اليوم', icon: <Calendar size={16} />, options: options.days, placeholder: 'كل الأيام' },
        { id: 'class', label: 'القسم', icon: <Building size={16} />, options: options.classes, placeholder: 'كل الأقسام' },
        { id: 'subject', label: 'المادة', icon: <BookOpen size={16} />, options: options.subjects, placeholder: 'كل المواد' },
        { id: 'room', label: 'القاعة', icon: <MapPin size={16} />, options: options.rooms, placeholder: 'كل القاعات' },
        { id: 'specialization', label: 'التخصص', icon: <Wrench size={16} />, options: options.specializations, placeholder: 'كل التخصصات' },
    ];

    return (
        <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-500" />
                    <h3 className="font-bold text-gray-900 text-sm">فلاتر البحث المتقدمة</h3>
                    {activeCount > 0 && (
                        <span className="w-5 h-5 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {activeCount}
                        </span>
                    )}
                </div>
                {activeCount > 0 && (
                    <button
                        onClick={() => { onReset(); setSearchText(''); }}
                        className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                    >
                        <Trash2 size={14} />
                        مسح الكل
                    </button>
                )}
            </div>

            <div className="p-4 space-y-4">
                {/* Search bar */}
                <div className="relative">
                    <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="بحث حر عن أستاذ أو مادة..."
                        className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 focus:bg-white outline-none transition-all"
                    />
                    {searchText && (
                        <button
                            onClick={() => setSearchText('')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Filter grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {filterConfigs.map(config => (
                        <FilterDropdown
                            key={config.id}
                            config={config}
                            value={filters[config.id] || ''}
                            onChange={(val) => setFilter(config.id, val)}
                            loading={options.loading}
                        />
                    ))}
                </div>

                {/* Active filter tags */}
                {activeCount > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {Object.entries(filters).map(([key, value]) => {
                            if (!value) return null;
                            const config = filterConfigs.find(c => c.id === key);
                            return (
                                <span
                                    key={key}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100"
                                >
                                    {config?.icon}
                                    <span>{config?.label}: {value}</span>
                                    <button
                                        onClick={() => setFilter(key as keyof FilterOptions, '')}
                                        className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Quick filters & saved */}
                <div className="border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Bookmark size={14} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">فلاتر سريعة</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {/* Predefined quick filters */}
                        {options.classes.slice(0, 2).map(cls => (
                            <QuickFilterChip
                                key={`cls-${cls.value}`}
                                label={cls.value}
                                active={filters.class === cls.value}
                                onClick={() => setFilter('class', filters.class === cls.value ? '' : cls.value)}
                            />
                        ))}
                        {options.subjects.slice(0, 2).map(sub => (
                            <QuickFilterChip
                                key={`sub-${sub.value}`}
                                label={sub.value}
                                active={filters.subject === sub.value}
                                onClick={() => setFilter('subject', filters.subject === sub.value ? '' : sub.value)}
                            />
                        ))}

                        {/* Saved filters */}
                        {savedFilters.map(saved => (
                            <div key={saved.id} className="group relative">
                                <QuickFilterChip
                                    label={`⭐ ${saved.name}`}
                                    active={false}
                                    onClick={() => applySaved(saved)}
                                />
                                <button
                                    onClick={() => deleteSaved(saved.id)}
                                    className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] items-center justify-center hidden group-hover:flex"
                                >
                                    ×
                                </button>
                            </div>
                        ))}

                        {/* Save current */}
                        {activeCount > 0 && !showSaveInput && (
                            <button
                                onClick={() => setShowSaveInput(true)}
                                className="flex items-center gap-1 px-3 py-1.5 border border-dashed border-gray-300 text-gray-500 rounded-full text-xs font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                <Plus size={12} />
                                حفظ الفلتر
                            </button>
                        )}

                        {/* Save input */}
                        {showSaveInput && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={saveName}
                                    onChange={(e) => setSaveName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    placeholder="اسم الفلتر..."
                                    className="w-32 px-2 py-1 border border-gray-300 rounded-lg text-xs outline-none focus:border-blue-400"
                                    autoFocus
                                />
                                <button
                                    onClick={handleSave}
                                    disabled={!saveName.trim()}
                                    className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                >
                                    حفظ
                                </button>
                                <button
                                    onClick={() => setShowSaveInput(false)}
                                    className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ═══════════ FilterDropdown ═══════════ */

interface FilterDropdownProps {
    config: FilterConfig;
    value: string;
    onChange: (value: string) => void;
    loading?: boolean;
}

const FilterDropdown = ({ config, value, onChange, loading }: FilterDropdownProps) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    // Fermer au clic extérieur
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filteredOptions = config.options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const selectedLabel = config.options.find(o => o.value === value)?.label;

    return (
        <div ref={ref} className="relative">
            {/* Label */}
            <label className="flex items-center gap-1 text-[11px] text-gray-500 font-medium mb-1">
                <span className="text-gray-400">{config.icon}</span>
                {config.label}
            </label>

            {/* Trigger */}
            <button
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-label={`فلتر ${config.label}`}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${value
                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                    } ${open ? 'ring-2 ring-blue-200 border-blue-400' : ''}`}
            >
                <span className="truncate">{selectedLabel || config.placeholder}</span>
                <svg className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 w-full min-w-[180px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1">
                    {/* Search in dropdown */}
                    {config.options.length > 6 && (
                        <div className="p-2 border-b border-gray-100">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="بحث..."
                                className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-300"
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="max-h-48 overflow-y-auto">
                        {/* All option */}
                        <button
                            onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${!value ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-600'
                                }`}
                        >
                            <span>{config.placeholder}</span>
                        </button>

                        {loading ? (
                            <div className="px-3 py-4 text-center">
                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
                            </div>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${value === opt.value
                                        ? 'bg-blue-50 text-blue-700 font-medium'
                                        : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {opt.count !== undefined && (
                                        <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                            {opt.count}
                                        </span>
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-3 text-xs text-gray-400 text-center">لا نتائج</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ═══════════ QuickFilterChip ═══════════ */

interface QuickFilterChipProps {
    label: string;
    active: boolean;
    onClick: () => void;
}

const QuickFilterChip = ({ label, active, onClick }: QuickFilterChipProps) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active
            ? 'bg-blue-500 text-white shadow-sm'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
    >
        {label}
    </button>
);

export default AdvancedFilters;
