import { memo } from 'react';
import Card from '../../../shared/components/ui/Card';
import Badge from '../../../shared/components/ui/Badge';
import AttendanceButton from './AttendanceButton';
import { Clock, User, BookOpen, MapPin, Building, Calendar } from 'lucide-react';
import { formatTime } from '../../../shared/utils/formatters';
import { Schedule } from '../../../types';

export interface ScheduleCardProps {
    schedule: Schedule;
    onMark: (scheduleId: string, status: 'present' | 'absent') => void;
    loadingId?: string | null;
}

export const ScheduleCard = memo(({ schedule, onMark, loadingId }: ScheduleCardProps) => {
    const isPending = schedule.status === 'pending';
    const isLoading = loadingId === schedule.id;

    return (
        <Card
            hover={isPending}
            className={`border-l-4 overflow-hidden relative ${isPending ? 'border-l-blue-500 shadow-sm'
                : schedule.status === 'present' ? 'border-l-green-500 bg-gray-50/50 opacity-90'
                    : 'border-l-red-500 bg-gray-50/50 opacity-90'
                }`}
            padding="p-0"
        >
            <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-bold" dir="ltr">{schedule.day}</span>
                    </div>
                    <div>
                        <Badge variant={schedule.status}>
                            {isPending ? 'بانتظار التسجيل' : schedule.status === 'present' ? 'حاضر' : 'غائب'}
                        </Badge>
                    </div>
                </div>

                <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className="bg-gray-100 p-2.5 rounded-xl border border-gray-200">
                        <Clock className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-0.5 font-medium">الوقت</p>
                        <div className="flex items-center gap-1.5 font-mono text-gray-900 font-bold" dir="ltr">
                            {schedule.time_start} - {schedule.time_end}
                        </div>
                    </div>
                </div>

                <div className="space-y-3 bg-gray-50/80 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                        <User className="h-5 w-5 text-gray-400 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 font-medium leading-none mb-1">الأستاذ</p>
                            <p className="font-bold text-gray-900 text-base leading-tight">{schedule.teacher}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-gray-400 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 font-medium leading-none mb-1">المادة</p>
                            <p className="font-medium text-gray-800 text-sm leading-tight">{schedule.subject}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-gray-400 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500 font-medium leading-none mb-1">الفصل</p>
                            <p className="font-medium text-gray-800 text-sm leading-tight">{schedule.class}</p>
                        </div>
                    </div>

                    {schedule.room && (
                        <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-gray-400 shrink-0" />
                            <div>
                                <p className="text-xs text-gray-500 font-medium leading-none mb-1">القاعة</p>
                                <p className="font-medium text-gray-800 text-sm leading-tight">{schedule.room}</p>
                            </div>
                        </div>
                    )}
                </div>

                {!isPending && schedule.recorded_by_user && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex justify-between items-center text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                <span>سجلها: {schedule.recorded_by_user.email?.split('@')[0]}</span>
                            </div>
                            <span>{formatTime(schedule.recorded_at)}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="px-5 pb-5 pt-0">
                <AttendanceButton
                    status={schedule.status}
                    onMark={(status: 'present' | 'absent') => onMark(schedule.id, status)}
                    loading={isLoading}
                />
            </div>
        </Card>
    );
});

ScheduleCard.displayName = 'ScheduleCard';
export default ScheduleCard;
