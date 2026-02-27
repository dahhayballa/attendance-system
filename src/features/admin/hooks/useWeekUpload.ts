import { useState } from 'react';
import { useToast } from '../../../shared/hooks/useToast';
import { supabase } from '../../../services/supabase/client';
import { parseExcelFile, validateScheduleData, transformToSchedules } from '../../../services/excel/parser.service';
import { bulkInsertSchedules } from '../../../services/supabase/schedule.service';

export const useWeekUpload = () => {
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const { toast } = useToast();

    const uploadWeek = async (file: File): Promise<boolean> => {
        setIsUploading(true);
        setUploadProgress(10);

        try {
            const jsonData = await parseExcelFile(file);
            setUploadProgress(30);

            const validation = validateScheduleData(jsonData);
            if (!validation.valid) {
                toast.error(validation.errors[0]);
                setIsUploading(false);
                return false;
            }
            setUploadProgress(50);

            const weekName = `الأسبوع ${new Date().toLocaleDateString('ar-MA')}`;
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const weekId = `WEEK-${Date.now()}`;

            // التحقق من وجود الأسبوع
            const { data: existingWeek, error: checkError } = await supabase
                .from('weeks')
                .select('id')
                .eq('start_date', startDate)
                .maybeSingle();

            if (checkError) throw checkError;

            let weekData;
            if (existingWeek) {
                weekData = existingWeek;
                toast.info('هذا الأسبوع موجود مسبقاً، سيتم إضافة الحصص إليه');
            } else {
                const { data: newWeek, error: weekError } = await supabase
                    .from('weeks')
                    .insert([{ 
                        name: weekName, 
                        start_date: startDate,
                        end_date: endDate,
                        week_id: weekId
                    }])
                    .select()
                    .single();

                if (weekError) throw weekError;
                weekData = newWeek;
            }
            setUploadProgress(70);

            const schedules = transformToSchedules(jsonData, weekData.id);
            await bulkInsertSchedules(schedules);
            setUploadProgress(100);

            toast.success(`تم رفع ${schedules.length} حصة بنجاح والتسجيل كـ ${weekName}`);
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 500);
            return true;

        } catch (error: any) {
            console.error('Upload Error:', error);
            toast.error(error.message || 'حدث خطأ أثناء رفع الجدول');
            setIsUploading(false);
            setUploadProgress(0);
            return false;
        }
    };

    return { uploadWeek, isUploading, uploadProgress };
};