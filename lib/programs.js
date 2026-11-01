export const PROGRAM_DISPLAY_NAMES = {
  AAA: 'AAA Sport Academy',
  A3: 'A3',
  SWDC: 'SWDC Swimmer',
  PRIVATE: 'Private 1-on-1',
};

export function getProgramDisplayName(program) {
  return PROGRAM_DISPLAY_NAMES[program] ?? program ?? '-';
}
