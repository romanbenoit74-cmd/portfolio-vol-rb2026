// Biome prop recipes by theme id (spec §5): vertical slice in phase 6, the 16 other biomes in phase 9 (4 batches).
import bath from './bath.js';
import kitchen from './kitchen.js';
import garden from './garden.js';
import volcano from './volcano.js';
import garage from './garage.js';
import office from './office.js';
import park from './park.js';
import attic from './attic.js';
import cellar from './cellar.js';
import greenhouse from './greenhouse.js';
import library from './library.js';
import nursery from './nursery.js';
import market from './market.js';
import gym from './gym.js';
import pool from './pool.js';
import lab from './lab.js';
import aquarium from './aquarium.js';
import candy from './candy.js';
import ice from './ice.js';
import desert from './desert.js';
import roof from './roof.js';

kitchen.looks.plant = bath.looks.plant; // the potted plant of the hand-made kitchen
export const RECIPES = { bathroom: bath, kitchen, garden, volcano, garage, office, park, attic, cellar, greenhouse, library, nursery, market, gym, pool, lab, aquarium, candy, ice, desert, roof };
