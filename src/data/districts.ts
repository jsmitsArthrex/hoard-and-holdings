// Auto-generated — do not edit manually

export type LairSize = 'small' | 'medium' | 'large' | 'grand';
export interface Property { id:string; name:string; goldPrice:number; lairSize:LairSize; dangerRating:number; distanceFromCity:number; owned:boolean; }
export interface District { id:string; name:string; properties:Property[]; }

export const districts: District[] = [
  {
    "id": "district_00",
    "name": "Ashveil Peaks",
    "properties": [
      {
        "id": "prop_00_00",
        "name": "Cinderspire Hold",
        "goldPrice": 240,
        "lairSize": "large",
        "dangerRating": 1,
        "distanceFromCity": 4.09,
        "owned": false
      },
      {
        "id": "prop_00_01",
        "name": "The Drowned Vault",
        "goldPrice": 216,
        "lairSize": "large",
        "dangerRating": 1,
        "distanceFromCity": 4.97,
        "owned": false
      },
      {
        "id": "prop_00_02",
        "name": "Ironmaw Bastion",
        "goldPrice": 347,
        "lairSize": "grand",
        "dangerRating": 1,
        "distanceFromCity": 4.97,
        "owned": false
      },
      {
        "id": "prop_00_03",
        "name": "Shadowfen Delve",
        "goldPrice": 334,
        "lairSize": "large",
        "dangerRating": 1,
        "distanceFromCity": 6.06,
        "owned": false
      },
      {
        "id": "prop_00_04",
        "name": "Frostpeak Sanctum",
        "goldPrice": 362,
        "lairSize": "grand",
        "dangerRating": 1,
        "distanceFromCity": 6.06,
        "owned": false
      }
    ]
  },
  {
    "id": "district_01",
    "name": "Mirewood Fens",
    "properties": [
      {
        "id": "prop_01_00",
        "name": "Stormbreak Keep",
        "goldPrice": 287,
        "lairSize": "large",
        "dangerRating": 1,
        "distanceFromCity": 6.06,
        "owned": false
      },
      {
        "id": "prop_01_01",
        "name": "Embercrag Tower",
        "goldPrice": 229,
        "lairSize": "medium",
        "dangerRating": 1,
        "distanceFromCity": 5.56,
        "owned": false
      },
      {
        "id": "prop_01_02",
        "name": "Bonewood Hollow",
        "goldPrice": 271,
        "lairSize": "medium",
        "dangerRating": 1,
        "distanceFromCity": 5.95,
        "owned": false
      },
      {
        "id": "prop_01_03",
        "name": "Dreadstone Fortress",
        "goldPrice": 165,
        "lairSize": "medium",
        "dangerRating": 2,
        "distanceFromCity": 6.08,
        "owned": false
      },
      {
        "id": "prop_01_04",
        "name": "Ashfall Lair",
        "goldPrice": 189,
        "lairSize": "medium",
        "dangerRating": 1,
        "distanceFromCity": 6.59,
        "owned": false
      }
    ]
  },
  {
    "id": "district_02",
    "name": "The Bone Coast",
    "properties": [
      {
        "id": "prop_02_00",
        "name": "Blackspire Crypt",
        "goldPrice": 150,
        "lairSize": "grand",
        "dangerRating": 2,
        "distanceFromCity": 6.35,
        "owned": false
      },
      {
        "id": "prop_02_01",
        "name": "Serpent's Maw",
        "goldPrice": 189,
        "lairSize": "medium",
        "dangerRating": 1,
        "distanceFromCity": 6.23,
        "owned": false
      },
      {
        "id": "prop_02_02",
        "name": "Crimson Delve",
        "goldPrice": 217,
        "lairSize": "medium",
        "dangerRating": 1,
        "distanceFromCity": 5.45,
        "owned": false
      },
      {
        "id": "prop_02_03",
        "name": "Gilded Peak Hold",
        "goldPrice": 204,
        "lairSize": "medium",
        "dangerRating": 3,
        "distanceFromCity": 4.71,
        "owned": false
      },
      {
        "id": "prop_02_04",
        "name": "Murktide Den",
        "goldPrice": 182,
        "lairSize": "medium",
        "dangerRating": 3,
        "distanceFromCity": 4.46,
        "owned": false
      }
    ]
  },
  {
    "id": "district_03",
    "name": "Cindermoor Wastes",
    "properties": [
      {
        "id": "prop_03_00",
        "name": "Stonewarden Refuge",
        "goldPrice": 199,
        "lairSize": "medium",
        "dangerRating": 3,
        "distanceFromCity": 4.5,
        "owned": false
      },
      {
        "id": "prop_03_01",
        "name": "Duskwall Keep",
        "goldPrice": 231,
        "lairSize": "medium",
        "dangerRating": 4,
        "distanceFromCity": 4.5,
        "owned": false
      },
      {
        "id": "prop_03_02",
        "name": "The Ruined Bastion",
        "goldPrice": 175,
        "lairSize": "medium",
        "dangerRating": 3,
        "distanceFromCity": 4.26,
        "owned": false
      },
      {
        "id": "prop_03_03",
        "name": "Thornwall Cavern",
        "goldPrice": 202,
        "lairSize": "small",
        "dangerRating": 3,
        "distanceFromCity": 3.8,
        "owned": false
      },
      {
        "id": "prop_03_04",
        "name": "Ancient Wyrm's Tomb",
        "goldPrice": 182,
        "lairSize": "medium",
        "dangerRating": 3,
        "distanceFromCity": 3.8,
        "owned": false
      }
    ]
  },
  {
    "id": "district_04",
    "name": "The Frozen Ramparts",
    "properties": [
      {
        "id": "prop_04_00",
        "name": "Scorch Hollow",
        "goldPrice": 136,
        "lairSize": "medium",
        "dangerRating": 4,
        "distanceFromCity": 3.8,
        "owned": false
      },
      {
        "id": "prop_04_01",
        "name": "The Iron Warren",
        "goldPrice": 196,
        "lairSize": "medium",
        "dangerRating": 3,
        "distanceFromCity": 4.01,
        "owned": false
      },
      {
        "id": "prop_04_02",
        "name": "Gloamhaven Spire",
        "goldPrice": 152,
        "lairSize": "medium",
        "dangerRating": 4,
        "distanceFromCity": 3.98,
        "owned": false
      },
      {
        "id": "prop_04_03",
        "name": "Ravenstone Keep",
        "goldPrice": 145,
        "lairSize": "medium",
        "dangerRating": 3,
        "distanceFromCity": 4.1,
        "owned": false
      },
      {
        "id": "prop_04_04",
        "name": "Dustmaw Delve",
        "goldPrice": 156,
        "lairSize": "medium",
        "dangerRating": 3,
        "distanceFromCity": 4.4,
        "owned": false
      }
    ]
  },
  {
    "id": "district_05",
    "name": "Saltmarsh Hollows",
    "properties": [
      {
        "id": "prop_05_00",
        "name": "The Pale Vault",
        "goldPrice": 139,
        "lairSize": "medium",
        "dangerRating": 3,
        "distanceFromCity": 4.45,
        "owned": false
      },
      {
        "id": "prop_05_01",
        "name": "Slagrock Fortress",
        "goldPrice": 166,
        "lairSize": "medium",
        "dangerRating": 3,
        "distanceFromCity": 4.68,
        "owned": false
      },
      {
        "id": "prop_05_02",
        "name": "Mistveil Sanctum",
        "goldPrice": 148,
        "lairSize": "medium",
        "dangerRating": 3,
        "distanceFromCity": 4.45,
        "owned": false
      },
      {
        "id": "prop_05_03",
        "name": "Gravecrag Hollow",
        "goldPrice": 184,
        "lairSize": "large",
        "dangerRating": 3,
        "distanceFromCity": 4.45,
        "owned": false
      },
      {
        "id": "prop_05_04",
        "name": "Cinderwatch",
        "goldPrice": 210,
        "lairSize": "large",
        "dangerRating": 3,
        "distanceFromCity": 4.24,
        "owned": false
      }
    ]
  },
  {
    "id": "district_06",
    "name": "The Gilded Delve",
    "properties": [
      {
        "id": "prop_06_00",
        "name": "The Obsidian Cradle",
        "goldPrice": 127,
        "lairSize": "medium",
        "dangerRating": 4,
        "distanceFromCity": 4.23,
        "owned": false
      },
      {
        "id": "prop_06_01",
        "name": "Saltwind Tower",
        "goldPrice": 145,
        "lairSize": "medium",
        "dangerRating": 4,
        "distanceFromCity": 4.17,
        "owned": false
      },
      {
        "id": "prop_06_02",
        "name": "The Deep Warren",
        "goldPrice": 132,
        "lairSize": "medium",
        "dangerRating": 4,
        "distanceFromCity": 3.99,
        "owned": false
      },
      {
        "id": "prop_06_03",
        "name": "Bleakstone Hold",
        "goldPrice": 131,
        "lairSize": "medium",
        "dangerRating": 4,
        "distanceFromCity": 3.79,
        "owned": false
      },
      {
        "id": "prop_06_04",
        "name": "Ghostfire Lair",
        "goldPrice": 135,
        "lairSize": "medium",
        "dangerRating": 5,
        "distanceFromCity": 3.76,
        "owned": false
      }
    ]
  },
  {
    "id": "district_07",
    "name": "Wraithwood Vale",
    "properties": [
      {
        "id": "prop_07_00",
        "name": "Ironfall Bastion",
        "goldPrice": 189,
        "lairSize": "grand",
        "dangerRating": 1,
        "distanceFromCity": 3.36,
        "owned": false
      },
      {
        "id": "prop_07_01",
        "name": "The Sunken Vault",
        "goldPrice": 200,
        "lairSize": "medium",
        "dangerRating": 1,
        "distanceFromCity": 3.38,
        "owned": false
      },
      {
        "id": "prop_07_02",
        "name": "Frostmaw Keep",
        "goldPrice": 210,
        "lairSize": "medium",
        "dangerRating": 1,
        "distanceFromCity": 3.93,
        "owned": false
      },
      {
        "id": "prop_07_03",
        "name": "The Amber Hollow",
        "goldPrice": 247,
        "lairSize": "medium",
        "dangerRating": 1,
        "distanceFromCity": 3.85,
        "owned": false
      },
      {
        "id": "prop_07_04",
        "name": "Stormsong Delve",
        "goldPrice": 308,
        "lairSize": "large",
        "dangerRating": 1,
        "distanceFromCity": 5.4,
        "owned": false
      }
    ]
  },
  {
    "id": "district_08",
    "name": "Stormbreak Cliffs",
    "properties": [
      {
        "id": "prop_08_00",
        "name": "Dreadmoor Fortress",
        "goldPrice": 349,
        "lairSize": "grand",
        "dangerRating": 1,
        "distanceFromCity": 5.4,
        "owned": false
      },
      {
        "id": "prop_08_01",
        "name": "The Bone Spire",
        "goldPrice": 266,
        "lairSize": "large",
        "dangerRating": 1,
        "distanceFromCity": 5.72,
        "owned": false
      },
      {
        "id": "prop_08_02",
        "name": "Voidstone Lair",
        "goldPrice": 253,
        "lairSize": "medium",
        "dangerRating": 1,
        "distanceFromCity": 5.72,
        "owned": false
      },
      {
        "id": "prop_08_03",
        "name": "Cindercrest Den",
        "goldPrice": 247,
        "lairSize": "large",
        "dangerRating": 1,
        "distanceFromCity": 5.72,
        "owned": false
      },
      {
        "id": "prop_08_04",
        "name": "The Leaden Vault",
        "goldPrice": 212,
        "lairSize": "medium",
        "dangerRating": 1,
        "distanceFromCity": 5.72,
        "owned": false
      }
    ]
  },
  {
    "id": "district_09",
    "name": "The Sunken Halls",
    "properties": [
      {
        "id": "prop_09_00",
        "name": "Swiftcrag Tower",
        "goldPrice": 193,
        "lairSize": "medium",
        "dangerRating": 1,
        "distanceFromCity": 5.1,
        "owned": false
      },
      {
        "id": "prop_09_01",
        "name": "Emberveil Hold",
        "goldPrice": 200,
        "lairSize": "medium",
        "dangerRating": 1,
        "distanceFromCity": 5.1,
        "owned": false
      },
      {
        "id": "prop_09_02",
        "name": "The Rusted Keep",
        "goldPrice": 166,
        "lairSize": "medium",
        "dangerRating": 2,
        "distanceFromCity": 5.69,
        "owned": false
      },
      {
        "id": "prop_09_03",
        "name": "Wraithspire Cavern",
        "goldPrice": 144,
        "lairSize": "small",
        "dangerRating": 2,
        "distanceFromCity": 5.87,
        "owned": false
      },
      {
        "id": "prop_09_04",
        "name": "The Gilded Maw",
        "goldPrice": 194,
        "lairSize": "medium",
        "dangerRating": 2,
        "distanceFromCity": 6.09,
        "owned": false
      }
    ]
  }
];
