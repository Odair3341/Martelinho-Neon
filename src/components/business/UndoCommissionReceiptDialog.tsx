
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Servico } from "@/types/business";
import { Undo2, AlertTriangle } from "lucide-react";

interface UndoCommissionReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Servico | null;
  onConfirm: (serviceId: number) => void;
}

export const UndoCommissionReceiptDialog = ({
  open,
  onOpenChange,
  service,
  onConfirm,
}: UndoCommissionReceiptDialogProps) => {
  if (!service) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleConfirm = () => {
    onConfirm(service.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Desfazer Recebimento</span>
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja desfazer o recebimento desta comissão? Esta
            ação não pode ser revertida.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">
              {service.veiculo} - {service.placa}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Cliente:</span>
                <span className="font-medium">
                  {/* O nome do cliente precisaria ser buscado ou passado como prop */}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Valor Recebido a ser Desfeito:</span>
                <span className="font-medium text-destructive">
                  {formatCurrency(service.comissao_recebida)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            className="bg-red-500 hover:bg-red-500/90"
          >
            <Undo2 className="h-4 w-4 mr-2" />
            Confirmar e Desfazer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
