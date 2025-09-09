import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Corrige o problema de timezone ao trabalhar com datas
 * Garante que a data seja interpretada no timezone local
 * @param dateString - String da data no formato YYYY-MM-DD
 * @returns String da data corrigida no formato YYYY-MM-DD
 */
export function fixTimezoneDate(dateString: string): string {
  if (!dateString) return dateString;
  
  // Se a data já está no formato correto YYYY-MM-DD, retorna como está
  // para evitar problemas de conversão de timezone
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  
  // Cria uma data no timezone local para evitar problemas de UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const localDate = new Date(year, month - 1, day);
  
  // Retorna a data no formato YYYY-MM-DD
  return localDate.toISOString().split('T')[0];
}

/**
 * Converte uma data do banco para o formato do input date
 * @param dateString - String da data (pode incluir timestamp)
 * @returns String da data no formato YYYY-MM-DD
 */
export function formatDateForInput(dateString: string): string {
  if (!dateString) return '';
  
  // Se a data já está no formato correto, retorna como está
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  
  // Se tem timestamp, pega apenas a parte da data
  return dateString.split('T')[0];
}
