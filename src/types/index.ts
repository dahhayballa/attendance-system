export interface User {
    id: string;
    email: string;
    name?: string;
    role: 'admin' | 'supervisor' | 'surveillance' | null;
}

export interface Schedule {
    id: string;
    week_id: string;
    day: string;
    time_start: string;
    time_end: string;
    teacher: string;
    subject: string;
    class: string;
    room?: string | null;
    status: 'pending' | 'present' | 'absent' | 'late' | 'cancelled';
    recorded_by?: string | null;
    recorded_at?: string | null;
    // Cancellation fields (added via SQL migration)
    cancellation_reason?: string | null;
    cancelled_by?: string | null;
    cancelled_at?: string | null;
    recorded_by_user?: {
        id: string;
        email: string;
        role?: string;
    };
}

// Filters for bulk schedule suspension (used by admin)
export interface SuspensionFilters {
    week_id: string;
    day?: string;     // If empty = entire week
    class?: string;   // If empty = all classes
    reason: string;   // Cancellation reason (required)
}

export interface AttendanceLog {
    id: string;
    schedule_id: string;
    user_id: string;
    status: 'present' | 'absent' | 'late' | 'excused' | 'cancelled';
    created_at: string;
    teacher_name?: string;
    class_name?: string;
    subject?: string;
    user_name?: string;
    schedule?: {
        teacher: string;
        subject: string;
        class: string;
    };
    user?: {
        email: string;
    };
}

export interface ScheduleStats {
    total: number;
    present: number;
    absent: number;
    recorded: number;
    pending: number;
    rate: number;
}
// ================================================================
// PHASE 1: NOUVEAUX TYPES À AJOUTER
// ================================================================
// Fichier: src/types/index.ts
// Action: AJOUTE ces types à ton fichier existant (ne supprime rien!)
// ================================================================

// ─────────────────────────────────────────────────────────────
// 1. STATUTS DE PRÉSENCE AVANCÉS
// ─────────────────────────────────────────────────────────────

export type AttendanceStatus = 
  | 'pending'           // ⏳ En attente d'enregistrement
  | 'present'           // ✅ Présent à l'heure
  | 'late'              // ⏰ Présent en retard
  | 'absent'            // ❌ Absent non justifié
  | 'absent_justified'  // 📝 Absent justifié
  | 'left_early'        // 🚪 Sorti avant la fin
  | 'exceptional'       // ⚠️ Absence exceptionnelle

// ─────────────────────────────────────────────────────────────
// 2. ENREGISTREMENT DE PRÉSENCE AVANCÉ
// ─────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string
  schedule_id: string
  status: AttendanceStatus
  
  // Gestion du retard
  late_minutes?: number           // Durée du retard en minutes
  
  // Justification
  reason?: string                 // Motif (obligatoire si late/absent/...)
  evidence_url?: string           // URL preuve (photo certificat, etc.)
  
  // Système de points
  points: number                  // Points attribués (-10 à +10)
  
  // Traçabilité
  device_info?: DeviceInfo        // Info de l'appareil
  location?: string               // Localisation GPS (optionnel)
  
  // Audit
  recorded_by: string             // ID du superviseur
  recorded_at: string             // Timestamp précis
  audit_trail?: AuditEntry[]      // Historique des modifications
}

// ─────────────────────────────────────────────────────────────
// 3. INFORMATIONS DE L'APPAREIL
// ─────────────────────────────────────────────────────────────

export interface DeviceInfo {
  userAgent: string               // Mozilla/5.0...
  platform: string                // Win32, MacIntel, iPhone...
  language: string                // fr, ar, en...
  screenResolution: string        // 1920x1080
}

// ─────────────────────────────────────────────────────────────
// 4. ENTRÉE D'AUDIT
// ─────────────────────────────────────────────────────────────

export interface AuditEntry {
  action: 'created' | 'updated' | 'deleted'
  by: string                      // User ID
  at: string                      // ISO timestamp
  details?: Record<string, any>   // Données additionnelles
}

