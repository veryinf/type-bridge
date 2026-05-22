import { Link, useRoute } from "wouter";
import { Home, Settings, Info, ScrollText, Sun, Moon } from "lucide-react";
import { cn } from "../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";
import { useTheme } from "../hooks/useTheme";

const navItems = [
  { href: "/", icon: Home, label: "主页" },
  { href: "/logs", icon: ScrollText, label: "操作日志" },
  { href: "/settings", icon: Settings, label: "设置" },
  { href: "/about", icon: Info, label: "关于" },
];

function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const [isActive] = useRoute(href);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={href}>
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
              isActive
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium truncate">{label}</span>
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export default function Sidebar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex flex-col w-48 bg-card border-r border-border h-screen shrink-0">
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">EI</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Type Bridge</h1>
            <p className="text-[10px] text-muted-foreground">手机电脑输入同步</p>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-border space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleTheme}
                className={cn(
                  "flex items-center justify-center w-full gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 shrink-0" />
                ) : (
                  <Moon className="h-4 w-4 shrink-0" />
                )}
                <span className="text-xs font-medium">
                  {theme === "dark" ? "浅色模式" : "深色模式"}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              切换到{theme === "dark" ? "浅色" : "深色"}模式
            </TooltipContent>
          </Tooltip>
          <p className="text-[10px] text-muted-foreground text-center">
            veryinf/type-bridge
          </p>
        </div>
      </aside>
    </TooltipProvider>
  );
}
