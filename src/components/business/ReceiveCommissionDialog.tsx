import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BusinessData, Servico } from "@/types/business";
import { DollarSign } from "lucide-react";

interface ReceiveCommissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Servico | null;
  data: BusinessData;
  onUpdateData: (newData: BusinessData) => void;
}

export const ReceiveCommissionDialog = ({ 
  open, 
  onOpenChange, 
  service, 
  data, 
  onUpdateData 
}: ReceiveCommissionDialogProps) => {
  const [valorReceber, setValorReceber] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleReceive = () => {
    if (!service || !valorReceber) return;

    const valor = parseFloat(valorReceber);
    const comissaoTotal = (service.valor_bruto * service.porcentagem_comissao) / 100;
    const novaComissaoRecebida = service.comissao_recebida + valor;

    // Não pode receber mais que o total da comissão
    if (novaComissaoRecebida > comissaoTotal) {
      alert(`Valor excede o máximo da comissão. Máximo disponível: ${formatCurrency(comissaoTotal - service.comissao_recebida)}`);
      return;
    }

    const updatedService: Servico = {
      ...service,
      comissao_recebida: novaComissaoRecebida,
      quitado: novaComissaoRecebida >= comissaoTotal
    };

    const updatedServices = data.servicos.map(s => s.id === service.id ? updatedService : s);
    const updatedData = { ...data, servicos: updatedServices };

    onUpdateData(updatedData);
    setValorReceber("");
    onOpenChange(false);
  };

  if (!service) return null;

  const comissaoTotal = (service.valor_bruto * service.porcentagem_comissao) / 100;
  const valorRestante = comissaoTotal - service.comissao_recebida;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-success" />
            <span>Receber Comissão</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">{service.veiculo} - {service.placa}</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Comissão Total:</span>
                <span className="font-medium">{formatCurrency(comissaoTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Já Recebido:</span>
                <span className="font-medium text-success">{formatCurrency(service.comissao_recebida)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Valor Restante:</span>
                <span className="font-semibold text-warning">{formatCurrency(valorRestante)}</span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="valor_receber">Valor a Receber (R$)</Label>
            <Input
              id="valor_receber"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={valorReceber}
              onChange={(e) => setValorReceber(e.target.value)}
              max={valorRestante}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Máximo: {formatCurrency(valorRestante)}
            </p>
          </div>

          <div className="flex space-x-3">
            <Button 
              onClick={() => setValorReceber(valorRestante.toString())}
              variant="outline"
              className="flex-1"
            >
              Receber Tudo
            </Button>
            <Button onClick={handleReceive} className="flex-1 bg-success hover:bg-success/90">
              <DollarSign className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </div>
          
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};