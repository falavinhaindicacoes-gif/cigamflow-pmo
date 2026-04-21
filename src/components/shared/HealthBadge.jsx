import React from 'react';
import { SAUDE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function HealthBadge({ saude, size = 'sm' }) {
  const info = SAUDE_COLORS[saude] || SAUDE_COLORS.verde;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 font-medium rounded-full border",
      info.bg, info.text, info.border,
      size === 'sm' ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
    )}>
      <span className={cn("rounded-full", info.dot, size === 'sm' ? "w-1.5 h-1.5" : "w-2 h-2")} />
      {info.label}
    </span>
  );
}