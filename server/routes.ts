import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertCategorySchema,
  insertTransactionSchema,
  insertBudgetSchema,
  insertSavingsGoalSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  // Category routes
  app.get('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Erro ao buscar categorias" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categoryData = insertCategorySchema.parse({ ...req.body, userId });
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar categoria" });
      }
    }
  });

  app.put('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, categoryData);
      if (!category) {
        res.status(404).json({ message: "Categoria não encontrada" });
        return;
      }
      res.json(category);
    } catch (error) {
      console.error("Error updating category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar categoria" });
      }
    }
  });

  app.delete('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const success = await storage.deleteCategory(id, userId);
      if (!success) {
        res.status(404).json({ message: "Categoria não encontrada" });
        return;
      }
      res.json({ message: "Categoria excluída com sucesso" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Erro ao excluir categoria" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
      const transactions = await storage.getTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Erro ao buscar transações" });
    }
  });

  app.get('/api/transactions/range', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        res.status(400).json({ message: "startDate e endDate são obrigatórios" });
        return;
      }
      const transactions = await storage.getTransactionsByDateRange(userId, startDate as string, endDate as string);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions by range:", error);
      res.status(500).json({ message: "Erro ao buscar transações" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactionData = insertTransactionSchema.parse({ ...req.body, userId });
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar transação" });
      }
    }
  });

  app.put('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const transactionData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(id, transactionData);
      if (!transaction) {
        res.status(404).json({ message: "Transação não encontrada" });
        return;
      }
      res.json(transaction);
    } catch (error) {
      console.error("Error updating transaction:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar transação" });
      }
    }
  });

  app.delete('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const success = await storage.deleteTransaction(id, userId);
      if (!success) {
        res.status(404).json({ message: "Transação não encontrada" });
        return;
      }
      res.json({ message: "Transação excluída com sucesso" });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ message: "Erro ao excluir transação" });
    }
  });

  // Budget routes
  app.get('/api/budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const budgets = await storage.getBudgets(userId);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Erro ao buscar orçamentos" });
    }
  });

  app.post('/api/budgets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const budgetData = insertBudgetSchema.parse({ ...req.body, userId });
      const budget = await storage.createBudget(budgetData);
      res.json(budget);
    } catch (error) {
      console.error("Error creating budget:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar orçamento" });
      }
    }
  });

  app.put('/api/budgets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const budgetData = insertBudgetSchema.partial().parse(req.body);
      const budget = await storage.updateBudget(id, budgetData);
      if (!budget) {
        res.status(404).json({ message: "Orçamento não encontrado" });
        return;
      }
      res.json(budget);
    } catch (error) {
      console.error("Error updating budget:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar orçamento" });
      }
    }
  });

  app.delete('/api/budgets/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const success = await storage.deleteBudget(id, userId);
      if (!success) {
        res.status(404).json({ message: "Orçamento não encontrado" });
        return;
      }
      res.json({ message: "Orçamento excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting budget:", error);
      res.status(500).json({ message: "Erro ao excluir orçamento" });
    }
  });

  // Savings goal routes
  app.get('/api/savings-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getSavingsGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
      res.status(500).json({ message: "Erro ao buscar metas de economia" });
    }
  });

  app.post('/api/savings-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goalData = insertSavingsGoalSchema.parse({ ...req.body, userId });
      const goal = await storage.createSavingsGoal(goalData);
      res.json(goal);
    } catch (error) {
      console.error("Error creating savings goal:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao criar meta de economia" });
      }
    }
  });

  app.put('/api/savings-goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const goalData = insertSavingsGoalSchema.partial().parse(req.body);
      const goal = await storage.updateSavingsGoal(id, goalData);
      if (!goal) {
        res.status(404).json({ message: "Meta de economia não encontrada" });
        return;
      }
      res.json(goal);
    } catch (error) {
      console.error("Error updating savings goal:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      } else {
        res.status(500).json({ message: "Erro ao atualizar meta de economia" });
      }
    }
  });

  app.delete('/api/savings-goals/:id', isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const success = await storage.deleteSavingsGoal(id, userId);
      if (!success) {
        res.status(404).json({ message: "Meta de economia não encontrada" });
        return;
      }
      res.json({ message: "Meta de economia excluída com sucesso" });
    } catch (error) {
      console.error("Error deleting savings goal:", error);
      res.status(500).json({ message: "Erro ao excluir meta de economia" });
    }
  });

  // Analytics routes
  app.get('/api/analytics/monthly-balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { year, month } = req.query;
      if (!year || !month) {
        res.status(400).json({ message: "year e month são obrigatórios" });
        return;
      }
      const balance = await storage.getMonthlyBalance(userId, parseInt(year as string), parseInt(month as string));
      res.json(balance);
    } catch (error) {
      console.error("Error fetching monthly balance:", error);
      res.status(500).json({ message: "Erro ao buscar saldo mensal" });
    }
  });

  app.get('/api/analytics/category-totals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        res.status(400).json({ message: "startDate e endDate são obrigatórios" });
        return;
      }
      const totals = await storage.getCategoryTotals(userId, startDate as string, endDate as string);
      res.json(totals);
    } catch (error) {
      console.error("Error fetching category totals:", error);
      res.status(500).json({ message: "Erro ao buscar totais por categoria" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
