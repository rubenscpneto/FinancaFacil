import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Target, Calendar, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import GoalForm from "@/components/GoalForm";
import type { SavingsGoal } from "@shared/schema";

export default function Goals() {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const { data: goals, isLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["/api/savings-goals"],
  });

  const getGoalStatus = (current: number, target: number, targetDate?: string) => {
    const progress = (current / target) * 100;
    
    if (progress >= 100) return { status: 'completed', color: 'green', label: 'Concluída' };
    
    if (targetDate) {
      const today = new Date();
      const deadline = new Date(targetDate);
      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));
      
      if (daysLeft < 0) return { status: 'overdue', color: 'red', label: 'Atrasada' };
      if (daysLeft <= 30) return { status: 'urgent', color: 'orange', label: 'Urgente' };
    }
    
    return { status: 'active', color: 'blue', label: 'Em andamento' };
  };

  const handleEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (showForm) {
    return (
      <GoalForm
        goal={editingGoal}
        onClose={() => {
          setShowForm(false);
          setEditingGoal(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Metas de Economia</h1>
            <p className="text-muted-foreground">
              Defina e acompanhe seus objetivos financeiros
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="btn-primary mt-4 sm:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            Nova Meta
          </Button>
        </div>

        {/* Goals Overview */}
        {goals && goals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="fintech-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="font-medium">Total de Metas</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {goals.length}
                </p>
              </CardContent>
            </Card>

            <Card className="fintech-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h3 className="font-medium">Valor Total</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(
                    goals.reduce((total, goal) => total + parseFloat(goal.targetAmount), 0)
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="fintech-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium">Concluídas</h3>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {goals.filter(goal => goal.completed).length}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Goals Grid */}
        {goals && goals.length === 0 ? (
          <Card className="fintech-card">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma meta criada</h3>
                <p className="text-muted-foreground mb-6">
                  Comece definindo seus objetivos financeiros e acompanhe seu progresso
                </p>
                <Button onClick={() => setShowForm(true)} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Meta
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals?.map((goal) => {
              const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
              const { status, color, label } = getGoalStatus(
                parseFloat(goal.currentAmount), 
                parseFloat(goal.targetAmount), 
                goal.targetDate || undefined
              );
              
              return (
                <Card 
                  key={goal.id} 
                  className="fintech-card cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleEdit(goal)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 ${goal.color} rounded-xl flex items-center justify-center`}>
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          <Badge 
                            variant="secondary"
                            className={`mt-1 ${
                              color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                              color === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' :
                              color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                            }`}
                          >
                            {label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Progresso</span>
                        <span className="text-sm font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-3" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Atual</span>
                        <span className="font-semibold text-primary">
                          {formatCurrency(parseFloat(goal.currentAmount))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Meta</span>
                        <span className="font-medium">
                          {formatCurrency(parseFloat(goal.targetAmount))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Faltam</span>
                        <span className="font-medium">
                          {formatCurrency(parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount))}
                        </span>
                      </div>
                    </div>

                    {goal.targetDate && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Prazo
                          </span>
                          <span className="font-medium">
                            {formatDate(new Date(goal.targetDate))}
                          </span>
                        </div>
                      </div>
                    )}

                    {progress >= 100 && (
                      <div className="text-center py-2">
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          🎉 Meta Alcançada!
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
