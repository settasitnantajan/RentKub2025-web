const calNights = (checkIn, checkOut) => {
  const milliDay = checkOut.getTime() - checkIn.getTime();

  const diffDay = milliDay / (1000 * 60 * 60 * 24);
  return diffDay;
};

export const calTotal = (checkIn, checkOut, price) => {
  if (!checkIn || !checkOut) return;
  const totalNights = calNights(checkIn, checkOut);
  const total = totalNights * price;
  return { total, totalNights };
};
