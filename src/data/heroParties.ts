// Auto-generated — do not edit manually

export interface HeroMonster { name:string; hp:number; ac:number; cr:number; str:number; dex:number; con:number; int:number; wis:number; cha:number; size:string; }
export interface HeroTierDef { tier:1|2|3|4; label:string; crRange:[number,number]; goldRewardRange:[number,number]; representatives:HeroMonster[]; }

export const heroTiers: HeroTierDef[] = [
  {
    "tier": 1,
    "label": "Wyrmling",
    "crRange": [
      1,
      4
    ],
    "goldRewardRange": [
      20,
      50
    ],
    "representatives": [
      {
        "name": "Auspicia Dran",
        "hp": 52,
        "ac": 15,
        "cr": 2.0,
        "str": 16,
        "dex": 14,
        "con": 14,
        "int": 15,
        "wis": 12,
        "cha": 10,
        "size": "M"
      },
      {
        "name": "Galsariad Ardyth (Tier 1)",
        "hp": 49,
        "ac": 12,
        "cr": 3.0,
        "str": 8,
        "dex": 14,
        "con": 8,
        "int": 16,
        "wis": 15,
        "cha": 12,
        "size": "M"
      },
      {
        "name": "Kysh",
        "hp": 27,
        "ac": 13,
        "cr": 1.0,
        "str": 14,
        "dex": 16,
        "con": 12,
        "int": 10,
        "wis": 13,
        "cha": 14,
        "size": "M"
      },
      {
        "name": "Nezznar the Black Spider",
        "hp": 27,
        "ac": 11,
        "cr": 2.0,
        "str": 9,
        "dex": 13,
        "con": 10,
        "int": 16,
        "wis": 14,
        "cha": 13,
        "size": "M"
      },
      {
        "name": "Yuan-ti Pureblood",
        "hp": 40,
        "ac": 11,
        "cr": 1.0,
        "str": 11,
        "dex": 12,
        "con": 11,
        "int": 13,
        "wis": 12,
        "cha": 14,
        "size": "M"
      },
      {
        "name": "Grisha",
        "hp": 33,
        "ac": 18,
        "cr": 2.0,
        "str": 14,
        "dex": 12,
        "con": 12,
        "int": 11,
        "wis": 14,
        "cha": 16,
        "size": "M"
      },
      {
        "name": "Tommy Two-Butts",
        "hp": 27,
        "ac": 16,
        "cr": 1.0,
        "str": 15,
        "dex": 14,
        "con": 13,
        "int": 21,
        "wis": 11,
        "cha": 9,
        "size": "M"
      },
      {
        "name": "Albino Dwarf Spirit Warrior",
        "hp": 30,
        "ac": 13,
        "cr": 1.0,
        "str": 13,
        "dex": 13,
        "con": 17,
        "int": 12,
        "wis": 14,
        "cha": 11,
        "size": "M"
      },
      {
        "name": "Wereraven",
        "hp": 31,
        "ac": 12,
        "cr": 2.0,
        "str": 10,
        "dex": 15,
        "con": 11,
        "int": 13,
        "wis": 15,
        "cha": 14,
        "size": "M"
      },
      {
        "name": "Werebat",
        "hp": 24,
        "ac": 13,
        "cr": 2.0,
        "str": 8,
        "dex": 17,
        "con": 10,
        "int": 10,
        "wis": 12,
        "cha": 8,
        "size": "S"
      }
    ]
  },
  {
    "tier": 2,
    "label": "Young Drake",
    "crRange": [
      5,
      10
    ],
    "goldRewardRange": [
      60,
      150
    ],
    "representatives": [
      {
        "name": "Jim Darkmagic",
        "hp": 40,
        "ac": 12,
        "cr": 5.0,
        "str": 8,
        "dex": 14,
        "con": 10,
        "int": 18,
        "wis": 12,
        "cha": 14,
        "size": "M"
      },
      {
        "name": "Dermot Wurder (Tier 2)",
        "hp": 82,
        "ac": 19,
        "cr": 5.0,
        "str": 18,
        "dex": 12,
        "con": 14,
        "int": 10,
        "wis": 18,
        "cha": 10,
        "size": "S"
      },
      {
        "name": "Flux Blastseeker",
        "hp": 55,
        "ac": 12,
        "cr": 5.0,
        "str": 10,
        "dex": 15,
        "con": 12,
        "int": 20,
        "wis": 9,
        "cha": 14,
        "size": "M"
      },
      {
        "name": "Whymsee",
        "hp": 75,
        "ac": 17,
        "cr": 5.0,
        "str": 12,
        "dex": 10,
        "con": 16,
        "int": 10,
        "wis": 15,
        "cha": 14,
        "size": "M"
      },
      {
        "name": "Abjurer Wizard",
        "hp": 104,
        "ac": 12,
        "cr": 9.0,
        "str": 9,
        "dex": 14,
        "con": 14,
        "int": 18,
        "wis": 12,
        "cha": 11,
        "size": "M"
      },
      {
        "name": "Kinyel Druu'giir",
        "hp": 78,
        "ac": 15,
        "cr": 8.0,
        "str": 11,
        "dex": 16,
        "con": 14,
        "int": 13,
        "wis": 11,
        "cha": 10,
        "size": "M"
      },
      {
        "name": "Lorehold Professor of Chaos",
        "hp": 110,
        "ac": 12,
        "cr": 7.0,
        "str": 11,
        "dex": 14,
        "con": 14,
        "int": 19,
        "wis": 15,
        "cha": 13,
        "size": "S, M"
      },
      {
        "name": "Wakanga O'tamu",
        "hp": 40,
        "ac": 12,
        "cr": 6.0,
        "str": 9,
        "dex": 14,
        "con": 11,
        "int": 17,
        "wis": 12,
        "cha": 11,
        "size": "M"
      },
      {
        "name": "Ammalia Cassalanter",
        "hp": 45,
        "ac": 12,
        "cr": 5.0,
        "str": 9,
        "dex": 14,
        "con": 11,
        "int": 17,
        "wis": 12,
        "cha": 15,
        "size": "M"
      },
      {
        "name": "Zress Orlezziir",
        "hp": 162,
        "ac": 16,
        "cr": 9.0,
        "str": 14,
        "dex": 19,
        "con": 15,
        "int": 12,
        "wis": 14,
        "cha": 13,
        "size": "M"
      }
    ]
  },
  {
    "tier": 3,
    "label": "Adult Drake",
    "crRange": [
      11,
      16
    ],
    "goldRewardRange": [
      200,
      400
    ],
    "representatives": [
      {
        "name": "Tyreus, Illusionist",
        "hp": 156,
        "ac": 13,
        "cr": 13.0,
        "str": 10,
        "dex": 16,
        "con": 14,
        "int": 20,
        "wis": 15,
        "cha": 16,
        "size": "M"
      },
      {
        "name": "Baba Lysaga",
        "hp": 120,
        "ac": 15,
        "cr": 11.0,
        "str": 18,
        "dex": 10,
        "con": 16,
        "int": 20,
        "wis": 17,
        "cha": 13,
        "size": "M"
      },
      {
        "name": "Thessalar",
        "hp": 104,
        "ac": 14,
        "cr": 12.0,
        "str": 10,
        "dex": 12,
        "con": 13,
        "int": 19,
        "wis": 16,
        "cha": 16,
        "size": "M"
      },
      {
        "name": "Jaheira",
        "hp": 112,
        "ac": 11,
        "cr": 13.0,
        "str": 14,
        "dex": 12,
        "con": 16,
        "int": 12,
        "wis": 20,
        "cha": 15,
        "size": "M"
      },
      {
        "name": "Archmage",
        "hp": 99,
        "ac": 12,
        "cr": 12.0,
        "str": 10,
        "dex": 14,
        "con": 12,
        "int": 20,
        "wis": 15,
        "cha": 16,
        "size": "M"
      },
      {
        "name": "Githyanki Supreme Commander",
        "hp": 187,
        "ac": 18,
        "cr": 14.0,
        "str": 19,
        "dex": 17,
        "con": 18,
        "int": 16,
        "wis": 16,
        "cha": 18,
        "size": "M"
      },
      {
        "name": "Githyanki Kith'rak",
        "hp": 180,
        "ac": 18,
        "cr": 12.0,
        "str": 18,
        "dex": 16,
        "con": 17,
        "int": 16,
        "wis": 15,
        "cha": 17,
        "size": "M"
      },
      {
        "name": "Oracle of Strixhaven",
        "hp": 150,
        "ac": 12,
        "cr": 15.0,
        "str": 12,
        "dex": 15,
        "con": 16,
        "int": 21,
        "wis": 20,
        "cha": 18,
        "size": "M"
      },
      {
        "name": "Manshoon",
        "hp": 126,
        "ac": 19,
        "cr": 13.0,
        "str": 10,
        "dex": 14,
        "con": 12,
        "int": 23,
        "wis": 15,
        "cha": 16,
        "size": "M"
      },
      {
        "name": "Zox Clammersham",
        "hp": 99,
        "ac": 12,
        "cr": 12.0,
        "str": 10,
        "dex": 14,
        "con": 12,
        "int": 20,
        "wis": 15,
        "cha": 16,
        "size": "M"
      }
    ]
  },
  {
    "tier": 4,
    "label": "Ancient",
    "crRange": [
      17,
      30
    ],
    "goldRewardRange": [
      500,
      1000
    ],
    "representatives": [
      {
        "name": "The Lord of Blades",
        "hp": 195,
        "ac": 19,
        "cr": 18.0,
        "str": 20,
        "dex": 15,
        "con": 18,
        "int": 19,
        "wis": 17,
        "cha": 18,
        "size": "M"
      },
      {
        "name": "Bhaal, Slayer",
        "hp": 209,
        "ac": 19,
        "cr": 20.0,
        "str": 24,
        "dex": 22,
        "con": 20,
        "int": 14,
        "wis": 16,
        "cha": 14,
        "size": "M"
      },
      {
        "name": "Drow Favored Consort",
        "hp": 240,
        "ac": 15,
        "cr": 18.0,
        "str": 15,
        "dex": 20,
        "con": 16,
        "int": 18,
        "wis": 15,
        "cha": 18,
        "size": "M"
      },
      {
        "name": "Drow Matron Mother",
        "hp": 247,
        "ac": 17,
        "cr": 20.0,
        "str": 12,
        "dex": 18,
        "con": 16,
        "int": 17,
        "wis": 21,
        "cha": 22,
        "size": "M"
      },
      {
        "name": "Drow Favored Consort",
        "hp": 225,
        "ac": 15,
        "cr": 18.0,
        "str": 15,
        "dex": 20,
        "con": 16,
        "int": 18,
        "wis": 15,
        "cha": 18,
        "size": "M"
      },
      {
        "name": "Drow Matron Mother",
        "hp": 262,
        "ac": 17,
        "cr": 20.0,
        "str": 12,
        "dex": 18,
        "con": 16,
        "int": 17,
        "wis": 21,
        "cha": 22,
        "size": "M"
      },
      {
        "name": "Nagpa",
        "hp": 187,
        "ac": 19,
        "cr": 17.0,
        "str": 9,
        "dex": 15,
        "con": 12,
        "int": 23,
        "wis": 18,
        "cha": 21,
        "size": "M"
      },
      {
        "name": "Quenthel Baenre",
        "hp": 132,
        "ac": 19,
        "cr": 22.0,
        "str": 10,
        "dex": 14,
        "con": 12,
        "int": 18,
        "wis": 20,
        "cha": 18,
        "size": "M"
      },
      {
        "name": "Laeral Silverhand",
        "hp": 228,
        "ac": 18,
        "cr": 17.0,
        "str": 13,
        "dex": 17,
        "con": 20,
        "int": 20,
        "wis": 20,
        "cha": 19,
        "size": "M"
      },
      {
        "name": "Halaster Blackcloak",
        "hp": 246,
        "ac": 14,
        "cr": 23.0,
        "str": 10,
        "dex": 18,
        "con": 18,
        "int": 24,
        "wis": 18,
        "cha": 18,
        "size": "M"
      }
    ]
  }
];
