import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BusinessData } from "@/types/business";
import { Header } from "@/components/business/Header";
import { Navigation } from "@/components/business/Navigation";
import { Dashboard } from "@/components/business/Dashboard";
import { ClientesTab } from "@/components/business/ClientesTab";
import { ServicosTab } from "@/components/business/ServicosTab";
import { DespesasTab } from "@/components/business/DespesasTab";
import { ComissoesTab } from "@/components/business/ComissoesTab";
import { RelatoriosTab } from "@/components/business/RelatoriosTab";
import { BackupTab } from "@/components/business/BackupTab";
import { ImportDialog } from "@/components/business/ImportDialog";

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  // Initial data structure
  const [businessData, setBusinessData] = useState<BusinessData>({
    clientes: [],
    servicos: [],
    despesas: [],
    comissoes: [],
    metadata: {
      exportDate: new Date().toISOString(),
      version: "1.0",
      totalClientes: 0,
      totalServicos: 0,
      totalDespesas: 0,
      totalComissoes: 0
    }
  });

  const handleImportData = (newData: BusinessData) => {
    setBusinessData(newData);
    toast({
      title: "Dados importados com sucesso!",
      description: `${newData.clientes.length} clientes e ${newData.servicos.length} serviços foram carregados.`,
    });
  };

  const handleUpdateData = (newData: BusinessData) => {
    setBusinessData(newData);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard data={businessData} />;
      case "clientes":
        return <ClientesTab data={businessData} onUpdateData={handleUpdateData} />;
      case "servicos":
        return <ServicosTab data={businessData} onUpdateData={handleUpdateData} />;
      case "despesas":
        return <DespesasTab data={businessData} onUpdateData={handleUpdateData} />;
      case "comissoes":
        return <ComissoesTab data={businessData} onUpdateData={handleUpdateData} />;
      case "relatorios":
        return <RelatoriosTab data={businessData} />;
      case "backup":
        return <BackupTab data={businessData} onImportData={() => setShowImportDialog(true)} />;
      default:
        return <Dashboard data={businessData} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onImportData={() => setShowImportDialog(true)} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="container mx-auto px-6 py-8">
        {renderActiveTab()}
      </main>

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportData}
      />
    </div>
  );
};

export default Index;
