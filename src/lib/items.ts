export type Rarity = "common" | "rare" | "epic" | "legendary";
export type ItemType = "character" | "ball" | "skill" | "accessory";

export interface GameItem {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  description: string;
  price: number;
  gemPrice?: number;
  color: string;
  icon: string;
}

export const CHARACTERS: GameItem[] = [
  { id:"default",  name:"Rookie",   type:"character", rarity:"common",    price:0,     color:"#e63946", icon:"⚽", description:"The starter — scrappy and hungry." },
  { id:"ninja",    name:"Ninja",    type:"character", rarity:"rare",      price:1200,  color:"#1a1a2e", icon:"🥷", description:"Silent but deadly on the pitch." },
  { id:"viking",   name:"Viking",   type:"character", rarity:"rare",      price:1500,  color:"#c0392b", icon:"⚔️", description:"Crushes defenders with brute force." },
  { id:"robot",    name:"Cyborg",   type:"character", rarity:"epic",      price:3000,  color:"#2563eb", icon:"🤖", description:"Precision-engineered for victory." },
  { id:"pharaoh",  name:"Pharaoh",  type:"character", rarity:"epic",      price:3500,  color:"#d4ac0d", icon:"👑", description:"Rules the pitch like an ancient god." },
  { id:"dragon",   name:"Dragon",   type:"character", rarity:"legendary", gemPrice:80, color:"#7c3aed", icon:"🐉", description:"Breathes fire into every shot." },
];

export const BALLS: GameItem[] = [
  { id:"classic", name:"Classic",  type:"ball", rarity:"common",    price:0,    color:"#fff",    icon:"⚽", description:"The original." },
  { id:"golden",  name:"Golden",   type:"ball", rarity:"rare",      price:800,  color:"#ffd700", icon:"🌕", description:"For those who shine." },
  { id:"fire",    name:"Fireball", type:"ball", rarity:"epic",      price:2500, color:"#ff4400", icon:"🔥", description:"Leaves a trail of flames." },
  { id:"galaxy",  name:"Galaxy",   type:"ball", rarity:"legendary", gemPrice:60,color:"#4c1d95", icon:"🌌", description:"Contains a small universe." },
];

export const SKILLS: GameItem[] = [
  { id:"power_shot", name:"Power Shot",  type:"skill", rarity:"rare",      price:1000, icon:"💥", description:"Triple kick power for 5 seconds.", color:"#ef4444" },
  { id:"turbo",      name:"Turbo",       type:"skill", rarity:"rare",      price:900,  icon:"⚡", description:"Blazing speed boost for 8 seconds.", color:"#f59e0b" },
  { id:"freeze",     name:"Freeze",      type:"skill", rarity:"epic",      price:2200, icon:"❄️", description:"Freezes the opponent for 3 seconds.", color:"#3b82f6" },
  { id:"tornado",    name:"Tornado",     type:"skill", rarity:"legendary", gemPrice:50,icon:"🌪️", description:"Spin kick that curves the ball.", color:"#8b5cf6" },
];

export const RARITY_COLORS: Record<Rarity, string> = {
  common:    "#94a3b8",
  rare:      "#3b82f6",
  epic:      "#a855f7",
  legendary: "#f59e0b",
};

export const RARITY_GLOW: Record<Rarity, string> = {
  common:    "rgba(148,163,184,0.3)",
  rare:      "rgba(59,130,246,0.4)",
  epic:      "rgba(168,85,247,0.5)",
  legendary: "rgba(245,158,11,0.6)",
};

export const ALL_ITEMS = [...CHARACTERS, ...BALLS, ...SKILLS];
