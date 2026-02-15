export function formatKRW(amount: number): string {
  return `\u20A9${amount.toLocaleString("ko-KR")}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR");
}
