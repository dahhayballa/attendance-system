import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';

interface SearchableSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
    icon: React.ReactNode;
    allLabel: string;
    className?: string;
}

/**
 * SearchableSelect
 * A premium, searchable dropdown component designed for high-density dashboards.
 */
const SearchableSelect = ({ value, onChange, options, placeholder, icon, allLabel, className = '' }: SearchableSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearch('');
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedDisplay = value === 'all' ? allLabel : value;

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Display / Trigger */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative group flex items-center px-4 py-3.5 bg-white border border-gray-100 rounded-2xl cursor-pointer shadow-sm transition-all duration-300 ${isOpen ? 'ring-4 ring-orange-500/10 border-orange-200 z-50' : 'hover:border-orange-200 hover:shadow-md'}`}
            >
                <div className={`absolute left-4 flex items-center pointer-events-none transition-colors duration-300 ${isOpen ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-500'}`}>
                    {icon}
                </div>
                
                <div className="flex-1 ltr:pl-8 rtl:pr-8 pr-6 min-w-0">
                    <p className={`text-[11px] font-black uppercase tracking-widest truncate ${isOpen ? 'text-orange-950' : 'text-gray-950'}`}>
                        {selectedDisplay}
                    </p>
                </div>

                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-orange-500' : 'rotate-90 text-gray-300'}`}>
                    <ChevronRight size={14} />
                </div>
            </div>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-orange-100 rounded-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-300">
                    {/* Search Field */}
                    <div className="p-4 border-b border-orange-50 flex items-center gap-3 bg-orange-50/10">
                        <Search size={14} className="text-orange-400 shrink-0" />
                        <input 
                            autoFocus
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Rechercher un(e) ${placeholder}...`}
                            className="bg-transparent text-xs font-bold text-gray-900 outline-none w-full placeholder:text-orange-200"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="text-orange-300 hover:text-orange-600 transition-colors px-1">
                                <Search size={12} className="rotate-45" />
                            </button>
                        )}
                    </div>

                    {/* Options List */}
                    <div className="max-h-64 overflow-y-auto py-2 px-2 custom-scrollbar overscroll-contain">
                        <div 
                            onClick={() => handleSelect('all')}
                            className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${value === 'all' ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-400 hover:bg-orange-50 hover:text-orange-600'}`}
                        >
                            <span>{allLabel}</span>
                            {value === 'all' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                        </div>
                        
                        <div className="h-[1px] bg-orange-50 my-2 mx-4 opacity-50"></div>

                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div 
                                    key={opt}
                                    onClick={() => handleSelect(opt)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer mt-1 first:mt-0 transition-all ${value === opt ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600'}`}
                                >
                                    <span className="truncate pr-4">{opt}</span>
                                    {value === opt && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                                </div>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                                <Search size={24} className="mb-2 text-orange-200" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-orange-400">Aucun résultat trouvé</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
