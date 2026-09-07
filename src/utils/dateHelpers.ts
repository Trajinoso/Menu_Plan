// Fuente única de verdad para fechas, calendarios y localización en español

export const SPANISH_DAYS_FULL = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

export const SPANISH_DAYS_ORDERED = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
];

export const SPANISH_MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

/**
 * Retorna la fecha actual en formato ISO local: YYYY-MM-DD
 */
export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Convierte un objeto Date a formato ISO YYYY-MM-DD
 */
export function toISOString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface WeekDayInfo {
  date: string; // YYYY-MM-DD
  dayName: string; // Lunes, Martes, etc.
  dayNumber: number; // 1-31
  isToday: boolean;
}

/**
 * Retorna las 7 fechas de la semana actual (Lunes a Domingo) en torno a la fecha provista (o hoy).
 */
export function getCurrentWeekDates(referenceDate: Date = new Date()): WeekDayInfo[] {
  const todayStr = getTodayISO();
  const d = new Date(referenceDate);
  // getDay(): 0 = Domingo, 1 = Lunes, ... 6 = Sábado
  const dayOfWeek = d.getDay();
  // Distancia hacia el lunes (si es domingo=0, restar 6; si no, restar dayOfWeek - 1)
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(d);
  monday.setDate(d.getDate() + distanceToMonday);

  const week: WeekDayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const dateStr = toISOString(current);
    const dayName = SPANISH_DAYS_ORDERED[i];
    week.push({
      date: dateStr,
      dayName,
      dayNumber: current.getDate(),
      isToday: dateStr === todayStr
    });
  }

  return week;
}

/**
 * Retorna el nombre formateado de Mes y Año (ej. "Septiembre 2026")
 */
export function formatMonthYear(d: Date = new Date()): string {
  const monthName = SPANISH_MONTHS[d.getMonth()];
  return `${monthName} ${d.getFullYear()}`;
}

/**
 * Retorna el rango de fechas formateado (ej. "7 al 13 de Septiembre")
 */
export function formatWeekRange(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return '';
  const [sYear, sMonth, sDay] = startDateStr.split('-').map(Number);
  const [eYear, eMonth, eDay] = endDateStr.split('-').map(Number);

  const sMonthName = SPANISH_MONTHS[sMonth - 1] || '';
  const eMonthName = SPANISH_MONTHS[eMonth - 1] || '';

  if (sMonth === eMonth && sYear === eYear) {
    return `${sDay} al ${eDay} de ${sMonthName}`;
  }
  return `${sDay} de ${sMonthName} al ${eDay} de ${eMonthName}`;
}

/**
 * Obtiene el nombre del día para una fecha ISO dada
 */
export function getDayNameFromISO(dateStr: string): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return 'Día';
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return SPANISH_DAYS_FULL[d.getDay()] || 'Día';
}
