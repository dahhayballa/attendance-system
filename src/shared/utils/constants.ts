export const ROLES = {
    ADMIN: 'admin' as const,
    SUPERVISOR: 'supervisor' as const
};

export type Role = typeof ROLES[keyof typeof ROLES];

export const ATTENDANCE_STATUS = {
    PENDING: 'pending' as const,
    PRESENT: 'present' as const,
    ABSENT: 'absent' as const
};

export type AttendanceStatus = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];
