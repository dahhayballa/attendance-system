export interface User {
    id: string;
    email: string;
    role: 'admin' | 'supervisor' | null;
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
    status: 'pending' | 'present' | 'absent';
    recorded_by?: string | null;
    recorded_at?: string | null;
    recorded_by_user?: {
        id: string;
        email: string;
        role?: string;
    };
}

export interface AttendanceLog {
    id: string;
    schedule_id: string;
    user_id: string;
    status: 'present' | 'absent';
    created_at: string;
    teacher_name?: string;
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
