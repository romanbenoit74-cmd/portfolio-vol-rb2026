// Arsenal catalogue (spec §10), pure data. slot: 'arme' (key 2) | 'pouvoir' (key F); menace ★ 1..3; plan = needs a Plan
// found in a toy chest before it can be bought; phase = v1 (phase 8) | v2 (phase 10); live = playable in this build (all of them since phase 10). The Raquette is given away.
export const ITEMS = [
  { id: 'raquette', name: 'Raquette Zap', slot: 'arme', menace: 1, price: 0, phase: 'v1', live: true },
  { id: 'brumi', name: 'Brumisateur', slot: 'arme', menace: 1, price: 150, phase: 'v1', live: true },
  { id: 'pieges', name: 'Pièges Glu', slot: 'arme', menace: 1, price: 300, phase: 'v1', live: true },
  { id: 'jumeaux', name: 'Jumeaux Acides', slot: 'arme', menace: 2, price: 1200, phase: 'v1', live: true },
  { id: 'aspi', name: 'Aspirateur-Canon', slot: 'arme', menace: 2, price: 1800, phase: 'v2', live: true },
  { id: 'tapette', name: 'Tapette Titan', slot: 'arme', menace: 2, price: 1500, phase: 'v2', live: true },
  { id: 'citro', name: 'Lance-Citronnelle', slot: 'arme', menace: 3, price: 3500, plan: true, phase: 'v2', live: true },
  { id: 'doigt', name: 'Doigt-Canon', slot: 'pouvoir', menace: 1, price: 250, phase: 'v1', live: true },
  { id: 'grappin', name: 'Gomme-Grappin', slot: 'pouvoir', menace: 2, price: 1600, phase: 'v1', live: true },
  { id: 'tourbillon', name: 'Tourbillon de Paume', slot: 'pouvoir', menace: 2, price: 2000, phase: 'v2', live: true },
  { id: 'clap', name: 'Clap Sismique', slot: 'pouvoir', menace: 2, price: 1800, phase: 'v2', live: true },
  { id: 'toile', name: 'Lance-Toile', slot: 'pouvoir', menace: 2, price: 1700, phase: 'v2', live: true },
  { id: 'mille', name: 'Mille Claques', slot: 'pouvoir', menace: 3, price: 4000, plan: true, phase: 'v1', live: true },
  { id: 'onde', name: 'Onde Paume-à-Paume', slot: 'pouvoir', menace: 3, price: 5000, plan: true, phase: 'v2', live: true },
];
// Hand skins: slot 'mains', bought with coins like any item but kept out of ITEMS (no Menace, no weapon engine).
// c = { glove, sleeve, piping } colours of the gloves; the free default skin is always owned (never stored in `owned`).
export const DEFAULT_SKIN = 'classique';
export const SKINS = [
  { id: 'classique', name: 'Classique', slot: 'mains', menace: 0, price: 0, live: true, c: { glove: '#FFFFFF', sleeve: '#3A2E5C', piping: '#B7F34D' } },
  { id: 'cuisine', name: 'Gants de cuisine', slot: 'mains', menace: 0, price: 200, live: true, c: { glove: '#FFD84A', sleeve: '#E8553B', piping: '#FFFFFF' } },
  { id: 'bonbon', name: 'Rose bonbon', slot: 'mains', menace: 0, price: 350, live: true, c: { glove: '#FFB3D1', sleeve: '#8E4BC9', piping: '#FFFFFF' } },
  { id: 'ninja', name: 'Ombre ninja', slot: 'mains', menace: 0, price: 600, live: true, c: { glove: '#3B3B52', sleeve: '#C92A3A', piping: '#FF6B7A' } },
  { id: 'boxe', name: 'Gants de boxe', slot: 'mains', menace: 0, price: 800, live: true, c: { glove: '#E5322D', sleeve: '#FFFFFF', piping: '#FFD84A' } },
  { id: 'glace', name: 'Givre', slot: 'mains', menace: 0, price: 1200, live: true, c: { glove: '#BFEFFF', sleeve: '#2F6FB8', piping: '#FFFFFF' } },
  { id: 'lave', name: 'Magma', slot: 'mains', menace: 0, price: 1500, live: true, c: { glove: '#FF8A2B', sleeve: '#3A1F1F', piping: '#FFE066' } },
  { id: 'or', name: 'Mains en or', slot: 'mains', menace: 0, price: 3000, live: true, c: { glove: '#FFD35A', sleeve: '#6B3FA0', piping: '#FFFFFF' } },
  // with an accessory (`acc`, built in src/player/ViewModel.js ACC)
  { id: 'mitaine', name: 'Mitaines de four', slot: 'mains', menace: 0, price: 300, live: true, acc: 'mitaine', c: { glove: '#D9382B', sleeve: '#F5F0E6', piping: '#2A2045' } },
  { id: 'canard', name: 'Pattes de canard', slot: 'mains', menace: 0, price: 400, live: true, acc: 'canard', c: { glove: '#FF9A2E', sleeve: '#FF7A14', piping: '#FFFFFF' } },
  { id: 'chat', name: 'Pattes de chat', slot: 'mains', menace: 0, price: 500, live: true, acc: 'chat', c: { glove: '#FF9F4A', sleeve: '#FF9F4A', piping: '#FFFFFF' } },
  { id: 'squelette', name: 'Mains de squelette', slot: 'mains', menace: 0, price: 700, live: true, acc: 'squelette', c: { glove: '#F3EFE0', sleeve: '#1E1B2E', piping: '#F3EFE0' } },
  { id: 'homard', name: 'Pinces de homard', slot: 'mains', menace: 0, price: 900, live: true, acc: 'homard', c: { glove: '#E23B2E', sleeve: '#B3241A', piping: '#FFE9D0' } },
  { id: 'crochet', name: 'Capitaine Crochet', slot: 'mains', menace: 0, price: 1000, live: true, acc: 'crochet', c: { glove: '#F5EFE0', sleeve: '#B3232F', piping: '#F2C230' } },
  { id: 'robot', name: 'Mains de robot', slot: 'mains', menace: 0, price: 1100, live: true, acc: 'robot', c: { glove: '#AEB8CC', sleeve: '#4A5568', piping: '#7CF3FF' } },
  { id: 'araignee', name: 'Mains d’araignée', slot: 'mains', menace: 0, price: 1500, live: true, acc: 'araignee', c: { glove: '#D91E2A', sleeve: '#1B3E9E', piping: '#FFFFFF' } },
  { id: 'licorne', name: 'Licorne arc-en-ciel', slot: 'mains', menace: 0, price: 1800, live: true, acc: 'licorne', c: { glove: '#FFD9EC', sleeve: '#C9B8FF', piping: '#FFD35A' } },
];
const BY_ID = Object.fromEntries([...ITEMS, ...SKINS].map((i) => [i.id, i]));
export const item = (id) => BY_ID[id] || null;
/** A skin by id; unknown or missing -> the default one (a remote player's loadout is not trusted). */
export const skinOf = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
export const PLAN_IDS = ITEMS.filter((i) => i.plan).map((i) => i.id);
