
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  Shield, 
  CreditCard, 
  BarChart3, 
  MessageSquare, 
  Smartphone 
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Gestão Completa de Imóveis",
    description: "Cadastre e gerencie todos os seus imóveis com fotos, descrições e documentos em um só lugar."
  },
  {
    icon: CreditCard,
    title: "Pagamentos Integrados",
    description: "Receba pagamentos via Pix, boleto e cartão. Conciliação automática e notificações inteligentes."
  },
  {
    icon: BarChart3,
    title: "Relatórios Financeiros",
    description: "Dashboard com métricas em tempo real, relatórios de inadimplência e análises de performance."
  },
  {
    icon: MessageSquare,
    title: "Comunicação Direta",
    description: "Chat integrado entre proprietários e inquilinos para solução rápida de questões."
  },
  {
    icon: Shield,
    title: "Segurança Avançada",
    description: "Criptografia de dados, autenticação 2FA e backup automático para proteção total."
  },
  {
    icon: Smartphone,
    title: "Acesso Mobile",
    description: "Aplicativo responsivo para acompanhamento em qualquer dispositivo, a qualquer hora."
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Funcionalidades
          </span>
          <h2 className="text-4xl font-bold mb-6">Tudo que Você Precisa</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas profissionais para gerenciar seus imóveis com eficiência e segurança
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:shadow-primary/5"
            >
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
