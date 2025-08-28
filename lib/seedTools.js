// Minecraft seed tools - much simpler than UUID generation
// Minecraft seeds are 64-bit signed integers: -2^63 to 2^63-1

import { MIN_SEED, MAX_SEED_INDEX } from './constants.js';

/**
 * Convert an index (0 to 2^64-1) to a Minecraft seed (-2^63 to 2^63-1)
 * This is a simple 1:1 mapping without complex cryptographic functions
 */
export function indexToSeed(index) {
  if (typeof index !== "bigint") {
    index = BigInt(index);
  }
  
  if (index < 0n) {
    throw new Error("Index must be non-negative");
  }
  
  if (index > MAX_SEED_INDEX) {
    throw new Error(`Index out of range - must be less than ${MAX_SEED_INDEX}`);
  }
  
  // Convert index (0 to 2^64-1) to seed (-2^63 to 2^63-1)
  // Index 0 maps to -2^63, index 2^64-1 maps to 2^63-1
  return MIN_SEED + index;
}

/**
 * Convert a Minecraft seed to an index for virtual scrolling
 */
export function seedToIndex(seed) {
  if (typeof seed !== "bigint") {
    seed = BigInt(seed);
  }
  
  // Convert seed (-2^63 to 2^63-1) to index (0 to 2^64-1)
  const index = seed - MIN_SEED;

  if (index < 0n || index > MAX_SEED_INDEX) {
    return null; // Invalid seed
  }
  
  return index;
}

/**
 * Generate a random Minecraft seed
 */
export function generateRandomSeed() {
  // Generate random 64-bit signed integer
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  
  let result = 0n;
  for (let i = 0; i < 8; i++) {
    result = (result << 8n) | BigInt(randomBytes[i]);
  }
  
  // Convert to signed 64-bit integer
  if (result >= 2n ** 63n) {
    result -= 2n ** 64n;
  }
  
  return result;
}

/**
 * Format seed for display (with thousand separators)
 */
export function formatSeedDisplay(seed) {
  if (typeof seed !== "bigint") {
    seed = BigInt(seed);
  }
  
  return seed.toLocaleString();
}

/**
 * Validate user input as a potential Minecraft seed
 */
export function validateSeed(input) {
  if (typeof input === "string") {
    input = input.trim();
    
    // Remove any thousand separators
    input = input.replace(/[,\s]/g, '');
    
    // Check if it's a valid integer format
    if (!/^-?\d+$/.test(input)) {
      return { valid: false, error: "Must be a valid integer" };
    }
    
    try {
      const seed = BigInt(input);
      
      if (seed < MIN_SEED || seed >= MIN_SEED + MAX_SEED_INDEX + 1n) {
        return { 
          valid: false, 
          error: `Seed must be between ${MIN_SEED.toLocaleString()} and ${(MIN_SEED + MAX_SEED_INDEX).toLocaleString()}` 
        };
      }
      
      return { valid: true, seed };
    } catch (e) {
      return { valid: false, error: "Invalid number format" };
    }
  }
  
  if (typeof input === "bigint" || typeof input === "number") {
    const seed = BigInt(input);
    if (seed < MIN_SEED || seed >= MIN_SEED + MAX_SEED_INDEX + 1n) {
      return { 
        valid: false, 
        error: `Seed must be between ${MIN_SEED.toLocaleString()} and ${(MIN_SEED + MAX_SEED_INDEX).toLocaleString()}` 
      };
    }
    return { valid: true, seed };
  }
  
  return { valid: false, error: "Invalid input type" };
}

/**
 * Parse seed from various input formats (hex, decimal)
 */
export function parseSeedInput(input) {
  if (typeof input !== "string") {
    return validateSeed(input);
  }
  
  input = input.trim();
  
  // Handle hex input (0x prefix)
  if (input.toLowerCase().startsWith("0x")) {
    try {
      const seed = BigInt(input);
      return validateSeed(seed);
    } catch (e) {
      return { valid: false, error: "Invalid hexadecimal format" };
    }
  }
  
  // Handle decimal input
  return validateSeed(input);
}

/**
 * Convert seed to hex representation
 */
export function seedToHex(seed) {
  if (typeof seed !== "bigint") {
    seed = BigInt(seed);
  }
  
  // Handle negative numbers properly in hex
  if (seed < 0n) {
    // Two's complement representation
    const unsigned = (2n ** 64n) + seed;
    return "0x" + unsigned.toString(16).toUpperCase().padStart(16, '0');
  } else {
    return "0x" + seed.toString(16).toUpperCase().padStart(16, '0');
  }
}

/**
 * Get seed information for display
 */
export function getSeedInfo(seed) {
  if (typeof seed !== "bigint") {
    seed = BigInt(seed);
  }
  
  return {
    decimal: seed.toString(),
    formatted: formatSeedDisplay(seed),
    hex: seedToHex(seed),
    index: seedToIndex(seed),
    isNegative: seed < 0n,
    isZero: seed === 0n,
    isMaxPositive: seed === 2n ** 63n - 1n,
    isMaxNegative: seed === MIN_SEED
  };
}
