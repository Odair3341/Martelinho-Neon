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
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
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
    // Get current user and load data
    const initializeUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.error('Failed to get user:', error);
          navigate('/auth');
          return;
        }

        setUser(user);
        await loadUserData(user.id);
      } catch (error) {
        console.error('Error initializing user:', error);
        navigate('/auth');
      } finally {
        setLoading(false);
      }
    };

    initializeUser();

    // Set up auth state listener for logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          navigate('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async (userId: string) => {
    try {
      // Load all user data from Supabase using Portuguese table names
      const [clientesResult, servicosResult, despesasResult, comissoesResult] = await Promise.all([
        supabase.from('clientes').select('*').order('nome'),
        supabase.from('servicos').select('*').order('data_servico', { ascending: false }),
        supabase.from('despesas').select('*').order('data_vencimento', { ascending: false }),
        supabase.from('comissoes').select('*').order('data_recebimento', { ascending: false })
      ]);

      if (clientesResult.error) throw clientesResult.error;
      if (servicosResult.error) throw servicosResult.error;
      if (despesasResult.error) throw despesasResult.error;
      if (comissoesResult.error) throw comissoesResult.error;

      // Map database structure to expected interface
      const mappedClientes = (clientesResult.data || []).map(cliente => ({
        id: cliente.id,
        nome: cliente.nome,
        telefone: '', // Not in current schema
        email: '', // Not in current schema
        endereco: '', // Not in current schema
        cpf: '', // Not in current schema
        data_cadastro: cliente.created_at || ''
      }));

      const mappedComissoes = (comissoesResult.data || []).map(comissao => ({
        id: comissao.id,
        servico_id: comissao.servico_id,
        valor: Number(comissao.valor),
        data_recebimento: comissao.data_recebimento,
        status: comissao.status as 'pendente' | 'recebido' | 'atrasado',
        created_at: comissao.created_at,
        updated_at: comissao.updated_at
      }));

      const mappedServicos = (servicosResult.data || []).map(servico => {
        // Buscar comissão recebida para este serviço para inferir a data de recebimento
        const comissaoRecebida = mappedComissoes.find(c => 
          c.servico_id === servico.id && c.status === 'recebido'
        );
        
        return {
          id: servico.id,
          data_servico: servico.data_servico,
          veiculo: servico.veiculo,
          placa: servico.placa,
          valor_bruto: Number(servico.valor_bruto),
          porcentagem_comissao: Number(servico.porcentagem_comissao),
          observacao: servico.observacao || '',
          valor_pago: Number(servico.valor_pago),
          quitado: servico.quitado,
          comissao_recebida: Number(servico.comissao_recebida),
          cliente_id: servico.cliente_id,
          data_recebimento_comissao: comissaoRecebida?.data_recebimento || undefined
        };
      });

      const mappedDespesas = (despesasResult.data || []).map(despesa => ({
        id: despesa.id,
        descricao: despesa.descricao,
        valor: Number(despesa.valor),
        data_vencimento: despesa.data_vencimento,
        pago: despesa.pago,
        categoria: 'Geral' // Default category
      }));

      const loadedData: BusinessData = {
        clientes: mappedClientes,
        servicos: mappedServicos,
        despesas: mappedDespesas,
        comissoes: mappedComissoes,
        metadata: {
          exportDate: new Date().toISOString(),
          version: "1.0",
          totalClientes: mappedClientes.length,
          totalServicos: mappedServicos.length,
          totalDespesas: mappedDespesas.length,
          totalComissoes: mappedComissoes.length
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
    const oldData = businessData;
    setBusinessData(newData);

    if (!user) return;

    try {
      // Handle Deletes
      const oldServiceIds = new Set(oldData.servicos.map(s => s.id));
      const newServiceIds = new Set(newData.servicos.map(s => s.id));
      for (const oldId of oldServiceIds) {
        if (!newServiceIds.has(oldId)) {
          await supabase.from('servicos').delete().eq('id', oldId).eq('user_id', user.id);
        }
      }
      // Similar delete logic for clientes, despesas can be added here

      // Primeiro insere clientes novos para garantir integridade referencial
      const clientIdMap = new Map<string, number>();
      for (const cliente of newData.clientes) {
        if (typeof cliente.id === 'string' && cliente.id.startsWith('temp_')) {
          const { data: insertedClient, error } = await supabase
            .from('clientes')
            .insert({ nome: cliente.nome, user_id: user.id })
            .select()
            .single();
          if (error) throw error;
          clientIdMap.set(cliente.id, insertedClient.id);
          setBusinessData(currentData => ({
            ...currentData,
            clientes: currentData.clientes.map(c =>
              c.id === cliente.id ? { ...c, id: insertedClient.id } : c
            ),
          }));
        } else {
          // update logic
        }
      }

      // Handle Inserts and Updates de serviços (após clientes)
      for (const servico of newData.servicos) {
        if (typeof servico.id === 'string' && servico.id.startsWith('temp_')) {
          // Insert new service
          const { data: insertedService, error } = await supabase
            .from('servicos')
            .insert({
              data_servico: servico.data_servico,
              cliente_id:
                typeof servico.cliente_id === 'string'
                  ? servico.cliente_id.startsWith('temp_')
                    ? clientIdMap.get(servico.cliente_id) ?? null
                    : parseInt(servico.cliente_id, 10)
                  : servico.cliente_id,
              veiculo: servico.veiculo,
              placa: servico.placa,
              valor_bruto: servico.valor_bruto,
              porcentagem_comissao: servico.porcentagem_comissao,
              observacao: servico.observacao,
              valor_pago: servico.valor_pago,
              quitado: servico.quitado,
              comissao_recebida: servico.comissao_recebida,
              user_id: user.id,
            })
            .select()
            .single();

          if (error) throw error;

          if (insertedService) {
            setBusinessData(currentData => ({
              ...currentData,
              servicos: currentData.servicos.map(s =>
                s.id === servico.id ? { ...s, id: insertedService.id } : s
              ),
            }));
          }
        } else {
          // Update existing service
           await supabase
            .from('servicos')
            .update({
              data_servico: servico.data_servico,
              cliente_id:
                typeof servico.cliente_id === 'string'
                  ? servico.cliente_id.startsWith('temp_')
                    ? clientIdMap.get(servico.cliente_id) ?? null
                    : parseInt(servico.cliente_id, 10)
                  : servico.cliente_id,
              veiculo: servico.veiculo,
              placa: servico.placa,
              valor_bruto: servico.valor_bruto,
              porcentagem_comissao: servico.porcentagem_comissao,
              observacao: servico.observacao,
              valor_pago: servico.valor_pago,
              quitado: servico.quitado,
              comissao_recebida: servico.comissao_recebida,
            })
            .eq('id', servico.id)
            .eq('user_id', user.id);
        }
      }
      // Similar loops for despesas
      for (const despesa of newData.despesas) {
        if (typeof despesa.id === 'string' && despesa.id.startsWith('temp_')) {
           const { data: insertedDespesa, error } = await supabase
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
           if (error) throw error;
           if (insertedDespesa) {
              setBusinessData(currentData => ({
                ...currentData,
                despesas: currentData.despesas.map(d =>
                  d.id === despesa.id ? { ...d, id: insertedDespesa.id } : d
                ),
              }));
           }
        } else {
           // update logic
        }
      }


    } catch (error: any) {
      console.error(
        'Erro detalhado ao salvar dados:', {
          errorMessage: error?.message,
          errorDetails: error,
          dataSent: newData,
        }
      );
      toast({
        title: "Erro ao salvar",
        description: `Houve um problema ao salvar os dados: ${error?.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`,
        variant: "destructive",
      });
      // Reverte a atualização otimista em caso de erro
      setBusinessData(oldData);
    }
  };

  const handleReceiveCommission = async (servico: Servico, amount: number) => {
    if (!user) return;

    try {
      // Criar data atual no timezone local para evitar problemas de conversão
      const hoje = new Date();
      const dataRecebimento = hoje.getFullYear() + '-' + 
        String(hoje.getMonth() + 1).padStart(2, '0') + '-' + 
        String(hoje.getDate()).padStart(2, '0');
      
      // Inserir nova comissão na tabela comissoes
      const { error: comissaoError } = await supabase
        .from('comissoes')
        .insert({
          servico_id: servico.id,
          valor: amount,
          data_recebimento: dataRecebimento,
          status: 'recebido',
          user_id: user.id
        });

      if (comissaoError) throw comissaoError;

      // Atualizar o serviço com o valor recebido e a data de recebimento
      const novaComissaoRecebida = servico.comissao_recebida + amount;
      
      const { error: servicoError } = await supabase
        .from('servicos')
        .update({ 
          comissao_recebida: novaComissaoRecebida
        })
        .eq('id', servico.id);

      if (servicoError) throw servicoError;

      // Atualizar o estado local
      setBusinessData(currentData => ({
        ...currentData,
        servicos: currentData.servicos.map(s =>
          s.id === servico.id 
            ? { 
                ...s, 
                comissao_recebida: novaComissaoRecebida,
                data_recebimento_comissao: dataRecebimento
              }
            : s
        ),
      }));

      toast({
        title: "Comissão recebida!",
        description: `R$ ${amount.toFixed(2)} foi marcado como recebido.`,
      });
    } catch (error: any) {
      console.error('Erro ao receber comissão:', error);
      toast({
        title: "Erro ao receber comissão",
        description: "Não foi possível marcar a comissão como recebida.",
        variant: "destructive",
      });
    }
  };

  const handleUndoCommission = async (servicoId: number) => {
    if (!user) return;

    try {
      // Encontrar o serviço
      const servico = businessData.servicos.find(s => s.id === servicoId);
      if (!servico) return;

      // Remover comissões recebidas da tabela comissoes
      const { error: comissaoError } = await supabase
        .from('comissoes')
        .delete()
        .eq('servico_id', servicoId)
        .eq('status', 'recebido');

      if (comissaoError) throw comissaoError;

      // Resetar o valor recebido no serviço
      const { error: servicoError } = await supabase
        .from('servicos')
        .update({ 
          comissao_recebida: 0
        })
        .eq('id', servicoId);

      if (servicoError) throw servicoError;

      // Atualizar o estado local
      setBusinessData(currentData => ({
        ...currentData,
        servicos: currentData.servicos.map(s =>
          s.id === servicoId 
            ? { 
                ...s, 
                comissao_recebida: 0,
                data_recebimento_comissao: undefined
              }
            : s
        ),
      }));

      toast({
        title: "Comissão desfeita!",
        description: "O recebimento da comissão foi desfeito.",
      });
    } catch (error: any) {
      console.error('Erro ao desfazer comissão:', error);
      toast({
        title: "Erro ao desfazer comissão",
        description: "Não foi possível desfazer o recebimento da comissão.",
        variant: "destructive",
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
        return <ComissoesTab 
          data={businessData} 
          onUpdateData={handleUpdateData} 
          onReceiveCommission={handleReceiveCommission}
          onUndoCommission={handleUndoCommission}
        />;
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando dados do usuário...</p>
        </div>
      </div>
    );
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
