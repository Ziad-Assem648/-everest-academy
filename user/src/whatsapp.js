export function formatWhatsAppLink(phone) {
  if (!phone) return "#";
  let digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) {
    digits = "20" + digits;
  }
  return `https://wa.me/${digits}`;
}
