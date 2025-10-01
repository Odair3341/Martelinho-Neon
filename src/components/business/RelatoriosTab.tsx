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
  Eye,
  CheckCircle,
  Clock
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
  const [filtroMes, setFiltroMes] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroCliente, setFiltroCliente] = useState<string>("");
  
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };

  const roundCurrency = (value: number) => {
    return Math.round(value * 100) / 100;
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
    
    const clienteNome = getClienteName(servico.cliente_id).toLowerCase();
    const passaCliente = !filtroCliente || clienteNome.includes(filtroCliente.toLowerCase());

    // Filtro de data
    let passaData = true;
    if (dataInicio && dataFim) {
      const dataServico = new Date(servico.data_servico);
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      passaData = dataServico >= inicio && dataServico <= fim;
    }

    return passaMes && passaStatus && passaCliente && passaData;
  });

  // Estatísticas gerais (sem filtros)
  const totalComissoes = data.servicos.reduce((acc, s) => acc + (s.valor_bruto * s.porcentagem_comissao / 100), 0);
  const comissoesRecebidas = data.servicos.reduce((acc, s) => acc + s.comissao_recebida, 0);
  const comissoesPendentes = totalComissoes - comissoesRecebidas;

  // Estatísticas filtradas
  const totalComissoesFiltradas = servicosFiltrados.reduce((acc, s) => acc + (s.valor_bruto * s.porcentagem_comissao / 100), 0);
  const comissoesRecebidasFiltradas = servicosFiltrados.reduce((acc, s) => acc + s.comissao_recebida, 0);
  const comissoesPendentesFiltradas = totalComissoesFiltradas - comissoesRecebidasFiltradas;

  const ticketMedio = data.servicos.length > 0 ? 
    data.servicos.reduce((acc, s) => acc + s.valor_bruto, 0) / data.servicos.length : 0;
  
  // Cálculos para despesas
  const totalDespesas = data.despesas.reduce((acc, d) => acc + d.valor, 0);
  const despesasPagas = data.despesas.filter(d => d.pago).reduce((acc, d) => acc + d.valor, 0);

  // Função para exportar relatório CSV
  const exportarRelatorioCSV = () => {
    const relatorio = servicosFiltrados.map(servico => {
      const comissaoTotal = roundCurrency(servico.valor_bruto * servico.porcentagem_comissao / 100);
      const comissaoRecebida = roundCurrency(servico.comissao_recebida);
      
      return {
        Data: formatDate(servico.data_servico),
        Cliente: getClienteName(servico.cliente_id),
        Veículo: servico.veiculo,
        Placa: servico.placa,
        'Valor Bruto': servico.valor_bruto,
        'Porcentagem': servico.porcentagem_comissao,
        'Comissão Total': comissaoTotal,
        'Comissão Recebida': comissaoRecebida,
        'Comissão Pendente': comissaoTotal - comissaoRecebida,
        Status: comissaoRecebida === 0 ? 'Pendente' : (comissaoRecebida >= comissaoTotal ? 'Completo' : 'Parcial')
      };
    });

    const headers = Object.keys(relatorio[0] || {}).join(',');
    const rows = relatorio.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio-comissoes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const limparFiltros = () => {
    setFiltroMes("todos");
    setFiltroStatus("todos");
    setFiltroCliente("");
    setDataInicio("");
    setDataFim("");
  };

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

      {/* Filtros Avançados de Comissões */}
      <Card className="shadow-medium border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-primary" />
              <span>Filtros Avançados de Comissões</span>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline"
                onClick={limparFiltros}
                size="sm"
              >
                Limpar Filtros
              </Button>
              <Button 
                onClick={exportarRelatorioCSV}
                className="bg-accent hover:bg-accent/90"
                disabled={servicosFiltrados.length === 0}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="filtro_mes">Filtrar por Mês</Label>
              <select 
                id="filtro_mes"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="w-full p-2 border rounded-md mt-1"
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
              <Label htmlFor="filtro_status">Filtrar por Status</Label>
              <select 
                id="filtro_status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full p-2 border rounded-md mt-1"
              >
                <option value="todos">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="parcial">Parcial</option>
                <option value="completo">Completo</option>
              </select>
            </div>

            <div>
              <Label htmlFor="data_inicio">Data de Início</Label>
              <Input 
                id="data_inicio" 
                type="date" 
                value={dataInicio} 
                onChange={(e) => setDataInicio(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="data_fim">Data de Fim</Label>
              <Input 
                id="data_fim" 
                type="date" 
                value={dataFim} 
                onChange={(e) => setDataFim(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="filtro_cliente">Filtrar por Cliente</Label>
              <Input 
                id="filtro_cliente" 
                placeholder="Digite o nome do cliente..."
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Filtrado */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Resumo das Comissões Filtradas</span>
            <Badge variant="secondary">{servicosFiltrados.length} serviços</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-primary mr-2" />
                <p className="text-sm font-medium text-muted-foreground">Total Filtrado</p>
              </div>
              <p className="text-3xl font-bold text-primary">{formatCurrency(totalComissoesFiltradas)}</p>
            </div>

            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-success mr-2" />
                <p className="text-sm font-medium text-muted-foreground">Recebido</p>
              </div>
              <p className="text-3xl font-bold text-success">{formatCurrency(comissoesRecebidasFiltradas)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((comissoesRecebidasFiltradas / totalComissoesFiltradas * 100) || 0)}% do filtrado
              </p>
            </div>

            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-warning mr-2" />
                <p className="text-sm font-medium text-muted-foreground">Pendente</p>
              </div>
              <p className="text-3xl font-bold text-warning">{formatCurrency(comissoesPendentesFiltradas)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((comissoesPendentesFiltradas / totalComissoesFiltradas * 100) || 0)}% restante
              </p>
            </div>

            <div className="text-center p-4 bg-white/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-accent mr-2" />
                <p className="text-sm font-medium text-muted-foreground">Progresso</p>
              </div>
              <p className="text-3xl font-bold text-accent">
                {Math.round((comissoesRecebidasFiltradas / totalComissoesFiltradas * 100) || 0)}%
              </p>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(comissoesRecebidasFiltradas / totalComissoesFiltradas * 100) || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Detalhada */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Detalhamento das Comissões Filtradas</CardTitle>
        </CardHeader>
        <CardContent>
          {servicosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhum serviço encontrado</p>
              <p className="text-sm">Ajuste os filtros para ver os resultados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left bg-muted/50">
                    <th className="p-3">Data</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3">Veículo</th>
                    <th className="p-3">Valor Bruto</th>
                    <th className="p-3">%</th>
                    <th className="p-3">Comissão Total</th>
                    <th className="p-3">Recebido</th>
                    <th className="p-3">Pendente</th>
                    <th className="p-3">Status</th>
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
                      <tr key={servico.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="font-medium">{formatDate(servico.data_servico)}</div>
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
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/50 font-bold">
                    <td colSpan={5} className="p-3 text-right">TOTAIS:</td>
                    <td className="p-3">{formatCurrency(totalComissoesFiltradas)}</td>
                    <td className="p-3 text-success">{formatCurrency(comissoesRecebidasFiltradas)}</td>
                    <td className="p-3 text-warning">{formatCurrency(comissoesPendentesFiltradas)}</td>
                    <td className="p-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gerar Relatórios */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Outros Relatórios</span>
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
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prévia dos Dados Gerais */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Resumo Geral (Sem Filtros)</CardTitle>
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
        reportType={currentReportType}
        data={data}
      />
    </div>
  );
};