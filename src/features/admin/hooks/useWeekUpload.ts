import { useState } from 'react';
import { supabase } from '../../../services/supabase/client';
import { useToast } from '../../../shared/hooks/useToast';
import * as XLSX from 'xlsx';

export const useWeekUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  /**
   * دالة لتنظيف وتفكيك نص اليوم والوقت
   * تحول "Jeudi\n08h - 10h" إلى { dayName: "Jeudi", startTime: "08:00:00", endTime: "10:00:00" }
   */
  const parseDateTime = (rawDay: any) => {
    try {
      const cleanText = String(rawDay || '').replace(/\r/g, '').trim();
      const parts = cleanText.split('\n');
      
      const dayName = parts[0].trim();
      const timeRange = parts[1] ? parts[1].trim() : '';

      let startTime = "08:00:00";
      let endTime = "10:00:00";

      if (timeRange.includes('-')) {
        const times = timeRange.split('-').map(t => {
          let hour = t.toLowerCase().replace('h', '').trim();
          // ضمان تنسيق الوقت HH:00:00
          return hour.padStart(2, '0') + ':00:00';
        });
        startTime = times[0];
        endTime = times[1];
      }

      return { dayName, startTime, endTime };
    } catch (e) {
      console.error("Error parsing date/time:", rawDay);
      return { dayName: String(rawDay), startTime: "08:00:00", endTime: "10:00:00" };
    }
  };

  const uploadWeek = async (file: File, weekName: string, startDate: string) => {
    // إعداد القيم الافتراضية
    const finalStartDate = startDate || new Date().toISOString().split('T')[0];
    const finalWeekName = weekName || `أسبوع - ${finalStartDate}`;

    setIsUploading(true);
    setUploadProgress(10);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        
        // 1. قراءة الملف (يدعم Excel و CSV)
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // تحويل البيانات إلى مصفوفة صفوف (Array of Arrays)
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (!rows || rows.length === 0) throw new Error("الملف فارغ أو غير صالح!");

        // 2. البحث عن سطر العناوين (Classe, Matière, Jour...)
        const headerIndex = rows.findIndex(row => 
          row && Array.isArray(row) && row.some(cell => {
            const c = String(cell || '').toLowerCase();
            return c.includes('classe') || c.includes('matière') || c.includes('jour');
          })
        );

        // إذا لم يجد العناوين تلقائياً، نفترض السطر الثالث (النموذجي لملفات MPG)
        const actualHeaderIndex = headerIndex !== -1 ? headerIndex : 2;
        const headers = rows[actualHeaderIndex].map(h => String(h || '').trim());
        const dataRows = rows.slice(actualHeaderIndex + 1);

        console.log("[Debug] العناوين المكتشفة:", headers);

        // 3. إنشاء سجل الأسبوع في Supabase
        const { data: weekData, error: weekError } = await supabase
          .from('weeks')
          .insert([{ 
            name: finalWeekName, 
            start_date: finalStartDate 
          }])
          .select()
          .single();

        if (weekError) throw weekError;

        // 4. تحضير الحصص للرفع (تجهيز الـ Objects)
        const schedulesToInsert = dataRows
          .map((row) => {
            if (!row || row.length === 0) return null;

            const obj: any = {};
            headers.forEach((header, i) => {
              if (header) obj[header] = row[i];
            });

            const className = obj['Classe'] || obj['classe'] || obj['class'];
            const dayRow = obj['Jour'] || obj['jour'] || obj['day'];

            // استثناء الصفوف الفارغة أو الترويسات المكررة
            if (!className || !dayRow || String(className).includes('Établissement')) {
              return null;
            }

            const { dayName, startTime, endTime } = parseDateTime(dayRow);

            // إرجاع الكائن بما يتوافق مع قاعدة البيانات الحالية
            return {
              week_id: weekData.id,
              class: String(className).trim(),
              subject: String(obj['Matière'] || obj['matière'] || obj['subject'] || '').trim(),
              room: String(obj['Salle'] || obj['salle'] || obj['room'] || '').trim(),
              teacher: String(obj['Formateur'] || obj['formateur'] || obj['teacher'] || '').trim(),
              day: dayName,
              time_start: startTime,
              time_end: endTime,
              status: 'pending'
            };
          })
          .filter(item => item !== null);

        if (schedulesToInsert.length === 0) {
          throw new Error("لم يتم العثور على حصص صالحة في الملف.");
        }

        setUploadProgress(50);

        // 5. الرفع الجماعي للحصص إلى Supabase
        const { error: scheduleError } = await supabase
          .from('schedules')
          .insert(schedulesToInsert);

        if (scheduleError) throw scheduleError;

        toast.success(`تم رفع ${schedulesToInsert.length} حصة بنجاح!`);
        setUploadProgress(100);

      } catch (error: any) {
        console.error('Upload Error:', error);
        toast.error(`فشل الرفع: ${error.message}`);
      } finally {
        setIsUploading(false);
      }
    };

    // قراءة الملف كـ Buffer لدعم ملفات Excel
    reader.readAsArrayBuffer(file);
  };

  return { uploadWeek, isUploading, uploadProgress };
};