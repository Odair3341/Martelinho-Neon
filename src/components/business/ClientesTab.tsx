import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BusinessData, Cliente } from "@/types/business";
import { Plus, Users, Eye, Calendar, DollarSign } from "lucide-react";

interface ClientesTabProps {
  data: BusinessData;
  onUpdateData: (newData: BusinessData) => void;
}

export const ClientesTab = ({ data, onUpdateData }: ClientesTabProps) => {
  const [newClienteName, setNewClienteName] = useState("");
  const [newClientePhone, setNewClientePhone] = useState("");
  const [newClienteEmail, setNewClienteEmail] = useState("");
  const [newClienteAddress, setNewClienteAddress] = useState("");
  const [newClienteCpf, setNewClienteCpf] = useState("");
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const addClient = () => {
    // Validação dos campos obrigatórios
    if (!newClienteName.trim()) {
      alert("Por favor, digite o nome do cliente.");
      return;
    }
    if (!newClientePhone.trim()) {
      alert("Por favor, digite o telefone do cliente.");
      return;
    }
    if (!newClienteEmail.trim()) {
      alert("Por favor, digite o email do cliente.");
      return;
    }
    if (!newClienteAddress.trim()) {
      alert("Por favor, digite o endereço do cliente.");
      return;
    }
    
    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClienteEmail)) {
      alert("Por favor, digite um email válido.");
      return;
    }
    
    const newClient: Cliente = {
      id: 'temp_' + Date.now(),
      nome: newClienteName.trim(),
      telefone: newClientePhone.trim(),
      email: newClienteEmail.trim(),
      endereco: newClienteAddress.trim(),
      cpf: newClienteCpf.trim() || undefined,
      data_cadastro: new Date().toISOString()
    };

    const updatedData = {
      ...data,
      clientes: [...data.clientes, newClient],
      metadata: {
        ...data.metadata,
        totalClientes: data.clientes.length + 1
      }
    };

    onUpdateData(updatedData);
    setNewClienteName("");
    setNewClientePhone("");
    setNewClienteEmail("");
    setNewClienteAddress("");
    setNewClienteCpf("");
    console.log("Cliente adicionado:", newClient);
  };

  const getClientStats = (clienteId: number | string) => {
    const servicosCliente = data.servicos.filter(s => s.cliente_id === clienteId);
    const totalServicos = servicosCliente.length;
    const totalFaturamento = servicosCliente.reduce((acc, s) => acc + s.valor_bruto, 0);
    const ultimoServico = servicosCliente.length > 0 
      ? new Date(Math.max(...servicosCliente.map(s => new Date(s.data_servico).getTime())))
      : null;

    return { totalServicos, totalFaturamento, ultimoServico };
  };

  return (
    <div className="space-y-6">
      {/* Adicionar Novo Cliente */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Adicionar Novo Cliente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome Completo *</label>
              <Input
                placeholder="Digite o nome completo do cliente"
                value={newClienteName}
                onChange={(e) => setNewClienteName(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Telefone *</label>
              <Input
                placeholder="(11) 99999-9999"
                value={newClientePhone}
                onChange={(e) => setNewClientePhone(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email *</label>
              <Input
                type="email"
                placeholder="cliente@email.com"
                value={newClienteEmail}
                onChange={(e) => setNewClienteEmail(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">CPF</label>
              <Input
                placeholder="000.000.000-00"
                value={newClienteCpf}
                onChange={(e) => setNewClienteCpf(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block">Endereço Completo *</label>
            <Input
              placeholder="Rua, número, bairro, cidade - CEP"
              value={newClienteAddress}
              onChange={(e) => setNewClienteAddress(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={addClient} className="bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-primary" />
            <span>Clientes Cadastrados ({data.clientes.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.clientes.map((cliente) => {
              const stats = getClientStats(cliente.id);
              return (
                <div key={cliente.id} className="p-4 border rounded-lg hover:shadow-soft transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{cliente.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {cliente.telefone && `📞 ${cliente.telefone}`}
                        {cliente.telefone && cliente.email && ' • '}
                        {cliente.email && `📧 ${cliente.email}`}
                      </p>
                      {cliente.endereco && (
                        <p className="text-sm text-muted-foreground mt-1">📍 {cliente.endereco}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Cliente desde: {cliente.data_cadastro ? new Date(cliente.data_cadastro).toLocaleDateString('pt-BR') : '14/08/2025'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedClient(cliente)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Serviços:</span>
                      <Badge variant="secondary">{stats.totalServicos}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total:</span>
                      <span className="font-medium text-success">
                        {formatCurrency(stats.totalFaturamento)}
                      </span>
                    </div>
                    
                    {stats.ultimoServico && (
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Último serviço: {stats.ultimoServico.toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.clientes.length}</p>
                <p className="text-sm text-muted-foreground">Clientes cadastrados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-accent/10 rounded-full">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Clientes ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-success/10 rounded-full">
                <Calendar className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.servicos.reduce((acc, s) => acc + s.valor_bruto, 0) / data.clientes.length || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Ticket médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};