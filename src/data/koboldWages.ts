// Auto-generated — do not edit manually

export type KoboldTier = 'basic' | 'standard' | 'skilled' | 'elite';
export type KoboldSource = 'motel' | 'lair';
export interface KoboldWage { tier:KoboldTier; dailyWage:number; description:string; source:KoboldSource; }

export const koboldWages: KoboldWage[] = [
  {
    "tier": "basic",
    "dailyWage": 2,
    "description": "Motel recruit. Eager but unskilled.",
    "source": "motel"
  },
  {
    "tier": "standard",
    "dailyWage": 4,
    "description": "Reliable lair kobold. Competent in assigned roles.",
    "source": "lair"
  },
  {
    "tier": "skilled",
    "dailyWage": 7,
    "description": "Veteran with a specialty. Drives higher passive income.",
    "source": "lair"
  },
  {
    "tier": "elite",
    "dailyWage": 12,
    "description": "Elite captain. Commands kobolds and maximises operations.",
    "source": "lair"
  }
];

export const koboldWageBaseline: number = 4.19;
