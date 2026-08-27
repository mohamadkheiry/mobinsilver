export const toman = (value: number) => `${new Intl.NumberFormat('fa-IR').format(value)} تومان`
export const persianDate = (value: string) => new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date(value))

export const categoryLabel: Record<string, string> = {
  all: 'همه محصولات',
  'silver-bar': 'شمش نقره',
  'silver-jewelry': 'زیورآلات نقره',
  'gold-bar': 'شمش طلا',
}
