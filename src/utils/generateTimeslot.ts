import { format, addMinutes } from "date-fns";


export const generateTimeSlots = (
  startTime: string,
  duration: number,
  ar: string[][]
): string[] => {
  const slots: string[] = [];
  const matchResult = startTime.match(/(\d+):(\d+) (\w+)/);

  if (!matchResult) {
    throw new Error(`Invalid time format: ${startTime}`);
  }

  const [hours, minutes, period] = matchResult.slice(1, 4);
  let start = new Date();
  start.setHours(
    period === "PM" && hours !== "12" ? parseInt(hours) + 12 : parseInt(hours),
    parseInt(minutes),
    0,
    0
  );

  for (let i = 0; i < duration * 2; i++) {
    slots.push(format(start, "h:mm aa"));
    start = addMinutes(start, 30);
  }
  ar.push(slots);
  return slots;
};
