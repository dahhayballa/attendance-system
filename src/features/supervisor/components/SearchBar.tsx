import { Search, X } from 'lucide-react';
import Card from '../../../shared/components/ui/Card';

export interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder = 'ابحث عن أستاذ...' }: SearchBarProps) => {
    return (
        <Card padding="p-2 sm:p-4" className="sticky top-16 z-30 shadow-sm mb-6 border-b-0 rounded-b-none sm:rounded-b-lg sm:border-b transition-all">
            <div className="relative flex items-center w-full">
                <label htmlFor="search-input" className="sr-only">بحث</label>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Search className="h-6 w-6 text-blue-500 font-bold" />
                </div>
                <input
                    id="search-input"
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="block w-full pl-12 pr-14 py-4 sm:py-5 border-2 border-transparent bg-gray-50 rounded-xl leading-5 bg-transparent placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg sm:text-xl font-medium text-gray-900 shadow-inner"
                    placeholder={placeholder}
                    autoComplete="off"
                />
                {value && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors focus:outline-none"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default SearchBar;
