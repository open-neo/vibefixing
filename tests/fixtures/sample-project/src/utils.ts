// Sample file with minor issues

import { unused } from "./nonexistent";

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function add(a: number, b: number) {
  return a + b;
}
