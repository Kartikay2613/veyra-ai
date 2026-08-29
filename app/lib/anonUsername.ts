const PREFIXES = [
  "Neon",
  "Quantum",
  "Cosmic",
  "Nova",
  "Pixel",
  "Turbo",
  "Midnight",
  "Solar",
  "Lunar",
  "Hyper",
  "Atomic",
  "Digital",
  "Electric",
  "Infinite",
  "Silent",
  "Crimson",
  "Golden",
  "Obsidian",
  "Velocity",
  "Radiant",
  "Orbit",
  "Echo",
  "Zero",
  "Prime",
  "Cyber",
];

const IDENTITIES = [
  // Tech
  "Architect",
  "Builder",
  "Coder",
  "Kernel",
  "Vector",
  "Compiler",
  "Debugger",
  "Protocol",
  "Node",
  "Circuit",

  // Career / creation
  "Maker",
  "Crafter",
  "Founder",
  "Strategist",
  "Creator",
  "Explorer",
  "Scholar",
  "Pioneer",
  "Navigator",
  "Inventor",

  // Abstract / fantasy
  "Oracle",
  "Nomad",
  "Voyager",
  "Ranger",
  "Sentinel",
  "Phantom",
  "Drifter",
  "Sage",
  "Titan",
  "Maverick",

  // A few animals for variety
  "Falcon",
  "Raven",
  "Fox",
  "Lynx",
  "Panda",
];

export function generateAnonUsername(): string {
  const prefix =
    PREFIXES[Math.floor(Math.random() * PREFIXES.length)];

  const identity =
    IDENTITIES[Math.floor(Math.random() * IDENTITIES.length)];

  const number = Math.floor(10 + Math.random() * 9990);

  return `${prefix}${identity}${number}`;
}