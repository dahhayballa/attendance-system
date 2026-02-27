import Button from '../../../shared/components/ui/Button';
import { Check, X } from 'lucide-react';

export interface AttendanceButtonProps {
    status: 'pending' | 'present' | 'absent';
    onMark: (status: 'present' | 'absent') => void;
    loading?: boolean;
}

export const AttendanceButton = ({ status, onMark, loading = false }: AttendanceButtonProps) => {
    if (status !== 'pending') {
        return (
            <Button
                variant={status === 'present' ? 'success' : 'danger'}
                fullWidth
                disabled
                className="opacity-100 cursor-default"
                leftIcon={status === 'present' ? <Check size={18} /> : <X size={18} />}
            >
                {status === 'present' ? 'تم تسجيل الحضور' : 'تم تسجيل الغياب'}
            </Button>
        );
    }

    return (
        <div className="flex gap-3 mt-4">
            <Button
                variant="success"
                fullWidth
                onClick={() => onMark('present')}
                loading={loading}
                disabled={loading}
                leftIcon={!loading && <Check size={18} />}
                className="shadow-sm hover:shadow"
            >
                حاضر
            </Button>
            <Button
                variant="danger"
                fullWidth
                onClick={() => onMark('absent')}
                loading={loading}
                disabled={loading}
                leftIcon={!loading && <X size={18} />}
                className="shadow-sm hover:shadow"
            >
                غائب
            </Button>
        </div>
    );
};

export default AttendanceButton;
