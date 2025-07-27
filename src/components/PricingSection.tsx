
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "R$ 49",
    period: "/mês",
    description: "Ideal para proprietários iniciantes",
    features: ["Até 10 imóveis", "Dashboard básico", "Suporte por email", "Relatórios mensais"],
    popular: false,
    color: "border-gray-200"
  },
  {
    name: "Professional",
    price: "R$ 99",
    period: "/mês",
    description: "Para gestores experientes",
    features: ["Até 50 imóveis", "Dashboard avançado", "Suporte prioritário", "Relatórios personalizados", "API de integração"],
    popular: true,
    color: "border-primary ring-2 ring-primary/20"
  },
  {
    name: "Enterprise",
    price: "R$ 199",
    period: "/mês",
    description: "Para empresas e imobiliárias",
    features: ["Imóveis ilimitados", "Multi-usuários", "Suporte 24/7", "Customizações", "Gestor dedicado"],
    popular: false,
    color: "border-gray-200"
  }
];

export const PricingSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Planos e Preços
          </span>
          <h2 className="text-4xl font-bold mb-6">Escolha o Plano Ideal</h2>
          <p className="text-xl text-muted-foreground">
            Transparência total, sem taxas ocultas
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative shadow-lg hover:shadow-xl transition-all duration-300 ${plan.color}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="px-4 py-1 bg-primary text-primary-foreground">
                    <Zap className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {plan.description}
                </CardDescription>
                <div className="mt-6">
                  <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-lg">{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-success mr-3 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full py-6 text-lg font-semibold" 
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => window.location.href = '/login'}
                >
                  {plan.popular ? "Começar Agora" : "Escolher Plano"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Todos os planos incluem teste gratuito de 14 dias
          </p>
          <p className="text-sm text-muted-foreground">
            Precisa de algo personalizado? <Button variant="link" className="p-0 h-auto">Entre em contato</Button>
          </p>
        </div>
      </div>
    </section>
  );
};
