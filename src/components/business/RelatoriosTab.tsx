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
  const [tipoFiltroData, setTipoFiltroData] = useState<'servico' | 'recebimento'>('servico'); // ✅ NOVO
  
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const roundCurrency = (value: number) => {
    return Math.round(value * 100) / 100;
  };

  const getClienteName = (clienteId: number) => {
    const cliente = data.clientes.find(c => c.id === clienteId);
    return cliente?.nome || "Cliente não encontrado";
  };

  // ✅ ATUALIZADO: Obter lista de meses disponíveis (serviço OU recebimento)
  const mesesDisponiveis = Array.from(new Set(
    data.servicos.flatMap(s => {
      const meses = [];
      
      // Mês do serviço
      const dateServico = new Date(s.data_servico);
      meses.push(`${dateServico.getFullYear()}-${String(dateServico.getMonth() + 1).padStart(2, '0')}`);
      
      // Mês do recebimento (se existir)
      if (s.data_recebimento_comissao) {
        const dateRecebimento = new Date(s.data_recebimento_comissao);
        meses.push(`${dateRecebimento.getFullYear()}-${String(dateRecebimento.getMonth() + 1).padStart(2, '0')}`);
      }
      
      return meses;
    })
  )).sort().reverse();

  // ✅ ATUALIZADO: Filtrar serviços
  const servicosFiltrados = data.servicos.filter(servico => {
    // Determinar qual data usar para o filtro de mês
    const dataParaFiltro = tipoFiltroData === 'recebimento' && servico.data_recebimento_comissao
      ? new Date(servico.data_recebimento_comissao)
      : new Date(servico.data_servico);
    
    const mesServico = `${dataParaFiltro.getFullYear()}-${String(dataParaFiltro.getMonth() + 1).padStart(2, '0')}`;
    
    const comissaoTotal = roundCurrency(servico.valor_bruto * servico.porcentagem_comissao / 100);
    const comissaoRecebida = roundCurrency(servico.comissao_recebida);
    
    const isPendente = comissaoRecebida === 0;
    const isCompleto = comissaoRecebida >= comissaoTotal;
    const isParcial = comissaoRecebida > 0 && comissaoRecebida < comissaoTotal;

    const passaMes = filtroMes === "todos" || mesServico === filtroMes;
    const passaStatus = filtroStatus === "todos" || 
      (filtroStatus === "pendente" && isPendente) ||
      (filtroStatus === "parcial" && isParcial) ||
      (filtroStatus === "completo" && isCompleto) ||
      (filtroStatus === "recebidos" && comissaoRecebida > 0);
    
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
        'Data Recebimento': servico.data_recebimento_comissao ? formatDateTime(servico.data_recebimento_comissao) : 'Não recebido',
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

  const limparFiltros = () => {
    setDataInicio("");
    setDataFim("");
    setFiltroMes("todos");
    setFiltroStatus("todos");
    setFiltroCliente("");
    setTipoFiltroData('servico'); // ✅ NOVO
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalComissoes)}</p>
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
                <p className="text-2xl font-bold text-foreground">{data.servicos.length}</p>
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
                <p className="text-2xl font-bold text-foreground">{data.clientes.length}</p>
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
                <p className="text-2xl font-bold text-foreground">{formatCurrency(ticketMedio)}</p>
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
              <span className="text-foreground">Filtros Avançados de Comissões</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* ✅ NOVO: Tipo de Filtro de Data */}
            <div>
              <Label htmlFor="tipo_filtro_data" className="text-foreground">Filtrar por Data de</Label>
              <select 
                id="tipo_filtro_data"
                value={tipoFiltroData}
                onChange={(e) => setTipoFiltroData(e.target.value as 'servico' | 'recebimento')}
                className="w-full p-2 border rounded-md mt-1 bg-background text-foreground"
              >
                <option value="servico">📅 Serviço</option>
                <option value="recebimento">💰 Recebimento</option>
              </select>
            </div>

            <div>
              <Label htmlFor="filtro_mes" className="text-foreground">Filtrar por Mês</Label>
              <select 
                id="filtro_mes"
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="w-full p-2 border rounded-md mt-1 bg-background text-foreground"
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
              <Label htmlFor="filtro_status" className="text-foreground">Filtrar por Status</Label>
              <select 
                id="filtro_status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full p-2 border rounded-md mt-1 bg-background text-foreground"
              >
                <option value="todos">Todos os Status</option>
                <option value="recebidos">✅ Apenas Recebidos</option>
                <option value="pendente">⏳ Pendente</option>
                <option value="parcial">🔵 Parcial</option>
                <option value="completo">✔️ Completo</option>
              </select>
            </div>

            <div>
              <Label htmlFor="filtro_cliente" className="text-foreground">Filtrar por Cliente</Label>
              <Input
                id="filtro_cliente"
                type="text"
                placeholder="Nome do cliente..."
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="mt-1 bg-background text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="data_inicio" className="text-foreground">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="mt-1 bg-background text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            <div>
              <Label htmlFor="data_fim" className="text-foreground">Data Fim</Label>
              <Input
                id="data_fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="mt-1 bg-background text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas Filtradas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Comissões (Filtrado)</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(totalComissoesFiltradas)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-success/10 to-success/5 border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recebidas (Filtrado)</p>
                <p className="text-3xl font-bold text-success">{formatCurrency(comissoesRecebidasFiltradas)}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-success/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-warning/10 to-warning/5 border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pendentes (Filtrado)</p>
                <p className="text-3xl font-bold text-warning">{formatCurrency(comissoesPendentesFiltradas)}</p>
              </div>
              <Clock className="h-10 w-10 text-warning/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Detalhada */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="text-foreground">Detalhamento das Comissões ({servicosFiltrados.length} serviços)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left text-foreground">Data Serviço</th>
                  <th className="p-3 text-left text-foreground">Data Recebimento</th>
                  <th className="p-3 text-left text-foreground">Cliente</th>
                  <th className="p-3 text-left text-foreground">Veículo</th>
                  <th className="p-3 text-left text-foreground">Valor Bruto</th>
                  <th className="p-3 text-left text-foreground">%</th>
                  <th className="p-3 text-left text-foreground">Comissão Total</th>
                  <th className="p-3 text-left text-foreground">Recebido</th>
                  <th className="p-3 text-left text-foreground">Pendente</th>
                  <th className="p-3 text-left text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {servicosFiltrados.map((servico) => {
                  const comissaoTotal = roundCurrency(servico.valor_bruto * servico.porcentagem_comissao / 100);
                  const comissaoRecebida = roundCurrency(servico.comissao_recebida);
                  const comissaoPendente = comissaoTotal - comissaoRecebida;
                  const isPendente = comissaoRecebida === 0;
                  const isCompleto = comissaoRecebida >= comissaoTotal;
                  const isParcial = comissaoRecebida > 0 && comissaoRecebida < comissaoTotal;
                  
                  return (
                    <tr key={servico.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-3 text-foreground">{formatDate(servico.data_servico)}</td>
                      <td className="p-3 text-foreground">
                        {servico.data_recebimento_comissao ? (
                          <span className="text-success font-medium">
                            {formatDateTime(servico.data_recebimento_comissao)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3 text-foreground">{getClienteName(servico.cliente_id)}</td>
                      <td className="p-3 text-foreground">
                        <div>{servico.veiculo}</div>
                        <div className="text-xs text-muted-foreground">{servico.placa}</div>
                      </td>
                      <td className="p-3 text-foreground">{formatCurrency(servico.valor_bruto)}</td>
                      <td className="p-3 text-foreground">{servico.porcentagem_comissao}%</td>
                      <td className="p-3 font-semibold text-foreground">{formatCurrency(comissaoTotal)}</td>
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
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openReport('comissoes')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Relatório de Comissões</p>
                <p className="text-sm text-muted-foreground">Visualizar detalhes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openReport('extrato')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-accent/10 rounded-full">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Extrato Financeiro</p>
                <p className="text-sm text-muted-foreground">Visualizar extrato</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openReport('despesas')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-warning/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Relatório de Despesas</p>
                <p className="text-sm text-muted-foreground">Visualizar despesas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => openReport('recebimentos')}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-success/10 rounded-full">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Recebimentos</p>
                <p className="text-sm text-muted-foreground">Histórico de pagamentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Viewer Dialog */}
      {showReportViewer && currentReportType && (
        <ReportViewer
          open={showReportViewer}
          onOpenChange={setShowReportViewer}
          reportType={currentReportType}
          data={data}
        />
      )}
    </div>
  );
};