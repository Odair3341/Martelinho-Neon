import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BusinessData, Servico } from "@/types/business";
import { Plus, Car, Calendar, Edit, Trash2 } from "lucide-react";
import { EditServiceDialog } from "./EditServiceDialog";
import { fixTimezoneDate } from "@/lib/utils";

interface ServicosTabProps {
  data: BusinessData;
  onUpdateData: (newData: BusinessData) => void;
}

export const ServicosTab = ({ data, onUpdateData }: ServicosTabProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Servico | null>(null);
  const [formData, setFormData] = useState({
    data_servico: "",
    cliente_id: "",
    veiculo: "",
    placa: "",
    valor_bruto: "",
    porcentagem_comissao: "35",
    observacao: ""
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
      year: 'numeric'
    });
  };

  const formatDateExtended = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const addService = () => {
    if (!formData.data_servico || !formData.cliente_id || !formData.veiculo || !formData.placa || !formData.valor_bruto) {
      return;
    }

    const valorBruto = parseFloat(formData.valor_bruto);
    const porcentagemComissao = parseFloat(formData.porcentagem_comissao);
    const comissaoTotal = (valorBruto * porcentagemComissao) / 100;

    const newService: Servico = {
      id: Date.now(),
      data_servico: fixTimezoneDate(formData.data_servico),
      cliente_id: parseInt(formData.cliente_id),
      veiculo: formData.veiculo,
      placa: formData.placa.toUpperCase(),
      valor_bruto: valorBruto,
      porcentagem_comissao: porcentagemComissao,
      observacao: formData.observacao,
      valor_pago: 0,
      quitado: false,
      comissao_recebida: 0  // Inicia com 0, será atualizada quando receber
    };

    const updatedData = {
      ...data,
      servicos: [...data.servicos, newService],
      metadata: {
        ...data.metadata,
        totalServicos: data.servicos.length + 1
      }
    };

    onUpdateData(updatedData);
    setFormData({
      data_servico: "",
      cliente_id: "",
      veiculo: "",
      placa: "",
      valor_bruto: "",
      porcentagem_comissao: "35",
      observacao: ""
    });
    setShowForm(false);
  };

  const getClienteName = (clienteId: number) => {
    const cliente = data.clientes.find(c => c.id === clienteId);
    return cliente?.nome || "Cliente não encontrado";
  };

  const servicosOrdenados = [...data.servicos].sort((a, b) => 
    new Date(b.data_servico).getTime() - new Date(a.data_servico).getTime()
  );

  const deleteService = (serviceId: number) => {
    const updatedServices = data.servicos.filter(s => s.id !== serviceId);
    const updatedData = {
      ...data,
      servicos: updatedServices,
      metadata: {
        ...data.metadata,
        totalServicos: updatedServices.length
      }
    };
    onUpdateData(updatedData);
  };

  const getStatusText = (servico: Servico) => {
    const comissaoTotal = servico.valor_bruto * servico.porcentagem_comissao / 100;
    
    if (servico.comissao_recebida === 0) {
      return "Pendente";
    } else if (servico.comissao_recebida >= comissaoTotal) {
      return "Finalizado";
    } else {
      return "Parcial";
    }
  };

  const getStatusVariant = (servico: Servico) => {
    const comissaoTotal = servico.valor_bruto * servico.porcentagem_comissao / 100;
    
    if (servico.comissao_recebida === 0) {
      return "secondary";
    } else if (servico.comissao_recebida >= comissaoTotal) {
      return "default";
    } else {
      return "outline";
    }
  };

  const getStatusColor = (servico: Servico) => {
    const comissaoTotal = servico.valor_bruto * servico.porcentagem_comissao / 100;
    
    if (servico.comissao_recebida === 0) {
      return "bg-warning/20 text-warning";
    } else if (servico.comissao_recebida >= comissaoTotal) {
      return "bg-success/20 text-success";
    } else {
      return "bg-blue-500/20 text-blue-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Botão Adicionar Serviço */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-primary" />
              <span>Adicionar Novo Serviço</span>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-accent hover:bg-accent/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Serviço
            </Button>
          </CardTitle>
        </CardHeader>
        
        {showForm && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_servico">Data do Serviço</Label>
                <Input
                  id="data_servico"
                  type="date"
                  value={formData.data_servico}
                  onChange={(e) => setFormData({...formData, data_servico: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="cliente_id">Cliente</Label>
                <Select value={formData.cliente_id} onValueChange={(value) => setFormData({...formData, cliente_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id.toString()}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="veiculo">Veículo</Label>
                <Input
                  id="veiculo"
                  placeholder="Ex: Tiguan, Mercedes C180"
                  value={formData.veiculo}
                  onChange={(e) => setFormData({...formData, veiculo: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="placa">Placa</Label>
                <Input
                  id="placa"
                  placeholder="ABC-1234"
                  value={formData.placa}
                  onChange={(e) => setFormData({...formData, placa: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="valor_bruto">Valor Bruto (R$)</Label>
                <Input
                  id="valor_bruto"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={formData.valor_bruto}
                  onChange={(e) => setFormData({...formData, valor_bruto: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="porcentagem_comissao">Comissão (%)</Label>
                <Input
                  id="porcentagem_comissao"
                  type="number"
                  step="0.1"
                  value={formData.porcentagem_comissao}
                  onChange={(e) => setFormData({...formData, porcentagem_comissao: e.target.value})}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="observacao">Observações</Label>
                <Textarea
                  id="observacao"
                  placeholder="Descreva os detalhes do serviço..."
                  value={formData.observacao}
                  onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                />
              </div>

              {formData.valor_bruto && formData.porcentagem_comissao && (
                <div className="md:col-span-2 p-4 bg-accent/10 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Valor da Comissão Calculado:</p>
                  <p className="text-2xl font-bold text-accent">
                    {formatCurrency((parseFloat(formData.valor_bruto) * parseFloat(formData.porcentagem_comissao)) / 100)}
                  </p>
                </div>
              )}

              <div className="md:col-span-2 flex space-x-4">
                <Button onClick={addService} className="flex-1">
                  Adicionar Serviço
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Lista de Serviços */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Car className="h-5 w-5 text-primary" />
            <span>Serviços Cadastrados ({data.servicos.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {servicosOrdenados.map((servico) => (
              <div key={servico.id} className="p-4 border rounded-lg hover:shadow-soft transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Car className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{servico.veiculo} - {servico.placa}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getClienteName(servico.cliente_id)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                     <Badge variant={getStatusVariant(servico)} className={getStatusColor(servico)}>
                       {getStatusText(servico)}
                     </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingService(servico)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => deleteService(servico.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Data do Serviço</p>
                    <div className="font-semibold text-base text-primary">
                      {formatDate(servico.data_servico)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateExtended(servico.data_servico)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Bruto</p>
                    <p className="font-medium">{formatCurrency(servico.valor_bruto)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Comissão ({servico.porcentagem_comissao}%)</p>
                    <p className="font-medium text-success">
                      {formatCurrency((servico.valor_bruto * servico.porcentagem_comissao) / 100)}
                    </p>
                  </div>
                   <div>
                     <p className="text-muted-foreground">Comissão Recebida</p>
                     <p className="font-medium">
                       {servico.comissao_recebida > 0 ? formatCurrency(servico.comissao_recebida) : "R$ 0,00"}
                     </p>
                     {servico.comissao_recebida > 0 && servico.comissao_recebida < (servico.valor_bruto * servico.porcentagem_comissao / 100) && (
                       <p className="text-xs text-warning">
                         Parcial - Falta: {formatCurrency((servico.valor_bruto * servico.porcentagem_comissao / 100) - servico.comissao_recebida)}
                       </p>
                     )}
                   </div>
                </div>

                {servico.observacao && (
                  <div className="mt-3 p-2 bg-muted/50 rounded">
                    <p className="text-sm text-muted-foreground">Observações:</p>
                    <p className="text-sm">{servico.observacao}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <EditServiceDialog
        open={!!editingService}
        onOpenChange={(open) => !open && setEditingService(null)}
        service={editingService}
        data={data}
        onUpdateData={onUpdateData}
      />
    </div>
  );
};