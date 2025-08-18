import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessData } from "@/types/business";
import { 
  Users, 
  Car, 
  DollarSign, 
  Receipt,
  TrendingUp,
  Calendar
} from "lucide-react";

interface DashboardProps {
  data: BusinessData;
}

export const Dashboard = ({ data }: DashboardProps) => {
  const totalServicos = data.servicos.length;
  const totalClientes = data.clientes.length;
  const totalComissoes = data.servicos.reduce((acc, servico) => acc + servico.comissao_recebida, 0);
  const totalReceitas = data.servicos.reduce((acc, servico) => acc + (servico.valor_bruto * servico.porcentagem_comissao / 100), 0);
  const servicosRecentes = data.servicos.slice(-5).reverse();
  
  // Cálculos para despesas
  const totalDespesas = data.despesas.reduce((acc, despesa) => acc + despesa.valor, 0);
  const despesasPagas = data.despesas.filter(d => d.pago).reduce((acc, despesa) => acc + despesa.valor, 0);
  const despesasPendentes = totalDespesas - despesasPagas;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Cartões de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Clientes
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalClientes}</div>
            <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Serviços
            </CardTitle>
            <Car className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{totalServicos}</div>
            <p className="text-xs text-muted-foreground">Serviços realizados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Comissões
            </CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>{formatCurrency(totalComissoes)}</div>
            <p className="text-xs text-muted-foreground">Comissões recebidas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total Comissões
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--warning))' }}>{formatCurrency(totalReceitas)}</div>
            <p className="text-xs text-muted-foreground">Total das comissões calculadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Despesas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Despesas
            </CardTitle>
            <Receipt className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--destructive))' }}>{formatCurrency(totalDespesas)}</div>
            <p className="text-xs text-muted-foreground">{data.despesas.length} despesas registradas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas Pagas
            </CardTitle>
            <Receipt className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>{formatCurrency(despesasPagas)}</div>
            <p className="text-xs text-muted-foreground">
              {data.despesas.filter(d => d.pago).length} pagas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Despesas Pendentes
            </CardTitle>
            <Receipt className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--warning))' }}>{formatCurrency(despesasPendentes)}</div>
            <p className="text-xs text-muted-foreground">
              {data.despesas.filter(d => !d.pago).length} pendentes
            </p>
          </CardContent>
        </Card>
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
                       Comissão: {formatCurrency(servico.comissao_recebida)}
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