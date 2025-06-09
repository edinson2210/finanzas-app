import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  ShoppingBag,
  Home,
  CreditCard,
  Building,
  Book,
  Plane,
  Coffee,
  Briefcase,
  Heart,
  Gift,
  ShoppingCart,
  Car,
  Zap,
  Film,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";

// Mapeo de iconos de categorías por nombre del icono
const ICON_MAP: Record<string, any> = {
  Home: Home,
  ShoppingCart: ShoppingCart,
  ShoppingBag: ShoppingBag,
  Car: Car,
  Zap: Zap,
  Film: Film,
  Briefcase: Briefcase,
  TrendingUp: TrendingUp,
  CircleDollarSign: CircleDollarSign,
  CreditCard: CreditCard,
  Building: Building,
  Book: Book,
  Plane: Plane,
  Coffee: Coffee,
  Heart: Heart,
  Gift: Gift,
  // Icono por defecto
  default: DollarSign,
};

/**
 * Obtiene el componente de icono para una categoría
 * @param iconName - Nombre del icono guardado en la base de datos
 * @returns Componente de icono de Lucide React
 */
export function getCategoryIcon(iconName?: string) {
  if (!iconName) return ICON_MAP.default;
  return ICON_MAP[iconName] || ICON_MAP.default;
}

/**
 * Obtiene datos completos de una categoría por nombre
 * @param categoryName - Nombre de la categoría
 * @param categories - Array de categorías del usuario
 * @returns Datos completos de la categoría o undefined
 */
export function getCategoryData(categoryName: string, categories: any[]) {
  return categories.find((cat) => cat.name === categoryName);
}

/**
 * Obtiene el icono de una categoría por su nombre
 * @param categoryName - Nombre de la categoría
 * @param categories - Array de categorías del usuario
 * @returns Componente de icono de Lucide React
 */
export function getCategoryIconByName(categoryName: string, categories: any[]) {
  const category = getCategoryData(categoryName, categories);
  return getCategoryIcon(category?.icon);
}

/**
 * Obtiene el color de una categoría por su nombre
 * @param categoryName - Nombre de la categoría
 * @param categories - Array de categorías del usuario
 * @returns Color en formato hexadecimal o color por defecto
 */
export function getCategoryColor(categoryName: string, categories: any[]) {
  const category = getCategoryData(categoryName, categories);
  return category?.color || "#3b82f6";
}
