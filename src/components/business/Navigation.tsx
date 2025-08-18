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
    <nav className="bg-white border-b border-border shadow-soft">
      <div className="container mx-auto px-6">
        <div className="flex space-x-1 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 whitespace-nowrap px-6 py-3 ${
                  activeTab === tab.id 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};