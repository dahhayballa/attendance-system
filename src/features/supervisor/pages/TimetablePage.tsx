import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../services/supabase/client';
import SupervisorLayout from '../components/SupervisorLayout';
import { Search, MapPin, Filter, User, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// --- COMPOSANT SOUS-JACENT POUR UNE GRILLE UNIQUE ---
const ClassTimetable = ({ title, schedules, activeDays, timePosFn, HOUR_HEIGHT, HOURS, t }: any) => {
    // Regrouper par jour
    const grouped = new Map<string, any[]>();
    activeDays.forEach((d: string) => grouped.set(d, []));
    
    schedules.forEach((s: any) => {
        if (!grouped.has(s.day)) grouped.set(s.day, []);
        grouped.get(s.day)!.push(s);
    });

    if (schedules.length === 0) return null; // Ne pas afficher une grille vide pour une classe

    return (
        <div className="mb-6 last:mb-0">
            {/* Titre de la Classe */}
            <div className="flex items-center gap-2 mb-3 bg-orange-50/50 px-3 py-2 rounded-lg border border-orange-100 w-max">
                <Layers size={16} className="text-orange-500" />
                <h2 className="text-sm font-black text-slate-800 tracking-tight">
                    {t('supervisor.timetablePage.titleSection')} <span className="text-orange-600 bg-white px-2 py-0.5 rounded shadow-sm border border-orange-200 ml-1">{title}</span>
                </h2>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-x-auto relative">
                <div className="min-w-[800px]">
                    
                    {/* Ligne d'En-tête (Jours) */}
                    <div className="flex border-b border-gray-200 bg-slate-50/90 sticky top-0 z-20 backdrop-blur-sm">
                        <div className="w-[50px] flex-shrink-0 border-r border-gray-200 bg-slate-50 relative z-30"></div>
                        {activeDays.map((day: string) => (
                            <div key={day} className="flex-1 px-2 py-2 text-center border-r border-gray-100 last:border-r-0">
                                <h3 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                                    {t(`supervisor.timetablePage.days.${day}`)}
                                </h3>
                            </div>
                        ))}
                    </div>

                    {/* Corps de la Grille */}
                    <div className="flex relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>
                        
                        {/* Colonne des Heures (Y-Axis) */}
                        <div className="w-[50px] flex-shrink-0 border-r border-gray-200 bg-white relative z-10 flex flex-col shadow-sm">
                            {HOURS.map((h: number) => (
                                <div key={h} className="w-full relative border-b border-gray-100/50" style={{ height: `${HOUR_HEIGHT}px` }}>
                                    <span className="absolute top-1.5 left-0 right-0 text-center text-xs font-black text-slate-500">
                                        {h.toString().padStart(2, '0')}h
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Les traits horizontaux de fond (Grid Lines) */}
                        <div className="absolute inset-0 left-[50px] flex flex-col z-0 pointer-events-none">
                            {HOURS.map((h: number) => (
                                <div key={`line-${h}`} className="w-full border-b border-slate-100/50" style={{ height: `${HOUR_HEIGHT}px` }} />
                            ))}
                        </div>

                        {/* Les colonnes contenant les cartes de cours */}
                        {activeDays.map((day: string) => {
                            const daySchedules = grouped.get(day) || [];
                            
                            // 1. Calcul des positions et tri
                            const processed = daySchedules.map(session => ({
                                ...session,
                                top: timePosFn(session.time_start),
                                bottom: timePosFn(session.time_end)
                            })).sort((a, b) => a.top - b.top);

                            // 2. Assignation en colonnes pour éviter les chevauchements (Overlap Algorithm)
                            const columns: typeof processed[] = [];
                            processed.forEach(session => {
                                let placed = false;
                                for (let col of columns) {
                                    // Si la session ne chevauche aucune autre de cette colonne
                                    if (!col.some(s => s.top < session.bottom && s.bottom > session.top)) {
                                        col.push(session);
                                        placed = true; break;
                                    }
                                }
                                if (!placed) columns.push([session]);
                            });

                            return (
                                <div key={`col-${day}`} className="flex-1 relative border-r border-slate-100 last:border-r-0 z-10">
                                    {columns.map((col, colIndex) => 
                                        col.map(session => {
                                            const height = Math.max(session.bottom - session.top, HOUR_HEIGHT * 0.5);
                                            const isSmall = height < 45;
                                            
                                            const widthPerc = 100 / columns.length;
                                            const leftPerc = colIndex * widthPerc;

                                            // Generer une couleur pastel aléatoire par Matière
                                            const generateColor = (str: string) => {
                                                if (!str) return { bg: '#fff', border: '#e2e8f0', title: '#000' };
                                                let hash = 0;
                                                for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
                                                const h = Math.abs(hash) % 360;
                                                return { bg: `hsl(${h}, 80%, 96%)`, border: `hsl(${h}, 60%, 85%)`, title: `hsl(${h}, 50%, 40%)` };
                                            };
                                            const colors = generateColor(session.subject);

                                            return (
                                                <div 
                                                    key={session.id} 
                                                    className="absolute rounded-lg p-1.5 overflow-hidden transition-all shadow-sm hover:shadow-md hover:z-20 group"
                                                    style={{ 
                                                        top: `${session.top + 2}px`, 
                                                        height: `${height - 4}px`, 
                                                        left: `calc(${leftPerc}% + 3px)`,
                                                        width: `calc(${widthPerc}% - 6px)`,
                                                        backgroundColor: colors.bg,
                                                        borderLeft: `3px solid ${colors.title}`,
                                                        borderTop: `1px solid ${colors.border}`,
                                                        borderRight: `1px solid ${colors.border}`,
                                                        borderBottom: `1px solid ${colors.border}`,
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start gap-1">
                                                        <h4 className={`font-black tracking-tight leading-tight line-clamp-2 ${isSmall ? 'text-[9px]' : 'text-[11px]'}`} style={{ color: colors.title }}>
                                                            {session.subject}
                                                        </h4>
                                                    </div>

                                                    {!isSmall && (
                                                        <div className="mt-1 space-y-1">
                                                            <p className="text-[9px] font-bold text-slate-700 flex items-center gap-1 line-clamp-1">
                                                                <User size={10} className="opacity-50" /> {session.teacher}
                                                            </p>
                                                            <p className="text-[9px] font-bold text-slate-600 bg-white/70 inline-flex items-center gap-1 rounded-[4px] px-1 shadow-sm border border-white/50">
                                                                <MapPin size={9} className="text-orange-500" /> {session.room}
                                                            </p>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-black tracking-wider text-slate-700 bg-white px-1 py-0.5 rounded shadow-sm border border-slate-200">
                                                        {session.time_start?.slice(0,5)} - {session.time_end?.slice(0,5)}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- PAGE PRINCIPALE ---
export const TimetablePage = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === 'ar';

    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [filterClass, setFilterClass] = useState('all');
    const [filterDay, setFilterDay] = useState(() => {
        const jsDays = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        return jsDays[new Date().getDay()] || 'Lundi';
    });
    const [searchTeacher, setSearchTeacher] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        const fetchSchedules = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .order('time_start');
            
            if (!error && data) {
                setSchedules(data);
            }
            setLoading(false);
        };
        fetchSchedules();
    }, []);

    const uniqueClasses = useMemo(() => Array.from(new Set(schedules.map(s => s.class))).filter(Boolean).sort() as string[], [schedules]);
    
    const DAYS_ORDER = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    const HOUR_HEIGHT = 60; // <<< RÉDUIT POUR PRENDRE MOINS DE PLACE EN HAUTEUR

    const filtered = useMemo(() => {
        return schedules.filter(s => {
            const mClass = filterClass === 'all' || s.class === filterClass;
            const mDay = filterDay === 'all' || s.day === filterDay;
            const mTeach = searchTeacher === '' || s.teacher?.toLowerCase().includes(searchTeacher.toLowerCase()) || s.subject?.toLowerCase().includes(searchTeacher.toLowerCase());
            return mClass && mDay && mTeach;
        });
    }, [schedules, filterClass, filterDay, searchTeacher]);

    const getTimePos = (timeString: string) => {
        if (!timeString) return 0;
        const [h, m] = timeString.split(':').map(Number);
        return ((h - 8) + (m / 60)) * HOUR_HEIGHT;
    };

    const activeDays = filterDay === 'all' ? DAYS_ORDER : [filterDay];
    const classesToRender = filterClass === 'all' ? uniqueClasses : [filterClass];

    return (
        <SupervisorLayout>
            <div className={`space-y-4 pb-12 ${isRtl ? 'font-arabic text-right' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
                
                {/* EN-TÊTE ET FILTRES RAPIDES */}
                <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md px-5 py-3 rounded-xl border border-gray-100 shadow-sm flex flex-col xl:flex-row xl:items-start justify-between gap-4 mt-2 -mx-2 px-6">
                    <div className="flex justify-between items-center w-full xl:w-auto">
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                            <span className="p-1.5 bg-orange-100 rounded-lg text-orange-500 text-lg leading-none">🗓</span> 
                            {t('supervisor.timetablePage.title')}
                        </h1>
                        <button 
                            onClick={() => setShowMobileFilters(!showMobileFilters)} 
                            className="xl:hidden flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-50 border border-gray-200 text-xs font-bold text-gray-600 rounded-lg hover:bg-gray-100 shadow-sm transition-colors"
                        >
                            <Filter size={14} className={showMobileFilters ? "text-orange-500" : "text-gray-400"} />
                        </button>
                    </div>

                    <div className={`flex-col md:flex-row gap-2 w-full xl:w-auto ${showMobileFilters ? 'flex' : 'hidden xl:flex'}`}>
                        {uniqueClasses.length > 0 && (
                            <div className="relative flex-1">
                                <select 
                                    value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                                    className="w-full rtl:pr-8 rtl:pl-3 ltr:pl-8 ltr:pr-3 py-2 bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 appearance-none shadow-sm cursor-pointer text-start"
                                >
                                    <option value="all">{t('supervisor.timetablePage.allClasses')}</option>
                                    {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="absolute rtl:left-3 ltr:right-3 top-2.5 text-xs text-orange-500 pointer-events-none">▼</div>
                            </div>
                        )}

                        <div className="relative flex-1">
                            <select 
                                value={filterDay} onChange={(e) => setFilterDay(e.target.value)}
                                className="w-full rtl:pr-8 rtl:pl-3 ltr:pl-8 ltr:pr-3 py-2 bg-orange-50 border border-orange-200 text-sm font-bold text-orange-700 rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 appearance-none shadow-sm cursor-pointer text-start"
                            >
                                <option value="all">{t('supervisor.timetablePage.wholeWeek')}</option>
                                {DAYS_ORDER.map(d => <option key={d} value={d}>{t(`supervisor.timetablePage.days.${d}`)}</option>)}
                            </select>
                            <div className="absolute rtl:left-3 ltr:right-3 top-2.5 text-xs text-orange-500 pointer-events-none">▼</div>
                        </div>

                        <div className="relative flex-1">
                            <Search className="absolute rtl:right-2.5 ltr:left-2.5 top-2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder={t('supervisor.timetablePage.searchPlaceholder')}
                                value={searchTeacher}
                                onChange={(e) => setSearchTeacher(e.target.value)}
                                className="rtl:pr-8 rtl:pl-3 ltr:pl-8 ltr:pr-3 py-2 bg-slate-50 border border-slate-200 text-sm font-medium rounded-lg outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 w-full shadow-sm text-start"
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="h-[400px] bg-white rounded-2xl animate-pulse border border-slate-100 flex items-center justify-center">
                        <p className="text-slate-400 font-bold">{t('supervisor.timetablePage.loadingGrid')}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
                        <Filter size={40} className="mx-auto text-gray-300 mb-6" />
                        <h3 className="text-xl font-black text-gray-800 mb-2">{t('supervisor.timetablePage.noCourses')}</h3>
                        <p className="text-gray-500 font-medium">{t('supervisor.timetablePage.emptyTimetable')}</p>
                    </div>
                ) : (
                    <div className="mt-6 space-y-6">
                        {classesToRender.map(cls => (
                            <ClassTimetable 
                                key={cls} 
                                title={cls} 
                                schedules={filtered.filter(s => s.class === cls)} 
                                activeDays={activeDays} 
                                timePosFn={getTimePos}
                                HOUR_HEIGHT={HOUR_HEIGHT}
                                HOURS={HOURS}
                                t={t}
                            />
                        ))}
                    </div>
                )}
            </div>
        </SupervisorLayout>
    );
};

export default TimetablePage;
