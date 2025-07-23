import dayjs from "dayjs";

export const disablePastDates = (current) => {
  return current && current < dayjs().startOf("day");
};
