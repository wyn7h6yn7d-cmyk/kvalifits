import * as React from "react";

import { selectControlClassName } from "@/components/ui/controlStyles";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select ref={ref} className={cn(selectControlClassName(), className)} {...props}>
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";
