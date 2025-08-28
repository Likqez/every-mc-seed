import React from "react";
import styled, { keyframes } from "styled-components";
import UnstyledButton from "../UnstyledButton/UnstyledButton";
import {
  querySmallScreen,
  queryVerySmallScreen,
  SCROLLBAR_WIDTH,
  ITEM_HEIGHT,
} from "../../../lib/constants";
import { ClipboardCopy, Star } from "../Icons";

const BaseButton = styled(UnstyledButton)`
  height: 100%;
  aspect-ratio: 1;
  cursor: pointer;
  padding: 0;
  transition:
    transform 0.1s ease-in-out,
    color 0.1s ease-in-out;

  @media ${querySmallScreen} {
    height: 60%;
  }

  &:focus {
    outline: none;
    background-color: transparent;
  }

  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -webkit-tap-highlight-color: transparent;
`;

const CopyButton = styled(BaseButton)`
  grid-area: copy;
  color: var(--slate-700);

  @media (hover: hover) {
    &:hover {
      color: var(--slate-900);
    }
  }

  transform: ${(props) => (props.$rowMouseDown ? "scale(0.8)" : "none")};

  &:active {
    transform: scale(0.8);
  }
`;

const SpinStretch = keyframes`
  0% {
    transform: scale(1) rotate(0deg);
  }
  20% {
    transform: scale(0.8) rotate(-40deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
  }
`;

const FavoriteButton = styled(BaseButton)`
  grid-area: favorite;
  color: var(--yellow-700);
  --fill-color: ${(props) =>
    props.$isFaved ? "var(--yellow-500)" : "transparent"};

  &[data-just-faved="true"] {
    animation: ${SpinStretch} 0.8s cubic-bezier(0.25, 0.8, 0.25, 1) both;
  }

  @media (hover: hover) {
    &:hover {
      color: ${(props) =>
        props.$isFaved ? "var(--yellow-100)" : "var(--yellow-500)"};
    }
  }
`;

const Wrapper = styled.div`
  flex: 1;
  min-height: 0;
  position: relative;
  outline: none;

  --text-size: 0.875rem;

  @media ${queryVerySmallScreen} {
    --text-size: 0.75rem;
  }
`;

const List = styled.div`
  height: 100%;
  padding-bottom: 2rem;
`;

const RowWrapper = styled.div`
  display: grid;
  padding: 0.25rem 0;

  grid-template-areas: "index colon seed copy favorite copied";
  grid-template-rows: 100%;
  grid-template-columns: repeat(5, fit-content(15px));
  gap: 0.25rem 0.5rem;
  align-items: center;

  margin-left: ${SCROLLBAR_WIDTH}px;
  font-family: monospace;
  white-space: nowrap;
  font-size: var(--text-size);
  border-bottom: 1px solid var(--border-color);
  height: ${ITEM_HEIGHT}px;

  /* Removed CSS hover - now handled by JavaScript */
  background-color: ${(props) => 
    props.isHovered ? "var(--slate-400)" : props.rowBackground || "transparent"
  };
  transition: background-color 0.1s ease-in-out;

  @media ${querySmallScreen} {
    grid-template-columns: repeat(2, fit-content(0));
    grid-template-areas: "index copy favorite" "seed copy favorite";
    grid-template-rows: 50% 50%;
    height: ${ITEM_HEIGHT * 2}px;
    justify-content: center;
    gap: 0.25rem 0.5rem;
    padding: 0.5rem 0;
    margin-left: 0;
  }
`;

const FadeOutDown = keyframes`
  0% { opacity: 0; }
  15% { opacity: 1; }
  40% { opacity: 1; }
  100% { opacity: 0; }
`;

const CopiedText = styled.div`
  grid-area: copied;
  font-size: var(--text-size);
  color: var(--green-900);
  animation: ${FadeOutDown} 0.6s ease-in both;
  user-select: none;

  @media ${querySmallScreen} {
    position: absolute;
    backdrop-filter: blur(10px);
    background-color: rgba(255, 255, 255, 0.8);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`;

const Index = styled.div`
  grid-area: index;
  color: var(--slate-600);
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  cursor: default;
`;

const LeadingZeros = styled.span`
  opacity: 0.3;
`;

const ActualIndex = styled.span`
  opacity: 0.7;
`;

