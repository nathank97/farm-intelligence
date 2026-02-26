import Card from '@/components/ui/Card';

interface StatsCardProps {
  title: string;
  value: string;
  change?: { value: number; label: string };
  className?: string;
}

export default function StatsCard({ title, value, change, className = '' }: StatsCardProps) {
  return (
    <Card className={className}>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        {change && (
          <p className={`mt-1 text-sm ${change.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change.value >= 0 ? '+' : ''}{change.value.toFixed(1)}% {change.label}
          </p>
        )}
      </div>
    </Card>
  );
}
