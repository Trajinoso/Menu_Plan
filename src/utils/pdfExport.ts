import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DayPlan, Recipe, MealItem, WeeklyPlan, getRecipeCategories } from '../types';

export interface ExportPdfOptions {
  weekTitle: string;
  weekStart: string;
  weekEnd: string;
  weekDays: { date: string; dayName: string; dayNumber: number; isToday: boolean }[];
  planDays: Record<string, DayPlan>;
}

export function generateWeeklyMenuPdf(options: ExportPdfOptions) {
  const { weekTitle, weekStart, weekEnd, weekDays, planDays } = options;

  // Create A4 Landscape PDF for optimal 7-day grid visibility
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm

  // Colors
  const primaryGreen = [15, 82, 56]; // #0f5238
  const primaryLight = [238, 247, 242]; // #eef7f2
  const accentOrange = [155, 69, 0]; // #9b4500
  const textDark = [25, 28, 29]; // #191c1d
  const textMuted = [112, 121, 115]; // #707973
  const borderGray = [225, 227, 228]; // #e1e3e4

  // Top header banner background
  doc.setFillColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.roundedRect(12, 10, pageWidth - 24, 22, 3, 3, 'F');

  // Brand title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MENUMASTER', 18, 19);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(177, 240, 206);
  doc.text('PLANIFICADOR SEMANAL DE MENÚS Y RECETAS', 18, 26);

  // Week range on right side of banner
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(weekTitle, pageWidth - 18, 19, { align: 'right' });

  const generatedDateStr = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 240, 230);
  doc.text(`Impreso el ${generatedDateStr}`, pageWidth - 18, 26, { align: 'right' });

  // Metrics summary bar
  let totalMeals = 0;
  let totalCaloriesAll = 0;
  let plannedDaysCount = 0;

  weekDays.forEach((wd) => {
    const d = planDays[wd.date];
    const lunchCount = d?.lunch?.length || 0;
    const dinnerCount = d?.dinner?.length || 0;
    const breakfastCount = d?.breakfast?.length || 0;
    const dayMeals = lunchCount + dinnerCount + breakfastCount;
    if (dayMeals > 0) plannedDaysCount++;
    totalMeals += dayMeals;

    const dayKcal =
      (d?.breakfast || []).reduce((acc, m) => acc + (m.calories || 0), 0) +
      (d?.lunch || []).reduce((acc, m) => acc + (m.calories || 0), 0) +
      (d?.dinner || []).reduce((acc, m) => acc + (m.calories || 0), 0);
    totalCaloriesAll += dayKcal;
  });

  const avgKcalPerDay = plannedDaysCount > 0 ? Math.round(totalCaloriesAll / plannedDaysCount) : 0;

  // Sub-header stats row
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(12, 35, pageWidth - 24, 10, 2, 2, 'F');
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(12, 35, pageWidth - 24, 10, 2, 2, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Comidas Planificadas: ${totalMeals}`, 18, 41.5);
  doc.text(`Días con Menú: ${plannedDaysCount} de 7`, 80, 41.5);
  doc.text(`Promedio Calorías: ${avgKcalPerDay > 0 ? `${avgKcalPerDay} kcal/día` : 'N/A'}`, 140, 41.5);
  doc.setTextColor(primaryGreen[0], primaryGreen[1], primaryGreen[2]);
  doc.text('Consejo: Mantén este menú visible en la cocina o refrigerador', pageWidth - 18, 41.5, { align: 'right' });

  // Format table data for 7 days
  const tableHeaders = ['Comida', ...weekDays.map((wd) => `${wd.dayName.toUpperCase()}\n${wd.dayNumber}`)];

  // Helper to format meal slot content
  const formatSlotCell = (dateStr: string, slot: 'lunch' | 'dinner' | 'breakfast'): string => {
    const day = planDays[dateStr];
    const meals = day?.[slot] || [];
    if (meals.length === 0) return '—';
    return meals
      .map((m) => {
        const parts = [m.name];
        const sub: string[] = [];
        if (m.calories) sub.push(`${m.calories} kcal`);
        if (m.timeMinutes) sub.push(`${m.timeMinutes}m`);
        if (sub.length > 0) parts.push(`(${sub.join(', ')})`);
        return parts.join(' ');
      })
      .join('\n\n');
  };

  const formatCaloriesCell = (dateStr: string): string => {
    const day = planDays[dateStr];
    if (!day) return '0 kcal';
    const dayKcal =
      (day.breakfast || []).reduce((acc, m) => acc + (m.calories || 0), 0) +
      (day.lunch || []).reduce((acc, m) => acc + (m.calories || 0), 0) +
      (day.dinner || []).reduce((acc, m) => acc + (m.calories || 0), 0);
    return dayKcal > 0 ? `${dayKcal} kcal` : '—';
  };

  const hasAnyBreakfast = weekDays.some((wd) => (planDays[wd.date]?.breakfast || []).length > 0);

  const tableBody: string[][] = [];

  if (hasAnyBreakfast) {
    tableBody.push(['Desayuno', ...weekDays.map((wd) => formatSlotCell(wd.date, 'breakfast'))]);
  }

  tableBody.push([
    'Almuerzo',
    ...weekDays.map((wd) => formatSlotCell(wd.date, 'lunch'))
  ]);

  tableBody.push([
    'Cena',
    ...weekDays.map((wd) => formatSlotCell(wd.date, 'dinner'))
  ]);

  tableBody.push([
    'Total Kcal',
    ...weekDays.map((wd) => formatCaloriesCell(wd.date))
  ]);

  // Compute column widths: first column 25mm, remaining 7 columns evenly distributed
  const colWidth = (pageWidth - 24 - 25) / 7;

  autoTable(doc, {
    startY: 48,
    margin: { left: 12, right: 12 },
    head: [tableHeaders],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: primaryGreen as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      cellPadding: 2.5
    },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      valign: 'top',
      lineColor: borderGray as [number, number, number],
      lineWidth: 0.2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: {
        cellWidth: 25,
        fontStyle: 'bold',
        fillColor: [248, 249, 250],
        textColor: primaryGreen as [number, number, number],
        valign: 'middle',
        halign: 'center'
      },
      1: { cellWidth: colWidth },
      2: { cellWidth: colWidth },
      3: { cellWidth: colWidth },
      4: { cellWidth: colWidth },
      5: { cellWidth: colWidth },
      6: { cellWidth: colWidth },
      7: { cellWidth: colWidth }
    },
    didParseCell: (data) => {
      // Highlight "Total Kcal" row
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fillColor = primaryLight as [number, number, number];
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = accentOrange as [number, number, number];
        data.cell.styles.halign = 'center';
      }
    }
  });

  // Footer notes & page number
  const finalY = (doc as any).lastAutoTable?.finalY || 180;
  
  if (finalY < pageHeight - 18) {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      'Documento generado automáticamente por MenuMaster. Los valores calóricos y tiempos son estimaciones.',
      14,
      pageHeight - 8
    );
    doc.text(`MenuMaster • ${weekTitle}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
  }

  // Trigger download with sanitized filename
  const cleanTitle = weekTitle.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`MenuMaster_${cleanTitle}.pdf`);
}
