export type RecurrenceType =
  | "none"
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

// Mapeo de recurrencias en inglés a español
export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  none: "Sin recurrencia",
  daily: "Diaria",
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  quarterly: "Trimestral",
  yearly: "Anual",
};

// Función para traducir una recurrencia al español
export function getRecurrenceLabel(
  recurrence: RecurrenceType | string | null | undefined
): string {
  if (!recurrence || recurrence === "none") {
    return RECURRENCE_LABELS.none;
  }

  return RECURRENCE_LABELS[recurrence as RecurrenceType] || recurrence;
}

// Función para calcular la siguiente fecha basada en la recurrencia
export function getNextRecurrenceDate(
  baseDate: Date,
  recurrence: RecurrenceType
): Date {
  const nextDate = new Date(baseDate);

  switch (recurrence) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "biweekly":
      // Quincenal: día 15 y último día del mes
      return getNextBiweeklyDate(baseDate);
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "quarterly":
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // Para "none" o casos no reconocidos, no cambiar la fecha
      break;
  }

  return nextDate;
}

// Función específica para calcular la siguiente fecha quincenal (15 y último día del mes)
function getNextBiweeklyDate(baseDate: Date): Date {
  const currentDay = baseDate.getDate();
  const currentMonth = baseDate.getMonth();
  const currentYear = baseDate.getFullYear();

  // Obtener el último día del mes actual
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  if (currentDay < 15) {
    // Si estamos antes del 15, la siguiente fecha es el 15 del mismo mes
    return new Date(currentYear, currentMonth, 15);
  } else if (currentDay >= 15 && currentDay < lastDayOfMonth) {
    // Si estamos en o después del 15 pero antes del último día, la siguiente es el último día del mes
    return new Date(currentYear, currentMonth, lastDayOfMonth);
  } else {
    // Si estamos en el último día del mes, la siguiente es el 15 del próximo mes
    return new Date(currentYear, currentMonth + 1, 15);
  }
}

// Función para verificar si una transacción recurrente necesita ser generada
export function shouldGenerateRecurrentTransaction(
  lastTransactionDate: Date,
  recurrence: RecurrenceType,
  today: Date = new Date()
): boolean {
  if (recurrence === "none") return false;

  const nextExpectedDate = getNextRecurrenceDate(
    lastTransactionDate,
    recurrence
  );

  // Si la fecha esperada es hoy o ya pasó, debería generarse
  return nextExpectedDate <= today;
}

// Función para obtener todas las fechas futuras hasta una fecha límite
export function getFutureRecurrenceDates(
  startDate: Date,
  recurrence: RecurrenceType,
  limitDate: Date
): Date[] {
  if (recurrence === "none") return [];

  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= limitDate) {
    currentDate = getNextRecurrenceDate(currentDate, recurrence);
    if (currentDate <= limitDate) {
      dates.push(new Date(currentDate));
    }
  }

  return dates;
}

// Función para obtener todas las transacciones pendientes que deberían generarse
export function getPendingRecurrentTransactions(
  recurringTransactions: any[],
  existingTransactions: any[],
  today: Date = new Date()
): any[] {
  const pendingTransactions: any[] = [];

  for (const recurring of recurringTransactions) {
    if (recurring.recurrence === "none") continue;

    // Crear una clave única para identificar esta recurrencia específica
    const recurrenceKey = `${recurring.description}-${recurring.category}-${recurring.amount}-${recurring.type}-${recurring.recurrence}`;

    // Encontrar todas las transacciones que coinciden con esta recurrencia específica
    const relatedTransactions = existingTransactions
      .filter((t) => {
        const transactionKey = `${t.description}-${t.category}-${t.amount}-${t.type}-${t.recurrence}`;
        return transactionKey === recurrenceKey;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Ordenar por fecha ascendente

    // Fecha de inicio para generar transacciones
    const startDate = new Date(recurring.date);

    // Generar todas las fechas que deberían existir desde la fecha de inicio hasta hoy
    const expectedDates = generateExpectedDates(
      startDate,
      recurring.recurrence as RecurrenceType,
      today
    );

    // Filtrar fechas que ya tienen transacciones
    const existingDates = new Set(
      relatedTransactions.map((t) => new Date(t.date).toDateString())
    );

    // Crear transacciones para fechas faltantes
    for (const expectedDate of expectedDates) {
      if (!existingDates.has(expectedDate.toDateString())) {
        pendingTransactions.push({
          ...recurring,
          date: expectedDate.toISOString(),
          id: `pending-${recurring.id}-${expectedDate.getTime()}`, // ID temporal
          isPending: true,
        });
      }
    }
  }

  return pendingTransactions;
}

// Función para generar todas las fechas esperadas según la recurrencia
function generateExpectedDates(
  startDate: Date,
  recurrence: RecurrenceType,
  endDate: Date
): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  // No incluir la fecha de inicio si es la misma que ya existe
  while (currentDate <= endDate) {
    // Calcular la siguiente fecha
    currentDate = getNextRecurrenceDate(currentDate, recurrence);

    // Si la siguiente fecha es menor o igual a la fecha de fin, agregarla
    if (currentDate <= endDate) {
      dates.push(new Date(currentDate));
    }
  }

  return dates;
}
