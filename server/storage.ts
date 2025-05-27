import {
  User,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  type UserProfileData,
  type InsertCategory,
  type InsertTransaction,
  type TransactionWithCategory,
  type InsertBudget,
  type BudgetWithCategory,
  type InsertSavingsGoal,
  type IStorage,
} from "@shared/schema";
import { adminDb, adminAuth } from "./firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

const USERS_COLLECTION = "users";
const CATEGORIES_COLLECTION = "categories";
const TRANSACTIONS_COLLECTION = "transactions";
const BUDGETS_COLLECTION = "budgets";
const SAVINGS_GOALS_COLLECTION = "savingsGoals";

export class FirestoreStorage implements IStorage {
  // --- User Operations ---
  async getUser(id: string): Promise<User | undefined> {
    const docSnap = await adminDb.collection(USERS_COLLECTION).doc(id).get();
    if (!docSnap.exists) return undefined;
    const data = docSnap.data() as Omit<User, 'id'>;
    return { id: docSnap.id, ...data };
  }

  async upsertUserProfile(userId: string, profileData: UserProfileData): Promise<User | undefined> {
    const userRef = adminDb.collection(USERS_COLLECTION).doc(userId);
    const now = FieldValue.serverTimestamp();
    
    // Prepare data, ensuring createdAt is only set on creation
    // and updatedAt is always set.
    const dataToSet: any = {
        ...profileData,
        updatedAt: now,
    };

    try {
        const docSnap = await userRef.get();
        if (docSnap.exists) {
            // Update existing document
            await userRef.update(dataToSet);
        } else {
            // Create new document
            dataToSet.createdAt = now;
            // email might be set from auth token initially, or an empty profile is created
            const firebaseUser = await adminAuth.getUser(userId);
            dataToSet.email = firebaseUser.email || null; 
            await userRef.set(dataToSet);
        }
        
        const updatedDocSnap = await userRef.get();
        const rawData = updatedDocSnap.data();
        if (!rawData) return undefined;

        const transformedData: Omit<User, 'id'> = {
          email: rawData.email,
          firstName: rawData.firstName,
          lastName: rawData.lastName,
          profileImageUrl: rawData.profileImageUrl,
          createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate() : new Date(),
          updatedAt: rawData.updatedAt?.toDate ? rawData.updatedAt.toDate() : new Date(),
        };
        
        return { id: updatedDocSnap.id, ...transformedData };

    } catch (error) {
        console.error("Error in upsertUserProfile:", error);
        return undefined;
    }
  }

