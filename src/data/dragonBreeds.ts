// Auto-generated — do not edit manually

export interface DragonStats { hp:number; attack:number; defense:number; spAttack:number; spDefense:number; speed:number; }
export interface DragonBreed { id:string; breed:string; pokemonType:string; description:string; baseStats:DragonStats; sampleSize:number; }

export const dragonBreeds: DragonBreed[] = [
  {
    "id": "fire",
    "breed": "Fire Drake",
    "pokemonType": "fire",
    "description": "Masters of flame, breathing scorching fire.",
    "baseStats": {
      "hp": 69.8,
      "attack": 82.6,
      "defense": 66.8,
      "spAttack": 83.3,
      "spDefense": 69.5,
      "speed": 74.1
    },
    "sampleSize": 66
  },
  {
    "id": "ice",
    "breed": "Frost Wyrm",
    "pokemonType": "ice",
    "description": "Born of glacial peaks, exhaling blizzards.",
    "baseStats": {
      "hp": 75.7,
      "attack": 74.4,
      "defense": 73.8,
      "spAttack": 75.8,
      "spDefense": 75.0,
      "speed": 61.6
    },
    "sampleSize": 31
  },
  {
    "id": "dragon",
    "breed": "Elder Drake",
    "pokemonType": "dragon",
    "description": "Ancient and proud, purest lineage of dragonkind.",
    "baseStats": {
      "hp": 79.6,
      "attack": 99.0,
      "defense": 75.2,
      "spAttack": 78.5,
      "spDefense": 77.7,
      "speed": 80.2
    },
    "sampleSize": 37
  },
  {
    "id": "poison",
    "breed": "Acid Serpent",
    "pokemonType": "poison",
    "description": "Dissolves stone and steel with corrosive breath.",
    "baseStats": {
      "hp": 70.6,
      "attack": 75.5,
      "defense": 72.8,
      "spAttack": 67.3,
      "spDefense": 69.7,
      "speed": 70.4
    },
    "sampleSize": 42
  },
  {
    "id": "electric",
    "breed": "Storm Drake",
    "pokemonType": "electric",
    "description": "Lightning incarnate, their roar splits the sky.",
    "baseStats": {
      "hp": 64.8,
      "attack": 73.0,
      "defense": 62.1,
      "spAttack": 84.8,
      "spDefense": 66.6,
      "speed": 85.1
    },
    "sampleSize": 59
  },
  {
    "id": "dark",
    "breed": "Shadow Wyrm",
    "pokemonType": "dark",
    "description": "Creatures of dusk, hunting unseen in the dark.",
    "baseStats": {
      "hp": 75.8,
      "attack": 88.0,
      "defense": 71.6,
      "spAttack": 72.9,
      "spDefense": 70.8,
      "speed": 75.6
    },
    "sampleSize": 45
  },
  {
    "id": "ghost",
    "breed": "Specter Drake",
    "pokemonType": "ghost",
    "description": "Neither alive nor dead, passing through walls.",
    "baseStats": {
      "hp": 61.8,
      "attack": 68.6,
      "defense": 75.5,
      "spAttack": 84.1,
      "spDefense": 80.8,
      "speed": 60.3
    },
    "sampleSize": 35
  },
  {
    "id": "steel",
    "breed": "Iron Wyrm",
    "pokemonType": "steel",
    "description": "Scales harder than metal, impervious to weapons.",
    "baseStats": {
      "hp": 71.7,
      "attack": 88.0,
      "defense": 111.1,
      "spAttack": 71.8,
      "spDefense": 75.3,
      "speed": 57.2
    },
    "sampleSize": 36
  }
];
