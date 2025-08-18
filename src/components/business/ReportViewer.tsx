import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BusinessData } from "@/types/business";
import { Download, FileText, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ReportViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: BusinessData;
  reportType: 'comissoes' | 'extrato' | 'despesas' | null;
}

export const ReportViewer = ({ open, onOpenChange, data, reportType }: ReportViewerProps) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const generatePDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const element = document.getElementById('report-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: 'transparent'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${reportType}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      toast({
        title: "PDF gerado com sucesso!",
        description: `Relatório salvo como ${fileName}`
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o arquivo PDF.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderComissoesReport = () => {
    const totalComissoes = data.servicos.reduce((acc, s) => acc + (s.valor_bruto * s.porcentagem_comissao / 100), 0);
    const comissoesRecebidas = data.servicos.reduce((acc, s) => acc + s.comissao_recebida, 0);
    const comissoesPendentes = totalComissoes - comissoesRecebidas;

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Relatório de Comissões</h2>
          <p className="text-muted-foreground">Oliveira Martelinho de Ouro</p>
          <p className="text-sm text-muted-foreground">Gerado em: {formatDate(new Date().toISOString())}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(totalComissoes)}</p>
                <p className="text-sm text-muted-foreground">Total de Comissões</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>{formatCurrency(comissoesRecebidas)}</p>
                <p className="text-sm text-muted-foreground">Comissões Recebidas</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: 'hsl(var(--warning))' }}>{formatCurrency(comissoesPendentes)}</p>
                <p className="text-sm text-muted-foreground">Comissões Pendentes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumo por Percentual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Taxa de Recebimento:</span>
                <span className="font-bold">{Math.round((comissoesRecebidas / totalComissoes * 100) || 0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Taxa Pendente:</span>
                <span className="font-bold">{Math.round((comissoesPendentes / totalComissoes * 100) || 0)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderExtratoReport = () => {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Extrato Detalhado de Comissões</h2>
          <p className="text-muted-foreground">Oliveira Martelinho de Ouro</p>
          <p className="text-sm text-muted-foreground">Gerado em: {formatDate(new Date().toISOString())}</p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead>Valor Bruto</TableHead>
              <TableHead>Comissão %</TableHead>
              <TableHead>Valor Comissão</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...data.servicos].sort((a, b) => new Date(a.data_servico).getTime() - new Date(b.data_servico).getTime()).map((servico) => (
              <TableRow key={servico.id}>
                <TableCell>{formatDate(servico.data_servico)}</TableCell>
                <TableCell>
                  {data.clientes.find(c => c.id === servico.cliente_id)?.nome || 'Cliente não encontrado'}
                </TableCell>
                <TableCell>{servico.veiculo} - {servico.placa}</TableCell>
                <TableCell>{formatCurrency(servico.valor_bruto)}</TableCell>
                <TableCell>{servico.porcentagem_comissao}%</TableCell>
                 <TableCell className="font-medium" style={{ color: 'hsl(var(--success))' }}>
                   {formatCurrency(servico.comissao_recebida)}
                 </TableCell>
                <TableCell>
                  <Badge variant={servico.quitado ? "default" : "secondary"}>
                    {servico.quitado ? "Finalizado" : "Pendente"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderDespesasReport = () => {
    const totalDespesas = data.despesas.reduce((acc, d) => acc + d.valor, 0);
    const despesasPagas = data.despesas.filter(d => d.pago).reduce((acc, d) => acc + d.valor, 0);
    const despesasPendentes = totalDespesas - despesasPagas;

    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Relatório de Despesas</h2>
          <p className="text-muted-foreground">Oliveira Martelinho de Ouro</p>
          <p className="text-sm text-muted-foreground">Gerado em: {formatDate(new Date().toISOString())}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{formatCurrency(totalDespesas)}</p>
                <p className="text-sm text-muted-foreground">Total de Despesas</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: 'hsl(var(--success))' }}>{formatCurrency(despesasPagas)}</p>
                <p className="text-sm text-muted-foreground">Despesas Pagas</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold" style={{ color: 'hsl(var(--destructive))' }}>{formatCurrency(despesasPendentes)}</p>
                <p className="text-sm text-muted-foreground">Despesas Pendentes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...data.despesas].sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime()).map((despesa) => (
              <TableRow key={despesa.id}>
                <TableCell>{despesa.descricao}</TableCell>
                <TableCell>{formatCurrency(despesa.valor)}</TableCell>
                <TableCell>{formatDate(despesa.data_vencimento)}</TableCell>
                <TableCell>
                  <Badge variant={despesa.pago ? "default" : "destructive"}>
                    {despesa.pago ? "Paga" : "Pendente"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderReport = () => {
    switch (reportType) {
      case 'comissoes':
        return renderComissoesReport();
      case 'extrato':
        return renderExtratoReport();
      case 'despesas':
        return renderDespesasReport();
      default:
        return null;
    }
  };

  if (!reportType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Visualização do Relatório</span>
            </div>
            <Button 
              onClick={generatePDF}
              disabled={isGeneratingPdf}
              className="ml-4"
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPdf ? "Gerando PDF..." : "Salvar como PDF"}
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div id="report-content" className="bg-card border border-border p-6 rounded-lg">
          {renderReport()}
        </div>
      </DialogContent>
    </Dialog>
  );
};