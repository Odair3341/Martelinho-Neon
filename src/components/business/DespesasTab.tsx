import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BusinessData, Despesa } from "@/types/business";
import { Plus, Receipt, Calendar, AlertCircle } from "lucide-react";

interface DespesasTabProps {
  data: BusinessData;
  onUpdateData: (newData: BusinessData) => void;
}

export const DespesasTab = ({ data, onUpdateData }: DespesasTabProps) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data_vencimento: ""
  });

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
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatDateExtended = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const getDaysUntilDue = (dateString: string) => {
    const today = new Date();
    const dueDate = new Date(dateString);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const addExpense = () => {
    if (!formData.descricao || !formData.valor || !formData.data_vencimento) {
      return;
    }

    const newExpense: Despesa = {
      id: 'temp_' + Date.now(),
      descricao: formData.descricao,
      valor: parseFloat(formData.valor),
      data_vencimento: formData.data_vencimento,
      pago: false
    };

    const updatedData = {
      ...data,
      despesas: [...data.despesas, newExpense],
      metadata: {
        ...data.metadata,
        totalDespesas: data.despesas.length + 1
      }
    };

    onUpdateData(updatedData);
    setFormData({
      descricao: "",
      valor: "",
      data_vencimento: ""
    });
    setShowForm(false);
  };

  const togglePaid = (despesaId: number | string) => {
    const updatedDespesas = data.despesas.map(despesa =>
      despesa.id === despesaId ? { ...despesa, pago: !despesa.pago } : despesa
    );

    const updatedData = {
      ...data,
      despesas: updatedDespesas
    };

    onUpdateData(updatedData);
  };

  const getStatusBadge = (despesa: Despesa) => {
    if (despesa.pago) {
      return <Badge className="bg-success text-success-foreground">Pago</Badge>;
    }
    
    const today = new Date();
    const vencimento = new Date(despesa.data_vencimento);
    
    if (vencimento < today) {
      return <Badge variant="destructive">Vencido</Badge>;
    }
    
    return <Badge variant="secondary">Pendente</Badge>;
  };

  const totalDespesas = data.despesas.reduce((acc, despesa) => acc + despesa.valor, 0);
  const totalPago = data.despesas.filter(d => d.pago).reduce((acc, despesa) => acc + despesa.valor, 0);
  const totalPendente = totalDespesas - totalPago;

  return (
    <div className="space-y-6">
      {/* Resumo das Despesas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Receipt className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalDespesas)}</p>
                <p className="text-sm text-muted-foreground">Total de despesas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-success/10 rounded-full">
                <Receipt className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalPago)}</p>
                <p className="text-sm text-muted-foreground">Despesas pagas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-warning/10 rounded-full">
                <AlertCircle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{formatCurrency(totalPendente)}</p>
                <p className="text-sm text-muted-foreground">Despesas pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adicionar Nova Despesa */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-primary" />
              <span>Adicionar Nova Despesa</span>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-accent hover:bg-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </Button>
          </CardTitle>
        </CardHeader>
        
        {showForm && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="descricao">Descrição da Despesa</Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Aluguel, Energia, Material..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => setFormData({...formData, valor: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="data_vencimento">Data de Vencimento</Label>
                <Input
                  id="data_vencimento"
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => setFormData({...formData, data_vencimento: e.target.value})}
                />
              </div>

              <div className="md:col-span-3 flex space-x-4">
                <Button onClick={addExpense} className="flex-1">
                  Adicionar Despesa
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lista de Despesas */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-primary" />
            <span>Despesas Registradas ({data.despesas.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.despesas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma despesa registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {[...data.despesas].sort((a, b) => new Date(b.data_vencimento).getTime() - new Date(a.data_vencimento).getTime()).map((despesa) => {
                const daysUntilDue = getDaysUntilDue(despesa.data_vencimento);
                return (
                  <div key={despesa.id} className="p-4 border rounded-lg hover:shadow-soft transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{despesa.descricao}</h3>
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground mb-1">Data de Vencimento:</p>
                          <div className="text-sm font-semibold text-primary">
                            {formatDate(despesa.data_vencimento)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDateExtended(despesa.data_vencimento)}
                            {!despesa.pago && (
                              <span className={`ml-2 ${daysUntilDue < 0 ? 'text-destructive' : daysUntilDue <= 3 ? 'text-warning' : 'text-muted-foreground'}`}>
                                {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} dias em atraso` : 
                                 daysUntilDue === 0 ? 'Vence hoje' :
                                 `${daysUntilDue} dias restantes`}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="font-bold text-lg">{formatCurrency(despesa.valor)}</span>
                        </div>
                        {getStatusBadge(despesa)}
                      </div>
                     </div>
                   
                     <div className="flex justify-end">
                       <Button
                         variant={despesa.pago ? "outline" : "default"}
                         size="sm"
                         onClick={() => togglePaid(despesa.id)}
                         className={despesa.pago ? "" : "bg-success hover:bg-success/90"}
                       >
                         {despesa.pago ? "Marcar como Pendente" : "Marcar como Pago"}
                       </Button>
                     </div>
                   </div>
                 );
               })}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};