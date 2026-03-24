import { useState } from 'react';
import { supabase } from '../../../services/supabase/client';
import { useAuth } from '../../auth/hooks/useAuth';
import { useToast } from '../../../shared/hooks/useToast';
import * as XLSX from 'xlsx';

const parseJour = (raw: any) => {
  const s = String(raw || '').replace(/\\n/g, '\n').trim();
  const lines = s.split('\n');
  const day = lines[0]?.trim() || 'Lundi';
  const match = (lines[1] || '').match(/(\d{1,2})h\s*[-]\s*(\d{1,2})h/);
  return {
    day,
    time_start: match ? `${match[1].padStart(2,'0')}:00:00` : '08:00:00',
    time_end:   match ? `${match[2].padStart(2,'0')}:00:00` : '10:00:00',
  };
};

export const useWeekUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadWeek = async (file: File): Promise<boolean> => {
    setIsUploading(true);
    setUploadProgress(10);

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];

          // Lire toutes les lignes comme tableau de tableaux
          const allRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', range: 2 }) as any[][];

          // Trouver la ligne qui contient "Classe" comme header réel
          const headerRowIndex = allRows.findIndex(row =>
            row.some((cell: any) => String(cell).trim() === 'Classe')
          );

          if (headerRowIndex === -1) throw new Error('Colonne "Classe" introuvable dans le fichier');

          const headers = allRows[headerRowIndex].map((h: any) => String(h).trim());
          const dataRows = allRows.slice(headerRowIndex + 1);

          console.log('[Upload] Headers found at row', headerRowIndex, ':', headers);
          console.log('[Upload] Data rows:', dataRows.length);

          // Convertir en objets
          const objects = dataRows.map(row => {
            const obj: Record<string, any> = {};
            headers.forEach((h, i) => { if (h) obj[h] = row[i] ?? ''; });
            return obj;
          });

          // Filtrer lignes valides
          const validRows = objects.filter(obj => {
            const cls = String(obj['Classe'] ?? '').trim();
            return cls && cls !== 'Classe' && !cls.includes('Établissement');
          });

          if (validRows.length === 0) throw new Error('Aucune ligne valide trouvée');

          console.log('[Upload] Valid rows:', validRows.length);
          console.log('[Upload] Sample pointer:', validRows[0]['Pointeur']);

          setUploadProgress(25);

          // Créer la semaine
          const { data: weekData, error: weekError } = await supabase
            .from('weeks')
            .insert([{
              name: file.name.replace(/\.[^.]+$/, ''),
              start_date: new Date().toISOString().split('T')[0],
              uploaded_by: user?.id ?? null,
            }])
            .select().single();

          if (weekError) throw weekError;
          setUploadProgress(40);

          // Préparer les schedules
          const schedules = validRows.map(obj => {
            const { day, time_start, time_end } = parseJour(obj['Jour']);
            return {
              week_id:    weekData.id,
              class:      String(obj['Classe']    ?? '').trim(),
              subject:    String(obj['Matière']   ?? obj['Matiere'] ?? '').trim(),
              room:       String(obj['Salle']      ?? '').trim() || null,
              teacher:    String(obj['Formateur'] ?? '').trim(),
              pointer:    String(obj['Pointeur']  ?? '').trim() || null,
              day,
              time_start,
              time_end,
              status: 'pending' as const,
            };
          }).filter(s => s.class && s.teacher);

          setUploadProgress(60);

          // Insérer par batch
          let inserted = 0;
          for (let i = 0; i < schedules.length; i += 50) {
            const { error } = await supabase.from('schedules').insert(schedules.slice(i, i + 50));
            if (error) throw error;
            inserted += Math.min(50, schedules.length - i);
            setUploadProgress(60 + Math.round((inserted / schedules.length) * 35));
          }

          setUploadProgress(100);
          toast.success(`✅ ${inserted} cours importés avec succès!`);
          resolve(true);

        } catch (err: any) {
          console.error('[Upload Error]', err);
          toast.error(`Erreur: ${err.message}`);
          resolve(false);
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => { setIsUploading(false); resolve(false); };
      reader.readAsArrayBuffer(file);
    });
  };

  return { uploadWeek, isUploading, uploadProgress };
};