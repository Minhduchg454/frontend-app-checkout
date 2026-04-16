// helpers.js
export const formatCurrency = (amount, currency = "VND") => {
  const number = parseFloat(amount);
  if (isNaN(number)) {
    return "0đ";
  }

  const curr = currency.toUpperCase();

  // Nếu là VND, dùng định dạng tiếng Việt (vi-VN)
  if (curr === "VND") {
    return `${new Intl.NumberFormat("vi-VN").format(number)}đ`;
  }

  // Nếu là các loại tiền khác (USD, EUR...), dùng định dạng chuẩn quốc tế của loại tiền đó
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: curr,
  }).format(number);
};
