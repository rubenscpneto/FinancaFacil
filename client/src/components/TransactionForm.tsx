import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { ArrowLeft, Plus } from "lucide-react";
import { formatCurrency, parseCurrency } from "@/lib/currency";
import { formatDateForInput } from "@/lib/date";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { transactionSchema, type InsertTransaction } from "@shared/schema";
import type { TransactionWithCategory, Category } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

interface TransactionFormProps {
  transaction?: TransactionWithCategory | null;
  categories: Category[];
  onClose: () => void;
}

export default function TransactionForm({
  transaction,
  categories,
  onClose,
}: TransactionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          ...transaction,
          userId: transaction.userId,
          amount: transaction.amount,
          date: transaction.date ? new Date(transaction.date) : new Date(),
          categoryId:
            typeof transaction.categoryId === "string"
              ? transaction.categoryId
              : "",
        }
      : {
          userId: user?.uid || "",
          description: "",
          amount: 0,
          type: "expense",
          date: new Date(),
          categoryId:
            typeof categories?.[0]?.id === "string" ? categories[0].id : "",
          paymentMethod: "pix",
        },
  });

  const transactionMutation = useMutation({
    mutationFn: async (data: InsertTransaction) => {
      if (transaction && transaction.id) {
        await apiRequest("PUT", `/api/transactions/${transaction.id}`, data);
      } else {
        await apiRequest("POST", "/api/transactions", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/analytics/monthly-balance"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/analytics/category-totals"],
      });
      toast({
        title: "Sucesso",
        description: transaction
          ? "Transação atualizada com sucesso!"
          : "Transação criada com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar transação",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof transactionSchema>) => {
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
      const dataToSubmit: InsertTransaction = {
        ...data,
        userId: user.uid,
        amount: Number(data.amount),
        date: data.date ? new Date(data.date) : new Date(),
        categoryId: data.categoryId === "" ? null : data.categoryId,
      };
      await transactionMutation.mutateAsync(dataToSubmit);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter categories based on transaction type
  const availableCategories =
    categories?.filter((cat) => cat.type === form.watch("type")) || [];

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
                {transaction ? "Editar Transação" : "Nova Transação"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Transaction Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Transação</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="income">Receita</SelectItem>
                          <SelectItem value="expense">Gasto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Supermercado, Salário, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
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

                {/* Category */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCategories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
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

                {/* Payment Method */}
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pagamento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pix">PIX</SelectItem>
                          <SelectItem value="debito">Débito</SelectItem>
                          <SelectItem value="credito">Crédito</SelectItem>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date */}
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={
                            field.value
                              ? formatDateForInput(new Date(field.value))
                              : ""
                          }
                          onChange={(e) => {
                            field.onChange(
                              e.target.value ? new Date(e.target.value) : null
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="sm:flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary sm:flex-1"
                  >
                    {isSubmitting
                      ? "Salvando..."
                      : transaction
                      ? "Atualizar"
                      : "Criar Transação"}
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
