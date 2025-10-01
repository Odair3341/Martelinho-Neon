import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessData } from "@/types/business";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReportViewer } from "./ReportViewer";

interface RelatoriosTabProps {
  data: BusinessData;
}

export const RelatoriosTab = ({ data }: RelatoriosTabProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("todos");
  const [selectedStatus, setSelectedStatus] = useState<string>("todos");
  const [dateFilterType, setDateFilterType] = useState<"servico" | "recebimento">("servico");

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Função para obter o nome do cliente
  const getClienteName = (clienteId: number | string) => {
    const cliente = data.clientes.find(c => c.id === clienteId);
    return cliente ? cliente.nome : 'Cliente não encontrado';
  };

  // Gerar lista de meses disponíveis baseado nos serviços
  const availableMonths = Array.from(
    new Set(
      data.servicos.map(s => {
        const date = new Date(s.data_servico);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })
    )
  ).sort().reverse();

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Filtrar serviços baseado no mês e status selecionados
  const filteredServicos = data.servicos.filter(servico => {
    // Filtro de mês
    let passaMes = true;
    if (selectedMonth !== "todos") {
      if (dateFilterType === "servico") {
        // Filtrar pela data do serviço
        const servicoDate = new Date(servico.data_servico);
        const servicoMonth = `${servicoDate.getFullYear()}-${String(servicoDate.getMonth() + 1).padStart(2, '0')}`;
        passaMes = servicoMonth === selectedMonth;
      } else {
        // Filtrar pela data de recebimento da comissão
        if (servico.data_recebimento_comissao) {
          const recebimentoDate = new Date(servico.data_recebimento_comissao);
          const recebimentoMonth = `${recebimentoDate.getFullYear()}-${String(recebimentoDate.getMonth() + 1).padStart(2, '0')}`;
          passaMes = recebimentoMonth === selectedMonth;
        } else {
          passaMes = false; // Se não tem data de recebimento, não passa no filtro
        }
      }
    }

    // Filtro de status
    const comissaoTotal = Math.round(servico.valor_bruto * servico.porcentagem_comissao) / 100;
    const isPendente = servico.comissao_recebida === 0;
    const isParcial = servico.comissao_recebida > 0 && servico.comissao_recebida < comissaoTotal;
    const isCompleto = servico.comissao_recebida >= comissaoTotal;

    let passaStatus = true;
    if (selectedStatus === "pendente") passaStatus = isPendente;
    else if (selectedStatus === "parcial") passaStatus = isParcial;
    else if (selectedStatus === "recebido") passaStatus = isCompleto;

    return passaMes && passaStatus;
  });

  // Calcular totais
  const totalServicos = filteredServicos.length;
  const totalValorBruto = filteredServicos.reduce((sum, s) => sum + s.valor_bruto, 0);
  const totalComissoes = filteredServicos.reduce((sum, s) => {
    const comissao = Math.round(s.valor_bruto * s.porcentagem_comissao) / 100;
    return sum + comissao;
  }, 0);
  const totalRecebido = filteredServicos.reduce((sum, s) => sum + s.comissao_recebida, 0);
  const totalPendente = totalComissoes - totalRecebido;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Relatórios</h2>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro de Mês */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Meses</SelectItem>
                  {availableMonths.map(month => {
                    const [year, monthNum] = month.split('-');
                    const monthName = monthNames[parseInt(monthNum) - 1];
                    return (
                      <SelectItem key={month} value={month}>
                        {monthName} {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Tipo de Data */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por</label>
              <Select value={dateFilterType} onValueChange={(value: "servico" | "recebimento") => setDateFilterType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="servico">Data do Serviço</SelectItem>
                  <SelectItem value="recebimento">Data de Recebimento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="recebido">Recebido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalServicos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Bruto Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalValorBruto)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comissões Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalComissoes)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Recebido</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRecebido)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Visualizador de Relatório */}
      <ReportViewer 
        data={data}
        filteredServicos={filteredServicos}
        selectedMonth={selectedMonth}
        selectedStatus={selectedStatus}
      />
    </div>
  );
};