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
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
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

  useEffect(() => {
    const initialize = async () => {
      try {
        const healthResp = await fetch('/api/health')
        if (healthResp.ok) {
          const health = await healthResp.json()
          if (health?.ok && health?.hasEnv && health?.result) {
            await loadUserData('')
          } else {
            throw new Error('Ambiente sem DATABASE_URL ou conexão indisponível')
          }
        } else {
          throw new Error('Falha no health check')
        }
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      const resp = await fetch('/api/data');
      if (!resp.ok) throw new Error('Falha ao carregar dados');
      const apiData = await resp.json();

      // Map database structure to expected interface
      const mappedClientes = (apiData.clientes || []).map((cliente: any) => ({
        id: cliente.id,
        nome: cliente.nome,
        telefone: '', // Not in current schema
        email: '', // Not in current schema
        endereco: '', // Not in current schema
        cpf: '', // Not in current schema
        data_cadastro: cliente.created_at || ''
      }));

      const mappedComissoes = (apiData.comissoes || []).map((comissao: any) => ({
        id: comissao.id,
        servico_id: comissao.servico_id,
        valor: Number(comissao.valor),
        data_recebimento: comissao.data_recebimento,
        status: comissao.status as 'pendente' | 'recebido' | 'atrasado',
        created_at: comissao.created_at,
        updated_at: comissao.updated_at
      }));

      const mappedServicos = (apiData.servicos || []).map((servico: any) => {
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

      const mappedDespesas = (apiData.despesas || []).map((despesa: any) => ({
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
    try {
      const resp = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      })
      if (!resp.ok) throw new Error('Falha ao importar dados')
      const result = await resp.json()
      await loadUserData('')
      if (result?.ok) {
        toast({
          title: "Dados importados com sucesso!",
          description: `${newData.clientes.length} clientes e ${newData.servicos.length} serviços foram salvos no Neon.`,
        })
      } else {
        const count = Array.isArray(result?.errors) ? result.errors.length : 0
        toast({
          title: "Importação parcial",
          description: count > 0 ? `Alguns registros falharam (${count}). Os demais foram salvos.` : 'Importação parcial concluída.',
        })
        console.error('Import errors:', result?.errors)
      }
    } catch (error: any) {
      console.error('Error importing data:', error)
      toast({
        title: "Erro ao importar dados",
        description: "Não foi possível salvar os dados importados.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateData = async (newData: BusinessData) => {
    const oldData = businessData

    const servicosAntes = new Set(oldData.servicos.map(s => s.id))
    const adicionados = newData.servicos.filter(s => !servicosAntes.has(s.id))

    if (adicionados.length === 1 && newData.clientes.length === oldData.clientes.length && newData.despesas.length === oldData.despesas.length && newData.comissoes.length === oldData.comissoes.length) {
      const novo = adicionados[0]
      try {
        const resp = await fetch('/api/service-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data_servico: novo.data_servico,
            veiculo: novo.veiculo,
            placa: novo.placa,
            valor_bruto: novo.valor_bruto,
            porcentagem_comissao: novo.porcentagem_comissao,
            observacao: novo.observacao,
            cliente_id: novo.cliente_id
          })
        })
        if (!resp.ok) throw new Error('Falha ao criar serviço')
        const json = await resp.json()
        const idReal = json.id

        const atualizado = {
          ...newData,
          servicos: newData.servicos.map(s => s.id === novo.id ? { ...s, id: idReal } : s),
          metadata: { ...newData.metadata, totalServicos: newData.servicos.length }
        }
        setBusinessData(atualizado)
        toast({ title: 'Serviço criado!', description: 'O novo serviço foi salvo no Neon.' })
        return
      } catch (error: any) {
        console.error('Erro ao criar serviço:', error)
        toast({
          title: 'Erro ao salvar',
          description: `Houve um problema ao salvar o novo serviço: ${error?.message || 'Erro desconhecido'}.`,
          variant: 'destructive',
        })
        return
      }
    }

    setBusinessData(newData)
    try {
      const resp = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData)
      })
      if (!resp.ok) throw new Error('Falha ao salvar dados')
    } catch (error: any) {
      console.error('Erro detalhado ao salvar dados:', error)
      toast({
        title: "Erro ao salvar",
        description: `Houve um problema ao salvar os dados: ${error?.message || 'Erro desconhecido'}. Verifique o console para mais detalhes.`,
        variant: "destructive",
      })
      setBusinessData(oldData)
    }
  }

  const handleReceiveCommission = async (servico: Servico, amount: number) => {

    try {
      const resp = await fetch('/api/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicoId: servico.id, amount })
      })
      if (!resp.ok) throw new Error('Falha ao registrar comissão')
      const json = await resp.json()
      const dataRecebimento = json.data_recebimento

      const novaComissaoRecebida = servico.comissao_recebida + amount

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

    try {
      const servico = businessData.servicos.find(s => s.id === servicoId);
      if (!servico) return;
      const resp = await fetch('/api/commission-undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicoId })
      })
      if (!resp.ok) throw new Error('Falha ao desfazer comissão')

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

  const handleLogout = async () => {};

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

  

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onImportData={() => setShowImportDialog(true)} 
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
