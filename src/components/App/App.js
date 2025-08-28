import React from "react";
import styled from "styled-components";
import Header from "../Header/Header";
import Scrollbar from "../Scrollbar/Scrollbar";
import { MAX_SEED_INDEX } from "../../../lib/constants";
import SeedDisplay from "../SeedDisplay/SeedDisplay";
import SearchWidget from "../SearchWidget/SearchWidget";
import FavoritesWidget from "../FavoritesWidget";
import { indexToSeed, seedToIndex } from "../../../lib/seedTools";
import JokeOverlay from "../JokeOverlay/JokeOverlay";

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 100svh;
  max-height: 100svh;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  overscroll-behavior: none;
`;

const HeaderAndContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
`;

const Content = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: row;
  flex: 1;
  min-height: 0;
  overscroll-behavior: none;
`;

function App() {
  const [virtualPosition, setVirtualPosition] = React.useState(0n);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [targetPosition, setTargetPosition] = React.useState(null);
  const [itemsToShow, setItemsToShow] = React.useState(40);
  const [search, setSearch] = React.useState("");
  const [searchDisplayed, setSearchDisplayed] = React.useState(false);
  const [showFavorites, _setShowFavorites] = React.useState(false);
  const animationRef = React.useRef(null);

  const [favedSeeds, setFavedSeeds] = React.useState(
    localStorage.getItem("favedSeeds")
      ? JSON.parse(localStorage.getItem("favedSeeds"))
      : {}
  );

  const setShowFavorites = React.useCallback(
    (value) => {
      setVirtualPosition(0n);
      _setShowFavorites(value);
    },
    [_setShowFavorites]
  );

  const MAX_POSITION = React.useMemo(() => {
    if (showFavorites) {
      const itemsToShowBig = BigInt(itemsToShow);
      const favedSeedsLength = BigInt(Object.keys(favedSeeds).length);
      if (favedSeedsLength > itemsToShowBig) {
        return favedSeedsLength - itemsToShowBig;
      }
      return 0n;
    } else return MAX_SEED_INDEX - BigInt(itemsToShow);
  }, [itemsToShow, showFavorites, favedSeeds]);

  const toggleFavedSeed = (seed) => {
    setFavedSeeds((prev) => {
      const seedKey = seed.toString(); // Convert BigInt to string for storage
      const prevValue = prev[seedKey] || false;
      const newValue = !prevValue;
      const newFavedSeeds = { ...prev };
      if (newValue) {
        newFavedSeeds[seedKey] = true;
      } else {
        delete newFavedSeeds[seedKey];
      }

      localStorage.setItem("favedSeeds", JSON.stringify(newFavedSeeds));
      return newFavedSeeds;
    });
  };

  const animateToPosition = React.useCallback(
    (targetPos) => {
      setTargetPosition(targetPos);
      setIsAnimating(true);
    },
    [setTargetPosition, setIsAnimating]
  );

  React.useEffect(() => {
    if (isAnimating && targetPosition !== null) {
      const startPosition = virtualPosition;
      const startTime = performance.now();
      const duration = 300;

      const animate = () => {
        // we can't use the currentTime provided by animate because it's not guaranteed
        // to be after startTime!
        const currentTime = performance.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const currentPos =
          startPosition +
          ((targetPosition - startPosition) *
            BigInt(Math.floor(easeProgress * 1000))) /
            1000n;

        setVirtualPosition(currentPos);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setVirtualPosition(targetPosition);
          setIsAnimating(false);
          setTargetPosition(null);
        }
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
    // we intentionally want to save off an "old" copy of virtual position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating, targetPosition]);

  const displayedSeeds = React.useMemo(() => {
    if (showFavorites) {
      const allSeeds = Object.keys(favedSeeds)
        .map((seedStr) => {
          const seed = BigInt(seedStr);
          const index = seedToIndex(seed);
          if (index === null) {
            console.error("no index", seed);
            return null;
          }
          return {
            index,
            seed,
          };
        })
        .filter((item) => item !== null)
        .sort((a, b) => {
          const delta = a.index - b.index;
          if (delta < 0n) return -1;
          if (delta > 0n) return 1;
          return 0;
        });
      let startIndex = virtualPosition;
      let endIndex = startIndex + BigInt(itemsToShow);
      if (startIndex > MAX_POSITION) {
        startIndex = MAX_POSITION;
      }
      return allSeeds.slice(Number(startIndex), Number(endIndex));
    }
    return Array.from({ length: itemsToShow }, (_, i) => {
      const index = virtualPosition + BigInt(i);
      if (index < 0n) {
        return null;
      }
      if (index > MAX_SEED_INDEX) {
        return null;
      }
      const seed = indexToSeed(index);
      if (!seed && seed !== 0n) {
        console.error("no seed", index);
        return null;
      }
      return { index, seed };
    });
  }, [virtualPosition, itemsToShow, showFavorites, favedSeeds, MAX_POSITION]);

  const firstSeed = React.useMemo(() => {
    if (showFavorites) {
      const firstSeedStr = Object.keys(favedSeeds)[0];
      return firstSeedStr ? BigInt(firstSeedStr) : null;
    }
    return indexToSeed(virtualPosition);
  }, [virtualPosition, showFavorites, favedSeeds]);

  const [browserHash, setBrowserHash] = React.useState(null);

  React.useEffect(() => {
    setBrowserHash(window.location.hash);
    const handleHashChange = () => {
      setBrowserHash(window.location.hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const hashContainsTheo = React.useMemo(() => {
    if (!browserHash) {
      return false;
    }
    const hash = browserHash.slice(1);
    return hash.includes("theo");
  }, [browserHash]);

  return (
    <>
      {hashContainsTheo && <JokeOverlay firstSeed={firstSeed} />}
      <SearchWidget
        animateToPosition={animateToPosition}
        virtualPosition={virtualPosition}
        setVirtualPosition={setVirtualPosition}
        search={search}
        setSearch={setSearch}
        searchDisplayed={searchDisplayed}
        setSearchDisplayed={setSearchDisplayed}
        displayedSeeds={displayedSeeds}
        MAX_POSITION={MAX_POSITION}
      />
      <FavoritesWidget
        setShowFavorites={setShowFavorites}
        isShowingFavorites={showFavorites}
      />
      <Wrapper>
        <HeaderAndContent>
          <Header />
          <Content>
            <SeedDisplay
              itemsToShow={itemsToShow}
              setItemsToShow={setItemsToShow}
              virtualPosition={virtualPosition}
              setVirtualPosition={setVirtualPosition}
              favedSeeds={favedSeeds}
              toggleFavedSeed={toggleFavedSeed}
              isAnimating={isAnimating}
              MAX_POSITION={MAX_POSITION}
              animateToPosition={animateToPosition}
              search={search}
              searchDisplayed={searchDisplayed}
              displayedSeeds={displayedSeeds}
            />
          </Content>
        </HeaderAndContent>
        <Scrollbar
          virtualPosition={virtualPosition}
          setVirtualPosition={setVirtualPosition}
          MAX_POSITION={MAX_POSITION}
          animateToPosition={animateToPosition}
          setIsAnimating={setIsAnimating}
        />
      </Wrapper>
    </>
  );
}

export default App;
