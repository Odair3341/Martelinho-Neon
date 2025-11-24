import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Corrige o problema de timezone ao trabalhar com datas.
 * Como o input `date` do HTML5 já retorna a data no formato YYYY-MM-DD,
 * a função apenas garante que a string seja repassada corretamente.
 * @param dateString - String da data no formato YYYY-MM-DD
 * @returns A mesma string de data recebida.
 */
export function fixTimezoneDate(dateString: string): string {
  // Apenas retorna a string. A lógica anterior de conversão de fuso horário
  // estava causando bugs, pois `toISOString` converte para UTC, mudando o dia.
  // O formato do input `date` já é o `YYYY-MM-DD` esperado pelo Supabase.
  return dateString;
}

/**
 * Formata uma string de data (com ou sem timestamp) para o formato YYYY-MM-DD.
 * @param dateString - String da data (pode ser 'YYYY-MM-DD' ou 'YYYY-MM-DDTHH:mm:ssZ')
 * @returns String da data no formato YYYY-MM-DD.
 */
export function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return '';
  // Garante que retorne apenas a parte da data, removendo o timestamp se houver.
  return dateString.split('T')[0];
}
