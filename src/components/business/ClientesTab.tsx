import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BusinessData, Cliente } from "@/types/business";
import { Plus, Users, Eye, Calendar, DollarSign, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

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
  
  // Estados para visualizar/editar cliente selecionado
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCpf, setEditCpf] = useState("");

  const activeClientsCount = data.clientes.filter(c => getClientStats(c.id).totalServicos > 0).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSelectClient = (cliente: Cliente) => {
    setSelectedClient(cliente);
    setEditName(cliente.nome);
    setEditPhone(cliente.telefone || "");
    setEditEmail(cliente.email || "");
    setEditAddress(cliente.endereco || "");
    setEditCpf(cliente.cpf || "");
    setIsEditing(false);
  };

  const addClient = () => {
    // Apenas o nome é estritamente obrigatório agora!
    if (!newClienteName.trim()) {
      alert("Por favor, digite o nome do cliente.");
      return;
    }
    
    // Validação de email (apenas se preenchido)
    if (newClienteEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newClienteEmail)) {
        alert("Por favor, digite um email válido.");
        return;
      }
    }
    
    const newClient: Cliente = {
      id: 'temp_' + Date.now(),
      nome: newClienteName.trim(),
      telefone: newClientePhone.trim() || undefined,
      email: newClienteEmail.trim() || undefined,
      endereco: newClienteAddress.trim() || undefined,
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

  const saveClientEdits = () => {
    if (!editName.trim()) {
      alert("Por favor, digite o nome do cliente.");
      return;
    }

    if (editEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editEmail)) {
        alert("Por favor, digite um email válido.");
        return;
      }
    }

    const updatedClientes = data.clientes.map(c => 
      c.id === selectedClient!.id 
        ? {
            ...c,
            nome: editName.trim(),
            telefone: editPhone.trim() || undefined,
            email: editEmail.trim() || undefined,
            endereco: editAddress.trim() || undefined,
            cpf: editCpf.trim() || undefined
          }
        : c
    );

    const updatedData = {
      ...data,
      clientes: updatedClientes
    };

    onUpdateData(updatedData);
    setIsEditing(false);
    setSelectedClient(null);
  };

  const handleDeleteClient = () => {
    const stats = getClientStats(selectedClient!.id);
    const msg = stats.totalServicos > 0
      ? `Atenção: Este cliente possui ${stats.totalServicos} serviços vinculados. Se você excluir este cliente, os serviços vinculados continuarão existindo no sistema, mas sem cliente associado. Confirma a exclusão de "${selectedClient!.nome}"?`
      : `Tem certeza que deseja excluir o cadastro do cliente "${selectedClient!.nome}"?`;

    if (!confirm(msg)) return;

    const updatedClientes = data.clientes.filter(c => c.id !== selectedClient!.id);
    const updatedData = {
      ...data,
      clientes: updatedClientes,
      metadata: {
        ...data.metadata,
        totalClientes: updatedClientes.length
      }
    };

    onUpdateData(updatedData);
    setSelectedClient(null);
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
      <Card className="shadow-medium bg-gray-900 border-gray-800 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Plus className="h-5 w-5 text-primary" />
            <span>Adicionar Novo Cliente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-gray-300">Nome Completo *</label>
              <Input
                placeholder="Digite o nome completo do cliente"
                value={newClienteName}
                onChange={(e) => setNewClienteName(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-gray-300">Telefone</label>
              <Input
                placeholder="(11) 99999-9999"
                value={newClientePhone}
                onChange={(e) => setNewClientePhone(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-gray-300">Email</label>
              <Input
                type="email"
                placeholder="cliente@email.com"
                value={newClienteEmail}
                onChange={(e) => setNewClienteEmail(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-gray-300">CPF</label>
              <Input
                placeholder="000.000.000-00"
                value={newClienteCpf}
                onChange={(e) => setNewClienteCpf(e.target.value)}
                className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium mb-1 block text-gray-300">Endereço Completo</label>
            <Input
              placeholder="Rua, número, bairro, cidade - CEP"
              value={newClienteAddress}
              onChange={(e) => setNewClienteAddress(e.target.value)}
              className="w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={addClient} className="bg-accent hover:bg-accent/90 text-white font-semibold shadow-gold">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cliente
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <Card className="shadow-medium bg-gray-900 border-gray-800 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Users className="h-5 w-5 text-primary" />
            <span>Clientes Cadastrados ({data.clientes.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.clientes.length === 0 ? (
            <p className="text-center text-gray-400 py-6">Nenhum cliente cadastrado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.clientes.map((cliente) => {
                const stats = getClientStats(cliente.id);
                return (
                  <div key={cliente.id} className="p-4 bg-gray-800/50 border border-gray-800 rounded-lg hover:shadow-soft transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="overflow-hidden mr-2">
                        <h3 className="font-semibold text-lg text-white truncate">{cliente.nome}</h3>
                        <p className="text-sm text-gray-400 truncate">
                          {cliente.telefone ? `📞 ${cliente.telefone}` : 'Sem telefone'}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {cliente.email ? `📧 ${cliente.email}` : 'Sem email'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectClient(cliente)}
                        className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-gray-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Serviços:</span>
                        <Badge variant="secondary" className="bg-gray-800 text-gray-300 border border-gray-700">{stats.totalServicos}</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Faturamento:</span>
                        <span className="font-medium text-green-400">
                          {formatCurrency(stats.totalFaturamento)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-900/40 border border-blue-800/60 text-white shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.clientes.length}</p>
                <p className="text-sm text-gray-300">Clientes cadastrados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-900/40 border border-emerald-800/60 text-white shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-500/20 rounded-full">
                <DollarSign className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeClientsCount}</p>
                <p className="text-sm text-gray-300">Clientes ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-900/40 border border-purple-800/60 text-white shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(data.servicos.reduce((acc, s) => acc + s.valor_bruto, 0) / (data.clientes.length || 1))}
                </p>
                <p className="text-sm text-gray-300">Ticket médio por cliente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diálogo Detalhes/Edição do Cliente */}
      <Dialog open={selectedClient !== null} onOpenChange={(open) => { if (!open) setSelectedClient(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gray-950 text-white border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>Ficha do Cliente</span>
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Visualize histórico de faturamento, serviços realizados ou edite o cadastro.
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-6 py-4">
              {/* Visualização de Cadastro */}
              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-900 p-5 rounded-lg border border-gray-800">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dados Cadastrais</h4>
                    <p className="text-lg font-bold text-white">{selectedClient.nome}</p>
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-500">Telefone:</span> {selectedClient.telefone || 'Não informado'}
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-500">Email:</span> {selectedClient.email || 'Não informado'}
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-500">CPF:</span> {selectedClient.cpf || 'Não informado'}
                    </p>
                    <p className="text-sm text-gray-300">
                      <span className="text-gray-500">Endereço:</span> {selectedClient.endereco || 'Não informado'}
                    </p>
                    <p className="text-xs text-gray-500 pt-2">
                      Cadastrado em: {selectedClient.data_cadastro ? new Date(selectedClient.data_cadastro).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  </div>

                  <div className="space-y-4 border-t md:border-t-0 md:border-l border-gray-800 md:pl-6 pt-4 md:pt-0">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Métricas Financeiras</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-800/40 p-3 rounded border border-gray-800 text-center">
                        <p className="text-xs text-gray-400">Total Serviços</p>
                        <p className="text-xl font-bold text-primary mt-1">
                          {getClientStats(selectedClient.id).totalServicos}
                        </p>
                      </div>
                      <div className="bg-gray-800/40 p-3 rounded border border-gray-800 text-center">
                        <p className="text-xs text-gray-400">Total Faturamento</p>
                        <p className="text-xl font-bold text-green-400 mt-1">
                          {formatCurrency(getClientStats(selectedClient.id).totalFaturamento)}
                        </p>
                      </div>
                    </div>
                    {getClientStats(selectedClient.id).ultimoServico && (
                      <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                        <Calendar className="h-3 w-3 text-primary" />
                        <span>Último serviço em: {getClientStats(selectedClient.id).ultimoServico!.toLocaleDateString('pt-BR')}</span>
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* Formulário de Edição */
                <div className="space-y-4 bg-gray-900 p-5 rounded-lg border border-gray-800">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Editar Cadastro</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Nome Completo *</label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-gray-850 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Telefone</label>
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="bg-gray-850 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Email</label>
                      <Input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="bg-gray-850 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">CPF</label>
                      <Input
                        value={editCpf}
                        onChange={(e) => setEditCpf(e.target.value)}
                        className="bg-gray-850 border-gray-700 text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-400 block mb-1">Endereço Completo</label>
                      <Input
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        className="bg-gray-850 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Histórico de Serviços */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300">Histórico de Serviços realizados</h4>
                {data.servicos.filter(s => s.cliente_id === selectedClient.id).length === 0 ? (
                  <p className="text-sm text-gray-500 bg-gray-900/30 p-4 rounded text-center border border-gray-800">
                    Nenhum serviço registrado para este cliente.
                  </p>
                ) : (
                  <div className="border border-gray-800 rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-800 text-gray-400 text-xs">
                        <tr>
                          <th className="p-3">Data</th>
                          <th className="p-3">Veículo</th>
                          <th className="p-3">Placa</th>
                          <th className="p-3 text-right">Valor Bruto</th>
                          <th className="p-3 text-right">Comissão</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.servicos
                          .filter(s => s.cliente_id === selectedClient.id)
                          .sort((a, b) => new Date(b.data_servico).getTime() - new Date(a.data_servico).getTime())
                          .map((s) => (
                            <tr key={s.id} className="border-t border-gray-800 bg-gray-900/50 hover:bg-gray-850">
                              <td className="p-3 text-gray-300">
                                {new Date(s.data_servico).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                              </td>
                              <td className="p-3 font-medium text-white">{s.veiculo}</td>
                              <td className="p-3 uppercase text-gray-300">{s.placa}</td>
                              <td className="p-3 text-right text-gray-300">{formatCurrency(s.valor_bruto)}</td>
                              <td className="p-3 text-right text-green-400 font-medium">
                                {formatCurrency((s.valor_bruto * s.porcentagem_comissao) / 100)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-gray-800 pt-4 flex flex-wrap gap-2 justify-between items-center bg-gray-950">
            {selectedClient && (
              <>
                <div className="flex-1 flex justify-start">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClient}
                    className="text-red-400 hover:text-white hover:bg-red-950/40"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Cadastro
                  </Button>
                </div>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(true)}
                        className="bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Cadastro
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setSelectedClient(null)}
                        className="bg-gray-800 hover:bg-gray-700 text-white"
                      >
                        Fechar Ficha
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={saveClientEdits}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Salvar Alterações
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};