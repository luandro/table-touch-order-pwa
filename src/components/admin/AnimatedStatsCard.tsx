import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AnimatedStatsCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  iconColor: string;
  previousValue?: number;
  trend?: 'up' | 'down' | 'neutral';
}

const AnimatedStatsCard = ({
  icon: Icon,
  value,
  label,
  iconColor,
  previousValue,
  trend = 'neutral'
}: AnimatedStatsCardProps) => {
  const [displayValue, setDisplayValue] = useState(previousValue || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true);

      const startValue = displayValue;
      const endValue = value;
      const duration = 800; // 0.8 seconds
      const startTime = Date.now();

      const animate = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);

        const currentValue = Math.round(startValue + (endValue - startValue) * easeOutCubic);
        setDisplayValue(currentValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, displayValue]);

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="pt-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Icon className={`w-5 h-5 ${iconColor}`} />
            {isAnimating && (
              <div className="absolute inset-0 rounded-full border-2 border-current opacity-30 animate-ping" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-baseline space-x-2">
              <p className={`text-2xl font-bold counter-animate ${isAnimating ? 'count-up' : ''}`}>
                {displayValue}
              </p>
              {trend !== 'neutral' && previousValue !== undefined && (
                <span className={`text-xs font-medium ${getTrendColor()}`}>
                  {getTrendIcon()}
                  {Math.abs(value - previousValue)}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-1">
              {label}
            </p>
          </div>
        </div>

        {/* Progress indicator for active values */}
        {value > 0 && (
          <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-500 ${
                iconColor.includes('blue') ? 'bg-blue-500' :
                iconColor.includes('yellow') ? 'bg-yellow-500' :
                iconColor.includes('green') ? 'bg-green-500' :
                'bg-gray-500'
              }`}
              style={{
                width: `${Math.min((value / 10) * 100, 100)}%`
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnimatedStatsCard;
