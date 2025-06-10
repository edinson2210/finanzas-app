# Changelog

## [Unreleased]

### Added

- Toggle en Dashboard para alternar entre vista mensual y histórica
- Nuevas funciones en el contexto financiero:
  - `getCurrentMonthIncome()`: Obtiene ingresos del mes actual
  - `getCurrentMonthExpenses()`: Obtiene gastos del mes actual
  - `getCurrentMonthBalance()`: Calcula balance del mes actual
- Indicador visual que muestra el período de datos actualmente visible
- Títulos dinámicos en las tarjetas del dashboard según el modo de vista

### Changed

- Dashboard ahora muestra por defecto datos del mes actual en lugar de totales históricos
- Las tarjetas de Balance, Ingresos y Gastos ahora tienen títulos y descripciones dinámicas
- Mejorada la experiencia de usuario con indicadores claros del período visualizado

### Technical Details

- Agregado componente ToggleGroup para alternar entre vistas
- Implementadas funciones de filtrado por fecha en el finance-context
- Mantiene compatibilidad con todas las funcionalidades existentes
