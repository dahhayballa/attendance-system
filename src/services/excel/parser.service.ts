import * as XLSX from 'xlsx';

// 1. قراءة ملف الإكسيل
export const parseExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            
            // البدء من الصف الثالث لتجاوز ترويسة ملف MPG
            const jsonData = XLSX.utils.sheet_to_json(sheet, { range: 2 });
            resolve(jsonData);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

// 2. التحقق من الأعمدة المطلوبة في الإكسيل
export const validateScheduleData = (data: any[]) => {
    if (!data || data.length === 0) {
        return { valid: false, errors: ['الملف فارغ أو لا يحتوي على بيانات صالحة'] };
    }

    const requiredFields = ['Classe', 'Matière', 'Formateur', 'Jour', 'Heures'];
    const firstRow = data[0];
    
    const missingFields = requiredFields.filter(field => !(field in firstRow));

    if (missingFields.length > 0) {
        return {
            valid: false,
            errors: [`الملف يفتقد للأعمدة التالية: ${missingFields.join(', ')}`]
        };
    }

    return { valid: true, errors: [] };
};

// 3. تحويل البيانات لتناسب قاعدة البيانات (الأعمدة النهائية: class, teacher, time_start, time_end)
export const transformToSchedules = (jsonData: any[], weekId: string) => {
    return jsonData.map(row => {
        const timeRange = (row['Heures'] || '').toString();
        let startTime = "08:00:00";
        let endTime = "10:00:00";

        if (timeRange.includes('-')) {
            const parts = timeRange.split('-').map((t: string) => {
                const clean = t.trim().toLowerCase().replace('h', '').replace(' ', '');
                if (clean.includes(':')) {
                    const [h, m] = clean.split(':');
                    return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
                }
                return `${clean.padStart(2, '0')}:00:00`;
            });
            
            startTime = parts[0] || "08:00:00";
            endTime = parts[1] || "10:00:00";
        }

        return {
            week_id: weekId,
            class: row['Classe'],     // تم التغيير من class_name إلى class
            subject: row['Matière'],
            room: row['Salle'] || 'N/A',
            teacher: row['Formateur'], // تم التغيير من teacher_name إلى teacher
            day: row['Jour']?.trim(),
            time_start: startTime,
            time_end: endTime,
            status: 'pending'
        };
    });
};