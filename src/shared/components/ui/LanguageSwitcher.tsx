import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'ar', label: 'العربية' },
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
] as const;

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const handleChangeLanguage = (code: string) => {
        i18n.changeLanguage(code);
    };

    return (
        <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1">
            {LANGUAGES.map((lang) => {
                const isActive = i18n.language.startsWith(lang.code);
                return (
                    <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleChangeLanguage(lang.code)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${
                            isActive
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        {lang.label}
                    </button>
                );
            })}
        </div>
    );
};

export default LanguageSwitcher;

