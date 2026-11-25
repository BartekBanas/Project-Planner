export type CpmRequestActivity = {
  taskName: string;
  duration: number;
  sequence: [number, number];
};

export type CpmActivity = CpmRequestActivity & {
  id: number;
  critical: boolean | null;
  timeReserve: number;
  earlyStart: number;
  earlyFinish: number;
  lateStart: number;
  lateFinish: number;
};

export type CpmEvent = {
  id: number;
  earliestTime: number;
  latestTime: number;
  timeReserve: number;
};

export type CpmSolution = {
  activities: CpmActivity[];
  events: CpmEvent[];
};
