export const statusColors = {
  present: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    hoverBg: 'hover:bg-green-100',
    hoverBorder: 'hover:border-green-300',
    ring: 'ring-green-500',
    icon: 'text-green-600',
  },
  absent: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    hoverBg: 'hover:bg-red-100',
    hoverBorder: 'hover:border-red-300',
    ring: 'ring-red-500',
    icon: 'text-red-600',
  },
  late: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    hoverBg: 'hover:bg-amber-100',
    hoverBorder: 'hover:border-amber-300',
    ring: 'ring-amber-500',
    icon: 'text-amber-600',
  },
  excused: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    hoverBg: 'hover:bg-blue-100',
    hoverBorder: 'hover:border-blue-300',
    ring: 'ring-blue-500',
    icon: 'text-blue-600',
  },
  pending: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    hoverBg: 'hover:bg-gray-100',
    hoverBorder: 'hover:border-gray-300',
    ring: 'ring-gray-500',
    icon: 'text-gray-500',
  }
} as const;

export type StatusType = keyof typeof statusColors;

export const getStatusColors = (status: StatusType | string) => {
  return statusColors[status as StatusType] || statusColors.pending;
};