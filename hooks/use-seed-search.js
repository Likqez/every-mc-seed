/* eslint-env es2020 */
import React from "react";
import { seedToIndex, indexToSeed } from "../lib/seedTools";
import { MAX_SEED_INDEX } from "../lib/constants";

const SEARCH_LOOKBACK = 50;
const SEARCH_LOOKAHEAD = 25;
const RANDOM_SEARCH_ITERATIONS = 100;

function isValidSeedString(search) {
  // Minecraft seeds can be:
  // - Positive/negative integers
  // - Optional leading minus sign
  // - Only digits after the optional minus
  const seedPattern = /^-?\d+$/;
  return seedPattern.test(search) && search.length <= 20; // 64-bit max is 19 digits
}

function generateCandidateSeeds(searchPattern) {
  const candidates = [];

  if (isValidSeedString(searchPattern)) {
    // Try the exact value if it's a complete seed
    try {
      const exactSeed = BigInt(searchPattern);
      if (exactSeed >= -(2n ** 63n) && exactSeed <= 2n ** 63n - 1n) {
        candidates.push(exactSeed);
      }
    } catch (e) {
      // Invalid BigInt, ignore
    }

    // Generate seeds with the pattern at different positions
    for (let i = 0; i < RANDOM_SEARCH_ITERATIONS; i++) {
      const maxDigits = 19; // Max digits for 64-bit
      const remainingDigits = maxDigits - searchPattern.length;

      if (remainingDigits > 0) {
        // Generate random prefix and suffix lengths
        const prefixLength = Math.floor(Math.random() * (remainingDigits + 1));
        const suffixLength = remainingDigits - prefixLength;

        // Generate random prefix and suffix
        const prefix = prefixLength > 0 ?
          Math.floor(Math.random() * (10 ** Math.min(prefixLength, 15))).toString().padStart(prefixLength, '0') : "";
        const suffix = suffixLength > 0 ?
          Math.floor(Math.random() * (10 ** Math.min(suffixLength, 15))).toString().padStart(suffixLength, '0') : "";

        const isNegative = Math.random() > 0.5; // 50% chance of negative

        // Create candidate seed
        let candidateStr = prefix + searchPattern + suffix;

        // Remove leading zeros except for the first digit if it would be empty
        candidateStr = candidateStr.replace(/^0+/, '') || '0';

        if (isNegative && candidateStr !== '0') {
          candidateStr = '-' + candidateStr;
        }

        try {
          const candidate = BigInt(candidateStr);
          if (candidate >= -(2n ** 63n) && candidate <= 2n ** 63n - 1n) {
            // Check if we already have this candidate
            if (!candidates.some(c => c === candidate)) {
              candidates.push(candidate);
            }
          }
        } catch (e) {
          // Invalid candidate, skip
        }
      }
    }

    // Also generate some systematic patterns for better coverage
    // Pattern at beginning, middle, and end positions
    const systematicPatterns = [
      searchPattern + '0'.repeat(Math.min(10, 19 - searchPattern.length)), // Pattern at start
      '1' + searchPattern + '0'.repeat(Math.min(9, 18 - searchPattern.length)), // Pattern near start
      '0'.repeat(Math.min(5, 19 - searchPattern.length)) + searchPattern + '0'.repeat(Math.min(5, 14 - searchPattern.length)), // Pattern in middle
    ];

    for (const pattern of systematicPatterns) {
      if (pattern.length <= 19) {
        try {
          const candidate = BigInt(pattern);
          if (candidate >= -(2n ** 63n) && candidate <= 2n ** 63n - 1n) {
            if (!candidates.some(c => c === candidate)) {
              candidates.push(candidate);
            }
          }
          // Also try negative version
          const negCandidate = -candidate;
          if (negCandidate >= -(2n ** 63n) && negCandidate <= 2n ** 63n - 1n) {
            if (!candidates.some(c => c === negCandidate)) {
              candidates.push(negCandidate);
            }
          }
        } catch (e) {
          // Invalid candidate, skip
        }
      }
    }
  }

  return candidates;
}

