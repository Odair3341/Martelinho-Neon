import { Button } from "@/components/ui/button";
import { 
  Home, 
  Users, 
  Car, 
  Receipt, 
  DollarSign, 
  FileText, 
  Database 
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: "dashboard", label: "Painel", icon: Home },
    { id: "clientes", label: "Clientes", icon: Users },
    { id: "servicos", label: "Serviços", icon: Car },
    { id: "despesas", label: "Despesas", icon: Receipt },
    { id: "comissoes", label: "Comissões", icon: DollarSign },
    { id: "relatorios", label: "Relatórios", icon: FileText },
    { id: "backup", label: "Backup", icon: Database },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 shadow-[0_-12px_35px_hsl(var(--background)/0.65)] backdrop-blur-xl md:sticky md:top-0 md:border-b md:border-t-0 md:shadow-soft">
      <div className="container mx-auto px-1 md:px-6">
        <div className="grid grid-cols-7 md:flex md:space-x-1 md:overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => onTabChange(tab.id)}
                className={`h-auto min-w-0 flex-col gap-1 rounded-none px-0.5 py-2 text-[10px] sm:text-xs md:h-10 md:flex-row md:space-x-2 md:rounded-md md:px-6 md:py-3 md:text-sm ${
                  activeTab === tab.id 
                    ? "bg-primary/10 text-primary md:bg-primary md:text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 md:h-4 md:w-4" />
                <span className="max-w-full truncate">{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
