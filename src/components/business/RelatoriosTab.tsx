import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessData } from "@/types/business";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";

interface RelatoriosTabProps {
  data: BusinessData;
}

export const RelatoriosTab = ({ data }: RelatoriosTabProps) => {
  const [selectedMonth, setSelectedMonth] = useState<string>("todos");
  const [dateFilterType, setDateFilterType] = useState<"servico" | "recebimento">("recebimento");

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

  // Filtrar serviços baseado no mês selecionado
  const filteredServicos = data.servicos.filter(servico => {
    if (selectedMonth === "todos") return true;

    if (dateFilterType === "servico") {
      const servicoDate = new Date(servico.data_servico);
      const servicoMonth = `${servicoDate.getFullYear()}-${String(servicoDate.getMonth() + 1).padStart(2, '0')}`;
      return servicoMonth === selectedMonth;
    } else {
      // Filtrar por data de recebimento
      if (!servico.data_recebimento_comissao) return false;
      const recebimentoDate = new Date(servico.data_recebimento_comissao);
      const recebimentoMonth = `${recebimentoDate.getFullYear()}-${String(recebimentoDate.getMonth() + 1).padStart(2, '0')}`;
      return recebimentoMonth === selectedMonth;
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Relatórios de Comissões</h2>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Período</label>
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

        <div className="flex-1 space-y-2">
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
      </div>

      {/* Cards Grandes e Bonitos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 - Total de Serviços */}
        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Serviços
              </CardTitle>
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalServicos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Serviços realizados
            </p>
          </CardContent>
        </Card>

        {/* Card 2 - Valor Bruto Total */}
        <Card className="border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faturamento Total
              </CardTitle>
              <DollarSign className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{formatCurrency(totalValorBruto)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor bruto dos serviços
            </p>
          </CardContent>
        </Card>

        {/* Card 3 - Comissões Totais */}
        <Card className="border-l-4 border-l-orange-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Comissões Totais
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{formatCurrency(totalComissoes)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total a receber
            </p>
          </CardContent>
        </Card>

        {/* Card 4 - Total Recebido */}
        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Recebido
              </CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(totalRecebido)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {percentualRecebido.toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Card de Resumo com Barra de Progresso */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Resumo do Período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progresso de Recebimento</span>
              <span className="text-muted-foreground">{percentualRecebido.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{ width: `${percentualRecebido}%` }}
              >
                {percentualRecebido > 10 && (
                  <span className="text-xs font-bold text-white">
                    {percentualRecebido.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Grid de Informações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Comissões Totais</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalComissoes)}</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Já Recebido</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRecebido)}</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Pendente</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalComissoes - totalRecebido)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABELA DETALHADA DE SERVIÇOS */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Detalhamento dos Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data Serviço</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor Bruto</TableHead>
                  <TableHead className="text-right">% Comissão</TableHead>
                  <TableHead className="text-right">Comissão Total</TableHead>
                  <TableHead className="text-right">Recebido</TableHead>
                  <TableHead className="text-right">Pendente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Recebimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServicos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      Nenhum serviço encontrado com os filtros selecionados
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredServicos
                    .sort((a, b) => new Date(b.data_servico).getTime() - new Date(a.data_servico).getTime())
                    .map((servico) => {
                      const comissaoTotal = Math.round(servico.valor_bruto * servico.porcentagem_comissao) / 100;
                      const comissaoPendente = Math.max(0, comissaoTotal - servico.comissao_recebida);
                      const isPendente = servico.comissao_recebida === 0;
                      const isParcial = servico.comissao_recebida > 0 && servico.comissao_recebida < comissaoTotal;
                      const isCompleto = servico.comissao_recebida >= comissaoTotal;

                      return (
                        <TableRow key={servico.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(servico.data_servico)}</TableCell>
                          <TableCell className="font-medium">{getClienteName(servico.cliente_id)}</TableCell>
                          <TableCell className="max-w-xs truncate">{servico.descricao || "-"}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">{formatCurrency(servico.valor_bruto)}</TableCell>
                          <TableCell className="text-right">{servico.porcentagem_comissao}%</TableCell>
                          <TableCell className="text-right font-semibold whitespace-nowrap">{formatCurrency(comissaoTotal)}</TableCell>
                          <TableCell className="text-right text-green-600 whitespace-nowrap">{formatCurrency(servico.comissao_recebida)}</TableCell>
                          <TableCell className="text-right text-orange-600 whitespace-nowrap">{formatCurrency(comissaoPendente)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={isPendente ? "destructive" : isParcial ? "secondary" : "default"}
                              className={isParcial ? "bg-orange-500 hover:bg-orange-600" : ""}
                            >
                              {isPendente ? "Pendente" : isParcial ? "Parcial" : "Recebido"}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {servico.data_recebimento_comissao ? formatDate(servico.data_recebimento_comissao) : "-"}
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