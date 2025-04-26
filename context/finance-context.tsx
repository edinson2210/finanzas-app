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
  type: "income" | "expense";
  category: string;
  recurrence?:
    | "none"
    | "daily"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "quarterly"
    | "yearly";
  notes?: string;
};

export type Debt = {
  id: string;
  description: string;
  totalAmount: number;
  remainingAmount: number;
  monthlyPayment: number;
  nextPaymentDate: string;
  frequency?:
    | "daily"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "quarterly"
    | "yearly";
  creditor?: string;
  interestRate?: number;
  interestFrequency?:
    | "weekly"
    | "biweekly"
    | "monthly"
    | "quarterly"
    | "yearly";
  linkedTransactions?: string[]; // IDs of related transactions
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

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "payment" | "budget" | "debt" | "info";
  status: "unread" | "read";
  reference?: string;
  referenceType?: string;
  date: Date;
};

export type SavingGoal = {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  color?: string;
  status: "active" | "completed" | "cancelled";
};

type FinanceState = {
  transactions: Transaction[];
  debts: Debt[];
  budgets: Budget[];
  categories: Category[];
  savingGoals: SavingGoal[];
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
  | { type: "ADD_SAVING_GOAL"; payload: SavingGoal }
  | {
      type: "UPDATE_SAVING_GOAL";
      payload: { id: string; data: Partial<SavingGoal> };
    }
  | { type: "DELETE_SAVING_GOAL"; payload: string }
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
  | { type: "FETCH_SAVING_GOALS_REQUEST" }
  | { type: "FETCH_SAVING_GOALS_SUCCESS"; payload: SavingGoal[] }
  | { type: "FETCH_SAVING_GOALS_FAILURE"; payload: string }
  | { type: "FETCH_SETTINGS_REQUEST" }
  | { type: "FETCH_SETTINGS_SUCCESS"; payload: FinanceState["settings"] }
  | { type: "FETCH_SETTINGS_FAILURE"; payload: string }
  | { type: "SET_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" };

type FinanceContextType = {
  state: FinanceState;
  dispatch: React.Dispatch<FinanceAction>;
  addTransaction: (
    transaction: Omit<Transaction, "id">
  ) => Promise<Transaction>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addDebt: (debt: Omit<Debt, "id">) => Promise<void>;
  updateDebt: (id: string, data: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, "id" | "spent">) => Promise<void>;
  updateBudget: (id: string, data: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addSavingGoal: (goal: Omit<SavingGoal, "id">) => Promise<void>;
  updateSavingGoal: (id: string, data: Partial<SavingGoal>) => Promise<void>;
  deleteSavingGoal: (id: string) => Promise<void>;
  contributeToSavingGoal: (goalId: string, amount: number) => Promise<void>;
  getIncomes: () => Transaction[];
  getExpenses: () => Transaction[];
  getTotalBalance: () => number;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getUpcomingPayments: (days?: number) => Transaction[];
  getTransactionsByCategory: () => Record<string, number>;
  fetchAllData: () => Promise<void>;
  addDebtPayment: (
    debtId: string,
    amount: number,
    date: string,
    notes?: string
  ) => Promise<Transaction>;
  getActiveDebts: () => Debt[];
  getDebtTransactions: (debtId: string) => Transaction[];
  getDebtTotalPaid: (debtId: string) => number;
  createNotification: (
    notification: Omit<Notification, "id" | "date" | "status">
  ) => Promise<void>;
  checkBudgetNotifications: () => Promise<void>;
  checkDebtNotifications: () => Promise<void>;
};

// Estado inicial para el proveedor
const initialState: FinanceState = {
  transactions: [],
  debts: [],
  budgets: [],
  categories: [],
  savingGoals: [],
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
    case "ADD_SAVING_GOAL":
      return {
        ...state,
        savingGoals: [...state.savingGoals, action.payload],
      };
    case "UPDATE_SAVING_GOAL":
      return {
        ...state,
        savingGoals: state.savingGoals.map((goal) =>
          goal.id === action.payload.id
            ? { ...goal, ...action.payload.data }
            : goal
        ),
      };
    case "DELETE_SAVING_GOAL":
      return {
        ...state,
        savingGoals: state.savingGoals.filter(
          (goal) => goal.id !== action.payload
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
    // Acciones relacionadas con cargar metas de ahorro
    case "FETCH_SAVING_GOALS_REQUEST":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "FETCH_SAVING_GOALS_SUCCESS":
      return {
        ...state,
        savingGoals: action.payload,
        isLoading: false,
      };
    case "FETCH_SAVING_GOALS_FAILURE":
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

  // Cargar datos cuando cambia el estado de la sesión
  useEffect(() => {
    if (status === "authenticated") {
      fetchAllData().then(() => {
        // Verificar notificaciones después de cargar todos los datos
        checkBudgetNotifications();
        checkDebtNotifications();
      });
    }
  }, [status]);

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

      // Cargar deudas
      await fetchDebts();

      // Cargar presupuestos
      await fetchBudgets();

      // Cargar metas de ahorro
      await fetchSavingGoals();

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

  // Función para cargar deudas desde la API
  const fetchDebts = async () => {
    dispatch({ type: "FETCH_DEBTS_REQUEST" });
    try {
      const response = await fetch("/api/debts");

      if (!response.ok) {
        throw new Error("Error al obtener deudas");
      }

      const data = await response.json();
      dispatch({ type: "FETCH_DEBTS_SUCCESS", payload: data });
    } catch (error: any) {
      console.error("Error al cargar deudas:", error);
      dispatch({
        type: "FETCH_DEBTS_FAILURE",
        payload: error.message || "Error al cargar deudas",
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
  const addTransaction = async (
    transaction: Omit<Transaction, "id">
  ): Promise<Transaction> => {
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

      return newTransaction;
    } catch (error: any) {
      console.error("Error al crear transacción:", error);
      toast({
        title: "Error",
        description: error.message || "Error al crear la transacción",
        variant: "destructive",
      });
      throw error;
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
    } catch (error: any) {
      console.error("Error al actualizar transacción:", error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la transacción",
        variant: "destructive",
      });
      throw error;
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
    } catch (error: any) {
      console.error("Error al eliminar transacción:", error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la transacción",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addDebt = async (debt: Omit<Debt, "id">) => {
    try {
      const response = await fetch("/api/debts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(debt),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear la deuda");
      }

      const newDebt = await response.json();
      dispatch({ type: "ADD_DEBT", payload: newDebt });

      return Promise.resolve();
    } catch (error: any) {
      console.error("Error al crear deuda:", error);
      toast({
        title: "Error",
        description: error.message || "Error al crear la deuda",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  };

  const updateDebt = async (id: string, data: Partial<Debt>) => {
    try {
      const response = await fetch(`/api/debts?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar la deuda");
      }

      const updatedDebt = await response.json();
      dispatch({
        type: "UPDATE_DEBT",
        payload: { id, data: updatedDebt },
      });

      return Promise.resolve();
    } catch (error: any) {
      console.error("Error al actualizar deuda:", error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la deuda",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      const response = await fetch(`/api/debts?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar la deuda");
      }

      dispatch({ type: "DELETE_DEBT", payload: id });

      return Promise.resolve();
    } catch (error: any) {
      console.error("Error al eliminar deuda:", error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la deuda",
        variant: "destructive",
      });
      return Promise.reject(error);
    }
  };

  // Nueva función para añadir un pago a una deuda
  const addDebtPayment = async (
    debtId: string,
    amount: number,
    date: string,
    notes?: string
  ): Promise<Transaction> => {
    // Buscar la deuda
    const debt = state.debts.find((d) => d.id === debtId);
    if (!debt) {
      throw new Error("Deuda no encontrada");
    }

    // Calcular intereses si existe tasa de interés
    let interestAmount = 0;
    let amountToCapital = amount;

    if (debt.interestRate && debt.interestRate > 0) {
      // Calcular el interés según la frecuencia definida
      const getInterestRatePerPeriod = (rate: number, frequency?: string) => {
        switch (frequency) {
          case "weekly":
            return rate / 100; // Tasa semanal directa
          case "biweekly":
            return rate / 100; // Tasa quincenal directa
          case "monthly":
            return rate / 100; // Tasa mensual directa
          case "quarterly":
            return rate / 100; // Tasa trimestral directa
          case "yearly":
            return rate / 100 / 12; // Convertir tasa anual a mensual
          default:
            return rate / 100 / 12; // Por defecto, asumimos mensual
        }
      };

      // Obtener tasa de interés aplicable para el período
      const interestRatePerPeriod = getInterestRatePerPeriod(
        debt.interestRate,
        debt.interestFrequency
      );

      // Calcular el monto de intereses acumulados
      interestAmount = debt.remainingAmount * interestRatePerPeriod;

      // Si el pago es menor o igual al interés, todo va a intereses
      if (amount <= interestAmount) {
        interestAmount = amount;
        amountToCapital = 0;
      } else {
        // Si el pago es mayor al interés, el excedente va al capital
        amountToCapital = amount - interestAmount;
      }
    }

    // Crear una transacción de gasto para el pago
    const transaction: Omit<Transaction, "id"> = {
      description: `Pago de deuda: ${debt.description}`,
      amount,
      type: "expense",
      category: "Deudas",
      date,
      notes:
        notes ||
        `Pago para deuda: ${debt.description}${
          interestAmount > 0 ? ` (Intereses: ${interestAmount.toFixed(2)})` : ""
        }`,
      recurrence: "none",
    };

    // Añadir la transacción
    const newTransaction = await addTransaction(transaction);

    // Actualizar la deuda con el nuevo saldo y la referencia a la transacción
    const remainingAmount = Math.max(0, debt.remainingAmount - amountToCapital);

    // Calcular próxima fecha de pago basada en la frecuencia
    const nextDate = new Date(date);

    // Aplicar la frecuencia correcta
    switch (debt.frequency || "monthly") {
      case "daily":
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case "biweekly":
        nextDate.setDate(nextDate.getDate() + 15);
        break;
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case "quarterly":
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case "yearly":
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }

    // Actualizar la deuda
    await updateDebt(debtId, {
      remainingAmount,
      nextPaymentDate:
        remainingAmount > 0 ? nextDate.toISOString() : debt.nextPaymentDate,
      linkedTransactions: [
        ...(debt.linkedTransactions || []),
        newTransaction.id,
      ],
    });

    return newTransaction;
  };

  // Función para obtener las deudas activas (con saldo pendiente)
  const getActiveDebts = () => {
    return state.debts.filter((debt) => debt.remainingAmount > 0);
  };

  // Función para obtener transacciones relacionadas con una deuda
  const getDebtTransactions = (debtId: string) => {
    const debt = state.debts.find((d) => d.id === debtId);
    if (!debt || !debt.linkedTransactions) return [];

    return state.transactions.filter((t) =>
      debt.linkedTransactions?.includes(t.id)
    );
  };

  // Función para obtener el total de pagos de una deuda
  const getDebtTotalPaid = (debtId: string) => {
    const transactions = getDebtTransactions(debtId);
    return transactions.reduce((total, t) => total + t.amount, 0);
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
    return getIncomes().reduce((acc, transaction) => {
      // Convertir a valor mensual según la frecuencia de recurrencia
      let monthlyValue = transaction.amount;
      if (transaction.recurrence) {
        switch (transaction.recurrence) {
          case "daily":
            monthlyValue = transaction.amount * 30; // Aproximado mensual
            break;
          case "weekly":
            monthlyValue = transaction.amount * 4.33; // Semanas promedio en un mes
            break;
          case "biweekly":
            monthlyValue = transaction.amount * 2; // Dos veces al mes
            break;
          case "quarterly":
            monthlyValue = transaction.amount / 3; // Un tercio por mes
            break;
          case "yearly":
            monthlyValue = transaction.amount / 12; // Un doceavo por mes
            break;
          // Para 'monthly' y 'none' se mantiene el valor original
        }
      }
      return acc + monthlyValue;
    }, 0);
  };

  const getTotalExpenses = () => {
    return getExpenses().reduce((acc, transaction) => {
      // Convertir a valor mensual según la frecuencia de recurrencia
      let monthlyValue = transaction.amount;
      if (transaction.recurrence) {
        switch (transaction.recurrence) {
          case "daily":
            monthlyValue = transaction.amount * 30; // Aproximado mensual
            break;
          case "weekly":
            monthlyValue = transaction.amount * 4.33; // Semanas promedio en un mes
            break;
          case "biweekly":
            monthlyValue = transaction.amount * 2; // Dos veces al mes
            break;
          case "quarterly":
            monthlyValue = transaction.amount / 3; // Un tercio por mes
            break;
          case "yearly":
            monthlyValue = transaction.amount / 12; // Un doceavo por mes
            break;
          // Para 'monthly' y 'none' se mantiene el valor original
        }
      }
      return acc + monthlyValue;
    }, 0);
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

  const createNotification = async (
    notification: Omit<Notification, "id" | "date" | "status">
  ) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notification),
      });
    } catch (error) {
      console.error("Error al crear notificación:", error);
    }
  };

  // Verificar presupuestos y enviar notificaciones si están por excederse
  const checkBudgetNotifications = async () => {
    try {
      const today = new Date();

      // Obtener todos los presupuestos con su porcentaje de uso
      const budgetsWithUsage = state.budgets.map((budget) => {
        const spent = getExpenses()
          .filter((expense) => expense.category === budget.category)
          .reduce((sum, expense) => sum + expense.amount, 0);

        const percentUsed = (spent / budget.amount) * 100;

        return {
          ...budget,
          spent,
          percentUsed,
        };
      });

      // Notificar presupuestos que superan el threshold pero no han sido notificados antes
      for (const budget of budgetsWithUsage) {
        if (
          budget.percentUsed >= state.settings.budgetThreshold &&
          budget.percentUsed < 100
        ) {
          await createNotification({
            title: "Alerta de Presupuesto",
            message: `Tu presupuesto para ${
              budget.category
            } está al ${Math.round(budget.percentUsed)}% del límite.`,
            type: "budget",
            reference: budget.id,
            referenceType: "budget",
          });
        } else if (budget.percentUsed >= 100) {
          await createNotification({
            title: "Presupuesto Excedido",
            message: `Has excedido tu presupuesto para ${
              budget.category
            } (${Math.round(budget.percentUsed)}%).`,
            type: "budget",
            reference: budget.id,
            referenceType: "budget",
          });
        }
      }
    } catch (error) {
      console.error("Error al verificar notificaciones de presupuesto:", error);
    }
  };

  // Verificar deudas con pagos próximos y enviar notificaciones
  const checkDebtNotifications = async () => {
    try {
      const today = new Date();
      const reminderDays = state.settings.reminderDays || 3;

      // Calcular la fecha límite para recordatorios (hoy + días de anticipación)
      const reminderDate = new Date(today);
      reminderDate.setDate(today.getDate() + reminderDays);

      // Filtrar deudas con pagos próximos
      const upcomingPayments = state.debts.filter((debt) => {
        if (debt.remainingAmount <= 0) return false;

        const paymentDate = new Date(debt.nextPaymentDate);
        return paymentDate <= reminderDate && paymentDate >= today;
      });

      // Crear notificaciones para cada pago próximo
      for (const debt of upcomingPayments) {
        const paymentDate = new Date(debt.nextPaymentDate);
        const daysUntilPayment = Math.ceil(
          (paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        let message = "";

        if (daysUntilPayment === 0) {
          message = `Tienes un pago de ${debt.monthlyPayment} para "${debt.description}" que vence hoy.`;
        } else if (daysUntilPayment === 1) {
          message = `Tienes un pago de ${debt.monthlyPayment} para "${debt.description}" que vence mañana.`;
        } else {
          message = `Tienes un pago de ${debt.monthlyPayment} para "${debt.description}" que vence en ${daysUntilPayment} días.`;
        }

        await createNotification({
          title: "Recordatorio de Pago",
          message,
          type: "payment",
          reference: debt.id,
          referenceType: "debt",
        });
      }
    } catch (error) {
      console.error("Error al verificar notificaciones de deudas:", error);
    }
  };

  // Funciones para el manejo de metas de ahorro
  const fetchSavingGoals = async () => {
    dispatch({ type: "FETCH_SAVING_GOALS_REQUEST" });
    try {
      const response = await fetch("/api/saving-goals");

      if (!response.ok) {
        throw new Error("Error al obtener metas de ahorro");
      }

      const data = await response.json();
      dispatch({ type: "FETCH_SAVING_GOALS_SUCCESS", payload: data });
    } catch (error: any) {
      console.error("Error al cargar metas de ahorro:", error);
      dispatch({
        type: "FETCH_SAVING_GOALS_FAILURE",
        payload: error.message || "Error al cargar metas de ahorro",
      });
    }
  };

  // Función para añadir una meta de ahorro
  const addSavingGoal = async (goal: Omit<SavingGoal, "id">) => {
    try {
      const response = await fetch("/api/saving-goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goal),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear la meta de ahorro");
      }

      const newGoal = await response.json();
      dispatch({ type: "ADD_SAVING_GOAL", payload: newGoal });

      toast({
        title: "Meta de ahorro creada",
        description: "La meta de ahorro se ha guardado correctamente.",
      });
    } catch (error: any) {
      console.error("Error al crear meta de ahorro:", error);
      toast({
        title: "Error",
        description: error.message || "Error al crear la meta de ahorro",
        variant: "destructive",
      });
    }
  };

  // Función para actualizar una meta de ahorro
  const updateSavingGoal = async (id: string, data: Partial<SavingGoal>) => {
    try {
      const response = await fetch(`/api/saving-goals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.message || "Error al actualizar la meta de ahorro"
        );
      }

      const updatedGoal = await response.json();
      dispatch({
        type: "UPDATE_SAVING_GOAL",
        payload: { id, data: updatedGoal },
      });

      toast({
        title: "Meta de ahorro actualizada",
        description: "La meta de ahorro se ha actualizado correctamente.",
      });
    } catch (error: any) {
      console.error("Error al actualizar meta de ahorro:", error);
      toast({
        title: "Error",
        description: error.message || "Error al actualizar la meta de ahorro",
        variant: "destructive",
      });
    }
  };

  // Función para eliminar una meta de ahorro
  const deleteSavingGoal = async (id: string) => {
    try {
      const response = await fetch(`/api/saving-goals/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar la meta de ahorro");
      }

      dispatch({ type: "DELETE_SAVING_GOAL", payload: id });

      toast({
        title: "Meta de ahorro eliminada",
        description: "La meta de ahorro se ha eliminado correctamente.",
      });
    } catch (error: any) {
      console.error("Error al eliminar meta de ahorro:", error);
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la meta de ahorro",
        variant: "destructive",
      });
    }
  };

  // Función para contribuir a una meta de ahorro (aumentar su monto actual)
  const contributeToSavingGoal = async (goalId: string, amount: number) => {
    try {
      // Buscar la meta de ahorro
      const goal = state.savingGoals.find((g) => g.id === goalId);
      if (!goal) {
        throw new Error("Meta de ahorro no encontrada");
      }

      // Calcular el nuevo monto actual
      const newCurrentAmount = goal.currentAmount + amount;

      // Determinar si la meta se ha completado
      const isCompleted = newCurrentAmount >= goal.targetAmount;

      // Actualizar la meta de ahorro
      await updateSavingGoal(goalId, {
        currentAmount: newCurrentAmount,
        status: isCompleted ? "completed" : goal.status,
      });

      // Crear una transacción de ahorro
      const transaction: Omit<Transaction, "id"> = {
        description: `Ahorro para: ${goal.name}`,
        amount,
        type: "expense", // Se considera un gasto porque es dinero que se aparta
        category: "Ahorro",
        date: new Date().toISOString(),
        notes: `Contribución a meta de ahorro: ${goal.name}`,
        recurrence: "none",
      };

      await addTransaction(transaction);

      // Mostrar notificación de éxito
      toast({
        title: "Contribución realizada",
        description: `Has contribuido $${amount} a tu meta "${goal.name}".`,
      });

      // Si se completó la meta, mostrar una notificación adicional
      if (isCompleted) {
        toast({
          title: "¡Meta completada!",
          description: `¡Felicidades! Has completado tu meta de ahorro "${goal.name}".`,
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error al contribuir a la meta de ahorro:", error);
      toast({
        title: "Error",
        description: error.message || "Error al contribuir a la meta de ahorro",
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
        addSavingGoal,
        updateSavingGoal,
        deleteSavingGoal,
        contributeToSavingGoal,
        getIncomes,
        getExpenses,
        getTotalBalance,
        getTotalIncome,
        getTotalExpenses,
        getUpcomingPayments,
        getTransactionsByCategory,
        fetchAllData,
        addDebtPayment,
        getActiveDebts,
        getDebtTransactions,
        getDebtTotalPaid,
        createNotification,
        checkBudgetNotifications,
        checkDebtNotifications,
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
