import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { BusinessData, Servico } from "@/types/business";
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
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showImportDialog, setShowImportDialog] = useState(false);
  
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

  useEffect(() => {
    const initializeApp = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/auth');
        setLoading(false);
        return;
      }
      setUser(session.user);
      await loadSharedData();
      setLoading(false);
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadSharedData = async () => {
    try {
      const [clientesResult, servicosResult, despesasResult, comissoesResult] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('servicos').select('*').order('data_servico', { ascending: false }),
        supabase.from('despesas').select('*').order('data_vencimento'),
        supabase.from('comissoes').select('*').order('data_recebimento', { ascending: false })
      ]);

      if (clientesResult.error) throw clientesResult.error;
      if (servicosResult.error) throw servicosResult.error;
      if (despesasResult.error) throw despesasResult.error;
      if (comissoesResult.error) throw comissoesResult.error;

      const loadedData: BusinessData = {
        clientes: clientesResult.data || [],
        servicos: servicosResult.data || [],
        despesas: despesasResult.data || [],
        comissoes: (comissoesResult.data || []).map(c => ({
          ...c,
          status: c.status as 'pendente' | 'recebido' | 'atrasado'
        })),
        metadata: {
          exportDate: new Date().toISOString(),
          version: "1.0",
          totalClientes: clientesResult.data?.length || 0,
          totalServicos: servicosResult.data?.length || 0,
          totalDespesas: despesasResult.data?.length || 0,
          totalComissoes: comissoesResult.data?.length || 0
        }
      };

      setBusinessData(loadedData);
      
    } catch (error: unknown) {
      console.error('Error loading shared data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados da empresa.",
        variant: "destructive",
      });
    }
  };

  const handleImportData = async (newData: BusinessData) => {
    if (!user) return;
    
    try {
      // This will delete ALL data in the tables and replace it with the backup
      await Promise.all([
        supabase.from('clientes').delete().neq('id', 0),
        supabase.from('servicos').delete().neq('id', 0),
        supabase.from('despesas').delete().neq('id', 0),
        supabase.from('comissoes').delete().neq('id', 0)
      ]);

      // We no longer need to map user_id
      await Promise.all([
        newData.clientes.length > 0 ? supabase.from('clientes').insert(newData.clientes) : Promise.resolve(),
        newData.servicos.length > 0 ? supabase.from('servicos').insert(newData.servicos) : Promise.resolve(),
        newData.despesas.length > 0 ? supabase.from('despesas').insert(newData.despesas) : Promise.resolve(),
        newData.comissoes.length > 0 ? supabase.from('comissoes').insert(newData.comissoes) : Promise.resolve()
      ]);

      await loadSharedData();
      
      toast({
        title: "Dados importados com sucesso!",
        description: `A base de dados foi substituída com o backup.`,
      });
    } catch (error: unknown) {
      console.error('Error importing data:', error);
      toast({
        title: "Erro ao importar dados",
        description: "Não foi possível salvar os dados importados.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateData = async (newData: BusinessData) => {
    const oldData = businessData;
    setBusinessData(newData);

    if (!user) return;

    try {
      const oldServiceIds = new Set(oldData.servicos.map(s => s.id));
      const newServiceIds = new Set(newData.servicos.map(s => s.id));
      for (const oldId of oldServiceIds) {
        if (!newServiceIds.has(oldId) && typeof oldId === 'number') {
          await supabase.from('servicos').delete().eq('id', oldId);
        }
      }

      for (const servico of newData.servicos) {
        if (typeof servico.id === 'string' && servico.id.startsWith('temp_')) {
          const { user_id, id, ...insertableServico } = servico;
          await supabase.from('servicos').insert(insertableServico as any);
        } else {
           const { user_id, id, ...updatableServico } = servico;
           await supabase.from('servicos').update(updatableServico as any).eq('id', id);
        }
      }
      
      // Simplified logic for clients and expenses for brevity
      // A full implementation would handle deletes and updates similarly to services
      const newClientes = newData.clientes.filter(c => typeof c.id === 'string');
      if (newClientes.length > 0) {
        await supabase.from('clientes').insert(newClientes.map(({id, ...c}) => c));
      }

      const newDespesas = newData.despesas.filter(d => typeof d.id === 'string');
       if (newDespesas.length > 0) {
        await supabase.from('despesas').insert(newDespesas.map(({id, ...d}) => d));
      }

      // After all operations, reload the single source of truth
      await loadSharedData();

    } catch (error: unknown) {
      console.error('Erro ao salvar dados:', error);
      toast({
        title: "Erro ao salvar",
        description: "Houve um problema ao salvar os dados. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
      setBusinessData(oldData);
    }
  };

  const handleReceiveCommission = async (service: Servico, amount: number) => {
    if (!user) return;

    const comissaoTotal = Math.round(service.valor_bruto * service.porcentagem_comissao) / 100;
    const novaComissaoRecebida = Math.round((service.comissao_recebida + amount) * 100) / 100;
    const dataRecebimento = new Date().toISOString();

    try {
      // 1. Update the service with the new received amount AND date
      const { error: serviceError } = await supabase
        .from('servicos')
        .update({ 
          comissao_recebida: novaComissaoRecebida,
          quitado: novaComissaoRecebida >= comissaoTotal,
          data_recebimento_comissao: dataRecebimento
        })
        .eq('id', service.id);

      if (serviceError) throw serviceError;

      // 2. Insert a new record into the commissions table
      const { error: commissionError } = await supabase
        .from('comissoes')
        .insert({
          servico_id: service.id,
          valor: amount,
          data_recebimento: dataRecebimento,
          status: 'recebido',
          user_id: user.id
        });
      
      if (commissionError) throw commissionError;

      // 3. Reload all data to reflect changes
      await loadSharedData();

      toast({
        title: "Recebimento confirmado!",
        description: `Valor de ${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} recebido em ${new Date(dataRecebimento).toLocaleString('pt-BR')}.`
      });

    } catch (error: unknown) {
      console.error('Erro ao receber comissão:', error);
      toast({
        title: "Erro ao processar recebimento",
        description: "Não foi possível salvar o recebimento. Verifique o console.",
        variant: "destructive",
      });
    }
  };

  // ✅ NOVA FUNÇÃO: Desfazer recebimento de comissão
  const handleUndoCommission = async (serviceId: number) => {
    if (!user) return;

    try {
      // 1. Delete all commission records for this service
      const { error: deleteError } = await supabase
        .from('comissoes')
        .delete()
        .eq('servico_id', serviceId);

      if (deleteError) throw deleteError;

      // 2. Reset the service
      const { error: updateError } = await supabase
        .from('servicos')
        .update({
          comissao_recebida: 0,
          quitado: false,
          data_recebimento_comissao: null
        })
        .eq('id', serviceId);

      if (updateError) throw updateError;

      // 3. Reload all data
      await loadSharedData();

      toast({
        title: "Recebimento desfeito!",
        description: "O recebimento da comissão foi cancelado com sucesso."
      });

    } catch (error: unknown) {
      console.error('Erro ao desfazer recebimento:', error);
      toast({
        title: "Erro ao desfazer recebimento",
        description: "Não foi possível desfazer o recebimento. Verifique o console.",
        variant: "destructive",
      });
    }
  };

  const handleMigrateOldCommissions = async () => {
    if (!user) return;

    toast({ title: "Iniciando migração...", description: "Analisando dados antigos. Por favor, aguarde." });

    try {
      const existingCommissionServiceIds = new Set(businessData.comissoes.map(c => c.servico_id));
      
      const servicesToMigrate = businessData.servicos.filter(s => 
        s.comissao_recebida > 0 && !existingCommissionServiceIds.has(s.id as number)
      );

      if (servicesToMigrate.length === 0) {
        toast({ title: "Nenhum dado para migrar", description: "Todos os pagamentos antigos já possuem um histórico." });
        return;
      }

      const newCommissions = servicesToMigrate.map(s => ({
        servico_id: s.id,
        valor: s.comissao_recebida,
        data_recebimento: s.data_servico, // Using service date as placeholder
        status: 'recebido',
        user_id: user.id
      }));

      const { error } = await supabase.from('comissoes').insert(newCommissions as any);

      if (error) throw error;

      await loadSharedData();

      toast({ 
        title: "Migração Concluída!", 
        description: `${servicesToMigrate.length} registros de pagamentos antigos foram migrados com sucesso.`
      });

    } catch (error: unknown) {
      console.error("Erro durante a migração:", error);
      toast({ 
        title: "Erro na Migração", 
        description: "Ocorreu um erro ao migrar os dados antigos.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
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
        return (
          <ComissoesTab 
            data={businessData} 
            onUpdateData={handleUpdateData} 
            onReceiveCommission={handleReceiveCommission}
            onUndoCommission={handleUndoCommission}
          />
        );
      case "relatorios":
        return <RelatoriosTab data={businessData} />;
      case "backup":
        return <BackupTab data={businessData} onImportData={() => setShowImportDialog(true)} onMigrate={handleMigrateOldCommissions} />;
      default:
        return <Dashboard data={businessData} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando dados da empresa...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onImportData={() => setShowImportDialog(true)} 
        onLogout={handleLogout}
        userEmail={user.email}
      />
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