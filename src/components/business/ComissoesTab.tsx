import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessData, Servico } from "@/types/business";
import { DollarSign, TrendingUp, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { ReceiveCommissionDialog } from "./ReceiveCommissionDialog";

interface ComissoesTabProps {
  data: BusinessData;
  onUpdateData: (newData: BusinessData) => void;
}

export const ComissoesTab = ({ data, onUpdateData }: ComissoesTabProps) => {
  const [receivingService, setReceivingService] = useState<Servico | null>(null);
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

  // Calcular estatísticas de comissões
  const totalComissoes = data.servicos.reduce((acc, servico) => 
    acc + (servico.valor_bruto * servico.porcentagem_comissao / 100), 0);
  
  const comissoesRecebidas = data.servicos.reduce((acc, servico) => 
    acc + servico.comissao_recebida, 0);
  
  const comissoesPendentes = totalComissoes - comissoesRecebidas;
  
  const servicosComComissao = data.servicos.filter(s => s.comissao_recebida > 0);
  const servicosPendentes = data.servicos.filter(s => s.comissao_recebida === 0);

  const marcarComoRecebido = (servicoId: number) => {
    const servicosAtualizados = data.servicos.map(servico => {
      if (servico.id === servicoId) {
        return {
          ...servico,
          comissao_recebida: (servico.valor_bruto * servico.porcentagem_comissao / 100),
          quitado: true
        };
      }
      return servico;
    });

    const updatedData = {
      ...data,
      servicos: servicosAtualizados
    };

    onUpdateData(updatedData);
  };

  return (
    <div className="space-y-6">
      {/* Resumo das Comissões */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalComissoes)}</p>
                <p className="text-sm text-muted-foreground">Total de Comissões</p>
                <p className="text-xs text-muted-foreground">{data.servicos.length} comissões registradas</p>
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
                <p className="text-sm text-muted-foreground">Já Recebido</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((comissoesRecebidas / totalComissoes * 100) || 0)}% do total
                </p>
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
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((comissoesPendentes / totalComissoes * 100) || 0)}% restante
                </p>
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
                <p className="text-2xl font-bold">28,2%</p>
                <p className="text-sm text-muted-foreground">Progresso</p>
                <div className="w-full bg-muted rounded-full h-2 mt-1">
                  <div 
                    className="bg-accent h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(comissoesRecebidas / totalComissoes * 100) || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controle de Sincronização */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              <span>Controle detalhado do recebimento das suas comissões</span>
            </div>
            <Button className="bg-accent hover:bg-accent/90">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Detalhamento das Comissões */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Detalhamento das Comissões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Veículo</th>
                  <th className="pb-3">Valor Bruto</th>
                  <th className="pb-3">%</th>
                  <th className="pb-3">Comissão</th>
                  <th className="pb-3">Pago</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {[...data.servicos].sort((a, b) => new Date(b.data_servico).getTime() - new Date(a.data_servico).getTime()).map((servico) => {
                  const comissaoTotal = servico.valor_bruto * servico.porcentagem_comissao / 100;
                  const isPendente = servico.comissao_recebida === 0;
                  
                  return (
                    <tr key={servico.id} className="border-b hover:bg-muted/50">
                      <td className="py-4">
                        <div className="font-semibold text-primary text-base">
                          {formatDate(servico.data_servico)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateExtended(servico.data_servico)}
                        </div>
                      </td>
                      <td className="py-3">{getClienteName(servico.cliente_id)}</td>
                      <td className="py-3">
                        {servico.veiculo}
                        <br />
                        <span className="text-xs text-muted-foreground">{servico.placa}</span>
                      </td>
                      <td className="py-3">{formatCurrency(servico.valor_bruto)}</td>
                      <td className="py-3">{servico.porcentagem_comissao}%</td>
                      <td className="py-3 font-medium">{formatCurrency(comissaoTotal)}</td>
                      <td className="py-3">
                        <span className={servico.comissao_recebida > 0 ? "text-success" : "text-warning"}>
                          {formatCurrency(servico.comissao_recebida)}
                        </span>
                        {servico.comissao_recebida > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Restante: {formatCurrency(comissaoTotal - servico.comissao_recebida)}
                          </div>
                        )}
                      </td>
                      <td className="py-3">
                        <Badge 
                          variant={isPendente ? "secondary" : "default"}
                          className={isPendente ? "bg-warning/20 text-warning" : "bg-success/20 text-success"}
                        >
                          {isPendente ? "Pendente" : "Recebido"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {comissaoTotal > servico.comissao_recebida && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => setReceivingService(servico)}
                              variant="outline"
                              className="border-success text-success hover:bg-success hover:text-white"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Parcial
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => marcarComoRecebido(servico.id)}
                              className="bg-success hover:bg-success/90"
                            >
                              Tudo
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ReceiveCommissionDialog
        open={!!receivingService}
        onOpenChange={(open) => !open && setReceivingService(null)}
        service={receivingService}
        data={data}
        onUpdateData={onUpdateData}
      />
    </div>
  );
};