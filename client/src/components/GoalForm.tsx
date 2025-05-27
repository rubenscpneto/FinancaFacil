import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  ArrowLeft,
  Car,
  Plane,
  Home,
  GraduationCap,
  Heart,
} from "lucide-react";
import { formatCurrency, parseCurrency } from "@/lib/currency";
import { formatDateForInput } from "@/lib/date";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { savingsGoalSchema, type InsertSavingsGoal } from "@shared/schema";
import type { SavingsGoal } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";

interface GoalFormProps {
  goal?: SavingsGoal | null;
  onClose: () => void;
}

const goalIcons = [
  {
    value: "car",
    label: "Carro",
    icon: Car,
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
  {
    value: "plane",
    label: "Viagem",
    icon: Plane,
    color: "bg-gradient-to-br from-accent to-pink-500",
  },
  {
    value: "home",
    label: "Casa",
    icon: Home,
    color: "bg-gradient-to-br from-green-500 to-emerald-600",
  },
  {
    value: "graduation",
    label: "Educação",
    icon: GraduationCap,
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  {
    value: "heart",
    label: "Emergência",
    icon: Heart,
    color: "bg-gradient-to-br from-red-500 to-red-600",
  },
];

export default function GoalForm({ goal, onClose }: GoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof savingsGoalSchema>>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: goal
      ? {
          ...goal,
          userId: goal.userId,
          targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
        }
      : {
          userId: user?.uid || "",
          name: "",
          targetAmount: 0,
          currentAmount: 0,
          icon: "car",
          color: "bg-gradient-to-br from-blue-500 to-blue-600",
          targetDate: undefined,
          completed: false,
        },
  });

  const goalMutation = useMutation({
    mutationFn: async (data: InsertSavingsGoal) => {
      if (goal && goal.id) {
        await apiRequest("PUT", `/api/savings-goals/${goal.id}`, data);
      } else {
        await apiRequest("POST", "/api/savings-goals", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      toast({
        title: "Sucesso",
        description: goal
          ? "Meta atualizada com sucesso!"
          : "Meta criada com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar meta",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: z.infer<typeof savingsGoalSchema>) => {
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
      const dataToSubmit: InsertSavingsGoal = {
        ...data,
        userId: user.uid,
        targetAmount: Number(data.targetAmount),
        currentAmount: Number(data.currentAmount),
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
      };
      await goalMutation.mutateAsync(dataToSubmit);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedIcon = form.watch("icon");
  const selectedIconData = goalIcons.find(
    (icon) => icon.value === selectedIcon
  );

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
                {goal ? "Editar Meta" : "Nova Meta de Economia"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Goal Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Meta</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Carro Novo, Viagem Europa"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Amount */}
                <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Meta</FormLabel>
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

                {/* Current Amount */}
                <FormField
                  control={form.control}
                  name="currentAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Atual</FormLabel>
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

                {/* Icon Selection */}
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícone</FormLabel>
                      <div className="grid grid-cols-3 gap-3">
                        {goalIcons.map((iconData) => {
                          const IconComponent = iconData.icon;
                          return (
                            <Button
                              key={iconData.value}
                              type="button"
                              variant="outline"
                              className={`h-20 flex flex-col space-y-2 ${
                                field.value === iconData.value
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-primary/50"
                              }`}
                              onClick={() => {
                                field.onChange(iconData.value);
                                form.setValue("color", iconData.color);
                              }}
                            >
                              <div
                                className={`w-8 h-8 ${iconData.color} rounded-lg flex items-center justify-center`}
                              >
                                <IconComponent className="w-5 h-5 text-white" />
                              </div>
                              <span className="text-xs">{iconData.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Target Date */}
                <FormField
                  control={form.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Alvo (Opcional)</FormLabel>
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

                {/* Completed Toggle */}
                <FormField
                  control={form.control}
                  name="completed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Meta Concluída?</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Preview */}
                {form.watch("name") && (
                  <div className="p-4 border border-border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-2">
                      Prévia da Meta:
                    </p>
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-12 h-12 ${selectedIconData?.color} rounded-xl flex items-center justify-center`}
                      >
                        {selectedIconData && (
                          <selectedIconData.icon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{form.watch("name")}</h4>
                        <p className="text-sm text-muted-foreground">
                          Meta: {form.watch("targetAmount") || "R$ 0,00"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                      : goal
                      ? "Atualizar"
                      : "Criar Meta"}
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
