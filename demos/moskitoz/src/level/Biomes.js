// "Gomme & Encre" palettes (spec §3.5), taken as-is from concept/js/palettes.js. Pure data (no three), tested by node --test.
// Every biome: wall/floor (+ second tone for motifs), one accent, its ink, the air (background/fog), light tints.
// Extra keys used by the game: trim (baseboards, default white), ceil (ceiling, default = wall lightened), fog ([near, far] in room sizes),
// light ([key, hemisphere] intensities for dark biomes whose ambient would otherwise wash everything out), floorScale (motif size on the floor).

export const SIGNAL = {
  ink: '#1E1633', acid: '#B8F53A', acidCore: '#F4FFB0', coral: '#FF5B4A', gold: '#FFC62E',
  bronze: '#E8904A', silver: '#DCE6F2', sky: '#4FC3FF', violet: '#9B6BFF', paper: '#FFFFFF',
};

const B = (id, name, o) => ({ id, name, indoor: true, key: '#FFF4E2', hemiSky: '#EAF2FF', hemiGround: '#B9B0D8', ...o });

export const BIOMES = [
  B('bathroom', 'Salle de bain', { wall: '#9EDDEB', wall2: '#86CFE0', wallMotif: 'grid', floor: '#F3F0E4', floor2: '#E4DECB', floorMotif: 'grid', accent: '#FFD23F', ink: '#173344', air: '#DDF4FA', hemiGround: '#9CC4D6' }),
  B('kitchen', 'Cuisine', { ceil: '#FFF8EA', wall: '#FFE08A', wall2: '#FFD36A', wallMotif: 'stripes', floor: '#F26B5B', floor2: '#FFF3DC', floorMotif: 'checker', accent: '#5BC8A8', ink: '#3A1E1A', air: '#FFF0CF', hemiGround: '#E5A98A' }),
  B('garden', 'Jardin', { trim: '#A0704C', indoor: false, wall: '#56C46A', wall2: '#4AB15D', wallMotif: 'dots', floor: '#8FDB63', floor2: '#7FCB55', floorMotif: 'stripes', floorScale: 2.2, accent: '#FF7FA8', ink: '#1F3A22', air: '#BFE8FF', sky: '#8CD2FF', hemiSky: '#E4F4FF', hemiGround: '#7FB866' }),
  B('garage', 'Garage', { wall: '#C7D2E0', wall2: '#B5C1D1', wallMotif: 'grid', floor: '#98A4B6', floor2: '#8A96A8', floorMotif: 'grid', accent: '#FFB21F', ink: '#1F2633', air: '#DDE4EE' }),
  B('office', 'Bureau', { wall: '#CAD7FF', wall2: '#B8C7F5', wallMotif: 'stripes', floor: '#7C8DE3', floor2: '#7082D8', floorMotif: 'dots', accent: '#FF8A5B', ink: '#1C2150', air: '#E6ECFF' }),
  B('park', 'Parc', { trim: '#A0704C', indoor: false, wall: '#3FB352', wall2: '#37A049', wallMotif: 'dots', floor: '#93E06A', floor2: '#86D25E', floorMotif: 'none', accent: '#FFCF3F', ink: '#1B3A20', air: '#C4EBFF', sky: '#94D8FF', hemiSky: '#E4F4FF', hemiGround: '#7FB866' }),
  B('attic', 'Grenier', { trim: '#FFF0D0', ceil: '#B87C48', wall: '#DDAA74', wall2: '#CF9A64', wallMotif: 'planks', floor: '#C98E54', floor2: '#B97E46', floorMotif: 'planks', accent: '#7AC7E8', ink: '#3A2213', air: '#F5DDBA', key: '#FFE8C4' }),
  B('cellar', 'Cave', { trim: '#D8F8E8', ceil: '#7AB8A0', fog: [1.0, 3.4], wall: '#8FC8B3', wall2: '#80B9A4', wallMotif: 'grid', floor: '#6AA890', floor2: '#5E9A83', floorMotif: 'grid', accent: '#FFC85A', ink: '#14302A', air: '#A9DCC7' }),
  B('greenhouse', 'Serre', { wall: '#BFF2DD', wall2: '#A8E6CC', wallMotif: 'grid', floor: '#E4DAB8', floor2: '#D8CCA6', floorMotif: 'grid', accent: '#FF6F61', ink: '#1D3B2C', air: '#E0FFF2' }),
  B('library', 'Bibliothèque', { trim: '#FFE8C0', ceil: '#D09868', wall: '#C4804F', wall2: '#B47244', wallMotif: 'planks', floor: '#C44A6A', floor2: '#B43F5E', floorMotif: 'dots', accent: '#F7D774', ink: '#33170F', air: '#F3D2A8', key: '#FFE6BF' }),
  B('nursery', "Chambre d'enfant", { wall: '#FFC8E2', wall2: '#FFB6D8', wallMotif: 'stripes', floor: '#8ED8FF', floor2: '#7CCBF5', floorMotif: 'dots', accent: '#FFB84A', ink: '#3B1D40', air: '#FFEAF4' }),
  B('market', 'Supermarché', { wall: '#FFF3B8', wall2: '#FFEA9A', wallMotif: 'none', floor: '#3AA0E0', floor2: '#F4F8FF', floorMotif: 'checker', accent: '#E84A4A', ink: '#1A2A40', air: '#FFF8DC' }),
  B('gym', 'Gymnase', { wall: '#FFBA6E', wall2: '#F5AA5C', wallMotif: 'stripes', floor: '#E8B070', floor2: '#DDA262', floorMotif: 'planks', accent: '#4A7AE8', ink: '#3A1F0E', air: '#FFE6C4' }),
  B('pool', 'Piscine', { wall: '#7FE6F6', wall2: '#6CD8EA', wallMotif: 'grid', floor: '#38B8EE', floor2: '#2FA8DE', floorMotif: 'grid', accent: '#FFE04A', ink: '#0E2F45', air: '#CCF4FC' }),
  B('lab', 'Laboratoire', { wall: '#E6F6F0', wall2: '#D6ECE4', wallMotif: 'grid', floor: '#A8D8C8', floor2: '#98CCBA', floorMotif: 'grid', accent: '#7CFF6B', ink: '#183A32', air: '#EAFBF4' }),
  B('aquarium', 'Aquarium', { ceil: '#3A64C8', fog: [0.8, 3.0], wall: '#4A86E8', wall2: '#3F78D8', wallMotif: 'dots', floor: '#8ABCF0', floor2: '#7AAEE6', floorMotif: 'none', accent: '#FF9F6B', ink: '#0C1F4A', air: '#3E78D6', key: '#DDEBFF', hemiGround: '#2F5BB0' }),
  B('candy', 'Bonbons', { wall: '#FF9CCC', wall2: '#FF88BF', wallMotif: 'stripes', floor: '#FF6EAC', floor2: '#FFE3F0', floorMotif: 'checker', accent: '#8AF0D4', ink: '#4A0F2E', air: '#FFD6EA' }),
  B('ice', 'Igloo', { wall: '#D6F2FF', wall2: '#C4EAFC', wallMotif: 'grid', floor: '#A6DEFC', floor2: '#96D2F4', floorMotif: 'none', accent: '#FF7A5C', ink: '#1A3A55', air: '#E6F7FF', key: '#F4FAFF' }),
  B('desert', 'Pyramide', { trim: '#FFE6A8', ceil: '#DCB464', wall: '#F2D494', wall2: '#E8C680', wallMotif: 'grid', floor: '#EAC878', floor2: '#DDB866', floorMotif: 'none', accent: '#34C0B0', ink: '#3D2A0E', air: '#FFE8B0', key: '#FFEFCF' }),
  B('volcano', 'Volcan', { trim: '#4E1F1A', ceil: '#3E1914', fog: [0.7, 2.6], light: [1.9, 1.05], wall: '#6E2E26', wall2: '#5E251F', wallMotif: 'none', floor: '#5A2C28', floor2: '#4C2420', floorMotif: 'none', accent: '#FF7A2E', ink: '#12060A', air: '#4A1A16', key: '#FFC49A', hemiSky: '#FF9A6A', hemiGround: '#3A1010' }),
];
export const ROOF = B('roof', 'Toit', { indoor: false, wall: '#ECE6D6', wall2: '#E0D9C6', wallMotif: 'none', floor: '#B4BCC8', floor2: '#A8B0BE', floorMotif: 'grid', accent: '#FFC62E', ink: '#1E2433', air: '#CFEAFF', sky: '#8CD2FF' });
// the trophy hall under floor 0 (not a playable biome): plum velvet, cream marble, gold
export const HALL = B('hall', 'Salle des trophées', { trim: '#FFC62E', ceil: '#24163F', fog: [1.4, 4], light: [2.3, 1.25], wall: '#3B2465', wall2: '#33205A', wallMotif: 'stripes', floor: '#F4E7C6', floor2: '#3A2466', floorMotif: 'checker', floorScale: 2, accent: '#FFC62E', ink: '#1A0F33', air: '#2A1A4A', key: '#FFE6B0', hemiSky: '#C9B4FF', hemiGround: '#3A2466' });
export const biome = (id) => BIOMES.find((b) => b.id === id) || (id === 'hall' ? HALL : ROOF);
