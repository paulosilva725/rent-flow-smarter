import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Shield, 
  CreditCard, 
  BarChart3, 
  MessageSquare, 
  Smartphone,
  CheckCircle,
  Star,
  ArrowRight
} from "lucide-react";

const Index = () => {
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

  const plans = [
    {
      name: "Starter",
      price: "R$ 49",
      period: "/mês",
      description: "Ideal para proprietários iniciantes",
      features: ["Até 10 imóveis", "Dashboard básico", "Suporte por email", "Relatórios mensais"],
      popular: false
    },
    {
      name: "Professional",
      price: "R$ 99",
      period: "/mês",
      description: "Para gestores experientes",
      features: ["Até 50 imóveis", "Dashboard avançado", "Suporte prioritário", "Relatórios personalizados", "API de integração"],
      popular: true
    },
    {
      name: "Enterprise",
      price: "R$ 199",
      period: "/mês",
      description: "Para empresas e imobiliárias",
      features: ["Imóveis ilimitados", "Multi-usuários", "Suporte 24/7", "Customizações", "Gestor dedicado"],
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Proprietária",
      content: "Reduziu meu tempo de gestão em 70%. Agora consigo acompanhar tudo pelo celular!",
      rating: 5
    },
    {
      name: "João Santos",
      role: "Imobiliária Premium",
      content: "Sistema completo que revolucionou nossa operação. Clientes mais satisfeitos e menos inadimplência.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">RentManager Pro</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => window.location.href = '/login'}>
              Entrar
            </Button>
            <Button onClick={() => window.location.href = '/login'}>
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Gerencie Seus Aluguéis
            <br />
            <span className="text-primary-glow">de Forma Inteligente</span>
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Sistema completo de gestão de aluguel com pagamentos integrados, 
            relatórios em tempo real e comunicação direta com inquilinos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="px-8 py-4 text-lg font-semibold"
              onClick={() => window.location.href = '/login'}
            >
              Teste Grátis por 14 Dias
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg border-white/20 text-white hover:bg-white/10"
            >
              Ver Demonstração
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Funcionalidades Completas</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar seus imóveis de forma profissional
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-card transition-smooth hover:shadow-elegant">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Planos Flexíveis</h2>
            <p className="text-xl text-muted-foreground">
              Escolha o plano ideal para o seu negócio
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative shadow-card transition-smooth hover:shadow-elegant ${
                  plan.popular ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    Mais Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-success mr-3" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => window.location.href = '/login'}
                  >
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">O Que Nossos Clientes Dizem</h2>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para Transformar Sua Gestão?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Comece hoje mesmo e veja a diferença em seus resultados
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="px-8 py-4 text-lg font-semibold"
            onClick={() => window.location.href = '/login'}
          >
            Iniciar Teste Gratuito
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="font-bold">RentManager Pro</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Sistema profissional de gestão de aluguéis para proprietários e imobiliárias.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Funcionalidades</li>
                <li>Preços</li>
                <li>Integrações</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Central de Ajuda</li>
                <li>Documentação</li>
                <li>Contato</li>
                <li>Status</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Sobre</li>
                <li>Blog</li>
                <li>Carreiras</li>
                <li>Privacidade</li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 RentManager Pro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
