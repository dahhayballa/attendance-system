import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { updateScheduleStatus } from '../../../services/supabase/schedule.service';
import { createAttendanceLog } from '../../../services/supabase/attendance.service';
import { useToast } from '../../../shared/hooks/useToast';
import { Schedule } from '../../../types';

export interface MarkAttendanceResult {
    success: boolean;
    schedule?: Schedule;
    error?: any;
}

export const useAttendance = () => {
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const markAttendance = async (scheduleId: string, status: 'present' | 'absent'): Promise<MarkAttendanceResult> => {
        if (!user) {
            toast.error('يجب تسجيل الدخول لتسجيل الحضور');
            return { success: false };
        }

        setLoadingId(scheduleId);

        try {
            const updatedSchedule = await updateScheduleStatus(scheduleId, status, user.id);
            await createAttendanceLog(scheduleId, user.id, status);
            toast.success(status === 'present' ? 'تم تسجيل حضور الأستاذ بنجاح' : 'تم تسجيل غياب الأستاذ');
            return { success: true, schedule: updatedSchedule };
        } catch (error: any) {
            console.error('Attendance mark error:', error);
            toast.error('حدث خطأ أثناء تسجيل الحضور');
            return { success: false, error };
        } finally {
            setLoadingId(null);
        }
    };

    return {
        markAttendance,
        loadingId
    };
};
