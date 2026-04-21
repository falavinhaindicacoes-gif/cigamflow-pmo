import React from 'react';
import { cn } from '@/lib/utils';

export default function CapacityGauge({ percentage, size = 'md' }) {
  const getColor = (pct) => {
    if (pct <= 80) return { bar: 'bg-green-500', text: 'text-green-700', label: 'Disponível' };
    if (pct <= 100) return { bar: 'bg-yellow-500', text: 'text-yellow-700', label: 'Atenção' };
    return { bar: 'bg-red-500', text: 'text-red-700', label: 'Sobrecarregado' };
  };

  const color = getColor(percentage);
  const displayPct = Math.min(percentage, 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={cn("font-semibold", color.text, size === 'sm' ? 'text-xs' : 'text-sm')}>
          {Math.round(percentage)}%
        </span>
        <span className={cn("text-muted-foreground", size === 'sm' ? 'text-[10px]' : 'text-xs')}>
          {color.label}
        </span>
      </div>
      <div className={cn("rounded-full bg-muted overflow-hidden", size === 'sm' ? 'h-1.5' : 'h-2')}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", color.bar)}
          style={{ width: `${displayPct}%` }}
        />
      </div>
    </div>
  );
}