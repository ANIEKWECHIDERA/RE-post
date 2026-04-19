export type StreakRiskState = 'start' | 'safe' | 'at_risk' | 'missed';

export type StreakStatus = {
  state: StreakRiskState;
  label: string;
  message: string;
};
