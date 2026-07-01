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

const compressImage = (base64Str: string, maxWidth = 200, maxHeight = 200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export const LogoUploadDialog = ({ open, onOpenChange, onLogoChange, currentLogo }: LogoUploadDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        
        // Converter para base64 para persistir no localStorage
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64String = e.target?.result as string;
          try {
            const compressed = await compressImage(base64String);
            setPreviewUrl(compressed);
          } catch (err) {
            setPreviewUrl(base64String);
          }
        };
        reader.readAsDataURL(file);
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
        description: "Sua nova logo foi aplicada com sucesso e será mantida entre sessões."
      });
      onOpenChange(false);
      setPreviewUrl("");
      setSelectedFile(null);
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