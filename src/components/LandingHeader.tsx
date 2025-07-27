
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export const LandingHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="border-b shadow-sm bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            RentManager Pro
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/auth')}>
            Entrar
          </Button>
          <Button onClick={() => navigate('/auth')} className="px-6">
            Começar Grátis
          </Button>
        </div>
      </div>
    </header>
  );
};
