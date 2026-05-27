import type { ReactNode, ElementType } from "react";

interface PageHeaderProps {
  icon: ElementType;
  title: string;
  extra?: ReactNode;
  children?: ReactNode;
}

export default function PageHeader({ icon: Icon, title, extra, children }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 backdrop-blur">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
        {extra}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
