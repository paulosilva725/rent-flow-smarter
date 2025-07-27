import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X } from "lucide-react";

const propertySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  rent: z.string().min(1, "Valor do aluguel é obrigatório"),
  securityDeposit: z.string().min(1, "Valor da caução é obrigatório"),
  description: z.string().optional(),
  bedrooms: z.string().min(1, "Número de quartos é obrigatório"),
  bathrooms: z.string().min(1, "Número de banheiros é obrigatório"),
  area: z.string().min(1, "Área é obrigatória"),
});

type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  onClose: () => void;
  onSubmit: (data: PropertyFormData) => void;
  initialData?: Partial<PropertyFormData>;
  isEditing?: boolean;
}

export const PropertyForm = ({ onClose, onSubmit, initialData, isEditing = false }: PropertyFormProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: initialData?.name || "",
      address: initialData?.address || "",
      rent: initialData?.rent || "",
      securityDeposit: initialData?.securityDeposit || "",
      description: initialData?.description || "",
      bedrooms: initialData?.bedrooms || "",
      bathrooms: initialData?.bathrooms || "",
      area: initialData?.area || "",
    },
  });

  const handleSubmit = async (data: PropertyFormData) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      form.reset();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar imóvel:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{isEditing ? "Editar Imóvel" : "Cadastrar Novo Imóvel"}</CardTitle>
            <CardDescription>{isEditing ? "Altere as informações do imóvel" : "Preencha as informações do imóvel"}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Imóvel</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Apartamento 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, bairro, cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Aluguel (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="2500.00" type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="securityDeposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caução/Depósito (R$)</FormLabel>
                      <FormControl>
                        <Input placeholder="2500.00" type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área (m²)</FormLabel>
                    <FormControl>
                      <Input placeholder="75" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quartos</FormLabel>
                      <FormControl>
                        <Input placeholder="2" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banheiros</FormLabel>
                      <FormControl>
                        <Input placeholder="1" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição detalhada do imóvel..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Salvando..." : "Salvar Imóvel"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};