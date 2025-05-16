import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DateRangePickerProps {
  className?: string;
  placeholder?: string;
  onChange?: (dateRange: any) => void;
}

export function DateRangePicker({
  className,
  placeholder = "Select date range",
  onChange,
}: DateRangePickerProps) {
  // Simple stub implementation to prevent build errors
  return (
    <div className={className || ""}>
      <Button
        variant="outline"
        onClick={() => onChange && onChange([new Date(), new Date()])}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        <span>{placeholder}</span>
      </Button>
    </div>
  );
}
