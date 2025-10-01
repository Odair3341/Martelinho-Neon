import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessData } from "@/types/business";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, Calendar, CheckCircle2, Filter, Download } from "lucide-react";

interface RelatoriosTabProps {
  data: BusinessData;
}

export const RelatoriosTab = ({ data }: RelatoriosTabProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("todos");
  const [dateFilterType, setDateFilterType] = useState<"recebimento" | "servico">("recebimento");
  const [statusFilter, setStatusFilter] = useState<string>("recebidos");
  const [clienteFilter, setClienteFilter] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para obter o nome do cliente
  const getClienteName = (clienteId: number | string) => {
    const cliente = data.clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nome : 'Cliente não encontrado';
  };

  // Gerar lista de meses disponíveis baseado nos serviços E nas datas de recebimento
  const availableMonths = Array.from(
    new Set([
      // Meses dos serviços
      ...data.servicos.map(s => {
        const date = new Date(s.data_servico);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }),
      // Meses dos recebimentos de comissão
      ...data.servicos
        .filter(s => s.data_recebimento_comissao)
        .map(s => {
          const date = new Date(s.data_recebimento_comissao!);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        })
    ])
  ).sort().reverse();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Filtrar serviços baseado nos filtros selecionados
  const filteredServicos = data.servicos.filter(servico => {
    // Filtro por mês
    let passesMonthFilter = true;
    if (selectedMonth !== "todos") {
      if (dateFilterType === "servico") {
        const servicoDate = new Date(servico.data_servico);
        const servicoMonth = `${servicoDate.getFullYear()}-${String(servicoDate.getMonth() + 1).padStart(2, '0')}`;
        passesMonthFilter = servicoMonth === selectedMonth;
      } else {
        // Filtrar por data de recebimento
        if (!servico.data_recebimento_comissao) {
          passesMonthFilter = false;
        } else {
          const recebimentoDate = new Date(servico.data_recebimento_comissao);
          const recebimentoMonth = `${recebimentoDate.getFullYear()}-${String(recebimentoDate.getMonth() + 1).padStart(2, '0')}`;
          passesMonthFilter = recebimentoMonth === selectedMonth;
        }
      }
    }

    // Filtro por status
    let passesStatusFilter = true;
    if (statusFilter !== "todos") {
      const comissaoTotal = Math.round(servico.valor_bruto * servico.porcentagem_comissao) / 100;
      const isRecebido = servico.comissao_recebida >= comissaoTotal;
      
      if (statusFilter === "recebidos") {
        passesStatusFilter = isRecebido;
      } else if (statusFilter === "pendentes") {
        passesStatusFilter = !isRecebido;
      }
    }

    // Filtro por cliente
    let passesClientFilter = true;
    if (clienteFilter.trim() !== "") {
      const cliente = data.clientes.find(c => c.id === servico.cliente_id);
      const clienteNome = cliente ? cliente.nome.toLowerCase() : '';
      passesClientFilter = clienteNome.includes(clienteFilter.toLowerCase());
    }

    // Filtro por data início e fim
    let passesDateRangeFilter = true;
    if (dataInicio || dataFim) {
      const servicoDate = new Date(servico.data_servico);
      
      if (dataInicio) {
        const inicioDate = new Date(dataInicio);
        if (servicoDate < inicioDate) passesDateRangeFilter = false;
      }
      
      if (dataFim) {
        const fimDate = new Date(dataFim);
        if (servicoDate > fimDate) passesDateRangeFilter = false;
      }
    }

    return passesMonthFilter && passesStatusFilter && passesClientFilter && passesDateRangeFilter;
  });

  // Calcular totais
  const totalServicos = filteredServicos.length;
  const totalValorBruto = filteredServicos.reduce((sum, s) => sum + s.valor_bruto, 0);
  const totalComissoes = filteredServicos.reduce((sum, s) => {
    const comissao = Math.round(s.valor_bruto * s.porcentagem_comissao) / 100;
    return sum + comissao;
  }, 0);
  const totalRecebido = filteredServicos.reduce((sum, s) => sum + s.comissao_recebida, 0);

  // Calcular porcentagem de recebimento
  const percentualRecebido = totalComissoes > 0 ? (totalRecebido / totalComissoes) * 100 : 0;
  const totalPendente = totalComissoes - totalRecebido;

  const clearFilters = () => {
    setSelectedMonth("todos");
    setDateFilterType("recebimento");
    setStatusFilter("recebidos");
    setClienteFilter("");
    setDataInicio("");
    setDataFim("");
  };

  const exportCSV = () => {
    // Implementação do export CSV
    console.log("Exportando CSV...");
  };

  return (
    <div className="space-y-6">
      {/* Header com métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1 - Total Comissões */}
        <Card className="bg-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Comissões</p>
                <p className="text-3xl font-bold">R$ 79.420,98</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2 - Total Serviços */}
        <Card className="bg-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Total Serviços</p>
                <p className="text-3xl font-bold">117</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3 - Total Clientes */}
        <Card className="bg-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Clientes</p>
                <p className="text-3xl font-bold">1</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4 - Ticket Médio */}
        <Card className="bg-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Ticket Médio</p>
                <p className="text-3xl font-bold">R$ 2.051,02</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros Avançados de Comissões */}
      <Card className="bg-gray-900 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros Avançados de Comissões
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearFilters} className="text-gray-300 border-gray-600 hover:bg-gray-800">
                Limpar Filtros
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV} className="text-gray-300 border-gray-600 hover:bg-gray-800">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Filtro por Data de */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Filtrar por Data de</label>
              <Select value={dateFilterType} onValueChange={(value: "recebimento" | "servico") => setDateFilterType(value)}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="recebimento">🔄 Recebimento</SelectItem>
                  <SelectItem value="servico">📅 Serviço</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Mês */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Filtrar por Mês</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="todos">Todos os Meses</SelectItem>
                  {availableMonths.map(month => {
                    const [year, monthNum] = month.split('-');
                    const monthName = monthNames[parseInt(monthNum) - 1];
                    return (
                      <SelectItem key={month} value={month}>
                        {monthName} de {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Filtrar por Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="recebidos">✅ Apenas Recebidos</SelectItem>
                  <SelectItem value="pendentes">⏳ Apenas Pendentes</SelectItem>
                  <SelectItem value="todos">📋 Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Cliente */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Filtrar por Cliente</label>
              <Input 
                placeholder="Nome do cliente..."
                value={clienteFilter}
                onChange={(e) => setClienteFilter(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>

            {/* Data Início */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Data Início</label>
              <Input 
                type="text"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Data Fim</label>
              <Input 
                type="text"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo - Filtrados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 - Total Comissões (Filtrado) */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Comissões (Filtrado)</p>
                <p className="text-3xl font-bold text-blue-600">R$ {totalComissoes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2 - Recebidos (Filtrado) */}
        <Card className="bg-green-50 dark:bg-green-950 border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Recebidos (Filtrado)</p>
                <p className="text-3xl font-bold text-green-600">R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3 - Pendentes (Filtrado) */}
        <Card className="bg-orange-50 dark:bg-orange-950 border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pendentes (Filtrado)</p>
                <p className="text-3xl font-bold text-orange-600">R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABELA DETALHADA DE COMISSÕES */}
      <Card className="bg-gray-900 text-white">
        <CardHeader>
          <CardTitle className="text-white">Detalhamento das Comissões ({totalServicos} serviços)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Data Serviço</TableHead>
                  <TableHead className="text-gray-300">Data Recebimento</TableHead>
                  <TableHead className="text-gray-300">Cliente</TableHead>
                  <TableHead className="text-gray-300">Veículo</TableHead>
                  <TableHead className="text-gray-300 text-right">Valor Bruto</TableHead>
                  <TableHead className="text-gray-300 text-right">%</TableHead>
                  <TableHead className="text-gray-300 text-right">Comissão Total</TableHead>
                  <TableHead className="text-gray-300 text-right">Recebido</TableHead>
                  <TableHead className="text-gray-300 text-right">Pendente</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServicos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-400 py-12">
                      Nenhum serviço encontrado com os filtros selecionados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServicos.map((servico) => {
                    const comissaoTotal = Math.round(servico.valor_bruto * servico.porcentagem_comissao) / 100;
                    const pendente = comissaoTotal - servico.comissao_recebida;
                    const cliente = data.clientes.find(c => c.id === servico.cliente_id);
                    
                    return (
                      <TableRow key={servico.id} className="border-gray-700">
                        <TableCell className="text-gray-300">
                          {new Date(servico.data_servico + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {servico.data_recebimento_comissao ? 
                            new Date(servico.data_recebimento_comissao + 'T00:00:00').toLocaleDateString('pt-BR') : 
                            '-'
                          }
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {cliente?.nome || 'Cliente não encontrado'}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {servico.veiculo} - {servico.placa}
                        </TableCell>
                        <TableCell className="text-gray-300 text-right">
                          R$ {servico.valor_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-gray-300 text-right">
                          {servico.porcentagem_comissao}%
                        </TableCell>
                        <TableCell className="text-gray-300 text-right">
                          R$ {comissaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-gray-300 text-right">
                          R$ {servico.comissao_recebida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-gray-300 text-right">
                          R$ {pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            servico.comissao_recebida >= comissaoTotal 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {servico.comissao_recebida >= comissaoTotal ? 'Recebido' : 'Pendente'}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};