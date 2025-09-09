import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BusinessData, Servico } from "@/types/business";
import { fixTimezoneDate, formatDateForInput } from "@/lib/utils";

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Servico | null;
  data: BusinessData;
  onUpdateData: (newData: BusinessData) => void;
}

export const EditServiceDialog = ({ 
  open, 
  onOpenChange, 
  service, 
  data, 
  onUpdateData 
}: EditServiceDialogProps) => {
  const [formData, setFormData] = useState({
    data_servico: "",
    cliente_id: "",
    veiculo: "",
    placa: "",
    valor_bruto: "",
    porcentagem_comissao: "35",
    observacao: ""
  });

  // Efeito para preencher o formulário quando o serviço mudar
  useEffect(() => {
    if (service) {
      setFormData({
        data_servico: formatDateForInput(service.data_servico),
        cliente_id: service.cliente_id.toString(),
        veiculo: service.veiculo,
        placa: service.placa,
        valor_bruto: service.valor_bruto.toString(),
        porcentagem_comissao: service.porcentagem_comissao.toString(),
        observacao: service.observacao || ""
      });
    }
  }, [service]);

  const handleSave = () => {
    if (!service || !formData.data_servico || !formData.cliente_id || !formData.veiculo || !formData.placa || !formData.valor_bruto) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const valorBruto = parseFloat(formData.valor_bruto);
    const porcentagemComissao = parseFloat(formData.porcentagem_comissao);
    
    // Validação do percentual de comissão
    if (isNaN(porcentagemComissao) || porcentagemComissao < 0 || porcentagemComissao > 100) {
      alert("O percentual de comissão deve estar entre 0% e 100%.");
      return;
    }
    const comissaoTotal = (valorBruto * porcentagemComissao) / 100;

    const updatedService: Servico = {
      ...service,
      data_servico: fixTimezoneDate(formData.data_servico),
      cliente_id: parseInt(formData.cliente_id),
      veiculo: formData.veiculo,
      placa: formData.placa.toUpperCase(),
      valor_bruto: valorBruto,
      porcentagem_comissao: porcentagemComissao,
      observacao: formData.observacao,
      // Mantém a comissão já recebida, mas se mudou o valor/porcentagem, pode ajustar
      comissao_recebida: service.comissao_recebida > comissaoTotal ? comissaoTotal : service.comissao_recebida
    };

    const updatedServices = data.servicos.map(s => s.id === service.id ? updatedService : s);
    const updatedData = { ...data, servicos: updatedServices };

    onUpdateData(updatedData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Serviço</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit_data_servico">Data do Serviço</Label>
            <Input
              id="edit_data_servico"
              type="date"
              value={formData.data_servico}
              onChange={(e) => setFormData({...formData, data_servico: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="edit_cliente_id">Cliente</Label>
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
            <Label htmlFor="edit_veiculo">Veículo</Label>
            <Input
              id="edit_veiculo"
              placeholder="Ex: Tiguan, Mercedes C180"
              value={formData.veiculo}
              onChange={(e) => setFormData({...formData, veiculo: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="edit_placa">Placa</Label>
            <Input
              id="edit_placa"
              placeholder="ABC-1234"
              value={formData.placa}
              onChange={(e) => setFormData({...formData, placa: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="edit_valor_bruto">Valor Bruto (R$)</Label>
            <Input
              id="edit_valor_bruto"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.valor_bruto}
              onChange={(e) => setFormData({...formData, valor_bruto: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="edit_porcentagem_comissao">Comissão (%)</Label>
            <Input
              id="edit_porcentagem_comissao"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.porcentagem_comissao}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseFloat(value);
                if (value === '' || (numValue >= 0 && numValue <= 100)) {
                  setFormData({...formData, porcentagem_comissao: value});
                }
              }}
              placeholder="0 - 100"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="edit_observacao">Observações</Label>
            <Textarea
              id="edit_observacao"
              placeholder="Descreva os detalhes do serviço..."
              value={formData.observacao}
              onChange={(e) => setFormData({...formData, observacao: e.target.value})}
            />
          </div>

          <div className="md:col-span-2 flex space-x-4">
            <Button onClick={handleSave} className="flex-1">
              Salvar Alterações
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};