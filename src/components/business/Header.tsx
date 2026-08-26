import { Button } from "@/components/ui/button";
import { Upload, Moon, Sun, Maximize, Edit, LogOut, User } from "lucide-react";
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
    <header className="border-b border-white/10 bg-[linear-gradient(135deg,#06162f_0%,#0b2b59_58%,#8a6500_140%)] text-white shadow-strong">
      <div className="container mx-auto px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center space-x-3 md:space-x-4">
             <div className="relative group">
               <div className="rounded-2xl border border-white/10 bg-white/10 p-1.5 backdrop-blur md:p-2">
                 <img 
                   src={currentLogo} 
                   alt="Oliveira Martelinho de Ouro" 
                   className="h-14 w-14 rounded-xl object-contain md:h-20 md:w-20"
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
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight md:text-2xl">Oliveira Martelinho de Ouro</h1>
              <p className="text-xs text-white/65 md:text-sm">Gestão financeira e operacional</p>
            </div>
          </div>
          
          <div className="flex shrink-0 items-center space-x-1.5 md:space-x-2">
            <Button 
              variant="secondary" 
              onClick={onImportData}
              className="hidden border-white/15 bg-white/10 text-white hover:bg-white/20 md:inline-flex"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar JSON
            </Button>
            
            <Button
              variant="secondary"
              onClick={toggleFullscreen}
              className="hidden border-white/15 bg-white/10 text-white hover:bg-white/20 md:inline-flex"
              title="Tela cheia"
            >
              <Maximize className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-xl border border-white/15 bg-white/10 p-0 text-white hover:bg-white/20"
              title={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
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
