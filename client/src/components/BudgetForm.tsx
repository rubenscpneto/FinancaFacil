import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { formatCurrency, parseCurrency } from "@/lib/currency";
import { formatDateForInput } from "@/lib/date";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { budgetSchema, type InsertBudget } from "@shared/schema";
import type { BudgetWithCategory, Category } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface BudgetFormProps {
  budget?: BudgetWithCategory | null;
  onClose: () => void;
}

export default function BudgetForm({ budget, onClose }: BudgetFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const expenseCategories =
    categories?.filter((cat) => cat.type === "expense") || [];

  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budget
      ? {
          ...budget,
          userId: budget.userId || user?.uid || "",
          amount: Number(budget.amount),
          categoryId:
            typeof budget.categoryId === "string" ? budget.categoryId : "",
          startDate: budget.startDate ? new Date(budget.startDate) : new Date(),
          endDate: budget.endDate ? new Date(budget.endDate) : undefined,
        }
      : {
          userId: user?.uid || "",
          name: "",
          amount: 0,
          period: "monthly",
          categoryId:
            typeof expenseCategories?.[0]?.id === "string"
              ? expenseCategories[0].id
              : "",
          startDate: new Date(),
          endDate: undefined,
        },
  });

  const budgetMutation = useMutation({
    mutationFn: async (data: InsertBudget) => {
      if (budget && budget.id) {
        await apiRequest("PUT", `/api/budgets/${budget.id}`, data);
      } else {
        await apiRequest("POST", "/api/budgets", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Sucesso",
        description: budget
          ? "Orçamento atualizado com sucesso!"
          : "Orçamento criado com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar orçamento",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof budgetSchema>) => {
    setIsSubmitting(true);
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    try {
      const dataToSubmit: InsertBudget = {
        ...data,
        userId: user.uid,
        amount: Number(data.amount),
        categoryId: data.categoryId === "" ? null : data.categoryId,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        endDate: data.endDate ? new Date(data.endDate) : null,
      };
      await budgetMutation.mutateAsync(dataToSubmit);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="fintech-card">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <CardTitle className="text-xl">
                {budget ? "Editar Orçamento" : "Novo Orçamento"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Orçamento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Orçamento Alimentação"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Limite</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="R$ 0,00"
                          {...field}
                          value={formatCurrency(Number(field.value || 0))}
                          onChange={(e) => {
                            const rawValue = e.target.value;
                            field.onChange(parseCurrency(rawValue));
                          }}
                          className="currency-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria de gasto" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {expenseCategories.map((category) => (
                            <SelectItem
                              key={category.id ?? Math.random().toString()}
                              value={category.id ?? ""}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value
                              ? formatDateForInput(new Date(field.value))
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? new Date(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value
                              ? formatDateForInput(new Date(field.value))
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? new Date(e.target.value) : null
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto fintech-button"
                  >
                    {isSubmitting
                      ? "Salvando..."
                      : budget
                      ? "Salvar Alterações"
                      : "Criar Orçamento"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