export function useSeedSearch({ virtualPosition, displayedSeeds }) {
  const [search, setSearch] = React.useState(null);
  const [seed, setSeed] = React.useState(null);
  const [nextStates, setNextStates] = React.useState([]);

  // Memoized previous seeds computation (like UUID search)
  const previousSeeds = React.useMemo(() => {
    let hasComputed = false;
    let value = null;
    return () => {
      const compute = () => {
        const prev = [];
        for (let i = 1; i <= SEARCH_LOOKBACK; i++) {
          i = BigInt(i);
          let index = BigInt(virtualPosition) - i;
          if (index < 0n) {
            index = MAX_SEED_INDEX + index + 1n;
          }
          const seedValue = indexToSeed(index);
          prev.push({ index, seed: seedValue });
        }
        return prev;
      };
      if (!hasComputed) {
        value = compute();
        hasComputed = true;
      }
      return value;
    };
  }, [virtualPosition]);

  // Memoized next seeds computation (like UUID search)
  const nextSeeds = React.useMemo(() => {
    let hasComputed = false;
    let value = null;
    return () => {
      const compute = () => {
        const next = [];
        for (let i = 1; i <= SEARCH_LOOKAHEAD; i++) {
          i = BigInt(i);
          let index = BigInt(virtualPosition) + i;
          if (index > MAX_SEED_INDEX) {
            index = index - MAX_SEED_INDEX - 1n;
          }
          const seedValue = indexToSeed(index);
          next.push({ index, seed: seedValue });
        }
        return next;
      };
      if (!hasComputed) {
        value = compute();
        hasComputed = true;
      }
      return value;
    };
  }, [virtualPosition]);

  // Optimized search around current position (like UUID search)
  const searchAround = React.useCallback(
    ({ input, wantHigher, canUseCurrentIndex }) => {
      if (wantHigher) {
        const startPosition = canUseCurrentIndex ? 0 : 1;
        // Add null check for displayedSeeds
        if (displayedSeeds && displayedSeeds.length > 0) {
          for (let i = startPosition; i < displayedSeeds.length; i++) {
            const seedValue = displayedSeeds[i]?.seed;
            if (seedValue && seedValue.toString().includes(input)) {
              return { seed: seedValue, index: displayedSeeds[i].index };
            }
          }
        }
        const next = nextSeeds();
        for (let i = 0; i < next.length; i++) {
          const seedValue = next[i].seed;
          if (seedValue && seedValue.toString().includes(input)) {
            return { seed: seedValue, index: next[i].index };
          }
        }
      } else {
        // canUseCurrentIndex isn't relevant when searching backwards!
        const prev = previousSeeds();
        for (const { seed: seedValue, index } of prev) {
          if (seedValue && seedValue.toString().includes(input)) {
            return { seed: seedValue, index };
          }
        }
      }
      return null;
    },
    [displayedSeeds, previousSeeds, nextSeeds]
  );

  // Enhanced random search with better pattern matching
  const searchRandomly = React.useCallback(
    ({ input, wantHigher }) => {
      const candidates = generateCandidateSeeds(input);
      if (candidates.length === 0) return null;

      let best = null;
      let compareIndex = virtualPosition;

      for (const candidate of candidates) {
        const index = seedToIndex(candidate);
        if (index === null) continue;

        const satisfiesConstraint = wantHigher
          ? index > compareIndex
          : index < compareIndex;

        const notInHistory = !nextStates.some(
          ({ seed: nextSeed }) => nextSeed === candidate
        );

        if (satisfiesConstraint && notInHistory) {
          const isBetter = best === null
            ? true
            : wantHigher
              ? index < best.index
              : index > best.index;

          if (isBetter) {
            best = { seed: candidate, index };
          }
        }
      }

      if (best) {
        return best;
      }

      // Fallback: return any candidate (like UUID search)
      const fallbackCandidate = candidates[Math.floor(Math.random() * candidates.length)];
      return {
        seed: fallbackCandidate,
        index: seedToIndex(fallbackCandidate),
      };
    },
    [nextStates, virtualPosition]
  );

  // Main search function (enhanced like UUID search)
  const searchSeed = React.useCallback((input) => {
    if (!input || !input.trim()) {
      setSearch(null);
      setSeed(null);
      setNextStates([]);
      return null;
    }

    const trimmedSearch = input.trim();

    // Clear next states stack when search changes
    setNextStates([]);

    const inner = () => {
      const around = searchAround({
        input: trimmedSearch,
        wantHigher: true,
        canUseCurrentIndex: true,
      });
      if (around) return around;
      return searchRandomly({ input: trimmedSearch, wantHigher: true });
    };

    const result = inner();
    if (result) {
      setSearch(trimmedSearch);
      setSeed(result.seed);
      setNextStates((prev) => [...prev, result]);
    } else {
      setSearch(trimmedSearch);
      setSeed(null);
    }
    return result?.seed ?? null;
  }, [searchAround, searchRandomly]);

  const nextSeed = React.useCallback(() => {
    if (!seed || !search) return null;

    const inner = () => {
      const around = searchAround({
        input: search,
        wantHigher: true,
        canUseCurrentIndex: false,
      });
      if (around) return around;
      return searchRandomly({ input: search, wantHigher: true });
    };

    const result = inner();
    if (result) {
      setSeed(result.seed);
      setNextStates((prev) => [...prev, result]);
      return result.seed;
    }
    return null;
  }, [seed, search, searchAround, searchRandomly]);

  const previousSeed = React.useCallback(() => {
    if (!seed || !search) return null;

    if (nextStates.length > 1) {
      setNextStates((prev) => prev.slice(0, -1));
      const prevState = nextStates[nextStates.length - 2];
      setSeed(prevState.seed);
      return prevState.seed;
    }

    const inner = () => {
      const around = searchAround({
        input: search,
        wantHigher: false,
        canUseCurrentIndex: false,
      });
      if (around) return around;
      return searchRandomly({ input: search, wantHigher: false });
    };

    const result = inner();
    if (result) {
      setSeed(result.seed);
      return result.seed;
    }
    return null;
  }, [seed, search, nextStates, searchAround, searchRandomly]);

  return {
    searchSeed,
    nextSeed,
    previousSeed,
    currentSeed: seed,
  };
}
