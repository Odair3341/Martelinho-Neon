import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessData, Servico } from "@/types/business";
import { DollarSign, TrendingUp, Clock, CheckCircle, RefreshCw, Undo2, Calendar, FileText, Download } from "lucide-react";
import { ReceiveCommissionDialog } from "./ReceiveCommissionDialog";
import { UndoCommissionReceiptDialog } from "./UndoCommissionReceiptDialog";

interface ComissoesTabProps {
  data: BusinessData;
  onUpdateData: (newData: BusinessData) => void;
  onReceiveCommission: (service: Servico, amount: number) => Promise<void>;
  onUndoCommission: (serviceId: number) => Promise<void>; // ✅ NOVA PROP
}

export const ComissoesTab = ({ data, onUpdateData, onReceiveCommission, onUndoCommission }: ComissoesTabProps) => {
  const [receivingService, setReceivingService] = useState<Servico | null>(null);
  const [undoingService, setUndoingService] = useState<Servico | null>(null);
  const [filtroMes, setFiltroMes] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  // Função para arredondar valores monetários e evitar problemas de precisão
  const roundCurrency = (value: number) => {
    return Math.round(value * 100) / 100;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const formatDateExtended = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getClienteName = (clienteId: number) => {
    const cliente = data.clientes.find(c => c.id === clienteId);
    return cliente?.nome || "Cliente não encontrado";
  };

  // Obter lista de meses disponíveis
  const mesesDisponiveis = Array.from(new Set(
    data.servicos.map(s => {
      const date = new Date(s.data_servico);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    })
  )).sort().reverse();

  // Filtrar serviços
  const servicosFiltrados = data.servicos.filter(servico => {
    const date = new Date(servico.data_servico);
    const mesServico = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const comissaoTotal = roundCurrency(servico.valor_bruto * servico.porcentagem_comissao / 100);
    const comissaoRecebida = roundCurrency(servico.comissao_recebida);
    
    const isPendente = comissaoRecebida === 0;
    const isCompleto = comissaoRecebida >= comissaoTotal;
    const isParcial = comissaoRecebida > 0 && comissaoRecebida < comissaoTotal;

    const passaMes = filtroMes === "todos" || mesServico === filtroMes;
    const passaStatus = filtroStatus === "todos" || 
      (filtroStatus === "pendente" && isPendente) ||
      (filtroStatus === "parcial" && isParcial) ||
      (filtroStatus === "completo" && isCompleto);

    return passaMes && passaStatus;
  });

  // Calcular estatísticas de comissões (com filtros)
  const totalComissoes = servicosFiltrados.reduce((acc, servico) => 
    acc + (servico.valor_bruto * servico.porcentagem_comissao / 100), 0);
  
  const comissoesRecebidas = servicosFiltrados.reduce((acc, servico) => 
    acc + servico.comissao_recebida, 0);
  
  const comissoesPendentes = totalComissoes - comissoesRecebidas;
  
  const servicosComComissao = servicosFiltrados.filter(s => s.comissao_recebida > 0);
  const servicosPendentes = servicosFiltrados.filter(s => s.comissao_recebida === 0);

  // Estatísticas gerais (sem filtros)
  const totalGeralComissoes = data.servicos.reduce((acc, servico) => 
    acc + (servico.valor_bruto * servico.porcentagem_comissao / 100), 0);
  
  const totalGeralRecebidas = data.servicos.reduce((acc, servico) => 
    acc + servico.comissao_recebida, 0);

  const marcarComoRecebido = (servico: Servico) => {
    const comissaoTotal = roundCurrency(servico.valor_bruto * servico.porcentagem_comissao / 100);
    const valorReceber = roundCurrency(comissaoTotal - servico.comissao_recebida);
    
    if (valorReceber > 0) {
      onReceiveCommission(servico, valorReceber);
    }
  };

  // ✅ ATUALIZADO: Agora usa a função do Index.tsx
  const handleUndoReceipt = async (servicoId: number) => {
    await onUndoCommission(servicoId);
    setUndoingService(null);
  };

  // Função para exportar relatório
  const exportarRelatorio = () => {
    const relatorio = servicosFiltrados.map(servico => {
      const comissaoTotal = roundCurrency(servico.valor_bruto * servico.porcentagem_comissao / 100);
      const comissaoRecebida = roundCurrency(servico.comissao_recebida);
      
      return {
        Data: formatDate(servico.data_servico),
        Cliente: getClienteName(servico.cliente_id),
        Veículo: `${servico.veiculo} - ${servico.placa}`,
        'Valor Bruto': formatCurrency(servico.valor_bruto),
        'Porcentagem': `${servico.porcentagem_comissao}%`,
        'Comissão Total': formatCurrency(comissaoTotal),
        'Comissão Recebida': formatCurrency(comissaoRecebida),
        'Comissão Pendente': formatCurrency(comissaoTotal - comissaoRecebida),
        Status: comissaoRecebida === 0 ? 'Pendente' : (comissaoRecebida >= comissaoTotal ? 'Completo' : 'Parcial')
      };
    });

    const csv = [
      Object.keys(relatorio[0]).join(','),
      ...relatorio.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-comissoes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Resumo Geral (sem filtros) */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Resumo Geral de Comissões</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalGeralComissoes)}</p>
              <p className="text-sm text-muted-foreground">Total Acumulado</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{formatCurrency(totalGeralRecebidas)}</p>
              <p className="text-sm text-muted-foreground">Total Recebido</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-warning">{formatCurrency(totalGeralComissoes - totalGeralRecebidas)}</p>
              <p className="text-sm text-muted-foreground">Total Pendente</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Filtros</span>
            </div>
            <Button 
              onClick={exportarRelatorio}
              className="bg-accent hover:bg-accent/90"
              disabled={servicosFiltrados.length === 0}
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Filtrar por Mês</label>
              <select 
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="todos">Todos os Meses</option>
                {mesesDisponiveis.map(mes => {
                  const [ano, mesNum] = mes.split('-');
                  const nomeMes = new Date(parseInt(ano), parseInt(mesNum) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                  return (
                    <option key={mes} value={mes}>
                      {nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Filtrar por Status</label>
              <select 
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="parcial">Parcial</option>
                <option value="completo">Completo</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas Filtradas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalComissoes)}</p>
                <p className="text-sm text-muted-foreground">Total Comissões</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-success/10 rounded-full">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{formatCurrency(comissoesRecebidas)}</p>
                <p className="text-sm text-muted-foreground">Recebidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-warning/10 rounded-full">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{formatCurrency(comissoesPendentes)}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-accent/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">
                  {Math.round((comissoesRecebidas / totalComissoes * 100) || 0)}%
                </p>
                <p className="text-sm text-muted-foreground">Progresso</p>
              </div>
            </div>
            <div className="mt-4 w-full bg-muted rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${(comissoesRecebidas / totalComissoes * 100) || 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Comissões */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Detalhamento das Comissões ({servicosFiltrados.length} serviços)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Cliente</th>
                  <th className="p-3 text-left">Veículo</th>
                  <th className="p-3 text-left">Valor Bruto</th>
                  <th className="p-3 text-left">%</th>
                  <th className="p-3 text-left">Comissão Total</th>
                  <th className="p-3 text-left">Recebido</th>
                  <th className="p-3 text-left">Pendente</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {[...servicosFiltrados].sort((a, b) => new Date(b.data_servico).getTime() - new Date(a.data_servico).getTime()).map((servico) => {
                  const comissaoTotal = roundCurrency(servico.valor_bruto * servico.porcentagem_comissao / 100);
                  const comissaoRecebida = roundCurrency(servico.comissao_recebida);
                  const comissaoPendente = comissaoTotal - comissaoRecebida;
                  const isPendente = comissaoRecebida === 0;
                  const isCompleto = comissaoRecebida >= comissaoTotal;
                  const isParcial = comissaoRecebida > 0 && comissaoRecebida < comissaoTotal;
                  
                  return (
                    <tr key={servico.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium">{formatDate(servico.data_servico)}</div>
                        <div className="text-xs text-muted-foreground">{formatDateExtended(servico.data_servico)}</div>
                      </td>
                      <td className="p-3">{getClienteName(servico.cliente_id)}</td>
                      <td className="p-3">
                        <div>{servico.veiculo}</div>
                        <div className="text-xs text-muted-foreground">{servico.placa}</div>
                      </td>
                      <td className="p-3">{formatCurrency(servico.valor_bruto)}</td>
                      <td className="p-3">{servico.porcentagem_comissao}%</td>
                      <td className="p-3 font-semibold">{formatCurrency(comissaoTotal)}</td>
                      <td className="p-3">
                        <span className={comissaoRecebida > 0 ? "text-success font-semibold" : "text-muted-foreground"}>
                          {formatCurrency(comissaoRecebida)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={comissaoPendente > 0 ? "text-warning font-semibold" : "text-muted-foreground"}>
                          {formatCurrency(comissaoPendente)}
                        </span>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant={isPendente ? "secondary" : (isCompleto ? "default" : "outline")}
                          className={
                            isPendente ? "bg-warning/20 text-warning border-warning" : 
                            isCompleto ? "bg-success/20 text-success border-success" : 
                            "bg-blue-500/20 text-blue-600 border-blue-500"
                          }
                        >
                          {isPendente ? "Pendente" : (isCompleto ? "Completo" : "Parcial")}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          {!isCompleto && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setReceivingService(servico)}
                                className="text-xs"
                              >
                                <DollarSign className="h-3 w-3 mr-1" />
                                Receber
                              </Button>
                              {comissaoPendente > 0 && (
                                <Button
                                  size="sm"
                                  onClick={() => marcarComoRecebido(servico)}
                                  className="text-xs bg-success hover:bg-success/90"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completo
                                </Button>
                              )}
                            </>
                          )}
                          {comissaoRecebida > 0 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setUndoingService(servico)}
                              className="text-xs"
                            >
                              <Undo2 className="h-3 w-3 mr-1" />
                              Desfazer
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ReceiveCommissionDialog
        open={!!receivingService}
        onOpenChange={(open) => !open && setReceivingService(null)}
        service={receivingService}
        onConfirm={onReceiveCommission}
      />

      <UndoCommissionReceiptDialog
        open={!!undoingService}
        onOpenChange={(open) => !open && setUndoingService(null)}
        service={undoingService}
        onConfirm={() => undoingService && handleUndoReceipt(undoingService.id as number)}
      />
    </div>
  );
};