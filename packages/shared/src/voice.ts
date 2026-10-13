import { PRODUCTS, Product } from './catalogue';
const NUMWORDS: Record<string, number> = { one:1,two:2,three:3,four:4,five:5,half:0.5,oru:1,rendu:2,moonu:3,naalu:4,anju:5,'ஒரு':1,'ஒன்று':1,'இரண்டு':2,'ரெண்டு':2,'மூன்று':3,'நான்கு':4,'ஐந்து':5,'அரை':0.5 };
export interface ParsedItem { product: Product; qty: number }
/** Keyword-based parser (prototype). Real AI/NLU comes later. */
export function parseOrder(text: string): { items: ParsedItem[]; unknown: string[] } {
  const parts = text.toLowerCase().split(/,|\band\b|\bum\b|மற்றும்|\n/).map(s => s.trim()).filter(Boolean);
  const items: ParsedItem[] = [], unknown: string[] = [];
  for (const part of parts) {
    const product = PRODUCTS.find(p => p.kw.some(k => part.includes(k)));
    if (!product) { unknown.push(part); continue; }
    let qty = 1; const m = part.match(/(\d+(\.\d+)?)/);
    if (m) qty = parseFloat(m[1]);
    else for (const [w, n] of Object.entries(NUMWORDS)) if (part.split(/\s+/).includes(w)) { qty = n; break; }
    items.push({ product, qty });
  }
  return { items, unknown };
}
