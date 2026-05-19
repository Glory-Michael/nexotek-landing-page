import * as migration_20260513_140849_phase1_2_3_additive from './20260513_140849_phase1_2_3_additive';

export const migrations = [
  {
    up: migration_20260513_140849_phase1_2_3_additive.up,
    down: migration_20260513_140849_phase1_2_3_additive.down,
    name: '20260513_140849_phase1_2_3_additive',
  },
];
