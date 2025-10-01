import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BusinessData } from "@/types/business";
import { Download, Upload, Database, AlertTriangle, Calendar, Bug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BackupTabProps {
  data: BusinessData;
  onImportData: () => void;
  onMigrate: () => void;
}

export const BackupTab = ({ data, onImportData, onMigrate }: BackupTabProps) => {
  const { toast } = useToast();
  const [showDebug, setShowDebug] = useState(false);



  const exportData = () => {
    try {
      const dataToExport = {
        ...data,
        metadata: {
          ...data.metadata,
          exportDate: new Date().toISOString(),
          totalClientes: data.clientes.length,
          totalServicos: data.servicos.length,
          totalDespesas: data.despesas.length,
          totalComissoes: data.comissoes.length,
          version: "1.0"
        }
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
      
      // Create download link
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      const fileName = `backup-sistema-financeiro-${new Date().toISOString().split('T')[0]}.json`;
      
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Backup criado com sucesso!",
        description: `Arquivo ${fileName} foi baixado.`,
      });
      
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast({
        title: "Erro ao criar backup",
        description: "Não foi possível gerar o arquivo de backup. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Alerta Importante */}
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> A restauração de um backup substituirá TODOS os dados no servidor.
        </AlertDescription>
      </Alert>

      {/* Backup e Restauração */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar Dados */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-primary" />
              <span>Exportar Dados (Fazer Backup)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Salve uma cópia de segurança de todos os seus dados atuais (clientes, serviços, etc.) em um arquivo json.
            </p>
            
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Clientes:</span>
                <span className="font-medium">{data.clientes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Serviços:</span>
                <span className="font-medium">{data.servicos.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Despesas:</span>
                <span className="font-medium">{data.despesas.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Comissões:</span>
                <span className="font-medium">{data.comissoes.length}</span>
              </div>
            </div>

            <Button onClick={exportData} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Fazer Backup Agora
            </Button>
          </CardContent>
        </Card>

        {/* Importar Dados */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-accent" />
              <span>Importar Dados (Restaurar)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-destructive/50 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                Esta ação substituirá todos os dados atuais. Use com cuidado!
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground">
              Restaure seus dados a partir de um arquivo de backup JSON. Todos os dados atuais serão substituídos.
            </p>

            <Button 
              onClick={onImportData} 
              variant="outline"
              className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Arquivo de Backup
            </Button>
          </CardContent>
        </Card>

        {/* Migrar Dados Antigos */}
        <Card className="shadow-medium border-blue-500/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-600">
              <Database className="h-5 w-5" />
              <span>Migrar Pagamentos Antigos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Esta ação criará registros de histórico para pagamentos de comissões feitos antes da atualização do sistema.
              A data de recebimento será a data do serviço.
            </p>
            <Button onClick={onMigrate} variant="outline" className="w-full border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
              <Upload className="h-4 w-4 mr-2" />
              Iniciar Migração
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informações do Sistema */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-primary" />
            <span>Informações do Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Dados Atuais</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Clientes:</span>
                  <span className="font-medium">{data.clientes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Serviços:</span>
                  <span className="font-medium">{data.servicos.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Despesas:</span>
                  <span className="font-medium">{data.despesas.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Comissões:</span>
                  <span className="font-medium">{data.comissoes.length}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Informações do Sistema</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versão:</span>
                  <span className="font-medium">v1.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última atualização:</span>
                  <span className="font-medium">
                    {data.metadata?.exportDate ? formatDate(data.metadata.exportDate) : "Não disponível"}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Sistema sempre atualizado em tempo real</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proteção de Dados */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Proteja seus dados com backups regulares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-primary/5 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Recomendações de Backup</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Faça backups semanalmente ou após grandes atualizações</li>
              <li>• Mantenha múltiplas cópias em locais diferentes</li>
              <li>• Teste a restauração periodicamente</li>
              <li>• Use nomes descritivos com data nos arquivos de backup</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Debug Card */}
      <Card className="shadow-medium border-yellow-500/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-600">
            <Bug className="h-5 w-5" />
            <span>Depuração de Dados</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Use esta ferramenta para visualizar os dados brutos da tabela de comissões e ajudar a diagnosticar problemas.
          </p>
          <Button onClick={() => setShowDebug(true)} variant="outline">
            Ver Dados de Comissões (Debug)
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDebug} onOpenChange={setShowDebug}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dados Brutos da Tabela de Comissões</DialogTitle>
          </DialogHeader>
          <div className="mt-4 bg-gray-900 text-white p-4 rounded-md max-h-[60vh] overflow-y-auto">
            <pre>
              {JSON.stringify(data.comissoes, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};