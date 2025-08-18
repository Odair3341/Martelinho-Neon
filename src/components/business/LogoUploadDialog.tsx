import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogoChange: (logo: string) => void;
  currentLogo: string;
}

export const LogoUploadDialog = ({ open, onOpenChange, onLogoChange, currentLogo }: LogoUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSave = () => {
    if (previewUrl) {
      onLogoChange(previewUrl);
      localStorage.setItem('custom-logo', previewUrl);
      toast({
        title: "Logo atualizada!",
        description: "Sua nova logo foi aplicada com sucesso."
      });
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    onLogoChange(currentLogo);
    localStorage.removeItem('custom-logo');
    setPreviewUrl("");
    setSelectedFile(null);
    toast({
      title: "Logo restaurada",
      description: "A logo original foi restaurada."
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Alterar Logo da Empresa</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="logo-upload">Selecionar Nova Logo</Label>
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="mt-2"
            />
          </div>

          {previewUrl && (
            <div className="space-y-4">
              <Label>Preview da Nova Logo</Label>
              <div className="p-4 border-2 border-dashed border-primary/30 rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors">
                <img 
                  src={previewUrl} 
                  alt="Preview da logo" 
                  className="h-20 w-20 object-contain mx-auto rounded-lg shadow-md border border-border/50"
                />
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button 
              onClick={handleSave} 
              disabled={!previewUrl}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Salvar Logo
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
            >
              <X className="h-4 w-4 mr-2" />
              Restaurar Original
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};