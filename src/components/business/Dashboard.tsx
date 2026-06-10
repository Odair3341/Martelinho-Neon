import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessData } from "@/types/business";
import { 
  Users, 
  Car, 
  DollarSign, 
  Receipt,
  TrendingUp,
  Calendar,
  CreditCard,
  Target,
  Wallet,
  PiggyBank
} from "lucide-react";

interface DashboardProps {
  data: BusinessData;
}

export const Dashboard = ({ data }: DashboardProps) => {
  const totalServicos = data.servicos.length;
  const totalClientes = data.clientes.length;
  
  // Cálculos financeiros principais
  const totalFaturado = data.servicos.reduce((acc, servico) => acc + servico.valor_bruto, 0);
  const totalComissoesRecebidas = data.servicos.reduce((acc, servico) => acc + servico.comissao_recebida, 0);
  const totalComissoesCalculadas = data.servicos.reduce((acc, servico) => acc + (servico.valor_bruto * servico.porcentagem_comissao / 100), 0);
  const valorAReceber = totalComissoesCalculadas - totalComissoesRecebidas;
  
  const parseDateToTime = (dateString: string) => {
    if (!dateString) return 0;
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : (dateString.includes(' ') ? dateString.split(' ')[0] : dateString);
    const date = new Date(datePart + 'T00:00:00');
    return isNaN(date.getTime()) ? new Date(dateString).getTime() || 0 : date.getTime();
  };

  const servicosRecentes = data.servicos
    .sort((a, b) => parseDateToTime(b.data_servico) - parseDateToTime(a.data_servico))
    .slice(0, 5);
  
  // Cálculos para despesas
  const totalDespesas = data.despesas.reduce((acc, despesa) => acc + despesa.valor, 0);
  const despesasPagas = data.despesas.filter(d => d.pago).reduce((acc, despesa) => acc + despesa.valor, 0);
  const despesasPendentes = totalDespesas - despesasPagas;
  
  // Lucro líquido estimado
  const lucroLiquido = totalComissoesRecebidas - despesasPagas;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      const datePart = dateString.includes('T') 
        ? dateString.split('T')[0] 
        : (dateString.includes(' ') ? dateString.split(' ')[0] : dateString);
      const date = new Date(datePart + 'T00:00:00');
      if (isNaN(date.getTime())) {
        const fallback = new Date(dateString);
        if (isNaN(fallback.getTime())) return '-';
        return fallback.toLocaleDateString('pt-BR');
      }
      return date.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Métricas Principais - Financeiro */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">💰 Resumo Financeiro</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Total Faturado
              </CardTitle>
              <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{formatCurrency(totalFaturado)}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Valor bruto dos serviços</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                Comissões Recebidas
              </CardTitle>
              <Wallet className="h-5 w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(totalComissoesRecebidas)}</div>
              <p className="text-xs text-green-600 dark:text-green-400">Já recebido</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Valor a Receber
              </CardTitle>
              <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">{formatCurrency(valorAReceber)}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Comissões pendentes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Lucro Líquido
              </CardTitle>
              <PiggyBank className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-purple-800 dark:text-purple-200' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(lucroLiquido)}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Comissões - Despesas pagas</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Métricas Operacionais */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">📊 Resumo Operacional</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-indigo-200 dark:border-indigo-800 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                Total de Clientes
              </CardTitle>
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">{totalClientes}</div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400">Clientes cadastrados</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 border-teal-200 dark:border-teal-800 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-teal-700 dark:text-teal-300">
                Total de Serviços
              </CardTitle>
              <Car className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-800 dark:text-teal-200">{totalServicos}</div>
              <p className="text-xs text-teal-600 dark:text-teal-400">Serviços realizados</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gestão de Despesas */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">💳 Gestão de Despesas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
                Total Despesas
              </CardTitle>
              <Receipt className="h-5 w-5 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">{formatCurrency(totalDespesas)}</div>
              <p className="text-xs text-red-600 dark:text-red-400">{data.despesas.length} despesas registradas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Despesas Pagas
              </CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{formatCurrency(despesasPagas)}</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {data.despesas.filter(d => d.pago).length} pagas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
                Despesas Pendentes
              </CardTitle>
              <Receipt className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">{formatCurrency(despesasPendentes)}</div>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {data.despesas.filter(d => !d.pago).length} pendentes
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Serviços Recentes */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>Serviços Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {servicosRecentes.map((servico) => {
              const cliente = data.clientes.find(c => c.id === servico.cliente_id);
              const comissaoTotal = roundCurrency(servico.valor_bruto * servico.porcentagem_comissao / 100);
              return (
                <div key={servico.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{servico.veiculo} - {servico.placa}</p>
                      <p className="text-sm text-muted-foreground">
                        {cliente?.nome} • {formatDate(servico.data_servico)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(servico.valor_bruto)}</p>
                     <p className="text-sm" style={{ color: 'hsl(var(--success))' }}>
                       Comissão: {formatCurrency(comissaoTotal)}
                     </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};