export interface Teacher {
    id: string;
    name: string;
    specialization?: string;
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
    room: string;
    status?: 'pending' | 'completed' | 'cancelled' | 'present' | 'absent' | 'late' | 'excused';
    recorded_at?: string;
    recorded_by?: string;
}

export interface Attendance {
    id: string;
    schedule_id: string;
    teacher: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    late_minutes?: number;
    notes?: string;
    recorded_by: string;
    recorded_at: string;
}

export type FilterOptions = {
    day: string;
    class: string;
    teacher: string;
    subject: string;
    room: string;
    specialization: string;
};
