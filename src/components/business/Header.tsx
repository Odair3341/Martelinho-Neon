import { Button } from "@/components/ui/button";
import { Upload, Settings, Moon, Sun, Maximize, Edit, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/theme-provider";
import { useState, useEffect } from "react";
import oliveiraLogo from "@/assets/oliveira-logo.png";
import { LogoUploadDialog } from "./LogoUploadDialog";

interface HeaderProps {
  onImportData: () => void;
  onLogout?: () => void;
  userEmail?: string | null;
}

export const Header = ({ onImportData, onLogout, userEmail }: HeaderProps) => {
  const { theme, setTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLogoDialog, setShowLogoDialog] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(oliveiraLogo);

  useEffect(() => {
    const savedLogo = localStorage.getItem('custom-logo');
    if (savedLogo) {
      setCurrentLogo(savedLogo);
    }
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-strong">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
             <div className="relative group">
               <div className="p-3 bg-white/10 rounded-xl">
                 <img 
                   src={currentLogo} 
                   alt="Oliveira Martelinho de Ouro" 
                   className="h-24 w-24 object-contain rounded-lg"
                 />
               </div>
              <Button
                size="sm"
                variant="ghost"
                className="absolute -top-1 -right-1 h-6 w-6 p-0 bg-white/20 hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setShowLogoDialog(true)}
                title="Editar logo"
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Oliveira Martelinho de Ouro</h1>
              <p className="text-primary-foreground/80 text-sm">Sistema Financeiro v1.0</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="secondary" 
              onClick={onImportData}
              className="bg-white/20 hover:bg-white/30 text-primary-foreground border-white/30"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar JSON
            </Button>
            
            <Button
              variant="secondary"
              onClick={toggleFullscreen}
              className="bg-white/20 hover:bg-white/30 text-primary-foreground border-white/30"
              title="Tela cheia"
            >
              <Maximize className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              onClick={toggleTheme}
              className="bg-white/20 hover:bg-white/30 text-primary-foreground border-white/30"
              title="Alternar tema"
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            
            {userEmail && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-primary-foreground border-white/30"
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span className="hidden md:inline max-w-32 truncate">{userEmail}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-sm text-muted-foreground">
                    {userEmail}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
      
      <LogoUploadDialog
        open={showLogoDialog}
        onOpenChange={setShowLogoDialog}
        onLogoChange={setCurrentLogo}
        currentLogo={oliveiraLogo}
      />
    </header>
  );
};