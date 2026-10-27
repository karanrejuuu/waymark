/**
 * Converts a number into Indian Rupee words format.
 * Example: 4800 -> "INR Four Thousand Eight Hundred Only"
 * Example: 228.58 -> "INR Two Hundred Twenty Eight and Fifty Eight paise Only"
 */

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function convertBelowThousand(n: number): string {
  let str = "";
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + " ";
    n %= 10;
  }
  if (n > 0) {
    str += ONES[n] + " ";
  }
  return str.trim();
}

export function numberToWordsRupees(amount: number): string {
  if (amount === 0) return "INR Zero Only";

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let remaining = rupees;
  let words = "";

  // Crores (1,00,00,000)
  const crores = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  if (crores > 0) {
    words += convertBelowThousand(crores) + " Crore ";
  }

  // Lakhs (1,00,000)
  const lakhs = Math.floor(remaining / 100000);
  remaining %= 100000;
  if (lakhs > 0) {
    words += convertBelowThousand(lakhs) + " Lakh ";
  }

  // Thousands (1,000)
  const thousands = Math.floor(remaining / 1000);
  remaining %= 1000;
  if (thousands > 0) {
    words += convertBelowThousand(thousands) + " Thousand ";
  }

  // Hundreds & Below
  if (remaining > 0) {
    words += convertBelowThousand(remaining) + " ";
  }

  words = words.trim();
  let result = "INR " + (words || "Zero");

  if (paise > 0) {
    result += " and " + convertBelowThousand(paise) + " paise";
  }

  result += " Only";
  return isNegative ? "Minus " + result : result;
}
