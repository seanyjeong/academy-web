export function formatKRW(amount: number | undefined | null): string {
  return `\u20A9${(amount ?? 0).toLocaleString("ko-KR")}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("ko-KR");
}