// ─────────────────────────────────────────────────────────────
// 5. STATISTIQUES PAR PROFESSEUR
// ─────────────────────────────────────────────────────────────

export interface ProfessorStats {
  professor_id: string
  professor_name: string
  
  // Compteurs
  total_sessions: number
  present_count: number
  late_count: number
  absent_count: number
  absent_justified_count: number
  
  // Moyennes
  late_average_minutes: number    // Durée moyenne des retards
  attendance_rate: number         // Taux de présence (%)
  
  // Système de points
  points_total: number            // Total des points
  points_average: number          // Moyenne des points
  
  // Tendance
  trend: 'up' | 'down' | 'stable'
}

// ─────────────────────────────────────────────────────────────
// 6. RAPPORT HEBDOMADAIRE
// ─────────────────────────────────────────────────────────────

export interface WeeklyReport {
  id: string
  week_start: string              // 2026-03-03
  week_end: string                // 2026-03-09
  
  // Totaux
  total_sessions: number
  total_hours: number
  
  // Par statut
  by_status: {
    present: number
    late: number
    absent: number
    absent_justified: number
    left_early: number
    exceptional: number
  }
  
  // Analyse par dimension
  by_professor: ProfessorStats[]
  by_subject: SubjectStats[]
  by_class: ClassStats[]
  by_day: DayStats[]
  
  // Alertes
  alerts: Alert[]
  
  // Meta
  generated_at: string
  generated_by: string
}

// ─────────────────────────────────────────────────────────────
// 7. STATS PAR MATIÈRE
// ─────────────────────────────────────────────────────────────

export interface SubjectStats {
  subject: string
  total_sessions: number
  attendance_rate: number         // %
  average_points: number
}

// ─────────────────────────────────────────────────────────────
// 8. STATS PAR CLASSE
// ─────────────────────────────────────────────────────────────

export interface ClassStats {
  class: string
  total_sessions: number
  attendance_rate: number         // %
  average_points: number
}

// ─────────────────────────────────────────────────────────────
// 9. STATS PAR JOUR
// ─────────────────────────────────────────────────────────────

export interface DayStats {
  day: string                     // الاثنين, Mardi...
  date: string                    // 2026-03-03
  total_sessions: number
  attendance_rate: number         // %
  problems: string[]              // Liste des problèmes identifiés
}

// ─────────────────────────────────────────────────────────────
// 10. ALERTES
// ─────────────────────────────────────────────────────────────

export interface Alert {
  id: string
  type: AlertType
  
  // Professeur concerné
  professor_id: string
  professor_name: string
  
  // Message
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  
  // Meta
  created_at: string
  acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: string
}

export type AlertType = 
  | 'frequent_late'               // 3+ retards
  | 'frequent_absent'             // 2+ absences non justifiées
  | 'low_rate'                    // Taux < 75%
  | 'pattern_detected'            // Pattern détecté (toujours lundi, etc.)
  | 'sudden_drop'                 // Chute soudaine

// ─────────────────────────────────────────────────────────────
// 11. FILTRES DE RECHERCHE
// ─────────────────────────────────────────────────────────────

export interface AttendanceFilters {
  week_id?: string
  professor?: string
  subject?: string
  class?: string
  day?: string
  status?: AttendanceStatus
  from_date?: string
  to_date?: string
}

// ─────────────────────────────────────────────────────────────
// 12. RÉSUMÉ STATISTIQUES
// ─────────────────────────────────────────────────────────────

export interface StatsSummary {
  total: number
  present: number
  late: number
  absent: number
  absent_justified: number
  left_early: number
  exceptional: number
  pending: number
  
  // Calculés
  recorded: number                // present + late + absent + ...
  attendance_rate: number         // %
  punctuality_rate: number        // % présent à l'heure
  average_points: number
}

// ================================================================
// FIN DES NOUVEAUX TYPES
// ================================================================
// IMPORTANT: Garde tous tes types existants!
// Ces nouveaux types viennent COMPLÉTER ce que tu as déjà
// ================================================================