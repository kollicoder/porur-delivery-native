export type Category = 'grocery' | 'fv' | 'med';
export interface Store { id: string; name: string; cat: Category; type: string; eta: string; rating: number; open: string; commission: number; }
export interface Product { id: string; store: string; cat: Category; name: string; ta: string; unit: string; price: number; emoji: string; kw: string[]; rx?: boolean; }

export const CATEGORIES = [
  { id: 'grocery', label: 'Groceries', ta: 'மளிகை', emoji: '🛒', color: '#fff3d6' },
  { id: 'fv', label: 'Fruits & Veg', ta: 'பழம் & காய்கறி', emoji: '🥕', color: '#e3f7e3' },
  { id: 'med', label: 'Medicines', ta: 'மருந்துகள்', emoji: '💊', color: '#e3eeff' },
  { id: 'rider', label: 'Book a Rider', ta: 'ரைடர் புக்', emoji: '🛵', color: '#ffe4e4' },
] as const;

export const STORES: Store[] = [
  { id: 's1', name: 'Porur Fresh Fruits & Veg', cat: 'fv', type: 'Fruits & Veg vendor', eta: '20-30 min', rating: 4.5, open: '5 AM – 11 PM', commission: 12 },
  { id: 's2', name: 'Sri Murugan Supermarket', cat: 'grocery', type: 'Supermarket', eta: '25-35 min', rating: 4.3, open: '24 x 7 (via hub)', commission: 10 },
  { id: 's3', name: 'Porur Pharmacy (tie-up)', cat: 'med', type: 'Licensed pharmacy', eta: '20-30 min', rating: 4.7, open: '24 x 7', commission: 8 },
];

export const PRODUCTS: Product[] = [
  { id:'p1', store:'s1', cat:'fv', name:'Tomato', ta:'தக்காளி', unit:'kg', price:32, emoji:'🍅', kw:['tomato','thakkali','தக்காளி'] },
  { id:'p2', store:'s1', cat:'fv', name:'Onion', ta:'வெங்காயம்', unit:'kg', price:38, emoji:'🧅', kw:['onion','vengayam','வெங்காயம்'] },
  { id:'p3', store:'s1', cat:'fv', name:'Potato', ta:'உருளைக்கிழங்கு', unit:'kg', price:35, emoji:'🥔', kw:['potato','urulai','உருளை'] },
  { id:'p4', store:'s1', cat:'fv', name:'Banana (Robusta)', ta:'வாழைப்பழம்', unit:'dozen', price:60, emoji:'🍌', kw:['banana','vazhaipazham','வாழைப்பழம்'] },
  { id:'p5', store:'s1', cat:'fv', name:'Apple (Shimla)', ta:'ஆப்பிள்', unit:'kg', price:180, emoji:'🍎', kw:['apple','ஆப்பிள்'] },
  { id:'p6', store:'s1', cat:'fv', name:'Coriander', ta:'கொத்தமல்லி', unit:'bunch', price:10, emoji:'🌿', kw:['coriander','kothamalli','கொத்தமல்லி'] },
  { id:'p7', store:'s2', cat:'grocery', name:'Aavin Milk (Toned)', ta:'பால்', unit:'litre', price:44, emoji:'🥛', kw:['milk','paal','பால்'] },
  { id:'p8', store:'s2', cat:'grocery', name:'Ponni Rice', ta:'அரிசி', unit:'kg', price:62, emoji:'🍚', kw:['rice','arisi','அரிசி'] },
  { id:'p9', store:'s2', cat:'grocery', name:'Toor Dal', ta:'துவரம் பருப்பு', unit:'kg', price:150, emoji:'🫘', kw:['dal','paruppu','பருப்பு'] },
  { id:'p10', store:'s2', cat:'grocery', name:'Eggs', ta:'முட்டை', unit:'dozen', price:84, emoji:'🥚', kw:['egg','muttai','முட்டை'] },
  { id:'p11', store:'s2', cat:'grocery', name:'Bread', ta:'ரொட்டி', unit:'pack', price:45, emoji:'🍞', kw:['bread','rotti','ரொட்டி'] },
  { id:'p12', store:'s2', cat:'grocery', name:'Sunflower Oil', ta:'எண்ணெய்', unit:'litre', price:155, emoji:'🛢️', kw:['oil','ennai','எண்ணெய்'] },
  { id:'p13', store:'s2', cat:'grocery', name:'Sugar', ta:'சர்க்கரை', unit:'kg', price:46, emoji:'🧂', kw:['sugar','sakkarai','சர்க்கரை'] },
  { id:'p14', store:'s3', cat:'med', name:'Paracetamol 500mg (10 tabs)', ta:'பாராசிட்டமால்', unit:'strip', price:20, emoji:'💊', kw:['paracetamol','dolo','crocin','பாராசிட்டமால்'] },
  { id:'p15', store:'s3', cat:'med', name:'ORS Sachet', ta:'ஓஆர்எஸ்', unit:'sachet', price:22, emoji:'🧃', kw:['ors'] },
  { id:'p16', store:'s3', cat:'med', name:'Amoxicillin 500mg (Rx)', ta:'அமாக்ஸிசிலின்', unit:'strip', price:95, emoji:'💊', kw:['amoxicillin'], rx:true },
  { id:'p17', store:'s3', cat:'med', name:'Band-aid (20 pcs)', ta:'பேண்டேஜ்', unit:'pack', price:50, emoji:'🩹', kw:['bandaid','band-aid','plaster'] },
  { id:'p18', store:'s3', cat:'med', name:'Digital Thermometer', ta:'தெர்மாமீட்டர்', unit:'piece', price:199, emoji:'🌡️', kw:['thermometer','தெர்மாமீட்டர்'] },
];
export const productById = (id: string) => PRODUCTS.find(p => p.id === id);
