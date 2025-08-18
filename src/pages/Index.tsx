import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Authentication and data loading
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // User logged in, load their data
          setTimeout(() => {
            loadUserData(session.user.id);
          }, 0);
        } else {
          // User logged out, redirect to auth
          navigate('/auth');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async (userId: string) => {
    try {
      // Load all user data from Supabase
      const [clientesResult, servicosResult, despesasResult, comissoesResult] = await Promise.all([
        supabase.from('clientes').select('*').eq('user_id', userId).order('nome'),
        supabase.from('servicos').select('*').eq('user_id', userId).order('data_servico', { ascending: false }),
        supabase.from('despesas').select('*').eq('user_id', userId).order('data_vencimento'),
        supabase.from('comissoes').select('*').eq('user_id', userId).order('data_recebimento', { ascending: false })
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
      
      if (loadedData.clientes.length > 0 || loadedData.servicos.length > 0) {
        toast({
          title: "Dados carregados!",
          description: `${loadedData.clientes.length} clientes e ${loadedData.servicos.length} serviços carregados.`,
        });
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar seus dados.",
        variant: "destructive",
      });
    }
  };

  const handleImportData = async (newData: BusinessData) => {
    if (!user) return;
    
    try {
      // Clear existing data and import new data
      await Promise.all([
        supabase.from('clientes').delete().eq('user_id', user.id),
        supabase.from('servicos').delete().eq('user_id', user.id),
        supabase.from('despesas').delete().eq('user_id', user.id),
        supabase.from('comissoes').delete().eq('user_id', user.id)
      ]);

      // Insert new data with user_id
      const clientesWithUserId = newData.clientes.map(cliente => ({ ...cliente, user_id: user.id }));
      const servicosWithUserId = newData.servicos.map(servico => ({ ...servico, user_id: user.id }));
      const despesasWithUserId = newData.despesas.map(despesa => ({ ...despesa, user_id: user.id }));
      const comissoesWithUserId = newData.comissoes.map(comissao => ({ ...comissao, user_id: user.id }));

      await Promise.all([
        clientesWithUserId.length > 0 ? supabase.from('clientes').insert(clientesWithUserId) : Promise.resolve(),
        servicosWithUserId.length > 0 ? supabase.from('servicos').insert(servicosWithUserId) : Promise.resolve(),
        despesasWithUserId.length > 0 ? supabase.from('despesas').insert(despesasWithUserId) : Promise.resolve(),
        comissoesWithUserId.length > 0 ? supabase.from('comissoes').insert(comissoesWithUserId) : Promise.resolve()
      ]);

      // Reload data from database
      await loadUserData(user.id);
      
      toast({
        title: "Dados importados com sucesso!",
        description: `${newData.clientes.length} clientes e ${newData.servicos.length} serviços foram salvos no Supabase.`,
      });
    } catch (error: any) {
      console.error('Error importing data:', error);
      toast({
        title: "Erro ao importar dados",
        description: "Não foi possível salvar os dados importados.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateData = async (newData: BusinessData) => {
    setBusinessData(newData);
    
    // Save changes to Supabase
    if (user) {
      try {
        // Handle servicos - check for new ones and updates
        const currentServiceIds = businessData.servicos.map(s => s.id);
        
        for (const servico of newData.servicos) {
          if (servico.id && currentServiceIds.includes(servico.id)) {
            // Update existing service
            await supabase
              .from('servicos')
              .update({
                data_servico: servico.data_servico,
                cliente_id: servico.cliente_id,
                veiculo: servico.veiculo,
                placa: servico.placa,
                valor_bruto: servico.valor_bruto,
                porcentagem_comissao: servico.porcentagem_comissao,
                observacao: servico.observacao,
                valor_pago: servico.valor_pago,
                quitado: servico.quitado,
                comissao_recebida: servico.comissao_recebida
              })
              .eq('id', servico.id)
              .eq('user_id', user.id);
          } else if (!currentServiceIds.includes(servico.id)) {
            // Insert new service
            const { data: insertedService } = await supabase
              .from('servicos')
              .insert({
                data_servico: servico.data_servico,
                cliente_id: servico.cliente_id,
                veiculo: servico.veiculo,
                placa: servico.placa,
                valor_bruto: servico.valor_bruto,
                porcentagem_comissao: servico.porcentagem_comissao,
                observacao: servico.observacao,
                valor_pago: servico.valor_pago,
                quitado: servico.quitado,
                comissao_recebida: servico.comissao_recebida,
                user_id: user.id
              })
              .select()
              .single();
              
            // Update local data with the real ID from database
            if (insertedService) {
              const updatedServicos = newData.servicos.map(s => 
                s.id === servico.id ? { ...s, id: insertedService.id } : s
              );
              setBusinessData({ ...newData, servicos: updatedServicos });
            }
          }
        }
        
        // Handle clientes
        const currentClientIds = businessData.clientes.map(c => c.id);
        
        for (const cliente of newData.clientes) {
          if (cliente.id && currentClientIds.includes(cliente.id)) {
            // Update existing client
            await supabase
              .from('clientes')
              .update({
                nome: cliente.nome
              })
              .eq('id', cliente.id)
              .eq('user_id', user.id);
          } else if (!currentClientIds.includes(cliente.id)) {
            // Insert new client
            const { data: insertedClient } = await supabase
              .from('clientes')
              .insert({
                nome: cliente.nome,
                user_id: user.id
              })
              .select()
              .single();
              
            // Update local data with the real ID from database
            if (insertedClient) {
              const updatedClientes = newData.clientes.map(c => 
                c.id === cliente.id ? { ...c, id: insertedClient.id } : c
              );
              setBusinessData({ ...newData, clientes: updatedClientes });
            }
          }
        }
        
        // Handle despesas
        const currentExpenseIds = businessData.despesas.map(d => d.id);
        
        for (const despesa of newData.despesas) {
          if (despesa.id && currentExpenseIds.includes(despesa.id)) {
            // Update existing expense
            await supabase
              .from('despesas')
              .update({
                descricao: despesa.descricao,
                valor: despesa.valor,
                data_vencimento: despesa.data_vencimento,
                pago: despesa.pago
              })
              .eq('id', despesa.id)
              .eq('user_id', user.id);
          } else if (!currentExpenseIds.includes(despesa.id)) {
            // Insert new expense
            const { data: insertedExpense } = await supabase
              .from('despesas')
              .insert({
                descricao: despesa.descricao,
                valor: despesa.valor,
                data_vencimento: despesa.data_vencimento,
                pago: despesa.pago,
                user_id: user.id
              })
              .select()
              .single();
              
            // Update local data with the real ID from database
            if (insertedExpense) {
              const updatedDespesas = newData.despesas.map(d => 
                d.id === despesa.id ? { ...d, id: insertedExpense.id } : d
              );
              setBusinessData({ ...newData, despesas: updatedDespesas });
            }
          }
        }
        
      } catch (error) {
        console.error('Erro ao salvar dados:', error);
        toast({
          title: "Erro ao salvar",
          description: "Houve um problema ao salvar os dados. Tente novamente.",
          variant: "destructive",
        });
      }
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
        return <ComissoesTab data={businessData} onUpdateData={handleUpdateData} />;
      case "relatorios":
        return <RelatoriosTab data={businessData} />;
      case "backup":
        return <BackupTab data={businessData} onImportData={() => setShowImportDialog(true)} />;
      default:
        return <Dashboard data={businessData} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
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
