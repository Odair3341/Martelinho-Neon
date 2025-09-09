import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BusinessData } from "@/types/business";
import { 
  FileText, 
  Download, 
  Filter, 
  Users, 
  Car, 
  DollarSign,
  TrendingUp,
  Calendar,
  Eye
} from "lucide-react";
import { ReportViewer } from "./ReportViewer";

interface RelatoriosTabProps {
  data: BusinessData;
}

export const RelatoriosTab = ({ data }: RelatoriosTabProps) => {
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [currentReportType, setCurrentReportType] = useState<'comissoes' | 'extrato' | 'despesas' | 'recebimentos' | null>(null);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  
  const openReport = (type: 'comissoes' | 'extrato' | 'despesas' | 'recebimentos') => {
    setCurrentReportType(type);
    setShowReportViewer(true);
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalComissoes = data.servicos.reduce((acc, s) => acc + (s.valor_bruto * s.porcentagem_comissao / 100), 0);
  const comissoesRecebidas = data.servicos.reduce((acc, s) => acc + s.comissao_recebida, 0);
  const comissoesPendentes = totalComissoes - comissoesRecebidas;
  const ticketMedio = data.servicos.length > 0 ? 
    data.servicos.reduce((acc, s) => acc + s.valor_bruto, 0) / data.servicos.length : 0;
  
  // Cálculos para despesas
  const totalDespesas = data.despesas.reduce((acc, d) => acc + d.valor, 0);
  const despesasPagas = data.despesas.filter(d => d.pago).reduce((acc, d) => acc + d.valor, 0);

  return (
    <div className="space-y-6">
      {/* Estatísticas Principais */}
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
              <div className="p-3 bg-accent/10 rounded-full">
                <Car className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.servicos.length}</p>
                <p className="text-sm text-muted-foreground">Total Serviços</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-success/10 rounded-full">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.clientes.length}</p>
                <p className="text-sm text-muted-foreground">Total Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-warning/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(ticketMedio)}</p>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Relatório */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-primary" />
            <span>Filtros de Relatório</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input id="data_inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="data_fim">Data de Fim</Label>
              <Input id="data_fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="cliente_filtro">Cliente (Opcional)</Label>
              <Input 
                id="cliente_filtro" 
                placeholder="Digite o nome do cliente..."
              />
            </div>
            <div className="flex items-end">
              <p className="text-sm text-muted-foreground">
                Deixe os campos vazios para incluir todos os dados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gerar Relatórios */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Gerar Relatórios</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Relatório de Comissões</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Relatório resumido com totais, recebidos e pendentes
              </p>
              <div className="flex space-x-2">
                <Button 
                  className="flex-1"
                  onClick={() => openReport('comissoes')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify({
                      tipo: "Relatório de Comissões",
                      data_geracao: new Date().toISOString(),
                      total_comissoes: totalComissoes,
                      comissoes_recebidas: comissoesRecebidas,
                      comissoes_pendentes: comissoesPendentes
                    }, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `relatorio_comissoes_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Extrato de Comissões</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Extrato detalhado com todos os serviços e status
              </p>
              <div className="flex space-x-2">
                <Button 
                  className="flex-1"
                  onClick={() => openReport('extrato')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const extrato = data.servicos.map(s => ({
                      data: s.data_servico,
                      cliente: data.clientes.find(c => c.id === s.cliente_id)?.nome || 'Cliente não encontrado',
                      veiculo: s.veiculo,
                      valor_bruto: s.valor_bruto,
                      comissao_percentual: s.porcentagem_comissao,
                      comissao_valor: s.comissao_recebida,
                      status: s.quitado ? 'Finalizado' : 'Pendente'
                    }));
                    const blob = new Blob([JSON.stringify({
                      tipo: "Extrato de Comissões",
                      data_geracao: new Date().toISOString(),
                      servicos: extrato
                    }, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `extrato_comissoes_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Relatório de Despesas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Relatório com despesas pagas e pendentes
              </p>
              <div className="flex space-x-2">
                <Button 
                  className="flex-1"
                  onClick={() => openReport('despesas')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify({
                      tipo: "Relatório de Despesas",
                      data_geracao: new Date().toISOString(),
                      total_despesas: totalDespesas,
                      despesas_pagas: despesasPagas,
                      despesas_pendentes: totalDespesas - despesasPagas,
                      despesas_detalhadas: data.despesas
                    }, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `relatorio_despesas_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Histórico de Recebimentos</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Visualize o histórico de comissões recebidas por data.
              </p>
              <div className="flex space-x-2">
                <Button 
                  className="flex-1"
                  onClick={() => openReport('recebimentos')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Lógica de download para o histórico de recebimentos pode ser adicionada aqui
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prévia dos Dados */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Prévia dos Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-success">Comissões Recebidas</h4>
              <div className="text-center p-6 bg-success/10 rounded-lg">
                <p className="text-3xl font-bold text-success">{formatCurrency(comissoesRecebidas)}</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round((comissoesRecebidas / totalComissoes * 100) || 0)}% do total
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-warning">Comissões Pendentes</h4>
              <div className="text-center p-6 bg-warning/10 rounded-lg">
                <p className="text-3xl font-bold text-warning">{formatCurrency(comissoesPendentes)}</p>
                <p className="text-sm text-muted-foreground">
                  {Math.round((comissoesPendentes / totalComissoes * 100) || 0)}% do total
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-destructive">Despesas Pagas</h4>
              <div className="text-center p-6 bg-destructive/10 rounded-lg">
                <p className="text-3xl font-bold text-destructive">{formatCurrency(despesasPagas)}</p>
                <p className="text-sm text-muted-foreground">
                  {data.despesas.filter(d => d.pago).length} despesas pagas
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-primary">Performance</h4>
              <div className="text-center p-6 bg-primary/10 rounded-lg">
                <p className="text-3xl font-bold text-primary">
                  {Math.round((comissoesRecebidas / totalComissoes * 100) || 0)}%
                </p>
                <p className="text-sm text-muted-foreground">Taxa de recebimento</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <ReportViewer
        open={showReportViewer}
        onOpenChange={setShowReportViewer}
        data={data}
        reportType={currentReportType}
        dataInicio={dataInicio}
        dataFim={dataFim}
      />
    </div>
  );
};