
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Proprietária de 15 imóveis",
    content: "Reduziu meu tempo de gestão em 70%. Agora consigo acompanhar tudo pelo celular e a inadimplência diminuiu drasticamente!",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108755-2616b056b0c5?w=150&h=150&fit=crop&crop=face"
  },
  {
    name: "João Santos",
    role: "Diretor - Imobiliária Premium",
    content: "Sistema completo que revolucionou nossa operação. Clientes mais satisfeitos, processos automatizados e menos inadimplência.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  },
  {
    name: "Ana Costa",
    role: "Gestora de Patrimônio",
    content: "A melhor decisão que tomei para meu negócio. Interface intuitiva, relatórios precisos e suporte excepcional.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            Depoimentos
          </span>
          <h2 className="text-4xl font-bold mb-6">O Que Nossos Clientes Dizem</h2>
          <p className="text-xl text-muted-foreground">
            Mais de 1.000 proprietários confiam no RentManager Pro
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                
                <div className="flex mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4 object-cover"
                  />
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
