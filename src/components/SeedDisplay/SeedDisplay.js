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

  &:selected {
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

  @media ${queryVerySmallScreen} {
    display: none;
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
    --text-size: 0.8rem;
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

  @media (hover: hover) {
    &:hover {
      background-color: var(--slate-400);
    }
  }

  background-color: var(--row-background, transparent);

  @media ${querySmallScreen} {
    grid-template-areas: "index seed copy favorite copied";
    grid-template-columns: repeat(5, fit-content(15px));
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

  @media ${queryVerySmallScreen} {
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

const Index = styled.span`
  opacity: 0.7;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const Padding = styled.span`
  opacity: 0.3;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const IndexWithPadding = styled.div`
  display: inline-block;
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

function SeedRow({ item, index, toggleFavedSeed, favedSeeds, search, searchDisplayed }) {
  const [justFaved, setJustFaved] = React.useState(null);
  const [mouseDown, setMouseDown] = React.useState(false);
  const [justCopied, setJustCopied] = React.useState(0);
  const timeoutRef = React.useRef(null);

  const { seed } = item;
  const seedStr = seed.toString();
  const isFaved = favedSeeds[seedStr] || false;

  // Simple index formatting like UUIDDisplay
  const indexString = index.toString();
  const length = indexString.length;
  const padLength = 20;
  const paddingLength = padLength - length;
  let padding;
  if (paddingLength < 0) {
    console.error("paddingLength < 0", indexString, length, padLength);
    padding = "";
  } else {
    padding = "0".repeat(paddingLength);
  }

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

  React.useEffect(() => {
    if (justFaved && justFaved !== seedStr) {
      setJustFaved(null);
    }
  }, [justFaved, seedStr]);

  const handleToggleFavorite = React.useCallback(() => {
    if (!isFaved) {
      setJustFaved(seedStr);
      setTimeout(() => setJustFaved(null), 800);
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
    >
      <IndexWithPadding style={{ gridArea: "index" }}>
        <Padding>{padding}</Padding>
        <Index>{indexString}</Index>
      </IndexWithPadding>
      <Colon />
      <Seed title={`Seed: ${seedStr}`}>
        {seedToDisplay}
      </Seed>

      <CopyButton
        $rowMouseDown={mouseDown}
        onClick={handleCopy}
        title="Copy seed to clipboard"
      >
        <ClipboardCopy />
      </CopyButton>

      <FavoriteButton
        $isFaved={isFaved}
        data-just-faved={isFaved && justFaved === seedStr}
        onClick={() => {
          if (!isFaved) {
            setJustFaved(seedStr);
          }
          toggleFavedSeed(seed);
        }}
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

  const movePosition = React.useCallback(
    (delta) => {
      setVirtualPosition((prev) => {
        const newPos = prev + delta;
        const ret =
          newPos < 0n ? 0n : newPos > MAX_POSITION ? MAX_POSITION : newPos;
        return ret;
      });
    },
    [MAX_POSITION, setVirtualPosition]
  );

  const handleKeyDown = React.useCallback(
    (event) => {
      if (searchDisplayed) return;
      if (isAnimating) return;

      const e = event;
      const PAGE_SIZE = BigInt(itemsToShow);
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;
      const shiftKey = e.shiftKey;

      const handleAndPrevent = (action) => {
        e.preventDefault();
        action();
      };

      const hasKeyAndModifier = (key, modifiers = []) => {
        return e.key === key && modifiers.every((mod) => mod);
      };

      const handleKeyAndPrevent = (key, modifiers = [], action) => {
        if (hasKeyAndModifier(key, modifiers)) {
          handleAndPrevent(action);
          return true;
        }
        return false;
      };

      const animateWithDelta = (delta) => {
        let target = virtualPosition + delta;
        if (target < 0n) {
          target = 0n;
        } else if (target > MAX_POSITION) {
          target = MAX_POSITION;
        }
        animateToPosition(target);
      };

      switch (true) {
        case handleKeyAndPrevent("ArrowDown", [cmdKey], () => {
          animateWithDelta(MAX_POSITION);
        }):
          return;
        case handleKeyAndPrevent("ArrowUp", [cmdKey], () =>
          animateWithDelta(-MAX_POSITION)
        ):
          return;
        case handleKeyAndPrevent(" ", [shiftKey], () => {
          animateWithDelta(-PAGE_SIZE);
        }):
          return;
        case handleKeyAndPrevent(" ", [], () => {
          animateWithDelta(PAGE_SIZE);
        }):
          return;
        case handleKeyAndPrevent("PageDown", [cmdKey], () => {
          animateWithDelta(MAX_POSITION);
        }):
          return;
        case handleKeyAndPrevent("PageUp", [cmdKey], () => {
          animateWithDelta(0n);
        }):
          return;
        case handleKeyAndPrevent("PageDown", [], () => {
          animateWithDelta(PAGE_SIZE);
        }):
          return;
        case handleKeyAndPrevent("PageUp", [], () => {
          animateWithDelta(-PAGE_SIZE);
        }):
          return;
        case handleKeyAndPrevent("Home", [], () => animateWithDelta(0n)):
          return;
        case handleKeyAndPrevent("End", [], () =>
          animateWithDelta(MAX_POSITION)
        ):
          return;
        case handleKeyAndPrevent("ArrowDown", [], () => movePosition(1n)):
          return;
        case handleKeyAndPrevent("ArrowUp", [], () => movePosition(-1n)):
          return;
        case handleKeyAndPrevent("j", [], () => movePosition(1n)):
          return;
        case handleKeyAndPrevent("k", [], () => movePosition(-1n)):
          return;
        default:
          break;
      }
    },
    [virtualPosition, itemsToShow, MAX_POSITION, animateToPosition, searchDisplayed, isAnimating, movePosition]
  );

  React.useEffect(() => {
    wrapperRef.current?.focus();
  }, [virtualPosition]);

  React.useEffect(() => {
    if (wrapperRef.current === null) return;

    const computeItemsToShow = () => {
      const rect = wrapperRef.current.getBoundingClientRect();
      const height = rect.height;
      const items = Math.floor(height / ITEM_HEIGHT);
      setItemsToShow(items);
    };
    computeItemsToShow();

    window.addEventListener("resize", computeItemsToShow);
    return () => {
      window.removeEventListener("resize", computeItemsToShow);
    };
  }, [setItemsToShow]);

  React.useEffect(() => {
    if (!wrapperRef.current) return;

    const handleWheel = (e) => {
      if (isAnimating) return;
      e.preventDefault();
      movePosition(BigInt(Math.floor(e.deltaY)));
    };

    wrapperRef.current.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    let lastTouchY = 0;
    let lastTouchTime = 0;
    let velocity = 0;
    let animationFrame = null;

    const applyMomentum = () => {
      if (Math.abs(velocity) > 0.5) {
        movePosition(BigInt(Math.floor(velocity)));
        // Decay the velocity - play with these numbers to adjust the "feel"
        velocity *= 0.95;
        animationFrame = requestAnimationFrame(applyMomentum);
      } else {
        velocity = 0;
      }
    };

    const handleTouchStart = (e) => {
      lastTouchY = e.touches[0].clientY;
      lastTouchTime = Date.now();
      velocity = 0;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY;
      const now = Date.now();
      const deltaTime = now - lastTouchTime;

      velocity = (deltaY / deltaTime) * 16.67;

      lastTouchY = touchY;
      lastTouchTime = now;

      movePosition(BigInt(Math.floor(deltaY * 2)));
    };

    const handleTouchEnd = () => {
      // Start momentum scrolling
      if (Math.abs(velocity) > 0.5) {
        animationFrame = requestAnimationFrame(applyMomentum);
      }
    };

    wrapperRef.current.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    wrapperRef.current.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    wrapperRef.current.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    });

    return () => {
      if (!wrapperRef.current) return;
      wrapperRef.current.removeEventListener("wheel", handleWheel);
      wrapperRef.current.removeEventListener("touchstart", handleTouchStart);
      wrapperRef.current.removeEventListener("touchmove", handleTouchMove);
      wrapperRef.current.removeEventListener("touchend", handleTouchEnd);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isAnimating, movePosition]);

  return (
    <Wrapper
      ref={wrapperRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <List>
        {displayedSeeds.map((item, idx) => {
          if (!item) return null;

          return (
            <SeedRow
              key={item.index}
              item={item}
              index={item.index}
              toggleFavedSeed={toggleFavedSeed}
              favedSeeds={favedSeeds}
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

