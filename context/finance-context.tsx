"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";

// Definición de tipos
export type Transaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: "income" | "expense" | "transfer";
  category: string;
  recurrence?: "none" | "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  notes?: string;
};

export type Debt = {
  id: string;
  description: string;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  nextPaymentDate: string;
};

export type Budget = {
  id: string;
  category: string;
  amount: number;
  period: "weekly" | "monthly" | "yearly";
  spent: number;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
};

type FinanceState = {
  transactions: Transaction[];
  debts: Debt[];
  budgets: Budget[];
  categories: Category[];
  settings: {
    currency: string;
    dateFormat: string;
    language: string;
    startWeekOnMonday: boolean;
    reminderDays: number;
    budgetThreshold: number;
  };
  isLoading: boolean;
  error: string | null;
};

type FinanceAction =
  | { type: "ADD_TRANSACTION"; payload: Transaction }
  | {
      type: "UPDATE_TRANSACTION";
      payload: { id: string; data: Partial<Transaction> };
    }
  | { type: "DELETE_TRANSACTION"; payload: string }
  | { type: "ADD_DEBT"; payload: Debt }
  | { type: "UPDATE_DEBT"; payload: { id: string; data: Partial<Debt> } }
  | { type: "DELETE_DEBT"; payload: string }
  | { type: "ADD_BUDGET"; payload: Budget }
  | { type: "UPDATE_BUDGET"; payload: { id: string; data: Partial<Budget> } }
  | { type: "DELETE_BUDGET"; payload: string }
  | { type: "ADD_CATEGORY"; payload: Category }
  | {
      type: "UPDATE_CATEGORY";
      payload: { id: string; data: Partial<Category> };
    }
  | { type: "DELETE_CATEGORY"; payload: string }
  | { type: "UPDATE_SETTINGS"; payload: Partial<FinanceState["settings"]> }
  | { type: "FETCH_TRANSACTIONS_REQUEST" }
  | { type: "FETCH_TRANSACTIONS_SUCCESS"; payload: Transaction[] }
  | { type: "FETCH_TRANSACTIONS_FAILURE"; payload: string }
  | { type: "FETCH_CATEGORIES_REQUEST" }
  | { type: "FETCH_CATEGORIES_SUCCESS"; payload: Category[] }
  | { type: "FETCH_CATEGORIES_FAILURE"; payload: string }
  | { type: "FETCH_DEBTS_REQUEST" }
  | { type: "FETCH_DEBTS_SUCCESS"; payload: Debt[] }
  | { type: "FETCH_DEBTS_FAILURE"; payload: string }
  | { type: "FETCH_BUDGETS_REQUEST" }
  | { type: "FETCH_BUDGETS_SUCCESS"; payload: Budget[] }
  | { type: "FETCH_BUDGETS_FAILURE"; payload: string }
  | { type: "FETCH_SETTINGS_REQUEST" }
  | { type: "FETCH_SETTINGS_SUCCESS"; payload: FinanceState["settings"] }
  | { type: "FETCH_SETTINGS_FAILURE"; payload: string }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" };