  // --- Category Operations ---
  async getCategories(userId: string): Promise<Category[]> {
    const snapshot = await adminDb
      .collection(CATEGORIES_COLLECTION)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : undefined,
      } as Category;
    });
  }

  async createCategory(categoryData: InsertCategory): Promise<Category | undefined> {
    try {
      const dataToCreate = {
        ...categoryData,
        createdAt: FieldValue.serverTimestamp(),
      };
      const docRef = await adminDb.collection(CATEGORIES_COLLECTION).add(dataToCreate);
      const docSnap = await docRef.get();
      const rawData = docSnap.data();
      if (!rawData) return undefined;
      return { 
        id: docSnap.id, 
        ...rawData,
        createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate() : new Date(),
      } as Category;
    } catch (error) {
      console.error("Error creating category:", error);
      return undefined;
    }
  }

  async updateCategory(id: string, userId: string, categoryData: Partial<Omit<InsertCategory, 'userId'>>): Promise<Category | undefined> {
    const docRef = adminDb.collection(CATEGORIES_COLLECTION).doc(id);
    try {
      const docSnap = await docRef.get();
      if (!docSnap.exists || docSnap.data()?.userId !== userId) {
        console.error("Category not found or user mismatch for update.");
        return undefined;
      }
      await docRef.update(categoryData);
      const updatedDocSnap = await docRef.get();
      const rawData = updatedDocSnap.data();
      if (!rawData) return undefined;
      return { 
        id: updatedDocSnap.id, 
        ...rawData,
        createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate() : undefined,
      } as Category;
    } catch (error) {
      console.error("Error updating category:", error);
      return undefined;
    }
  }

  async deleteCategory(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(CATEGORIES_COLLECTION).doc(id);
    try {
      const docSnap = await docRef.get();
      if (!docSnap.exists || docSnap.data()?.userId !== userId) {
        console.error("Category not found or user mismatch for delete.");
        return false;
      }
      await docRef.delete();
      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      return false;
    }
  }

  // --- Transaction Operations ---
  async getTransactions(userId: string, limit?: number): Promise<TransactionWithCategory[]> {
    let query = adminDb
      .collection(TRANSACTIONS_COLLECTION)
      .where("userId", "==", userId)
      .orderBy("date", "desc");

    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    const transactions: TransactionWithCategory[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const transactionDate = data.date?.toDate ? data.date.toDate() : (data.date instanceof Date ? data.date : new Date());
      const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : new Date());
      
      const transaction: Transaction = {
        id: doc.id,
        userId: data.userId,
        categoryId: data.categoryId,
        description: data.description,
        amount: data.amount,
        type: data.type,
        paymentMethod: data.paymentMethod,
        date: transactionDate,
        createdAt: createdAtDate,
      };

      let categoryData: Category | undefined = undefined;
      if (transaction.categoryId) {
        const catSnap = await adminDb.collection(CATEGORIES_COLLECTION).doc(transaction.categoryId).get();
        if (catSnap.exists) {
          const cat = catSnap.data();
          if (cat) {
            const catCreatedAt = cat.createdAt?.toDate ? cat.createdAt.toDate() : (cat.createdAt instanceof Date ? cat.createdAt : undefined);
            categoryData = { id: catSnap.id, ... (cat as Omit<Category, 'id' | 'createdAt'>), createdAt: catCreatedAt };
          }
        }
      }
      transactions.push({ ...transaction, category: categoryData });
    }
    return transactions;
  }

  async getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TransactionWithCategory[]> {
    const snapshot = await adminDb
      .collection(TRANSACTIONS_COLLECTION)
      .where("userId", "==", userId)
      .where("date", ">=", startDate) 
      .where("date", "<=", endDate)
      .orderBy("date", "desc")
      .get();

    const transactions: TransactionWithCategory[] = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const transactionDate = data.date?.toDate ? data.date.toDate() : (data.date instanceof Date ? data.date : new Date());
      const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : new Date());

      const transaction: Transaction = {
        id: doc.id,
        userId: data.userId,
        categoryId: data.categoryId,
        description: data.description,
        amount: data.amount,
        type: data.type,
        paymentMethod: data.paymentMethod,
        date: transactionDate,
        createdAt: createdAtDate,
      };
      let categoryData: Category | undefined = undefined;
      if (transaction.categoryId) {
        const catSnap = await adminDb.collection(CATEGORIES_COLLECTION).doc(transaction.categoryId).get();
        if (catSnap.exists) {
          const cat = catSnap.data();
           if (cat) {
            const catCreatedAt = cat.createdAt?.toDate ? cat.createdAt.toDate() : (cat.createdAt instanceof Date ? cat.createdAt : undefined);
            categoryData = { id: catSnap.id, ... (cat as Omit<Category, 'id' | 'createdAt'>), createdAt: catCreatedAt };
          }
        }
      }
      transactions.push({ ...transaction, category: categoryData });
    }
    return transactions;
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction | undefined> {
    try {
      const dataToCreate = {
        ...transactionData, 
        createdAt: FieldValue.serverTimestamp(),
      };
      const docRef = await adminDb.collection(TRANSACTIONS_COLLECTION).add(dataToCreate);
      const docSnap = await docRef.get();
      const rawData = docSnap.data();
      if (!rawData) return undefined;

      const responseDate = rawData.date?.toDate ? rawData.date.toDate() : (rawData.date instanceof Date ? rawData.date : new Date());
      const responseCreatedAt = rawData.createdAt?.toDate ? rawData.createdAt.toDate() : (rawData.createdAt instanceof Date ? rawData.createdAt : new Date());

      return {
        id: docSnap.id,
        ...(rawData as Omit<Transaction, 'id' | 'date' | 'createdAt'>),
        date: responseDate,
        createdAt: responseCreatedAt,
      } as Transaction;
    } catch (error) {
      console.error("Error creating transaction:", error);
      return undefined;
    }
  }

  async updateTransaction(id: string, userId: string, transactionInput: Partial<Omit<InsertTransaction, 'userId'>>): Promise<Transaction | undefined> {
    const docRef = adminDb.collection(TRANSACTIONS_COLLECTION).doc(id);
    try {
      const docSnapBeforeUpdate = await docRef.get();
      if (!docSnapBeforeUpdate.exists || docSnapBeforeUpdate.data()?.userId !== userId) {
        console.error("Transaction not found or user mismatch for update.");
        return undefined;
      }

      const dataToUpdate: Partial<InsertTransaction> & { updatedAt?: FieldValue } = { 
        ...transactionInput 
      };

      await docRef.update(dataToUpdate);
      const updatedDocSnap = await docRef.get();
      const rawData = updatedDocSnap.data();
      if (!rawData) return undefined;

      const responseDate = rawData.date?.toDate ? rawData.date.toDate() : (rawData.date instanceof Date ? rawData.date : new Date());
      const originalCreatedAt = docSnapBeforeUpdate.data()?.createdAt;
      const responseCreatedAt = rawData.createdAt?.toDate ? rawData.createdAt.toDate() : 
                               (originalCreatedAt?.toDate ? originalCreatedAt.toDate() : new Date());

      return {
        id: updatedDocSnap.id,
        ...(rawData as Omit<Transaction, 'id' | 'date' | 'createdAt'>),
        date: responseDate,
        createdAt: responseCreatedAt, 
      } as Transaction;
    } catch (error) {
      console.error("Error updating transaction:", error);
      return undefined;
    }
  }

  async deleteTransaction(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(TRANSACTIONS_COLLECTION).doc(id);
    try {
      const docSnap = await docRef.get();
      if (!docSnap.exists || docSnap.data()?.userId !== userId) {
        console.error("Transaction not found or user mismatch for delete.");
        return false;
      }
      await docRef.delete();
      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return false;
    }
  }

  // --- Budget Operations ---
  async getBudgets(userId: string): Promise<BudgetWithCategory[]> {
    const snapshot = await adminDb
      .collection(BUDGETS_COLLECTION)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc") // Or order by startDate, name, etc.
      .get();

    const budgets: BudgetWithCategory[] = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const budget: Budget = {
        id: doc.id,
        userId: data.userId,
        categoryId: data.categoryId,
        name: data.name,
        amount: data.amount,
        period: data.period,
        startDate: data.startDate?.toDate ? data.startDate.toDate() : (data.startDate instanceof Date ? data.startDate : new Date()),
        endDate: data.endDate?.toDate ? data.endDate.toDate() : (data.endDate instanceof Date ? data.endDate : null),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : new Date()),
      };

      let categoryData: Category | undefined = undefined;
      if (budget.categoryId) {
        const catSnap = await adminDb.collection(CATEGORIES_COLLECTION).doc(budget.categoryId).get();
        if (catSnap.exists) {
          const cat = catSnap.data();
          if (cat) {
            const catCreatedAt = cat.createdAt?.toDate ? cat.createdAt.toDate() : (cat.createdAt instanceof Date ? cat.createdAt : undefined);
            categoryData = { id: catSnap.id, ...(cat as Omit<Category, 'id' | 'createdAt'>), createdAt: catCreatedAt };
          }
        }
      }
      budgets.push({ ...budget, category: categoryData });
    }
    return budgets;
  }

  async createBudget(budgetData: InsertBudget): Promise<Budget | undefined> {
    try {
      const dataToCreate = {
        ...budgetData,
        // Ensure Date objects are passed directly, Firestore handles conversion
        startDate: budgetData.startDate, 
        endDate: budgetData.endDate || null, // Handle optional endDate
        createdAt: FieldValue.serverTimestamp(),
      };
      const docRef = await adminDb.collection(BUDGETS_COLLECTION).add(dataToCreate);
      const docSnap = await docRef.get();
      const rawData = docSnap.data();
      if (!rawData) return undefined;

      return {
        id: docSnap.id,
        ...(rawData as Omit<Budget, 'id' | 'startDate' | 'endDate' | 'createdAt'>),
        startDate: rawData.startDate?.toDate ? rawData.startDate.toDate() : (rawData.startDate instanceof Date ? rawData.startDate : new Date()),
        endDate: rawData.endDate?.toDate ? rawData.endDate.toDate() : (rawData.endDate instanceof Date ? rawData.endDate : null),
        createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate() : (rawData.createdAt instanceof Date ? rawData.createdAt : new Date()),
      } as Budget;
    } catch (error) {
      console.error("Error creating budget:", error);
      return undefined;
    }
  }

  async updateBudget(id: string, userId: string, budgetInput: Partial<Omit<InsertBudget, 'userId'>>): Promise<Budget | undefined> {
    const docRef = adminDb.collection(BUDGETS_COLLECTION).doc(id);
    try {
      const docSnapBeforeUpdate = await docRef.get();
      if (!docSnapBeforeUpdate.exists || docSnapBeforeUpdate.data()?.userId !== userId) {
        console.error("Budget not found or user mismatch for update.");
        return undefined;
      }

      const dataToUpdate: Partial<InsertBudget> & { updatedAt?: FieldValue } = { 
        ...budgetInput 
      };
      // If dates are provided in budgetInput, they are already JS Date objects
      // Firestore will handle their conversion to Timestamps.
      // dataToUpdate.updatedAt = FieldValue.serverTimestamp(); // Optional for tracking updates

      await docRef.update(dataToUpdate);
      const updatedDocSnap = await docRef.get();
      const rawData = updatedDocSnap.data();
      if (!rawData) return undefined;

      const originalCreatedAt = docSnapBeforeUpdate.data()?.createdAt;
      return {
        id: updatedDocSnap.id,
        ...(rawData as Omit<Budget, 'id' | 'startDate' | 'endDate' | 'createdAt'>),
        startDate: rawData.startDate?.toDate ? rawData.startDate.toDate() : (rawData.startDate instanceof Date ? rawData.startDate : new Date()),
        endDate: rawData.endDate?.toDate ? rawData.endDate.toDate() : (rawData.endDate instanceof Date ? rawData.endDate : null),
        createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate() : (originalCreatedAt?.toDate ? originalCreatedAt.toDate() : new Date()),
      } as Budget;
    } catch (error) {
      console.error("Error updating budget:", error);
      return undefined;
    }
  }

  async deleteBudget(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(BUDGETS_COLLECTION).doc(id);
    try {
      const docSnap = await docRef.get();
      if (!docSnap.exists || docSnap.data()?.userId !== userId) {
        console.error("Budget not found or user mismatch for delete.");
        return false;
      }
      await docRef.delete();
      return true;
    } catch (error) {
      console.error("Error deleting budget:", error);
      return false;
    }
  }

  // --- Savings Goal Operations ---
  async getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
    const snapshot = await adminDb
      .collection(SAVINGS_GOALS_COLLECTION)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc") // Or order by targetDate, name, etc.
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...(data as Omit<SavingsGoal, 'id' | 'targetDate' | 'createdAt'>),
        targetDate: data.targetDate?.toDate ? data.targetDate.toDate() : (data.targetDate instanceof Date ? data.targetDate : null),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt instanceof Date ? data.createdAt : new Date()),
      } as SavingsGoal;
    });
  }

  async createSavingsGoal(goalData: InsertSavingsGoal): Promise<SavingsGoal | undefined> {
    try {
      const dataToCreate = {
        ...goalData,
        currentAmount: goalData.currentAmount || 0,
        completed: goalData.completed || false,
        targetDate: goalData.targetDate || null, // Handle optional targetDate
        createdAt: FieldValue.serverTimestamp(),
      };
      const docRef = await adminDb.collection(SAVINGS_GOALS_COLLECTION).add(dataToCreate);
      const docSnap = await docRef.get();
      const rawData = docSnap.data();
      if (!rawData) return undefined;

      return {
        id: docSnap.id,
        ...(rawData as Omit<SavingsGoal, 'id' | 'targetDate' | 'createdAt'>),
        targetDate: rawData.targetDate?.toDate ? rawData.targetDate.toDate() : (rawData.targetDate instanceof Date ? rawData.targetDate : null),
        createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate() : (rawData.createdAt instanceof Date ? rawData.createdAt : new Date()),
      } as SavingsGoal;
    } catch (error) {
      console.error("Error creating savings goal:", error);
      return undefined;
    }
  }

  async updateSavingsGoal(id: string, userId: string, goalInput: Partial<Omit<InsertSavingsGoal, 'userId'>>): Promise<SavingsGoal | undefined> {
    const docRef = adminDb.collection(SAVINGS_GOALS_COLLECTION).doc(id);
    try {
      const docSnapBeforeUpdate = await docRef.get();
      if (!docSnapBeforeUpdate.exists || docSnapBeforeUpdate.data()?.userId !== userId) {
        console.error("SavingsGoal not found or user mismatch for update.");
        return undefined;
      }

      const dataToUpdate: Partial<InsertSavingsGoal> & { updatedAt?: FieldValue } = { 
        ...goalInput 
      };
      // dataToUpdate.updatedAt = FieldValue.serverTimestamp(); // Optional for tracking updates

      await docRef.update(dataToUpdate);
      const updatedDocSnap = await docRef.get();
      const rawData = updatedDocSnap.data();
      if (!rawData) return undefined;

      const originalCreatedAt = docSnapBeforeUpdate.data()?.createdAt;
      return {
        id: updatedDocSnap.id,
        ...(rawData as Omit<SavingsGoal, 'id' | 'targetDate' | 'createdAt'>),
        targetDate: rawData.targetDate?.toDate ? rawData.targetDate.toDate() : (rawData.targetDate instanceof Date ? rawData.targetDate : null),
        createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate() : (originalCreatedAt?.toDate ? originalCreatedAt.toDate() : new Date()),
      } as SavingsGoal;
    } catch (error) {
      console.error("Error updating savings goal:", error);
      return undefined;
    }
  }

  async deleteSavingsGoal(id: string, userId: string): Promise<boolean> {
    const docRef = adminDb.collection(SAVINGS_GOALS_COLLECTION).doc(id);
    try {
      const docSnap = await docRef.get();
      if (!docSnap.exists || docSnap.data()?.userId !== userId) {
        console.error("SavingsGoal not found or user mismatch for delete.");
        return false;
      }
      await docRef.delete();
      return true;
    } catch (error) {
      console.error("Error deleting savings goal:", error);
      return false;
    }
  }

  // --- Analytics Operations ---
  async getMonthlyBalance(userId: string, year: number, month: number): Promise<{ income: number; expenses: number; balance: number } | undefined> {
    // Firestore month is 0-indexed (0 for January, 11 for December)
    // JavaScript month is also 0-indexed, so ensure consistency or adjust if needed.
    // Assuming 'month' parameter is 1-indexed (January = 1) as is common.
    const jsMonth = month - 1; 
    const startDate = new Date(year, jsMonth, 1);
    const endDate = new Date(year, jsMonth + 1, 0); // Day 0 of next month gives last day of current month

    try {
      const transactionsSnapshot = await adminDb
        .collection(TRANSACTIONS_COLLECTION)
        .where("userId", "==", userId)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .get();

      let income = 0;
      let expenses = 0;

      transactionsSnapshot.docs.forEach(doc => {
        const transaction = doc.data() as Transaction;
        if (transaction.type === 'income') {
          income += transaction.amount;
        } else if (transaction.type === 'expense') {
          expenses += transaction.amount;
        }
      });

      return { income, expenses, balance: income - expenses };
    } catch (error) {
      console.error("Error in getMonthlyBalance:", error);
      return undefined;
    }
  }

  async getCategoryTotals(userId: string, startDate: Date, endDate: Date): Promise<{ categoryId: string | null; categoryName: string; total: number; type: string }[] | undefined> {
    try {
      const transactionsSnapshot = await adminDb
        .collection(TRANSACTIONS_COLLECTION)
        .where("userId", "==", userId)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .get();

      const categoryTotalsMap: Map<string, { total: number; type: string; categoryName: string; categoryId: string | null }> = new Map();

      // Fetch all relevant categories first to minimize reads inside the loop
      const categoryIds = new Set<string>();
      transactionsSnapshot.docs.forEach(doc => {
        const transaction = doc.data() as Transaction;
        if (transaction.categoryId) {
          categoryIds.add(transaction.categoryId);
        }
      });
      
      const categoriesMap = new Map<string, Category>();
      if (categoryIds.size > 0) {
        // Firestore IN queries are limited to 30 elements per query in newer SDK versions.
        // For simplicity here, we fetch one by one, but for many categories, batching or a different approach might be better.
        // Or, fetch all user categories once if the number is manageable.
        for (const catId of Array.from(categoryIds)) {
            const catSnap = await adminDb.collection(CATEGORIES_COLLECTION).doc(catId).get();
            if (catSnap.exists) {
                const catData = catSnap.data() as Omit<Category, 'id'>;
                categoriesMap.set(catId, { id: catSnap.id, ...catData } as Category);
            }
        }
      }

      transactionsSnapshot.docs.forEach(doc => {
        const transaction = doc.data() as Transaction;
        const key = `${transaction.categoryId || 'uncategorized'}-${transaction.type}`;
        
        const existingTotal = categoryTotalsMap.get(key);
        const category = transaction.categoryId ? categoriesMap.get(transaction.categoryId) : undefined;
        const categoryName = category ? category.name : (transaction.categoryId ? 'Unknown Category' : 'Uncategorized');

        if (existingTotal) {
          existingTotal.total += transaction.amount;
        } else {
          categoryTotalsMap.set(key, {
            total: transaction.amount,
            type: transaction.type,
            categoryName: categoryName,
            categoryId: transaction.categoryId || null,
          });
        }
      });

      return Array.from(categoryTotalsMap.values());

    } catch (error) {
      console.error("Error in getCategoryTotals:", error);
      return undefined;
    }
  }
}

export const storage = new FirestoreStorage();
