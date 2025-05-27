import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { adminAuth } from "./firebaseAdmin"; // Corrected import path
import {
  categorySchema,
  transactionSchema,
  budgetSchema,
  savingsGoalSchema,
} from "@shared/schema";
import { z } from "zod";

// Firebase Authentication Middleware
const firebaseAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized: Missing or malformed Authorization header." });
  }

  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    return res.status(401).json({ message: "Unauthorized: No token provided." });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    // Attach user information to the request object
    // Make sure your Request type (if extended) accommodates 'user'
    (req as any).user = decodedToken; // Using 'as any' for simplicity, consider defining a custom Request type
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    return res.status(403).json({ message: "Forbidden: Invalid or expired token." });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  // The /api/auth/user route might change depending on how you want to handle user profiles
  // For now, it will rely on the token for UID.
  app.get('/api/auth/user', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      // After firebaseAuthMiddleware, req.user should contain the decoded token (including uid)
      const userId = req.user.uid; 
      // You might want to fetch more user details from your Firestore 'users' collection here
      // For now, we can return the decoded token info or a simplified user object
      const userProfile = await storage.getUser(userId); // Assuming storage.getUser uses the UID
      if (userProfile) {
        res.json(userProfile);
      } else {
        // If user not in DB, could create it or return just UID / basic info from token
        res.json({ uid: userId, email: req.user.email, name: req.user.name }); 
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erro ao buscar usuário" });
    }
  });

  // Category routes
  app.get('/api/categories', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid; // UID from Firebase token
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Erro ao buscar categorias" });
    }
  });

  app.post('/api/categories', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid; // UID from Firebase token
      const categoryData = categorySchema.parse({ ...req.body, userId }); // userId is now from token
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

  app.put('/api/categories/:id', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const id = req.params.id; // ID is a string for Firestore
      const categoryData = categorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, userId, categoryData); // Pass userId
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

  app.delete('/api/categories/:id', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const id = req.params.id; // ID is a string for Firestore
      const userId = req.user.uid;
      const success = await storage.deleteCategory(id, userId); // Pass userId
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
  app.get('/api/transactions', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const transactions = await storage.getTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Erro ao buscar transações" });
    }
  });

  app.get('/api/transactions/range', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        res.status(400).json({ message: "startDate e endDate (strings) são obrigatórios" });
        return;
      }
      const transactions = await storage.getTransactionsByDateRange(userId, new Date(startDate), new Date(endDate));
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions by range:", error);
      res.status(500).json({ message: "Erro ao buscar transações" });
    }
  });

  app.post('/api/transactions', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      // Ensure req.body.date is converted to a Date object before parsing
      const bodyWithDate = { ...req.body, userId, date: req.body.date ? new Date(req.body.date) : undefined };
      const transactionData = transactionSchema.parse(bodyWithDate);
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

  app.put('/api/transactions/:id', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const id = req.params.id; // ID is a string for Firestore
      // Ensure req.body.date is converted to a Date object if present
      const bodyWithDate = { ...req.body, date: req.body.date ? new Date(req.body.date) : undefined };
      const transactionData = transactionSchema.partial().parse(bodyWithDate);
      const transaction = await storage.updateTransaction(id, userId, transactionData); // Pass userId
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

  app.delete('/api/transactions/:id', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const id = req.params.id; // ID is a string for Firestore
      const userId = req.user.uid;
      const success = await storage.deleteTransaction(id, userId); // Pass userId
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
  app.get('/api/budgets', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const budgets = await storage.getBudgets(userId);
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ message: "Erro ao buscar orçamentos" });
    }
  });

  app.post('/api/budgets', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      // Ensure date fields are converted to Date objects before parsing
      const bodyWithDates = {
        ...req.body,
        userId,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      const budgetData = budgetSchema.parse(bodyWithDates);
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

  app.put('/api/budgets/:id', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const id = req.params.id; // ID is a string for Firestore
       // Ensure date fields are converted to Date objects if present
      const bodyWithDates = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null, // Allow null for endDate
      };
      const budgetData = budgetSchema.partial().parse(bodyWithDates);
      const budget = await storage.updateBudget(id, userId, budgetData); // Pass userId
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

  app.delete('/api/budgets/:id', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const id = req.params.id; // ID is a string for Firestore
      const userId = req.user.uid;
      const success = await storage.deleteBudget(id, userId); // Pass userId
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
  app.get('/api/savings-goals', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const goals = await storage.getSavingsGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
      res.status(500).json({ message: "Erro ao buscar metas de economia" });
    }
  });

  app.post('/api/savings-goals', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
       // Ensure targetDate is converted to a Date object if present
      const bodyWithDate = {
        ...req.body,
        userId,
        targetDate: req.body.targetDate ? new Date(req.body.targetDate) : undefined,
      };
      const goalData = savingsGoalSchema.parse(bodyWithDate);
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

  app.put('/api/savings-goals/:id', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const id = req.params.id; // ID is a string for Firestore
      // Ensure targetDate is converted to a Date object if present
      const bodyWithDate = {
        ...req.body,
        targetDate: req.body.targetDate ? new Date(req.body.targetDate) : null, // Allow null for targetDate
      };
      const goalData = savingsGoalSchema.partial().parse(bodyWithDate);
      const goal = await storage.updateSavingsGoal(id, userId, goalData); // Pass userId
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

  app.delete('/api/savings-goals/:id', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const id = req.params.id; // ID is a string for Firestore
      const userId = req.user.uid;
      const success = await storage.deleteSavingsGoal(id, userId); // Pass userId
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
  app.get('/api/analytics/monthly-balance', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
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

  app.get('/api/analytics/category-totals', firebaseAuthMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.uid;
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
        res.status(400).json({ message: "startDate e endDate (strings) são obrigatórios" });
        return;
      }
      const totals = await storage.getCategoryTotals(userId, new Date(startDate), new Date(endDate));
      res.json(totals);
    } catch (error) {
      console.error("Error fetching category totals:", error);
      res.status(500).json({ message: "Erro ao buscar totais por categoria" });
    }
  });

  // Create HTTP server instance for Vite to consume in dev mode
  const server = createServer(app);

  return server;
}
