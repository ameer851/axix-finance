import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  children,
  actions,
  className
}) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="px-6 py-5 flex justify-between items-center">
        <div>
          <CardTitle className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">
              {description}
            </CardDescription>
          )}
        </div>
        {actions && (
          <div className="flex space-x-3">
            {actions}
          </div>
        )}
      </CardHeader>
      <CardContent className="border-t border-gray-200 dark:border-gray-700 p-0">
        {children}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
