import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessData } from "@/types/business";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, Calendar, CheckCircle2, Filter, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

  // Arredondamento monetário (2 casas)
  const roundCurrency = (value: number) => Math.round(value * 100) / 100;
  // Função para formatar data de forma robusta e evitar fuso horário incorreto
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      // Pega apenas a parte YYYY-MM-DD caso venha com hora (T ou espaço)
      const datePart = dateString.includes('T') 
        ? dateString.split('T')[0] 
        : (dateString.includes(' ') ? dateString.split(' ')[0] : dateString);
      
      const date = new Date(datePart + 'T00:00:00');
      if (isNaN(date.getTime())) {
        const fallback = new Date(dateString);
        if (isNaN(fallback.getTime())) {
          return '-';
        }
        return fallback.toLocaleDateString('pt-BR');
      }
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
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

  // Obter as linhas filtradas e mapeadas do relatório
  const rows = useMemo(() => {
    if (dateFilterType === "servico") {
      return data.servicos.filter(servico => {
        // Filtro por mês
        let passesMonthFilter = true;
        if (selectedMonth !== "todos") {
          const servicoDate = new Date(servico.data_servico);
          const servicoMonth = `${servicoDate.getFullYear()}-${String(servicoDate.getMonth() + 1).padStart(2, '0')}`;
          passesMonthFilter = servicoMonth === selectedMonth;
        }

        // Filtro por status
        let passesStatusFilter = true;
        if (statusFilter !== "todos") {
          const comissaoTotal = roundCurrency((servico.valor_bruto * servico.porcentagem_comissao) / 100);
          const isRecebido = roundCurrency(servico.comissao_recebida) >= comissaoTotal;
          
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
          const servicoDate = servico.data_servico; // YYYY-MM-DD
          if (dataInicio && servicoDate < dataInicio) passesDateRangeFilter = false;
          if (dataFim && servicoDate > dataFim) passesDateRangeFilter = false;
        }

        return passesMonthFilter && passesStatusFilter && passesClientFilter && passesDateRangeFilter;
      }).map(servico => {
        const comissaoTotal = roundCurrency((servico.valor_bruto * servico.porcentagem_comissao) / 100);
        const valorRecebido = roundCurrency(servico.comissao_recebida);
        const pendente = Math.max(0, roundCurrency(comissaoTotal - valorRecebido));
        const cliente = data.clientes.find(c => c.id === servico.cliente_id);
        return {
          id: `s-${servico.id}`,
          dataServico: servico.data_servico,
          dataRecebimento: servico.data_recebimento_comissao,
          clienteNome: cliente?.nome || 'Cliente não encontrado',
          veiculoInfo: `${servico.veiculo} - ${servico.placa}`,
          valorBruto: Number(servico.valor_bruto),
          porcentagemComissao: Number(servico.porcentagem_comissao),
          comissaoTotal,
          valorRecebido,
          pendente,
          status: valorRecebido >= comissaoTotal ? 'Recebido' as const : 'Pendente' as const
        };
      });
    } else {
      // Filtrar por comissões recebidas (Recebimento)
      return data.comissoes.filter(comissao => {
        if (comissao.status !== 'recebido') return false;

        const servico = data.servicos.find(s => s.id === comissao.servico_id);
        if (!servico) return false;

        // Filtro por mês
        let passesMonthFilter = true;
        if (selectedMonth !== "todos") {
          const recebimentoDate = new Date(comissao.data_recebimento);
          const recebimentoMonth = `${recebimentoDate.getFullYear()}-${String(recebimentoDate.getMonth() + 1).padStart(2, '0')}`;
          passesMonthFilter = recebimentoMonth === selectedMonth;
        }

        // Filtro por status
        let passesStatusFilter = true;
        if (statusFilter === "pendentes") {
          passesStatusFilter = false;
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
        const receiptDate = comissao.data_recebimento.substring(0, 10);
        if (dataInicio && receiptDate < dataInicio) passesDateRangeFilter = false;
        if (dataFim && receiptDate > dataFim) passesDateRangeFilter = false;

        return passesMonthFilter && passesStatusFilter && passesClientFilter && passesDateRangeFilter;
      }).map(comissao => {
        const servico = data.servicos.find(s => s.id === comissao.servico_id)!;
        const comissaoTotal = roundCurrency((servico.valor_bruto * servico.porcentagem_comissao) / 100);
        const cliente = data.clientes.find(c => c.id === servico.cliente_id);
        const totalRecebidoServico = roundCurrency(servico.comissao_recebida);
        const pendente = Math.max(0, roundCurrency(comissaoTotal - totalRecebidoServico));
        return {
          id: `c-${comissao.id}`,
          dataServico: servico.data_servico,
          dataRecebimento: comissao.data_recebimento,
          clienteNome: cliente?.nome || 'Cliente não encontrado',
          veiculoInfo: `${servico.veiculo} - ${servico.placa}`,
          valorBruto: Number(servico.valor_bruto),
          porcentagemComissao: Number(servico.porcentagem_comissao),
          comissaoTotal,
          valorRecebido: Number(comissao.valor), // O valor recebido especificamente nesta data!
          pendente,
          status: 'Recebido' as const
        };
      });
    }
  }, [data, dateFilterType, selectedMonth, statusFilter, clienteFilter, dataInicio, dataFim]);

  // Calcular totais baseados nas linhas filtradas
  const totalServicos = rows.length;
  const totalValorBruto = roundCurrency(rows.reduce((sum, r) => sum + r.valorBruto, 0));
  const totalComissoes = roundCurrency(rows.reduce((sum, r) => sum + r.comissaoTotal, 0));
  const totalRecebido = roundCurrency(rows.reduce((sum, r) => sum + r.valorRecebido, 0));
  const totalPendente = Math.max(0, roundCurrency(totalComissoes - totalRecebido));

  // Totais Gerais (sem filtros)
  const totalServicosGeral = data.servicos.length;
  const totalValorBrutoGeral = roundCurrency(data.servicos.reduce((sum, s) => sum + roundCurrency(s.valor_bruto), 0));
  const totalComissoesGeral = roundCurrency(data.servicos.reduce((sum, s) => sum + roundCurrency((s.valor_bruto * s.porcentagem_comissao) / 100), 0));
  const totalRecebidoGeral = roundCurrency(data.servicos.reduce((sum, s) => sum + roundCurrency(s.comissao_recebida), 0));
  const totalPendenteGeral = Math.max(0, roundCurrency(totalComissoesGeral - totalRecebidoGeral));

  const clearFilters = () => {
    setSelectedMonth("todos");
    setDateFilterType("recebimento");
    setStatusFilter("recebidos");
    setClienteFilter("");
    setDataInicio("");
    setDataFim("");
  };

  const generatePDF = async () => {
    const isRecebimento = dateFilterType === "recebimento";
    const reportTitle = isRecebimento ? "Relatório de Recebimentos" : "Relatório de Comissões (Serviço)";
    const filterMonthText = selectedMonth !== "todos" 
      ? monthNames[parseInt(selectedMonth.split('-')[1]) - 1] + " de " + selectedMonth.split('-')[0]
      : "Todos";
    
    // Criar container temporário
    const printContainer = document.createElement("div");
    printContainer.style.position = "fixed";
    printContainer.style.left = "-9999px";
    printContainer.style.top = "-9999px";
    printContainer.style.width = "800px";
    printContainer.style.backgroundColor = "#ffffff";
    printContainer.style.color = "#000000";
    printContainer.style.padding = "24px";
    printContainer.style.fontFamily = "Arial, sans-serif";
    
    // Conteúdo HTML estruturado em tema claro
    printContainer.innerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: bold; color: #1e3a8a; margin: 0;">Oliveira Martelinho de Ouro</h1>
        <p style="font-size: 16px; font-weight: 600; color: #475569; margin: 4px 0 0 0;">${reportTitle}</p>
        <p style="font-size: 11px; color: #64748b; margin: 6px 0 0 0;">
          Gerado em: ${new Date().toLocaleString('pt-BR')} | Período/Mês: ${filterMonthText}
        </p>
      </div>
      
      <div style="margin-bottom: 20px; font-size: 11px; color: #475569; background-color: #f8fafc; padding: 10px; border-radius: 4px; border: 1px solid #cbd5e1;">
        <strong>Filtros aplicados:</strong> 
        Mês: ${filterMonthText} | 
        Tipo de Data: ${isRecebimento ? "Recebimento" : "Serviço"} | 
        Status: ${statusFilter === 'recebidos' ? 'Recebidos' : statusFilter === 'pendentes' ? 'Pendentes' : 'Todos'} 
        ${clienteFilter ? `| Cliente: ${clienteFilter}` : ''}
        ${dataInicio ? `| Início: ${formatDate(dataInicio)}` : ''}
        ${dataFim ? `| Fim: ${formatDate(dataFim)}` : ''}
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; text-align: center; background-color: #f8fafc;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600;">Total Registros</div>
          <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px;">${totalServicos}</div>
        </div>
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; text-align: center; background-color: #f8fafc;">
          <div style="font-size: 11px; color: #64748b; font-weight: 600;">Valor Bruto</div>
          <div style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 4px;">${formatCurrency(totalValorBruto)}</div>
        </div>
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; text-align: center; background-color: #f0fdf4; border-color: #bbf7d0;">
          <div style="font-size: 11px; color: #166534; font-weight: 600;">Total Recebido</div>
          <div style="font-size: 18px; font-weight: bold; color: #166534; margin-top: 4px;">${formatCurrency(totalRecebido)}</div>
        </div>
        <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; text-align: center; background-color: #fef2f2; border-color: #fecaca;">
          <div style="font-size: 11px; color: #991b1b; font-weight: 600;">Total Pendente</div>
          <div style="font-size: 18px; font-weight: bold; color: #991b1b; margin-top: 4px;">${formatCurrency(totalPendente)}</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 8px 6px; text-align: left; border-bottom: 1px solid #cbd5e1;">Data Serv.</th>
            <th style="padding: 8px 6px; text-align: left; border-bottom: 1px solid #cbd5e1;">Data Rec.</th>
            <th style="padding: 8px 6px; text-align: left; border-bottom: 1px solid #cbd5e1;">Cliente</th>
            <th style="padding: 8px 6px; text-align: left; border-bottom: 1px solid #cbd5e1;">Veículo</th>
            <th style="padding: 8px 6px; text-align: right; border-bottom: 1px solid #cbd5e1;">Valor Bruto</th>
            <th style="padding: 8px 6px; text-align: right; border-bottom: 1px solid #cbd5e1;">Comissão</th>
            <th style="padding: 8px 6px; text-align: right; border-bottom: 1px solid #cbd5e1;">${isRecebimento ? "Recebido no Dia" : "Recebido"}</th>
            <th style="padding: 8px 6px; text-align: right; border-bottom: 1px solid #cbd5e1;">Pendente</th>
            <th style="padding: 8px 6px; text-align: center; border-bottom: 1px solid #cbd5e1;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows.length === 0 ? `
            <tr>
              <td colspan="9" style="padding: 24px; text-align: center; color: #64748b;">Nenhum registro encontrado.</td>
            </tr>
          ` : rows.map(row => `
            <tr style="border-bottom: 1px solid #cbd5e1;">
              <td style="padding: 6px 4px;">${formatDate(row.dataServico)}</td>
              <td style="padding: 6px 4px;">${row.dataRecebimento ? formatDate(row.dataRecebimento) : '-'}</td>
              <td style="padding: 6px 4px; font-weight: 600;">${row.clienteNome}</td>
              <td style="padding: 6px 4px;">${row.veiculoInfo}</td>
              <td style="padding: 6px 4px; text-align: right;">${formatCurrency(row.valorBruto)}</td>
              <td style="padding: 6px 4px; text-align: right;">${formatCurrency(row.comissaoTotal)} (${row.porcentagemComissao}%)</td>
              <td style="padding: 6px 4px; text-align: right; color: #166534; font-weight: 600;">${formatCurrency(row.valorRecebido)}</td>
              <td style="padding: 6px 4px; text-align: right; color: ${row.pendente > 0 ? '#991b1b' : '#475569'};">${formatCurrency(row.pendente)}</td>
              <td style="padding: 6px 4px; text-align: center;">
                <span style="padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; 
                  background-color: ${row.status === 'Recebido' ? '#dcfce7' : '#ffedd5'}; 
                  color: ${row.status === 'Recebido' ? '#166534' : '#9a3412'};">
                  ${row.status}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    document.body.appendChild(printContainer);
    
    try {
      const canvas = await html2canvas(printContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const safeMonthText = selectedMonth !== "todos" ? `_${selectedMonth}` : "_geral";
      pdf.save(`relatorio_comissoes${safeMonthText}.pdf`);
      toast.success("PDF do relatório gerado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF do relatório");
    } finally {
      document.body.removeChild(printContainer);
    }
  };

  const exportCSV = () => {
    const isRecebimento = dateFilterType === "recebimento";
    const headers = [
      "Data Servico",
      "Data Recebimento",
      "Cliente",
      "Veiculo",
      "Valor Bruto",
      "Porcentagem Comissao",
      "Comissao Total",
      isRecebimento ? "Valor Recebido no Dia" : "Valor Recebido",
      "Pendente",
      "Status"
    ];

    const csvRows = [
      headers.join(";"),
      ...rows.map(row => [
        formatDate(row.dataServico),
        row.dataRecebimento ? formatDate(row.dataRecebimento) : "",
        `"${row.clienteNome.replace(/"/g, '""')}"`,
        `"${row.veiculoInfo.replace(/"/g, '""')}"`,
        row.valorBruto.toFixed(2),
        row.porcentagemComissao.toString(),
        row.comissaoTotal.toFixed(2),
        row.valorRecebido.toFixed(2),
        row.pendente.toFixed(2),
        row.status
      ].join(";"))
    ];

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = `relatorio_comissoes_${selectedMonth !== "todos" ? selectedMonth : "geral"}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exportado com sucesso!");
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
                <p className="text-blue-100 text-sm">Comissões no Período</p>
                <p className="text-3xl font-bold">{formatCurrency(totalComissoes)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2 - Total Acumulado */}
        <Card className="bg-orange-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Faturamento no Período</p>
                <p className="text-3xl font-bold">{formatCurrency(totalValorBruto)}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3 - Total Recebido */}
        <Card className="bg-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Recebido no Período</p>
                <p className="text-3xl font-bold">{formatCurrency(totalRecebido)}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4 - Total Pendente */}
        <Card className="bg-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Pendente no Período</p>
                <p className="text-3xl font-bold">{formatCurrency(totalPendente)}</p>
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
              <Button variant="outline" size="sm" onClick={generatePDF} className="text-blue-400 border-blue-600 hover:bg-blue-900/30">
                <FileText className="h-4 w-4 mr-2" />
                Salvar PDF
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
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Data Fim</label>
              <Input 
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>


      {/* TABELA DETALHADA DE COMISSÕES */}
      <Card className="bg-gray-900 text-white">
        <CardHeader>
          <CardTitle className="text-white">Detalhamento das Comissões ({totalServicos} registros)</CardTitle>
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
                  <TableHead className="text-gray-300 text-right">{dateFilterType === "recebimento" ? "Recebido no Dia" : "Recebido Acumulado"}</TableHead>
                  <TableHead className="text-gray-300 text-right">Pendente</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-gray-400 py-12">
                      Nenhum registro encontrado com os filtros selecionados
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    return (
                      <TableRow key={row.id} className="border-gray-700">
                        <TableCell className="text-gray-300">
                          {formatDate(row.dataServico)}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {row.dataRecebimento ? formatDate(row.dataRecebimento) : '-'}
                        </TableCell>
                        <TableCell className="text-gray-300 font-medium">
                          {row.clienteNome}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {row.veiculoInfo}
                        </TableCell>
                        <TableCell className="text-gray-300 text-right">
                          {formatCurrency(row.valorBruto)}
                        </TableCell>
                        <TableCell className="text-gray-300 text-right">
                          {row.porcentagemComissao}%
                        </TableCell>
                        <TableCell className="text-gray-300 text-right font-medium">
                          {formatCurrency(row.comissaoTotal)}
                        </TableCell>
                        <TableCell className="text-gray-300 text-right font-semibold text-green-400">
                          {formatCurrency(row.valorRecebido)}
                        </TableCell>
                        <TableCell className="text-gray-300 text-right text-orange-400">
                          {formatCurrency(row.pendente)}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            row.status === 'Recebido' 
                              ? 'bg-green-900/50 text-green-400 border border-green-700/50' 
                              : 'bg-orange-900/50 text-orange-400 border border-orange-700/50'
                          }`}>
                            {row.status}
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