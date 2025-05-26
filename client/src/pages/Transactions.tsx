import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  Edit3,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/date";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TransactionForm from "@/components/TransactionForm";
import type { TransactionWithCategory } from "@shared/schema";

export default function Transactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery<TransactionWithCategory[]>({
    queryKey: ["/api/transactions"],
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir transação",
        variant: "destructive",
      });
    },
  });

  const filteredTransactions = transactions?.filter(transaction =>
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEdit = (transaction: TransactionWithCategory) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta transação?")) {
      deleteTransactionMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-0">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-4" />
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (showForm) {
    return (
      <TransactionForm
        transaction={editingTransaction}
        onClose={() => {
          setShowForm(false);
          setEditingTransaction(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-6">Transações</h1>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="default">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mb-6">
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Importar CSV
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Transactions List */}
        <Card className="fintech-card">
          <CardHeader>
            <CardTitle>
              Todas as Transações ({filteredTransactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhuma transação encontrada</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? "Tente ajustar os filtros de busca" : "Comece adicionando sua primeira transação"}
                </p>
                <Button onClick={() => setShowForm(true)} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transação
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        transaction.type === 'income' 
                          ? 'bg-green-50 dark:bg-green-950' 
                          : 'bg-red-50 dark:bg-red-950'
                      }`}>
                        {transaction.type === 'income' ? (
                          <ArrowUpCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <ArrowDownCircle className="w-6 h-6 text-red-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{transaction.description}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          {transaction.category && (
                            <Badge variant="secondary" className="text-xs">
                              {transaction.category.name}
                            </Badge>
                          )}
                          <span>{formatDate(new Date(transaction.date))}</span>
                          {transaction.paymentMethod && (
                            <span className="capitalize">• {transaction.paymentMethod}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(parseFloat(transaction.amount))}
                        </p>
                      </div>
                      
                      <div className="opacity-0 group-hover:opacity-100 flex space-x-2 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