type FinanceContextType = {
  state: FinanceState;
  dispatch: React.Dispatch<FinanceAction>;
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addDebt: (debt: Omit<Debt, "id">) => Promise<void>;
  updateDebt: (id: string, data: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, "id" | "spent">) => Promise<void>;
  updateBudget: (id: string, data: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getIncomes: () => Transaction[];
  getExpenses: () => Transaction[];
  getTotalBalance: () => number;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getUpcomingPayments: (days?: number) => Transaction[];
  getTransactionsByCategory: () => Record<string, number>;
  fetchAllData: () => Promise<void>;
};

// Estado inicial para el proveedor
const initialState: FinanceState = {
  transactions: [],
  debts: [],
  budgets: [],
  categories: [],
  settings: {
    currency: "USD",
    dateFormat: "dd/MM/yyyy",
    language: "es",
    startWeekOnMonday: true,
    reminderDays: 3,
    budgetThreshold: 80,
  },
  isLoading: false,
  error: null,
};

// Reducer para manejar las acciones
function financeReducer(
  state: FinanceState,
  action: FinanceAction
): FinanceState {
  switch (action.type) {
    case "ADD_TRANSACTION":
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case "UPDATE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.map((transaction) =>
          transaction.id === action.payload.id
            ? { ...transaction, ...action.payload.data }
            : transaction
        ),
      };
    case "DELETE_TRANSACTION":
      return {
        ...state,
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.payload
        ),
      };
    case "ADD_DEBT":
      return {
        ...state,
        debts: [...state.debts, action.payload],
      };
    case "UPDATE_DEBT":
      return {
        ...state,
        debts: state.debts.map((debt) =>
          debt.id === action.payload.id
            ? { ...debt, ...action.payload.data }
            : debt
        ),
      };
    case "DELETE_DEBT":
      return {
        ...state,
        debts: state.debts.filter((debt) => debt.id !== action.payload),
      };
    case "ADD_BUDGET":
      return {
        ...state,
        budgets: [...state.budgets, action.payload],
      };
    case "UPDATE_BUDGET":
      return {
        ...state,
        budgets: state.budgets.map((budget) =>
          budget.id === action.payload.id
            ? { ...budget, ...action.payload.data }
            : budget
        ),
      };
    case "DELETE_BUDGET":
      return {
        ...state,
        budgets: state.budgets.filter((budget) => budget.id !== action.payload),
      };
    case "ADD_CATEGORY":
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case "UPDATE_CATEGORY":
      return {
        ...state,
        categories: state.categories.map((category) =>
          category.id === action.payload.id
            ? { ...category, ...action.payload.data }
            : category
        ),
      };
    case "DELETE_CATEGORY":
      return {
        ...state,
        categories: state.categories.filter(
          (category) => category.id !== action.payload
        ),
      };
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    // Acciones relacionadas con cargar transacciones
    case "FETCH_TRANSACTIONS_REQUEST":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "FETCH_TRANSACTIONS_SUCCESS":
      return {
        ...state,
        transactions: action.payload,
        isLoading: false,
      };
    case "FETCH_TRANSACTIONS_FAILURE":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    // Acciones relacionadas con cargar categorías
    case "FETCH_CATEGORIES_REQUEST":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "FETCH_CATEGORIES_SUCCESS":
      return {
        ...state,
        categories: action.payload,
        isLoading: false,
      };
    case "FETCH_CATEGORIES_FAILURE":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    // Acciones relacionadas con cargar deudas
    case "FETCH_DEBTS_REQUEST":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "FETCH_DEBTS_SUCCESS":
      return {
        ...state,
        debts: action.payload,
        isLoading: false,
      };
    case "FETCH_DEBTS_FAILURE":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    // Acciones relacionadas con cargar presupuestos
    case "FETCH_BUDGETS_REQUEST":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "FETCH_BUDGETS_SUCCESS":
      return {
        ...state,
        budgets: action.payload,
        isLoading: false,
      };
    case "FETCH_BUDGETS_FAILURE":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    // Acciones relacionadas con cargar ajustes
    case "FETCH_SETTINGS_REQUEST":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "FETCH_SETTINGS_SUCCESS":
      return {
        ...state,
        settings: action.payload,
        isLoading: false,
      };
    case "FETCH_SETTINGS_FAILURE":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    // Gestión de errores
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
}

