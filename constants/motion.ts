export const motion = {
  quick: 140,
  enter: 280,
  exit: 200,
  spring: { damping: 16, stiffness: 300, mass: 0.65 },
  inflate: { damping: 13, stiffness: 210, mass: 0.75 },
  pressScale: 0.975,
} as const;
