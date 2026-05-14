import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { AppError } from "../error/appError";

dayjs.extend(isSameOrBefore);

export const getDateRangeArray = (
  startDate: string,
  endDate: string,
): string[] => {
  if (!startDate || !endDate) {
    throw new AppError("Start date and end date are required", 400);
  }

  const start = dayjs(startDate);
  const end = dayjs(endDate);

  if (!start.isValid() || !end.isValid()) {
    throw new AppError("Invalid date format", 400);
  }

  if (start.isAfter(end)) {
    throw new AppError("Start date cannot be after end date", 400);
  }

  const dates: string[] = [];
  let currentDate = start;

  while (currentDate.isBefore(end)) {
    dates.push(currentDate.format("YYYY-MM-DD"));
    currentDate = currentDate.add(1, "day");
  }

  return dates;
};
