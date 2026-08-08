import * as migration_20260807_073539 from './20260807_073539';
import * as migration_20260808_103833 from './20260808_103833';

export const migrations = [
  {
    up: migration_20260807_073539.up,
    down: migration_20260807_073539.down,
    name: '20260807_073539',
  },
  {
    up: migration_20260808_103833.up,
    down: migration_20260808_103833.down,
    name: '20260808_103833'
  },
];
