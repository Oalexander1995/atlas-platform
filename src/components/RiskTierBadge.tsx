import React from 'react';
import { ShieldCheck, ShieldAlert, AlertOctagon, Compass } from 'lucide-react';

export type RiskTier = 'low' | 'medium' | 'high' | 'uncharted';

interface RiskTierBadgeProps {
  tier: RiskTier;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RiskTierBadge({ tier, size = 'md', className = '' }: RiskTierBadgeProps) {
  const configs: Record<
    RiskTier,
    { label: string; icon: React.ComponentType<{ className?: string }>; style: string }
  > = {
    low: {
      label: 'Lower Risk',
      icon: ShieldCheck,
      style: 'bg-teal-50 text-teal-800 border-teal-300 ring-teal-200',
    },
    medium: {
      label: 'Medium Risk',
      icon: ShieldAlert,
      style: 'bg-amber-50 text-amber-800 border-amber-300 ring-amber-200',
    },
    high: {
      label: 'Higher Risk',
      icon: AlertOctagon,
      style: 'bg-orange-50 text-orange-900 border-orange-300 ring-orange-200',
    },
    uncharted: {
      label: 'Higher Risk',
      icon: AlertOctagon,
      style: 'bg-purple-50 text-purple-900 border-purple-300 ring-purple-200',
    },
  };

  const config = configs[tier] || configs.low;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs md:text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-sm md:text-base px-3 py-1.5 gap-2 font-medium',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      title="All projects carry a risk of losing your money"
      className={`inline-flex items-center rounded-full border font-medium ${config.style} ${sizeClasses[size]} ${className}`}
    >
      <Icon className={iconSizes[size]} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}