// Crear el contexto
const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Proveedor del contexto
export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(financeReducer, initialState);
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [dataLoaded, setDataLoaded] = useState(false);

  // Cargar datos cuando el usuario está autenticado
  useEffect(() => {
    if (status === "authenticated" && !dataLoaded) {
      fetchAllData();
    }
  }, [status, dataLoaded]);

  // Función para cargar todos los datos del usuario
  const fetchAllData = async () => {
    try {
      // Solo cargar datos si el usuario está autenticado
      if (status !== "authenticated") return;

      // Cargar transacciones
      await fetchTransactions();

      // Cargar categorías
      await fetchCategories();

      // Cargar configuración
      await fetchSettings();

      // Cargar deudas - Implementar en el futuro
      // await fetchDebts();

      // Cargar presupuestos
      await fetchBudgets();

      // Marcar que los datos ya fueron cargados
      setDataLoaded(true);
    } catch (error: any) {
      console.error("Error al cargar datos:", error);
      toast({
        title: "Error",
        description:
          "No se pudieron cargar los datos. Intente de nuevo más tarde.",
        variant: "destructive",
      });
      dispatch({
        type: "SET_ERROR",
        payload: error.message || "Error al cargar datos",
      });
    }
  };

  // Función para cargar transacciones desde la API
  const fetchTransactions = async () => {
    dispatch({ type: "FETCH_TRANSACTIONS_REQUEST" });
    try {
      const response = await fetch("/api/transactions");

      if (!response.ok) {
        throw new Error("Error al obtener transacciones");
      }

      const data = await response.json();
      dispatch({ type: "FETCH_TRANSACTIONS_SUCCESS", payload: data });
    } catch (error: any) {
      console.error("Error al cargar transacciones:", error);
      dispatch({
        type: "FETCH_TRANSACTIONS_FAILURE",
        payload: error.message || "Error al cargar transacciones",
      });
    }
  };

  // Función para cargar categorías desde la API
  const fetchCategories = async () => {
    dispatch({ type: "FETCH_CATEGORIES_REQUEST" });
    try {
      const response = await fetch("/api/categories");

      if (!response.ok) {
        throw new Error("Error al obtener categorías");
      }

      const data = await response.json();
      dispatch({ type: "FETCH_CATEGORIES_SUCCESS", payload: data });
    } catch (error: any) {
      console.error("Error al cargar categorías:", error);
      dispatch({
        type: "FETCH_CATEGORIES_FAILURE",
        payload: error.message || "Error al cargar categorías",
      });
    }
  };

  // Función para cargar la configuración desde la API
  const fetchSettings = async () => {
    dispatch({ type: "FETCH_SETTINGS_REQUEST" });
    try {
      const response = await fetch("/api/settings");

      if (!response.ok) {
        throw new Error("Error al obtener configuración");
      }

      const data = await response.json();
      dispatch({ type: "FETCH_SETTINGS_SUCCESS", payload: data });
    } catch (error: any) {
      console.error("Error al cargar configuración:", error);
      dispatch({
        type: "FETCH_SETTINGS_FAILURE",
        payload: error.message || "Error al cargar configuración",
      });
    }
  };

  // Función para cargar presupuestos desde la API
  const fetchBudgets = async () => {
    dispatch({ type: "FETCH_BUDGETS_REQUEST" });
    try {
      const response = await fetch("/api/budgets");

      if (!response.ok) {
        throw new Error("Error al obtener presupuestos");
      }

      const data = await response.json();
      dispatch({ type: "FETCH_BUDGETS_SUCCESS", payload: data });
    } catch (error: any) {
      console.error("Error al cargar presupuestos:", error);
      dispatch({
        type: "FETCH_BUDGETS_FAILURE",
        payload: error.message || "Error al cargar presupuestos",
      });
    }
  };

  // Función para añadir una transacción
  const addTransaction = async (transaction: Omit<Transaction, "id">) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear la transacción");
      }

      const newTransaction = await response.json();
      dispatch({ type: "ADD_TRANSACTION", payload: newTransaction });

      toast({
        title: "Transacción creada",
        description: "La transacción se ha guardado correctamente.",
      });
    } catch (error: any) {
      console.error("Error al crear transacción:", error);
      toast({
        title: "Error",
        description: error.message || "Error al crear la transacción",
        variant: "destructive",
      });
    }
  };

  // Función para actualizar una transacción
  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar la transacción");
      }

      const updatedTransaction = await response.json();
      dispatch({
        type: "UPDATE_TRANSACTION",
        payload: { id, data: updatedTransaction },
      });

      toast({
        title: "Transacción actualizada",
        description: "La transacción se ha actualizado correctamente.",
      });
    } catch (error: any) {
      console.error("Error al actualizar transacción:", error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la transacción",
        variant: "destructive",
      });
    }
  };

  // Función para eliminar una transacción
  const deleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar la transacción");
      }

      dispatch({ type: "DELETE_TRANSACTION", payload: id });

      toast({
        title: "Transacción eliminada",
        description: "La transacción se ha eliminado correctamente.",
      });
    } catch (error: any) {
      console.error("Error al eliminar transacción:", error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la transacción",
        variant: "destructive",
      });
    }
  };

  const addDebt = async (debt: Omit<Debt, "id">) => {
    // Implementación temporal hasta que se cree el endpoint
    const newDebt = {
      ...debt,
      id: Date.now().toString(36) + Math.random().toString(36).substring(2),
    };
    dispatch({ type: "ADD_DEBT", payload: newDebt });
    return Promise.resolve();
  };

  const updateDebt = async (id: string, data: Partial<Debt>) => {
    dispatch({ type: "UPDATE_DEBT", payload: { id, data } });
    return Promise.resolve();
  };

  const deleteDebt = async (id: string) => {
    dispatch({ type: "DELETE_DEBT", payload: id });
    return Promise.resolve();
  };

  const getIncomes = () => {
    return state.transactions.filter((t) => t.type === "income");
  };

  const getExpenses = () => {
    return state.transactions.filter((t) => t.type === "expense");
  };

  const getTotalBalance = () => {
    return state.transactions.reduce((acc, transaction) => {
      if (transaction.type === "income") {
        return acc + transaction.amount;
      } else if (transaction.type === "expense") {
        return acc - transaction.amount;
      }
      return acc;
    }, 0);
  };

  const getTotalIncome = () => {
    return getIncomes().reduce(
      (acc, transaction) => acc + transaction.amount,
      0
    );
  };

  const getTotalExpenses = () => {
    return getExpenses().reduce(
      (acc, transaction) => acc + transaction.amount,
      0
    );
  };

  const getUpcomingPayments = (days = 30) => {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + days);

    return state.transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return (
        transaction.type === "expense" &&
        transactionDate >= today &&
        transactionDate <= futureDate
      );
    });
  };

  const getTransactionsByCategory = () => {
    const expensesByCategory: Record<string, number> = {};

    state.transactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        if (!expensesByCategory[transaction.category]) {
          expensesByCategory[transaction.category] = 0;
        }
        expensesByCategory[transaction.category] += transaction.amount;
      }
    });

    return expensesByCategory;
  };

  const addBudget = async (budget: Omit<Budget, "id" | "spent">) => {
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(budget),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear el presupuesto");
      }

      const newBudget = await response.json();
      dispatch({ type: "ADD_BUDGET", payload: newBudget });

      toast({
        title: "Presupuesto creado",
        description: "El presupuesto se ha guardado correctamente.",
      });
    } catch (error: any) {
      console.error("Error al crear presupuesto:", error);
      toast({
        title: "Error",
        description: error.message || "Error al crear el presupuesto",
        variant: "destructive",
      });
    }
  };

  const updateBudget = async (id: string, data: Partial<Budget>) => {
    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar el presupuesto");
      }

      const updatedBudget = await response.json();
      dispatch({
        type: "UPDATE_BUDGET",
        payload: { id, data: updatedBudget },
      });

      toast({
        title: "Presupuesto actualizado",
        description: "El presupuesto se ha actualizado correctamente.",
      });
    } catch (error: any) {
      console.error("Error al actualizar presupuesto:", error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el presupuesto",
        variant: "destructive",
      });
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar el presupuesto");
      }

      dispatch({ type: "DELETE_BUDGET", payload: id });

      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto se ha eliminado correctamente.",
      });
    } catch (error: any) {
      console.error("Error al eliminar presupuesto:", error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el presupuesto",
        variant: "destructive",
      });
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        state,
        dispatch,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addDebt,
        updateDebt,
        deleteDebt,
        addBudget,
        updateBudget,
        deleteBudget,
        getIncomes,
        getExpenses,
        getTotalBalance,
        getTotalIncome,
        getTotalExpenses,
        getUpcomingPayments,
        getTransactionsByCategory,
        fetchAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance debe utilizarse dentro de un FinanceProvider");
  }
  return context;
}
