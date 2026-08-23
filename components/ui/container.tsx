import * as React from "react";

import { SITE_CONTAINER } from "@/lib/site/publicPageLayout";
import { cn } from "@/lib/utils";

export function Container({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(SITE_CONTAINER, className)}
      {...props}
    />
  );
}

