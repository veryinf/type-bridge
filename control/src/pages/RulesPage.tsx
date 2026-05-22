import { useState } from "react";
import { ListChecks, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "../components/ui/dialog";
import { z } from "zod";

const ruleSchema = z.object({
  pattern: z.string().min(1, "正则表达式不能为空").refine(
    (val) => {
      try { new RegExp(val); return true; } catch { return false; }
    },
    { message: "无效的正则表达式" }
  ),
  replacement: z.string(),
});

interface Rule {
  id: number;
  pattern: string;
  replacement: string;
  enabled: boolean;
}

const defaultRules: Rule[] = [
  { id: 1, pattern: "毫安时", replacement: "mAh", enabled: true },
  { id: 2, pattern: "赫兹", replacement: "Hz", enabled: true },
  { id: 3, pattern: "伏特", replacement: "V", enabled: true },
  { id: 4, pattern: "(艾特)\\s*(QQ)\\s*点", replacement: "@qq.", enabled: false },
];

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>(defaultRules);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [pattern, setPattern] = useState("");
  const [replacement, setReplacement] = useState("");
  const [error, setError] = useState("");

  const openAddDialog = () => {
    setEditingRule(null);
    setPattern("");
    setReplacement("");
    setError("");
    setDialogOpen(true);
  };

  const openEditDialog = (rule: Rule) => {
    setEditingRule(rule);
    setPattern(rule.pattern);
    setReplacement(rule.replacement);
    setError("");
    setDialogOpen(true);
  };

  const handleSave = () => {
    const result = ruleSchema.safeParse({ pattern, replacement });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    if (editingRule) {
      setRules(rules.map((r) => (r.id === editingRule.id ? { ...r, pattern, replacement } : r)));
    } else {
      const newRule: Rule = {
        id: Math.max(0, ...rules.map((r) => r.id)) + 1,
        pattern,
        replacement,
        enabled: true,
      };
      setRules([...rules, newRule]);
    }
    setDialogOpen(false);
  };

  const deleteRule = (id: number) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const toggleRule = (id: number) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">规则管理</h2>
          <Badge variant="secondary">{rules.length} 条规则</Badge>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" onClick={openAddDialog}>
              <Plus className="h-3.5 w-3.5" />
              添加规则
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRule ? "编辑规则" : "添加规则"}</DialogTitle>
              <DialogDescription>
                配置正则表达式替换规则，匹配的文本将自动替换。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">正则表达式</label>
                <Input
                  placeholder="例如：毫安时"
                  value={pattern}
                  onChange={(e) => { setPattern(e.target.value); setError(""); }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">替换为</label>
                <Input
                  placeholder="例如：mAh"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-destructive text-xs">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm">取消</Button>
              </DialogClose>
              <Button size="sm" onClick={handleSave}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex-1 overflow-hidden p-4">
        <Card className="h-full flex flex-col overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">替换规则列表</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-2">
                {rules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <ListChecks className="h-8 w-8 mb-2 opacity-30" />
                    <p className="text-sm">暂无规则</p>
                    <p className="text-xs mt-1">点击右上角"添加规则"创建</p>
                  </div>
                ) : (
                  rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border border-border transition-opacity ${!rule.enabled ? "opacity-50" : ""}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded text-primary">
                            {rule.pattern}
                          </code>
                          <span className="text-muted-foreground text-xs">→</span>
                          <code className="text-xs font-mono bg-muted/50 px-1.5 py-0.5 rounded text-success">
                            {rule.replacement || "(空)"}
                          </code>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleRule(rule.id)}
                          title={rule.enabled ? "禁用" : "启用"}
                        >
                          <Badge variant={rule.enabled ? "success" : "secondary"} className="text-[10px]">
                            {rule.enabled ? "启用" : "禁用"}
                          </Badge>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEditDialog(rule)}
                          title="编辑"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteRule(rule.id)}
                          title="删除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