const Colon = styled.span`
  grid-area: colon;
  cursor: default;

  &::after {
    content: "";
  }

  @media ${querySmallScreen} {
    display: none;
  }
`;

const Seed = styled.span`
  grid-area: seed;
  color: var(--slate-900);
  display: block;
  width: fit-content;
  white-space: pre; /* Preserve leading spaces for alignment */
  cursor: text; /* Show text cursor for seed to indicate it's selectable */

  @media ${querySmallScreen} {
    justify-self: end;
  }
`;

const Highlight = styled.span`
  background-color: yellow;
`;

function SeedRow({ item, index, toggleFavedSeed, favedSeeds, isHovered, search, searchDisplayed }) {
  const [justFaved, setJustFaved] = React.useState(false);
  const [mouseDown, setMouseDown] = React.useState(false);
  const [justCopied, setJustCopied] = React.useState(0);
  const timeoutRef = React.useRef(null);

  const copyButtonRef = React.useRef();
  const favoriteButtonRef = React.useRef();

  const { seed } = item;
  const seedStr = seed.toString();
  const isFaved = favedSeeds[seedStr] || false;

  // Smart seed display formatting - leading zeros only when needed, with proper alignment
  const formattedSeed = React.useMemo(() => {
    try {
      const seedStr = seed.toString();

      if (seed < 0n) {
        const absoluteSeedStr = seedStr.slice(1); // Remove minus sign

        // For negative numbers, check if absolute value is at maximum length (19 digits)
        if (absoluteSeedStr.length < 19) {
          const paddedAbsolute = absoluteSeedStr.padStart(19, '0');
          return `-${paddedAbsolute}`;
        } else {
          // Full length negative number - no padding needed
          return seedStr;
        }
      } else {
        // For positive numbers, add space prefix to align with negative signs
        if (seedStr.length < 19) {
          return ` ${seedStr.padStart(19, '0')}`;
        } else {
          // Full length positive number - just add space prefix
          return ` ${seedStr}`;
        }
      }
    } catch (e) {
      return seedStr;
    }
  }, [seed, seedStr]);

  // Implement search highlighting - search on actual seed value without leading zeros
  const actualSeedStr = seed.toString(); // The real seed value without formatting
  const highlight = searchDisplayed && search && actualSeedStr.includes(search);
  let seedToDisplay = formattedSeed;

  if (highlight) {
    // For highlighting, we want to show that the search matched the actual seed value
    // So we highlight the corresponding digits in the formatted display, not the leading zeros
    const searchStart = actualSeedStr.indexOf(search);

    if (searchStart >= 0) {
      if (seed < 0n) {
        // For negative seeds: -actualDigits becomes -000...000actualDigits
        const actualDigits = actualSeedStr.slice(1); // Remove minus sign from actual seed
        const actualDigitsStart = actualDigits.indexOf(search);

        if (actualDigitsStart >= 0) {
          // The search is in the digits part (not including minus sign)
          const leadingZerosCount = 19 - actualDigits.length;
          const formattedStart = 1 + leadingZerosCount + actualDigitsStart; // 1 for minus + zeros + position
          const formattedEnd = formattedStart + search.length;

          seedToDisplay = (
            <>
              {formattedSeed.slice(0, formattedStart)}
              <Highlight>{formattedSeed.slice(formattedStart, formattedEnd)}</Highlight>
              {formattedSeed.slice(formattedEnd)}
            </>
          );
        } else if (search.startsWith('-') && actualSeedStr.startsWith(search)) {
          // The search includes the minus sign (e.g., searching for "-123")
          const digitsAfterMinus = search.slice(1);
          const leadingZerosCount = 19 - actualDigits.length;
          const formattedEnd = 1 + leadingZerosCount + digitsAfterMinus.length;

          seedToDisplay = (
            <>
              <Highlight>{formattedSeed.slice(0, formattedEnd)}</Highlight>
              {formattedSeed.slice(formattedEnd)}
            </>
          );
        }
      } else {
        // For positive seeds: actualDigits becomes space + 000...000actualDigits
        const leadingZerosCount = 19 - actualSeedStr.length;
        const formattedStart = 1 + leadingZerosCount + searchStart; // 1 for space + zeros + position
        const formattedEnd = formattedStart + search.length;

        seedToDisplay = (
          <>
            {formattedSeed.slice(0, formattedStart)}
            <Highlight>{formattedSeed.slice(formattedStart, formattedEnd)}</Highlight>
            {formattedSeed.slice(formattedEnd)}
          </>
        );
      }
    }
  }

  // Format index with leading zeros for consistent width
  const formattedIndexParts = React.useMemo(() => {
    const maxDigits = 20;
    const indexStr = index.toString();
    const paddedIndex = indexStr.padStart(maxDigits, '0');

    // Find where the actual number starts (first non-zero digit)
    const firstNonZeroIndex = paddedIndex.search(/[1-9]/);

    if (firstNonZeroIndex === -1) {
      // All zeros case
      return {
        leadingZeros: paddedIndex.slice(0, -1),
        actualDigits: paddedIndex.slice(-1)
      };
    } else {
      return {
        leadingZeros: paddedIndex.slice(0, firstNonZeroIndex),
        actualDigits: paddedIndex.slice(firstNonZeroIndex)
      };
    }
  }, [index]);

  const handleCopy = React.useCallback(async () => {
    clearTimeout(timeoutRef.current);
    await navigator.clipboard
      .writeText(seedStr)
      .catch((e) => {
        console.error("error copying to clipboard", e);
        setJustCopied(0);
      })
      .then(() => {
        setJustCopied((prev) => prev + 1);
        timeoutRef.current = setTimeout(() => {
          setJustCopied(0);
        }, 1000);
      });
  }, [seedStr]);

  const handleToggleFavorite = React.useCallback(() => {
    if (!isFaved) {
      setJustFaved(true);
      setTimeout(() => setJustFaved(false), 800);
    }
    toggleFavedSeed(seed);
  }, [seed, toggleFavedSeed, isFaved]);

  React.useEffect(() => {
    const handleMouseUp = () => {
      if (mouseDown) {
        setMouseDown(false);
        handleCopy();
      }
    };

    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [mouseDown, handleCopy]);

  return (
    <RowWrapper
      onMouseDown={(e) => {
        // only trigger if the click is on the row, not on some text
        if (e.target === e.currentTarget) {
          setMouseDown(true);
        }
      }}
      style={{
        backgroundColor: mouseDown ? "var(--slate-500)" : null,
      }}
      isHovered={isHovered}
    >
      <Index>
        <LeadingZeros>{formattedIndexParts.leadingZeros}</LeadingZeros>
        <ActualIndex>{formattedIndexParts.actualDigits}</ActualIndex>
      </Index>
      <Colon>:</Colon>
      <Seed title={`Seed: ${seedStr}`}>
        {seedToDisplay}
      </Seed>

      <CopyButton
        ref={copyButtonRef}
        $rowMouseDown={mouseDown}
        onClick={handleCopy}
        title="Copy seed to clipboard"
      >
        <ClipboardCopy />
      </CopyButton>

      <FavoriteButton
        ref={favoriteButtonRef}
        $isFaved={isFaved}
        data-just-faved={justFaved}
        onClick={handleToggleFavorite}
        title={isFaved ? "Remove from favorites" : "Add to favorites"}
      >
        <Star fill="var(--fill-color)" />
      </FavoriteButton>

      {justCopied !== 0 && <CopiedText key={justCopied}>Copied!</CopiedText>}
    </RowWrapper>
  );
}

function SeedDisplay({
  itemsToShow,
  setItemsToShow,
  virtualPosition,
  setVirtualPosition,
  favedSeeds,
  toggleFavedSeed,
  isAnimating,
  MAX_POSITION,
  animateToPosition,
  search,
  searchDisplayed,
  displayedSeeds,
}) {
  const wrapperRef = React.useRef();
  const [hoveredRowIndex, setHoveredRowIndex] = React.useState(null);

  // Use a more stable key generation to reduce DOM churn
  const stableDisplayedSeeds = React.useMemo(() => {
    return displayedSeeds.map((item, idx) => ({
      ...item,
      stableKey: `${virtualPosition}-${idx}` // More stable key based on position
    }));
  }, [displayedSeeds, virtualPosition]);

  // Throttle mouse move events to reduce hover state updates
  const mouseMoveThrottleRef = React.useRef();
  const handleMouseMove = React.useCallback((event) => {
    if (mouseMoveThrottleRef.current) return;

    mouseMoveThrottleRef.current = requestAnimationFrame(() => {
      mouseMoveThrottleRef.current = null;

      if (!wrapperRef.current) return;

      const rect = wrapperRef.current.getBoundingClientRect();
      const relativeY = event.clientY - rect.top;
      const itemHeight = window.innerWidth <= 768 ? ITEM_HEIGHT * 2 : ITEM_HEIGHT;
      const newHoveredIndex = Math.floor(relativeY / itemHeight);

      // Only update if meaningfully different and within bounds
      if (Math.abs(newHoveredIndex - (hoveredRowIndex ?? -1)) >= 1 &&
          newHoveredIndex >= 0 &&
          newHoveredIndex < displayedSeeds.length) {
        setHoveredRowIndex(newHoveredIndex);
      }
    });
  }, [hoveredRowIndex, displayedSeeds.length]);

  // Clear hover when mouse leaves
  const handleMouseLeave = React.useCallback(() => {
    if (mouseMoveThrottleRef.current) {
      cancelAnimationFrame(mouseMoveThrottleRef.current);
      mouseMoveThrottleRef.current = null;
    }
    setHoveredRowIndex(null);
  }, []);

  // Optimize wheel handling for blazing fast scrolling
  const handleWheel = React.useCallback(
    (event) => {
      if (isAnimating) return; // Only block during animations, allow scrolling during search

      event.preventDefault();

      // Direct deltaY usage like UUID implementation
      setVirtualPosition((prev) => {
        const delta = BigInt(Math.floor(event.deltaY));
        const newPos = prev + delta;
        return newPos < 0n ? 0n : newPos > MAX_POSITION ? MAX_POSITION : newPos;
      });
    },
    [isAnimating, MAX_POSITION, setVirtualPosition] // Remove searchDisplayed from dependencies
  );

  const handleKeyDown = React.useCallback(
    (event) => {
      if (searchDisplayed) return;

      const step = event.shiftKey ? BigInt(itemsToShow) * 10n : BigInt(itemsToShow);

      switch (event.key) {
        case "ArrowDown":
        case "j":
          event.preventDefault();
          const newPosDown = virtualPosition + step;
          const clampedDown = newPosDown > MAX_POSITION ? MAX_POSITION : newPosDown;
          animateToPosition(clampedDown);
          break;

        case "ArrowUp":
        case "k":
          event.preventDefault();
          const newPosUp = virtualPosition - step;
          const clampedUp = newPosUp < 0n ? 0n : newPosUp;
          animateToPosition(clampedUp);
          break;

        case "Home":
          event.preventDefault();
          animateToPosition(0n);
          break;

        case "End":
          event.preventDefault();
          animateToPosition(MAX_POSITION);
          break;
      }
    },
    [virtualPosition, itemsToShow, MAX_POSITION, animateToPosition, searchDisplayed]
  );

  React.useEffect(() => {
    const updateItemsToShow = () => {
      const height = wrapperRef.current?.clientHeight || 600;
      const itemHeight = window.innerWidth <= 768 ? ITEM_HEIGHT * 2 : ITEM_HEIGHT;
      const newItemsToShow = Math.floor(height / itemHeight) + 5;
      setItemsToShow(newItemsToShow);
    };

    updateItemsToShow();
    window.addEventListener("resize", updateItemsToShow);
    return () => window.removeEventListener("resize", updateItemsToShow);
  }, [setItemsToShow]);

  React.useEffect(() => {
    wrapperRef.current?.focus();
  }, [virtualPosition]);

  // Cleanup animation frame on unmount
  React.useEffect(() => {
    return () => {
      if (mouseMoveThrottleRef.current) {
        cancelAnimationFrame(mouseMoveThrottleRef.current);
      }
    };
  }, []);

  return (
    <Wrapper
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <List>
        {stableDisplayedSeeds.map((item, idx) => {
          if (!item) return null;

          return (
            <SeedRow
              key={item.stableKey} // Use stable key to reduce DOM churn
              item={item}
              index={item.index} // Keep as BigInt instead of converting to Number
              toggleFavedSeed={toggleFavedSeed}
              favedSeeds={favedSeeds}
              isHovered={hoveredRowIndex === idx}
              search={search}
              searchDisplayed={searchDisplayed}
            />
          );
        })}
      </List>
    </Wrapper>
  );
}

export default SeedDisplay;
