"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ActFourPhase } from "@/types/actFour";
import { PROJECTS } from "@/utils/constants";

const ACT_FOUR_ENTRY = 0.825;
const ACT_FOUR_EXIT = 0.905;
const PROJECT_COUNT = PROJECTS.length;
const WHEEL_THRESHOLD = 124;
const PROJECT_ADVANCE_LOCK_MS = 1450;
const ACT_FOUR_RETURN_TARGET = 0.92;

export function useActFourSequence(scrollProgress: number) {
  const [phase, setPhase] = useState<ActFourPhase>("locked");
  const [projectIndex, setProjectIndex] = useState(0);
  const [exitArmed, setExitArmed] = useState(false);
  const warpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextAdvanceAt = useRef(0);
  const lockedScrollY = useRef<number | null>(null);
  const projectIndexRef = useRef(0);

  useEffect(() => {
    projectIndexRef.current = projectIndex;
  }, [projectIndex]);

  const clearWarpTimer = useCallback(() => {
    if (warpTimer.current) {
      clearTimeout(warpTimer.current);
      warpTimer.current = null;
    }
  }, []);

  const clearReturnTimer = useCallback(() => {
    if (returnTimer.current) {
      clearTimeout(returnTimer.current);
      returnTimer.current = null;
    }
  }, []);

  const beginWarp = useCallback(() => {
    setPhase((current) => {
      if (current !== "ready") return current;
      clearWarpTimer();
      clearReturnTimer();
      setProjectIndex(0);
      setExitArmed(false);
      lockedScrollY.current = window.scrollY;
      warpTimer.current = setTimeout(() => setPhase("inside"), 1420);
      return "warping";
    });
  }, [clearReturnTimer, clearWarpTimer]);

  useEffect(() => {
    const outsideActFour = scrollProgress < ACT_FOUR_ENTRY || scrollProgress >= ACT_FOUR_EXIT;

    // Once the globe has been entered, its sequence owns navigation. It must
    // never be cancelled by residual Lenis momentum crossing an outer range.
    if (phase === "warping" || phase === "inside") return;

    if (phase === "returning" && scrollProgress < ACT_FOUR_EXIT) return;

    if (outsideActFour) {
      clearWarpTimer();
      clearReturnTimer();
      lockedScrollY.current = null;
      setExitArmed(false);
      setProjectIndex(0);
      setPhase("locked");
      return;
    }

    if (phase === "locked") setPhase("ready");
  }, [clearReturnTimer, clearWarpTimer, phase, scrollProgress]);

  useEffect(() => () => {
    clearWarpTimer();
    clearReturnTimer();
  }, [clearReturnTimer, clearWarpTimer]);

  const projectWorldLocked = phase === "warping" || phase === "inside";

  useEffect(() => {
    if (!projectWorldLocked) return;

    if (lockedScrollY.current === null) lockedScrollY.current = window.scrollY;
    const origin = lockedScrollY.current;
    const htmlOverflow = document.documentElement.style.overflow;
    const bodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("act-four-scroll-lock", { detail: { locked: true } }));
    let frame = 0;
    const holdDocumentPosition = () => {
      if (Math.abs(window.scrollY - origin) > 0.5) window.scrollTo(0, origin);
      frame = requestAnimationFrame(holdDocumentPosition);
    };

    frame = requestAnimationFrame(holdDocumentPosition);
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.style.overflow = htmlOverflow;
      document.body.style.overflow = bodyOverflow;
      window.dispatchEvent(new CustomEvent("act-four-scroll-lock", { detail: { locked: false } }));
    };
  }, [projectWorldLocked]);

  useEffect(() => {
    if (phase === "warping") {
      const blockWarpScroll = (event: WheelEvent) => event.preventDefault();
      window.addEventListener("wheel", blockWarpScroll, { passive: false, capture: true });
      return () => window.removeEventListener("wheel", blockWarpScroll, { capture: true });
    }

    if (phase !== "inside") return;

    let wheelCarry = 0;
    const onWheel = (event: WheelEvent) => {
      wheelCarry += event.deltaY;
      if (Math.abs(wheelCarry) < WHEEL_THRESHOLD) {
        event.preventDefault();
        return;
      }

      const direction = Math.sign(wheelCarry);
      wheelCarry = 0;

      if (performance.now() < nextAdvanceAt.current) {
        event.preventDefault();
        return;
      }

      const currentIndex = projectIndexRef.current;

      if (direction < 0 && currentIndex > 0) {
        event.preventDefault();
        nextAdvanceAt.current = performance.now() + PROJECT_ADVANCE_LOCK_MS;
        projectIndexRef.current = currentIndex - 1;
        setExitArmed(false);
        setProjectIndex(currentIndex - 1);
        return;
      }

      if (direction > 0 && currentIndex < PROJECT_COUNT - 1) {
        event.preventDefault();
        nextAdvanceAt.current = performance.now() + PROJECT_ADVANCE_LOCK_MS;
        projectIndexRef.current = currentIndex + 1;
        setExitArmed(false);
        setProjectIndex(currentIndex + 1);
        return;
      }

      if (direction > 0 && currentIndex === PROJECT_COUNT - 1) {
        // The final plate stays on screen. Leaving the core is a deliberate action.
        event.preventDefault();
        nextAdvanceAt.current = performance.now() + PROJECT_ADVANCE_LOCK_MS;
        setExitArmed(true);
      } else {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", onWheel, { capture: true });
  }, [phase]);

  const exitProjectWorld = useCallback(() => {
    if (phase !== "inside" || !exitArmed) return;
    lockedScrollY.current = null;
    setExitArmed(false);
    setPhase("returning");
    clearReturnTimer();
    returnTimer.current = setTimeout(() => {
      const track = document.querySelector<HTMLElement>("[data-cinematic-track]");
      if (!track) return;
      const travel = Math.max(0, track.offsetHeight - window.innerHeight);
      window.scrollTo({ top: track.offsetTop + travel * ACT_FOUR_RETURN_TARGET, behavior: "auto" });
    }, 920);
  }, [clearReturnTimer, exitArmed, phase]);

  return { phase, beginWarp, projectIndex, exitArmed, exitProjectWorld };
}
