
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]"></div>
      </div>
      
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para Revolucionar Sua Gestão?
          </h2>
          
          <p className="text-xl mb-8 opacity-90 leading-relaxed">
            Junte-se a mais de 1.000 proprietários que já transformaram seus negócios
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              variant="secondary"
              className="px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => window.location.href = '/login'}
            >
              Iniciar Teste Gratuito
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-6 text-lg border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
            >
              Falar com Especialista
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
            <div className="flex items-center justify-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
              <span>14 dias grátis</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
              <span>Sem compromisso</span>
            </div>
            <div className="flex items-center justify-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
              <span>Suporte incluso</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
