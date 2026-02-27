import Card from '../../../shared/components/ui/Card';
import { formatDate, formatTime } from '../../../shared/utils/formatters';
import Badge from '../../../shared/components/ui/Badge';
import { AttendanceLog } from '../../../types';

export interface ActivityLogProps {
    logs: AttendanceLog[];
    loading: boolean;
}

export const ActivityLog = ({ logs, loading }: ActivityLogProps) => {
    if (loading) {
        return (
            <Card header={<h3 className="text-lg font-bold text-gray-900 pb-2">سجل النشاطات الأخيرة</h3>}>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex gap-4">
                            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    return (
        <Card header={<h3 className="text-lg font-bold text-gray-900 pb-2">سجل النشاطات الأخيرة</h3>} padding="p-0">
            <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {logs && logs.length > 0 ? logs.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                        <div className="bg-blue-100 text-blue-600 p-2 rounded-full mt-1 flex-shrink-0 w-10 h-10 flex items-center justify-center">
                            <span className="text-sm font-bold">{log.user_name?.[0] || 'م'}</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-gray-900 text-sm">
                                    المراقب {log.user_name} سجل حضوراً
                                </p>
                                <div className="text-xs text-gray-500" dir="ltr">
                                    {formatTime(log.created_at)}
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                                الأستاذ: <span className="font-medium">{log.teacher_name}</span> - مادة: {log.subject}
                            </p>
                            <div className="flex items-center gap-2">
                                <Badge variant={log.status}>{log.status === 'present' ? 'حاضر' : 'غائب'}</Badge>
                                <span className="text-xs text-gray-400">{formatDate(log.created_at)}</span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        لا توجد نشاطات مسجلة حديثاً
                    </div>
                )}
            </div>
            {logs && logs.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-b-xl text-center border-t border-gray-100">
                    <button className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none">
                        عرض كل السجل
                    </button>
                </div>
            )}
        </Card>
    );
};

export default ActivityLog;
