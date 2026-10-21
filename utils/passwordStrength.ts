/** Local guidance only: never sends or stores the password, nor changes Auth's policy. */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  if (
    password.length < 8 ||
    /senha|password|qwerty|123456|cortexa|letmein/i.test(password) ||
    /^(.{1,4})\1{2,}$/.test(password)
  )
    return 1;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter((rule) =>
    rule.test(password),
  ).length;
  if ((password.length >= 12 && variety >= 3) || (password.length >= 20 && variety >= 2)) return 3;
  return 2;
}
