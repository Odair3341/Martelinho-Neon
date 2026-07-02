import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BusinessData } from "@/types/business";
import {
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: BusinessData, mode: "merge" | "replace") => void;
}

export const ImportDialog = ({
  open,
  onOpenChange,
  onImport,
}: ImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === "application/json") {
        setFile(selectedFile);
        setError("");
        setSuccess(false);
        setConfirmReplace(false);
      } else {
        setError("Por favor, selecione um arquivo JSON válido.");
        setFile(null);
      }
    }
  };

  const handleModeChange = (value: "merge" | "replace") => {
    setMode(value);
    setConfirmReplace(false);
  };

  const handleImport = async () => {
    if (!file) return;

    // Exige confirmação explícita no modo replace
    if (mode === "replace" && !confirmReplace) {
      setError(
        "Marque a caixa de confirmação acima para prosseguir com a substituição total."
      );
      return;
    }

    try {
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);

      if (
        !jsonData.clientes ||
        !jsonData.servicos ||
        !jsonData.despesas ||
        !jsonData.comissoes
      ) {
        throw new Error(
          "Estrutura do arquivo JSON inválida. Verifique se contém as seções: clientes, servicos, despesas e comissoes."
        );
      }

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
          ...jsonData.metadata,
        },
      };

      onImport(businessData, mode);
      setSuccess(true);
      setError("");

      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setFile(null);
        setMode("merge");
        setConfirmReplace(false);
      }, 2000);
    } catch (err) {
      console.error("Erro ao importar arquivo:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao processar o arquivo JSON. Verifique o formato e tente novamente."
      );
      setSuccess(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setFile(null);
    setError("");
    setSuccess(false);
    setMode("merge");
    setConfirmReplace(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileJson className="h-5 w-5 text-primary" />
            <span>Importar Dados JSON</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Seleção do arquivo */}
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
              Arquivo JSON com clientes, serviços, despesas e comissões.
            </p>
          </div>

          {/* Modo de importação */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Modo de importação</Label>
            <RadioGroup
              value={mode}
              onValueChange={(v) => handleModeChange(v as "merge" | "replace")}
              className="space-y-2"
            >
              {/* Merge */}
              <div
                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  mode === "merge"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground"
                }`}
                onClick={() => handleModeChange("merge")}
              >
                <RadioGroupItem value="merge" id="mode-merge" className="mt-0.5" />
                <div className="flex-1">
                  <label
                    htmlFor="mode-merge"
                    className="font-medium text-sm cursor-pointer flex items-center gap-2"
                  >
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    Adicionar / Mesclar
                    <span className="text-xs text-green-600 font-normal bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                      Recomendado
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mantém os dados existentes. Adiciona novos registros e
                    atualiza os que já existem com base no arquivo.
                  </p>
                </div>
              </div>

              {/* Replace */}
              <div
                className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  mode === "replace"
                    ? "border-destructive bg-destructive/5"
                    : "border-border hover:border-muted-foreground"
                }`}
                onClick={() => handleModeChange("replace")}
              >
                <RadioGroupItem
                  value="replace"
                  id="mode-replace"
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <label
                    htmlFor="mode-replace"
                    className="font-medium text-sm cursor-pointer flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    Substituir todos os dados
                    <span className="text-xs text-destructive font-normal bg-destructive/10 px-1.5 py-0.5 rounded">
                      Apaga tudo
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Remove todos os registros do banco e recria a partir do
                    arquivo. Use apenas para restauração de backup completo.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Confirmação extra para modo replace */}
          {mode === "replace" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="space-y-3">
                <p className="font-semibold">
                  Atenção: esta ação é irreversível!
                </p>
                <p className="text-sm">
                  Todos os dados atuais serão permanentemente apagados e
                  substituídos pelo conteúdo do arquivo selecionado.
                </p>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={confirmReplace}
                    onChange={(e) => {
                      setConfirmReplace(e.target.checked);
                      if (e.target.checked) setError("");
                    }}
                    className="w-4 h-4 accent-destructive"
                  />
                  Entendo que todos os dados serão apagados
                </label>
              </AlertDescription>
            </Alert>
          )}

          {/* Erro */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sucesso */}
          {success && (
            <Alert className="border-green-500 bg-green-500/10 text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Dados importados com sucesso! O sistema será atualizado
                automaticamente.
              </AlertDescription>
            </Alert>
          )}

          {/* Botões */}
          <div className="flex space-x-2">
            <Button
              onClick={handleImport}
              disabled={
                !file ||
                success ||
                (mode === "replace" && !confirmReplace)
              }
              className={`flex-1 ${
                mode === "replace"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }`}
            >
              <Upload className="h-4 w-4 mr-2" />
              {mode === "replace" ? "Substituir e Importar" : "Importar Dados"}
            </Button>
            <Button
              variant="outline"
              onClick={handleClose}
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
