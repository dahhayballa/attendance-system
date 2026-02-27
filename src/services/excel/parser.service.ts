import * as XLSX from 'xlsx';
import { Schedule } from '../../types';

export const parseExcelFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                resolve(jsonData);
            } catch (error) {
                reject(new Error('فشل في قراءة ملف الإكسل'));
            }
        };

        reader.onerror = () => reject(new Error('فشل في قراءة الملف'));
        reader.readAsArrayBuffer(file);
    });
};

export const validateScheduleData = (data: any[]): { valid: boolean; errors: string[] } => {
    if (!data || data.length === 0) {
        return { valid: false, errors: ['الملف فارغ'] };
    }

    const errors: string[] = [];
    const requiredColumns = ['اليوم', 'من الساعة', 'إلى الساعة', 'الأستاذ', 'المادة', 'الفصل'];

    const firstRow = data[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
        errors.push(`الأعمدة التالية مفقودة: ${missingColumns.join('، ')}`);
        return { valid: false, errors };
    }

    return { valid: true, errors: [] };
};

export const transformToSchedules = (data: any[], weekId: string): Partial<Schedule>[] => {
    return data.map(row => ({
        week_id: weekId,
        day: row['اليوم']?.toString().trim() || '',
        time_start: row['من الساعة']?.toString().trim() || '',
        time_end: row['إلى الساعة']?.toString().trim() || '',
        teacher: row['الأستاذ']?.toString().trim() || '',
        subject: row['المادة']?.toString().trim() || '',
        class: row['الفصل']?.toString().trim() || '',
        room: row['القاعة']?.toString().trim() || null,
        status: 'pending'
    }));
};
