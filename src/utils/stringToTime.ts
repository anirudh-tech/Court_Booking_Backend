export const parseTime = (timeString: string): Date => {
  const date = new Date();
  const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = timeString.match(timeRegex);

  if (!match) {
    return new Date();
    // throw new Error("Invalid time format");
  }

  const [, hours, minutes, ampm] = match;
  let parsedHours = parseInt(hours, 10);
  const parsedMinutes = parseInt(minutes, 10);

  if (ampm.toUpperCase() === "PM" && parsedHours !== 12) {
    parsedHours += 12;
  } else if (ampm.toUpperCase() === "AM" && parsedHours === 12) {
    parsedHours = 0;
  }

  date?.setHours(parsedHours);
  date?.setMinutes(parsedMinutes);
  date?.setSeconds(0);
  date?.setMilliseconds(0);

  return date;
};
