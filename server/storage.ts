import {
  users,
  categories,
  transactions,
  budgets,
  savingsGoals,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Transaction,
  type InsertTransaction,
  type TransactionWithCategory,
  type Budget,
  type InsertBudget,
  type BudgetWithCategory,
  type SavingsGoal,
  type InsertSavingsGoal,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sum, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Category operations
  getCategories(userId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number, userId: string): Promise<boolean>;

  // Transaction operations
  getTransactions(userId: string, limit?: number): Promise<TransactionWithCategory[]>;
  getTransactionsByDateRange(userId: string, startDate: string, endDate: string): Promise<TransactionWithCategory[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: number, userId: string): Promise<boolean>;

  // Budget operations
  getBudgets(userId: string): Promise<BudgetWithCategory[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: number, userId: string): Promise<boolean>;

  // Savings goal operations
  getSavingsGoals(userId: string): Promise<SavingsGoal[]>;
  createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal>;
  updateSavingsGoal(id: number, goal: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined>;
  deleteSavingsGoal(id: number, userId: string): Promise<boolean>;

  // Analytics operations
  getMonthlyBalance(userId: string, year: number, month: number): Promise<{ income: string; expenses: string; balance: string }>;
  getCategoryTotals(userId: string, startDate: string, endDate: string): Promise<{ categoryId: number; categoryName: string; total: string; type: string }[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Category operations
  async getCategories(userId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return result.rowCount > 0;
  }

  // Transaction operations
  async getTransactions(userId: string, limit?: number): Promise<TransactionWithCategory[]> {
    const query = db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        categoryId: transactions.categoryId,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        paymentMethod: transactions.paymentMethod,
        date: transactions.date,
        createdAt: transactions.createdAt,
        category: {
          id: categories.id,
          userId: categories.userId,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
          type: categories.type,
          createdAt: categories.createdAt,
        },
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date), desc(transactions.createdAt));

    if (limit) {
      return await query.limit(limit);
    }
    return await query;
  }

  async getTransactionsByDateRange(userId: string, startDate: string, endDate: string): Promise<TransactionWithCategory[]> {
    return await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        categoryId: transactions.categoryId,
        description: transactions.description,
        amount: transactions.amount,
        type: transactions.type,
        paymentMethod: transactions.paymentMethod,
        date: transactions.date,
        createdAt: transactions.createdAt,
        category: {
          id: categories.id,
          userId: categories.userId,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
          type: categories.type,
          createdAt: categories.createdAt,
        },
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .orderBy(desc(transactions.date), desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransaction(id: number, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const [updatedTransaction] = await db
      .update(transactions)
      .set(transaction)
      .where(eq(transactions.id, id))
      .returning();
    return updatedTransaction;
  }

  async deleteTransaction(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
    return result.rowCount > 0;
  }

  // Budget operations
  async getBudgets(userId: string): Promise<BudgetWithCategory[]> {
    return await db
      .select({
        id: budgets.id,
        userId: budgets.userId,
        categoryId: budgets.categoryId,
        name: budgets.name,
        amount: budgets.amount,
        period: budgets.period,
        startDate: budgets.startDate,
        endDate: budgets.endDate,
        createdAt: budgets.createdAt,
        category: {
          id: categories.id,
          userId: categories.userId,
          name: categories.name,
          icon: categories.icon,
          color: categories.color,
          type: categories.type,
          createdAt: categories.createdAt,
        },
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .where(eq(budgets.userId, userId))
      .orderBy(desc(budgets.createdAt));
  }

  async createBudget(budget: InsertBudget): Promise<Budget> {
    const [newBudget] = await db.insert(budgets).values(budget).returning();
    return newBudget;
  }

  async updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined> {
    const [updatedBudget] = await db
      .update(budgets)
      .set(budget)
      .where(eq(budgets.id, id))
      .returning();
    return updatedBudget;
  }

  async deleteBudget(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
    return result.rowCount > 0;
  }

  // Savings goal operations
  async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    return await db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId))
      .orderBy(desc(savingsGoals.createdAt));
  }

  async createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal> {
    const [newGoal] = await db.insert(savingsGoals).values(goal).returning();
    return newGoal;
  }

  async updateSavingsGoal(id: number, goal: Partial<InsertSavingsGoal>): Promise<SavingsGoal | undefined> {
    const [updatedGoal] = await db
      .update(savingsGoals)
      .set(goal)
      .where(eq(savingsGoals.id, id))
      .returning();
    return updatedGoal;
  }

  async deleteSavingsGoal(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
    return result.rowCount > 0;
  }

  // Analytics operations
  async getMonthlyBalance(userId: string, year: number, month: number): Promise<{ income: string; expenses: string; balance: string }> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    const [incomeResult] = await db
      .select({
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'income'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    const [expenseResult] = await db
      .select({
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    const income = incomeResult?.total || "0";
    const expenses = expenseResult?.total || "0";
    const balance = (parseFloat(income) - parseFloat(expenses)).toString();

    return { income, expenses, balance };
  }

  async getCategoryTotals(userId: string, startDate: string, endDate: string): Promise<{ categoryId: number; categoryName: string; total: string; type: string }[]> {
    return await db
      .select({
        categoryId: sql<number>`COALESCE(${transactions.categoryId}, 0)`,
        categoryName: sql<string>`COALESCE(${categories.name}, 'Sem categoria')`,
        total: sum(transactions.amount),
        type: transactions.type,
      })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactions.categoryId, categories.name, transactions.type)
      .orderBy(desc(sum(transactions.amount)));
  }
}

export const storage = new DatabaseStorage();
