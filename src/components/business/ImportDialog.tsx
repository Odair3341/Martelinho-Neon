import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BusinessData } from "@/types/business";
import { Upload, FileJson, AlertCircle, CheckCircle } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: BusinessData) => void;
}

export const ImportDialog = ({ open, onOpenChange, onImport }: ImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/json") {
        setFile(selectedFile);
        setError("");
        setSuccess(false);
      } else {
        setError("Por favor, selecione um arquivo JSON válido.");
        setFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);
      
      // Validar estrutura básica do JSON
      if (!jsonData.clientes || !jsonData.servicos || !jsonData.despesas || !jsonData.comissoes) {
        throw new Error("Estrutura do arquivo JSON inválida. Verifique se contém as seções: clientes, servicos, despesas e comissoes.");
      }

      // Garantir que os arrays existem
      const businessData: BusinessData = {
        clientes: jsonData.clientes || [],
        servicos: jsonData.servicos || [],
        despesas: jsonData.despesas || [],
        comissoes: jsonData.comissoes || [],
        metadata: {
          exportDate: new Date().toISOString(),
          version: "1.0",
          totalClientes: jsonData.clientes?.length || 0,
          totalServicos: jsonData.servicos?.length || 0,
          totalDespesas: jsonData.despesas?.length || 0,
          totalComissoes: jsonData.comissoes?.length || 0,
          ...jsonData.metadata
        }
      };

      onImport(businessData);
      setSuccess(true);
      setError("");
      
      // Fechar o diálogo após 2 segundos
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setFile(null);
      }, 2000);
      
    } catch (err) {
      console.error("Erro ao importar arquivo:", err);
      setError(err instanceof Error ? err.message : "Erro ao processar o arquivo JSON. Verifique o formato e tente novamente.");
      setSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileJson className="h-5 w-5 text-primary" />
            <span>Importar Dados JSON</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-input">Selecionar arquivo JSON</Label>
            <Input
              id="file-input"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Selecione um arquivo JSON com os dados de clientes, serviços, despesas e comissões.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-success bg-success/10 text-success">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Dados importados com sucesso! O sistema será atualizado automaticamente.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={handleImport} 
              disabled={!file || success}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar Dados
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={success}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};