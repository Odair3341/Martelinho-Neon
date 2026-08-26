import { useState, useEffect, useCallback } from "react";
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
import { Loader2, ServerCrash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const EMPTY_DATA: BusinessData = {
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
    totalComissoes: 0,
  },
};

function isTemp(id: number | string | undefined): boolean {
  return typeof id === "string" && id.startsWith("temp_");
}

const Index = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dataLoadedSuccessfully, setDataLoadedSuccessfully] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessData>(EMPTY_DATA);

  // ─── Carregamento de dados ────────────────────────────────────────────────────
  const loadUserData = useCallback(async () => {
    try {
      const resp = await fetch("/api/data");
      if (!resp.ok) throw new Error("Falha ao carregar dados");
      const apiData = await resp.json();

      const mappedClientes = (apiData.clientes || []).map(
        (cliente: {
          id: string | number;
          nome: string;
          telefone?: string;
          email?: string;
          endereco?: string;
          cpf?: string;
          created_at?: string;
        }) => ({
          id: cliente.id,
          nome: cliente.nome,
          telefone: cliente.telefone || "",
          email: cliente.email || "",
          endereco: cliente.endereco || "",
          cpf: cliente.cpf || "",
          data_cadastro: cliente.created_at || "",
        })
      );

      const mappedComissoes = (apiData.comissoes || []).map(
        (comissao: {
          id: number;
          servico_id: number;
          valor: string | number;
          data_recebimento: string;
          status: string;
          created_at?: string;
          updated_at?: string;
        }) => ({
          id: comissao.id,
          servico_id: comissao.servico_id,
          valor: Number(comissao.valor),
          data_recebimento: comissao.data_recebimento,
          status: comissao.status as "pendente" | "recebido" | "atrasado",
          created_at: comissao.created_at,
          updated_at: comissao.updated_at,
        })
      );

      const mappedServicos = (apiData.servicos || []).map(
        (servico: {
          id: string | number;
          data_servico: string;
          veiculo: string;
          placa: string;
          valor_bruto: string | number;
          porcentagem_comissao: string | number;
          observacao?: string;
          valor_pago: string | number;
          quitado: boolean;
          comissao_recebida: string | number;
          cliente_id: string | number;
        }) => {
          const comissaoRecebida = mappedComissoes.find(
            (c) => c.servico_id === servico.id && c.status === "recebido"
          );
          return {
            id: servico.id,
            data_servico: servico.data_servico,
            veiculo: servico.veiculo,
            placa: servico.placa,
            valor_bruto: Number(servico.valor_bruto),
            porcentagem_comissao: Number(servico.porcentagem_comissao),
            observacao: servico.observacao || "",
            valor_pago: Number(servico.valor_pago),
            quitado: servico.quitado,
            comissao_recebida: Number(servico.comissao_recebida),
            cliente_id: servico.cliente_id,
            data_recebimento_comissao:
              comissaoRecebida?.data_recebimento || undefined,
          };
        }
      );

      const mappedDespesas = (apiData.despesas || []).map(
        (despesa: {
          id: string | number;
          descricao: string;
          valor: string | number;
          data_vencimento: string;
          pago: boolean;
        }) => ({
          id: despesa.id,
          descricao: despesa.descricao,
          valor: Number(despesa.valor),
          data_vencimento: despesa.data_vencimento,
          pago: despesa.pago,
          categoria: "Geral",
        })
      );

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
          totalComissoes: mappedComissoes.length,
        },
      };

      setBusinessData(loadedData);
      setDataLoadedSuccessfully(true);

      if (loadedData.clientes.length > 0 || loadedData.servicos.length > 0) {
        toast({
          title: "Dados carregados!",
          description: `${loadedData.clientes.length} clientes e ${loadedData.servicos.length} serviços carregados.`,
        });
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setDataLoadedSuccessfully(false);
      const err = error as Error;
      toast({
        title: "Erro ao carregar dados",
        description:
          err.message || "Não foi possível carregar seus dados.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const initialize = useCallback(async () => {
    setLoading(true);
    setDataLoadedSuccessfully(false);
    try {
      const healthResp = await fetch("/api/health");
      if (healthResp.ok) {
        const health = await healthResp.json();
        if (health?.ok && health?.hasEnv && health?.result) {
          await loadUserData();
        } else {
          throw new Error(
            "Ambiente sem DATABASE_URL ou conexão indisponível"
          );
        }
      } else {
        throw new Error("Falha no health check");
      }
    } catch (err) {
      console.error("Initialization failed:", err);
      setDataLoadedSuccessfully(false);
    } finally {
      setLoading(false);
    }
  }, [loadUserData]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // ─── Importação de backup (modo replace) ─────────────────────────────────────
  const handleImportData = async (newData: BusinessData, mode: "merge" | "replace" = "replace") => {
    try {
      const resp = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newData, mode }),
      });
      if (!resp.ok) throw new Error("Falha ao importar dados");
      const result = await resp.json();
      await loadUserData();
      if (result?.ok) {
        toast({
          title: "Dados importados com sucesso!",
          description: `${newData.clientes.length} clientes e ${newData.servicos.length} serviços foram salvos.`,
        });
      } else {
        const count = Array.isArray(result?.errors) ? result.errors.length : 0;
        toast({
          title: "Importação parcial",
          description:
            count > 0
              ? `Alguns registros falharam (${count}). Os demais foram salvos.`
              : "Importação parcial concluída.",
        });
        console.error("Import errors:", result?.errors);
      }
    } catch (error) {
      console.error("Error importing data:", error);
      const err = error as Error;
      toast({
        title: "Erro ao importar dados",
        description:
          err?.message || "Não foi possível salvar os dados importados.",
        variant: "destructive",
      });
    }
  };

  // ─── Salvar alterações incrementais (clientes, despesas, serviços) ────────────
  const handleUpdateData = async (newData: BusinessData) => {
    const oldData = businessData;

    // ── Detectar deleções e chamar /api/delete individualmente ──────────────────
    const deletedClientes = oldData.clientes.filter(
      (c) => !newData.clientes.find((nc) => nc.id === c.id)
    );
    const deletedServicos = oldData.servicos.filter(
      (s) => !newData.servicos.find((ns) => ns.id === s.id)
    );
    const deletedDespesas = oldData.despesas.filter(
      (d) => !newData.despesas.find((nd) => nd.id === d.id)
    );

    // Deleções reais (IDs numéricos) — chamar backend
    for (const c of deletedClientes) {
      if (!isTemp(c.id)) {
        try {
          const r = await fetch("/api/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ table: "clientes", id: c.id }),
          });
          if (!r.ok) throw new Error(await r.text());
        } catch (e) {
          console.error("Erro ao deletar cliente:", e);
          toast({
            title: "Erro ao deletar cliente",
            description: `Não foi possível remover "${c.nome}" do banco.`,
            variant: "destructive",
          });
        }
      }
    }

    for (const s of deletedServicos) {
      if (!isTemp(s.id)) {
        try {
          const r = await fetch("/api/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ table: "servicos", id: s.id }),
          });
          if (!r.ok) throw new Error(await r.text());
        } catch (e) {
          console.error("Erro ao deletar serviço:", e);
          toast({
            title: "Erro ao deletar serviço",
            description: "Não foi possível remover o serviço do banco.",
            variant: "destructive",
          });
        }
      }
    }

    for (const d of deletedDespesas) {
      if (!isTemp(d.id)) {
        try {
          const r = await fetch("/api/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ table: "despesas", id: d.id }),
          });
          if (!r.ok) throw new Error(await r.text());
        } catch (e) {
          console.error("Erro ao deletar despesa:", e);
          toast({
            title: "Erro ao deletar despesa",
            description: "Não foi possível remover a despesa do banco.",
            variant: "destructive",
          });
        }
      }
    }

    // ── Sincronização de cascata ON DELETE SET NULL para serviços ───────────────
    // Se um cliente foi deletado, setar cliente_id = null nos serviços vinculados
    let dataToSave = newData;
    if (deletedClientes.length > 0) {
      const deletedIds = new Set(deletedClientes.map((c) => c.id));
      dataToSave = {
        ...newData,
        servicos: newData.servicos.map((s) =>
          deletedIds.has(s.cliente_id) ? { ...s, cliente_id: 0 } : s
        ),
      };
    }

    // Atualizar estado local imediatamente (sem esperar backend)
    setBusinessData(dataToSave);

    // ── Enviar apenas alterações (não deleções — já foram tratadas acima) ────────
    // Filtrar apenas registros novos ou modificados (sem os que acabaram de ser deletados)
    try {
      const resp = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...dataToSave, mode: "merge" }),
      });
      if (!resp.ok) throw new Error("Falha ao salvar dados");
      const result = await resp.json();

      // ── Aplicar mapeamento de IDs temporários retornados pelo backend ──────────
      const clientIdsMap: Record<string, number> = result?.clientIdsMap || {};
      const serviceIdsMap: Record<string, number> = result?.serviceIdsMap || {};
      const hasMappings =
        Object.keys(clientIdsMap).length > 0 ||
        Object.keys(serviceIdsMap).length > 0;

      if (hasMappings) {
        setBusinessData((current) => ({
          ...current,
          clientes: current.clientes.map((c) =>
            isTemp(c.id) && clientIdsMap[c.id as string]
              ? { ...c, id: clientIdsMap[c.id as string] }
              : c
          ),
          servicos: current.servicos.map((s) => {
            let updated = s;
            // Substituir ID temporário do serviço
            if (isTemp(s.id) && serviceIdsMap[s.id as string]) {
              updated = { ...updated, id: serviceIdsMap[s.id as string] };
            }
            // Substituir cliente_id temporário
            if (isTemp(s.cliente_id) && clientIdsMap[s.cliente_id as string]) {
              updated = {
                ...updated,
                cliente_id: clientIdsMap[s.cliente_id as string],
              };
            }
            return updated;
          }),
        }));
      }

      if (result?.errors?.length > 0) {
        console.error("Save errors:", result.errors);
        toast({
          title: "Salvo com avisos",
          description: `${result.errors.length} registro(s) com erro. Verifique o console.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      const err = error as Error;
      toast({
        title: "Erro ao salvar",
        description: `${err?.message || "Erro desconhecido"}. Recarregue a página e tente novamente.`,
        variant: "destructive",
      });
      // Reverter estado em caso de erro total
      setBusinessData(oldData);
    }
  };

  // ─── Receber comissão ─────────────────────────────────────────────────────────
  const handleReceiveCommission = async (servico: Servico, amount: number) => {
    try {
      const resp = await fetch("/api/commission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicoId: servico.id, amount }),
      });
      if (!resp.ok) throw new Error("Falha ao registrar comissão");
      const json = await resp.json();
      const dataRecebimento = json.data_recebimento;
      const novaComissaoRecebida = servico.comissao_recebida + amount;

      setBusinessData((currentData) => ({
        ...currentData,
        servicos: currentData.servicos.map((s) =>
          s.id === servico.id
            ? {
                ...s,
                comissao_recebida: novaComissaoRecebida,
                data_recebimento_comissao: dataRecebimento,
              }
            : s
        ),
      }));

      toast({
        title: "Comissão recebida!",
        description: `R$ ${amount.toFixed(2)} foi marcado como recebido.`,
      });
    } catch (error) {
      console.error("Erro ao receber comissão:", error);
      const err = error as Error;
      toast({
        title: "Erro ao receber comissão",
        description:
          err?.message ||
          "Não foi possível marcar a comissão como recebida.",
        variant: "destructive",
      });
    }
  };

  // ─── Desfazer comissão ────────────────────────────────────────────────────────
  const handleUndoCommission = async (servicoId: number) => {
    try {
      const servico = businessData.servicos.find((s) => s.id === servicoId);
      if (!servico) return;
      const resp = await fetch("/api/commission-undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ servicoId }),
      });
      if (!resp.ok) throw new Error("Falha ao desfazer comissão");

      setBusinessData((currentData) => ({
        ...currentData,
        servicos: currentData.servicos.map((s) =>
          s.id === servicoId
            ? { ...s, comissao_recebida: 0, data_recebimento_comissao: undefined }
            : s
        ),
      }));

      toast({
        title: "Comissão desfeita!",
        description: "O recebimento da comissão foi desfeito.",
      });
    } catch (error) {
      console.error("Erro ao desfazer comissão:", error);
      const err = error as Error;
      toast({
        title: "Erro ao desfazer comissão",
        description:
          err?.message ||
          "Não foi possível desfazer o recebimento da comissão.",
        variant: "destructive",
      });
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard data={businessData} />;
      case "clientes":
        return (
          <ClientesTab data={businessData} onUpdateData={handleUpdateData} />
        );
      case "servicos":
        return (
          <ServicosTab data={businessData} onUpdateData={handleUpdateData} />
        );
      case "despesas":
        return (
          <DespesasTab data={businessData} onUpdateData={handleUpdateData} />
        );
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
        return (
          <BackupTab
            data={businessData}
            onImportData={() => setShowImportDialog(true)}
          />
        );
      default:
        return <Dashboard data={businessData} />;
    }
  };

  // ─── Tela de carregamento ─────────────────────────────────────────────────────
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

  // ─── Tela de erro resiliente ──────────────────────────────────────────────────
  if (!dataLoadedSuccessfully) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="flex justify-center">
            <div className="p-4 bg-destructive/10 rounded-full">
              <ServerCrash className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Falha ao conectar ao banco de dados
            </h2>
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os dados. Isso pode ser uma oscilação
              temporária de rede. Seus dados estão seguros — tente novamente.
            </p>
          </div>
          <Button
            onClick={initialize}
            className="gap-2"
            size="lg"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // ─── App principal ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background notranslate" translate="no">
      <Header onImportData={() => setShowImportDialog(true)} />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="container mx-auto px-4 pb-28 pt-6 md:px-6 md:pb-8 md:pt-8">{renderActiveTab()}</main>

      <ImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImport={handleImportData}
      />
    </div>
  );
};

export default Index;
