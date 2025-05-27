import { z } from "zod";

// Firestore doesn't use table/relation definitions like SQL/Drizzle.
// We will define TypeScript interfaces/types for our data structures
// and Zod schemas for validation.

// --- User --- 
// User ID will be the Firebase Auth UID (string)
export interface User {
  id: string; // Firebase UID
  email?: string | null; // From Firebase Auth, might be null
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null; // From Firebase Auth or custom
  createdAt: Date; // Or Firestore Timestamp
  updatedAt: Date; // Or Firestore Timestamp
}
// For creating/updating user profiles in Firestore (data beyond auth)
export const userProfileSchema = z.object({
  firstName: z.string().optional().nullable(),
  lastName: z.string().optional().nullable(),
  // profileImageUrl could be managed separately if using Firebase Storage
});
export type UserProfileData = z.infer<typeof userProfileSchema>;

// --- Categories --- 
export interface Category {
  id?: string; // Firestore document ID (auto-generated or custom)
  userId: string; // Firebase UID of the owner
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  createdAt?: Date; // Or Firestore Timestamp
}
export const categorySchema = z.object({
  userId: z.string(),
  name: z.string().min(1, "Name is required"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  type: z.enum(['income', 'expense']),
});
export type InsertCategory = z.infer<typeof categorySchema>;

// --- Transactions --- 
export interface Transaction {
  id?: string; // Firestore document ID
  userId: string;
  categoryId?: string | null; // Firestore ID of the category document
  description: string;
  amount: number;
  type: 'income' | 'expense';
  paymentMethod?: 'pix' | 'debit' | 'credit' | 'cash' | string; // Allow other strings for flexibility
  date: Date; // Or Firestore Timestamp
  createdAt?: Date; // Or Firestore Timestamp
}
export const transactionSchema = z.object({
  userId: z.string(),
  categoryId: z.string().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(['income', 'expense']),
  paymentMethod: z.string().optional(),
  date: z.date(), // For client-side, then convert to Firestore Timestamp
});
export type InsertTransaction = z.infer<typeof transactionSchema>;

// --- Budgets --- 
export interface Budget {
  id?: string; // Firestore document ID
  userId: string;
  categoryId?: string | null; // Firestore ID of the category document
  name: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: Date; // Or Firestore Timestamp
  endDate?: Date | null; // Or Firestore Timestamp
  createdAt?: Date; // Or Firestore Timestamp
}
export const budgetSchema = z.object({
  userId: z.string(),
  categoryId: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required"),
  amount: z.number().positive("Amount must be positive"),
  period: z.enum(['monthly', 'weekly', 'yearly']),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
});
export type InsertBudget = z.infer<typeof budgetSchema>;

// --- Savings Goals --- 
export interface SavingsGoal {
  id?: string; // Firestore document ID
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  targetDate?: Date | null; // Or Firestore Timestamp
  completed: boolean;
  createdAt?: Date; // Or Firestore Timestamp
}
export const savingsGoalSchema = z.object({
  userId: z.string(),
  name: z.string().min(1, "Name is required"),
  targetAmount: z.number().positive("Target amount must be positive"),
  currentAmount: z.number().min(0).default(0),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  targetDate: z.date().optional().nullable(),
  completed: z.boolean().default(false),
});
export type InsertSavingsGoal = z.infer<typeof savingsGoalSchema>;

// Note: The old Drizzle-based types like `UpsertUser` and `XxxWithCategory` might need rethinking.
// For Firestore, when you fetch a transaction, you might fetch its category separately if needed,
// or you might store some denormalized category data (like categoryName) directly on the transaction
// for easier querying/display if performance becomes an issue.

// For now, let's define simple relation types, but the actual data fetching will be different.
export type TransactionWithCategory = Transaction & {
  category?: Category; // This implies a join or separate fetch client-side or server-side aggregation
};

export type BudgetWithCategory = Budget & {
  category?: Category; // Similar to above
};

// We no longer need the Drizzle `relations` objects.
// We also don't need the Drizzle-generated `users.$inferInsert` etc.
// The `insertUserSchema` is replaced by `userProfileSchema` for data stored in Firestore beyond auth.
// The other `insert...Schema` are now directly Zod schemas.

// The old export type UpsertUser = typeof users.$inferInsert; is not directly applicable.
// Firebase user creation/update is handled by Firebase Auth SDK.
// For profile data in Firestore, UserProfileData is the type for creation/update.

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>; // id is Firebase UID
  // upsertUser was for Replit Auth. For Firebase, user profile data is distinct.
  // We might need a setUserProfile or updateUserProfile method.
  // For now, let's assume user profile data is managed within the User object, or a separate function.
  // Let's adjust upsertUser to reflect setting/updating profile data for a given UID.
  upsertUserProfile(userId: string, profileData: UserProfileData): Promise<User | undefined>; 

  // Category operations
  getCategories(userId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category | undefined>; 
  updateCategory(id: string, userId: string, categoryData: Partial<Omit<InsertCategory, 'userId'>>): Promise<Category | undefined>; // id is Firestore doc ID
  deleteCategory(id: string, userId: string): Promise<boolean>; // id is Firestore doc ID

  // Transaction operations
  getTransactions(userId: string, limit?: number): Promise<TransactionWithCategory[]>;
  getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TransactionWithCategory[]>; // Dates should be Date objects
  createTransaction(transaction: InsertTransaction): Promise<Transaction | undefined>; 
  updateTransaction(id: string, userId: string, transactionData: Partial<Omit<InsertTransaction, 'userId'>>): Promise<Transaction | undefined>; // id is Firestore doc ID
  deleteTransaction(id: string, userId: string): Promise<boolean>; // id is Firestore doc ID

  // Budget operations
  getBudgets(userId: string): Promise<BudgetWithCategory[]>;
  createBudget(budget: InsertBudget): Promise<Budget | undefined>; 
  updateBudget(id: string, userId: string, budgetData: Partial<Omit<InsertBudget, 'userId'>>): Promise<Budget | undefined>; // id is Firestore doc ID
  deleteBudget(id: string, userId: string): Promise<boolean>; // id is Firestore doc ID

  // Savings goal operations
  getSavingsGoals(userId: string): Promise<SavingsGoal[]>;
  createSavingsGoal(goal: InsertSavingsGoal): Promise<SavingsGoal | undefined>; 
  updateSavingsGoal(id: string, userId: string, goalData: Partial<Omit<InsertSavingsGoal, 'userId'>>): Promise<SavingsGoal | undefined>; // id is Firestore doc ID
  deleteSavingsGoal(id: string, userId: string): Promise<boolean>; // id is Firestore doc ID

  // Analytics operations
  getMonthlyBalance(userId: string, year: number, month: number): Promise<{ income: number; expenses: number; balance: number } | undefined>; 
  getCategoryTotals(userId: string, startDate: Date, endDate: Date): Promise<{ categoryId: string | null; categoryName: string; total: number; type: string }[] | undefined>; 
}
