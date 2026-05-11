import Button from '../../../shared/components/ui/Button';
import { Check, X } from 'lucide-react';
import { getStatusColors } from '../../../shared/styles/colors';

export interface AttendanceButtonProps {
    status: 'pending' | 'present' | 'absent' | 'late' | 'cancelled';
    onMark: (status: 'present' | 'absent') => void;
    loading?: boolean;
}

export const AttendanceButton = ({ status, onMark, loading = false }: AttendanceButtonProps) => {
    if (status !== 'pending') {
        const colors = getStatusColors(status);
        
        let label = '';
        let variant: 'success' | 'danger' | 'secondary' = 'danger';
        let icon = null;

        if (status === 'present') {
            label = 'Présent enregistré';
            variant = 'success';
            icon = <Check size={18} className={colors.icon} />;
        } else if (status === 'absent') {
            label = 'Absent enregistré';
            variant = 'danger';
            icon = <X size={18} className={colors.icon} />;
        } else if (status === 'cancelled') {
            label = 'Séance annulée';
            variant = 'danger';
            icon = <X size={18} className={colors.icon} />;
        } else if (status === 'late') {
            label = 'Retard enregistré';
            variant = 'secondary';
            icon = <Check size={18} className={colors.icon} />;
        }

        return (
            <Button
                variant={variant}
                fullWidth
                disabled
                className={`opacity-100 cursor-default ${colors.bg} ${colors.text} ${colors.border}`}
                leftIcon={icon}
            >
                {label}
            </Button>
        );
    }

    return (
        <div className="flex gap-3 mt-4" dir="ltr">
            <Button
                variant="success"
                fullWidth
                onClick={() => onMark('present')}
                loading={loading}
                disabled={loading}
                leftIcon={!loading && <Check size={18} />}
                className="shadow-sm hover:shadow"
            >
                Présent
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
                Absent
            </Button>
        </div>
    );
};

export default AttendanceButton;
