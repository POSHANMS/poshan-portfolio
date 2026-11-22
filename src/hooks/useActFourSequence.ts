"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import type { ActFourPhase } from "@/types/actFour";
import { PROJECTS } from "@/utils/constants";
import { ACT_FIVE_TIMING } from "@/animations/actFiveChoreography";
import { ACT_FOUR_WARP_IN_DURATION_MS } from "@/animations/scrollCamera";

const ACT_FOUR_ENTRY = 0.825;
const ACT_FOUR_EXIT = 0.905;
const ACT_FOUR_GATE_ANCHOR = 0.875;
const PROJECT_COUNT = PROJECTS.length;
const WHEEL_THRESHOLD = 124;
const PROJECT_ADVANCE_LOCK_MS = 720;
// Trackpad momentum can emit sparse tail events long after its initial burst.
const WHEEL_GESTURE_GAP_MS = 180;
// Station 05 is also the vault exit. A longer idle window prevents the tail of
// the 04 -> 05 trackpad gesture from being mistaken for a deliberate exit.
const STATION_FIVE_GESTURE_GAP_MS = 1400;
const EXIT_FADE_MS = 200;
const EXIT_FLIGHT_MS = 900;
const ACT_FOUR_RETURN_TARGET = ACT_FIVE_TIMING.cameraStart + 0.002;
const TRANSITION_PHASES = new Set<ActFourPhase>(["act4_warp_in", "act4_vault", "act4_warp_out"]);

function setTrackProgress(progress: number) {
  const track = document.querySelector<HTMLElement>("[data-cinematic-track]");
  if (!track) return;
  const travel = Math.max(0, track.offsetHeight - window.innerHeight);
  const top = track.offsetTop + travel * progress;
  window.dispatchEvent(new CustomEvent("act-four-set-scroll", { detail: { top } }));
  window.scrollTo({ top, behavior: "auto" });
}

export function useActFourSequence(scrollProgress: number, warpCharge: MutableRefObject<number>) {
  const [phase, setPhase] = useState<ActFourPhase>("act3");
  const [projectIndex, setProjectIndex] = useState(0);
  const [hasCompletedAct4Vault, setHasCompletedAct4Vault] = useState(false);
  const phaseRef = useRef<ActFourPhase>("act3");
  const warpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actFiveHandoffPending = useRef(false);
  const lockedScrollY = useRef<number | null>(null);
  const projectIndexRef = useRef(0);
  const wheelCarry = useRef(0);
  const lastWheelAt = useRef(0);
  const nextAdvanceAt = useRef(0);
  const wheelNeedsFreshGesture = useRef(false);
  const stationFiveExitArmed = useRef(false);
  const scrollProgressRef = useRef(scrollProgress);
  scrollProgressRef.current = scrollProgress;

  const transitionTo = useCallback((next: ActFourPhase) => {
    if (next === "act4_exterior") {
      // Returning from Act III, V, or VI always restores a ready-to-warp gate.
      // Completion remains latched separately so it only unlocks the downward exit.
      warpCharge.current = 0;
      projectIndexRef.current = 0;
      setProjectIndex(0);
    }
    phaseRef.current = next;
    setPhase(next);
  }, [warpCharge]);

  const clearWarpTimer = useCallback(() => {
    if (warpTimer.current) clearTimeout(warpTimer.current);
    warpTimer.current = null;
  }, []);
  const clearExitTimer = useCallback(() => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
    exitTimer.current = null;
  }, []);

  const beginWarp = useCallback(() => {
    if (phaseRef.current !== "act4_exterior") return;
    clearWarpTimer();
    clearExitTimer();
    projectIndexRef.current = 0;
    setProjectIndex(0);
    lockedScrollY.current = window.scrollY;
    transitionTo("act4_warp_in");
    warpTimer.current = setTimeout(() => transitionTo("act4_vault"), ACT_FOUR_WARP_IN_DURATION_MS);
  }, [clearExitTimer, clearWarpTimer, transitionTo]);

  const exitProjectWorld = useCallback(() => {
    if (phaseRef.current !== "act4_vault") return;
    clearExitTimer();
    transitionTo("act4_warp_out");
    exitTimer.current = setTimeout(() => {
      setHasCompletedAct4Vault(true);
      exitTimer.current = setTimeout(() => {
        projectIndexRef.current = 0;
        setProjectIndex(0);
        lockedScrollY.current = null;
        actFiveHandoffPending.current = true;
        // Prepare Act V's checkpoint scroll position before revealing its scene.
        // This keeps its already-authored CHECKPOINT 01 / 04 reset untouched and
        // prevents a single frame of the prior vault environment behind the HUD.
        window.dispatchEvent(new CustomEvent("act-four-scroll-lock", { detail: { locked: false } }));
        setTrackProgress(ACT_FOUR_RETURN_TARGET);
        requestAnimationFrame(() => {
          transitionTo("act5");
          requestAnimationFrame(() => { actFiveHandoffPending.current = false; });
        });
      }, EXIT_FLIGHT_MS);
    }, EXIT_FADE_MS);
  }, [clearExitTimer, transitionTo]);

  useEffect(() => {
    if (!TRANSITION_PHASES.has(phase)) {
      // The phase changes just before the controlled scroll is corrected to the
      // Act V entry key. Hold the committed handoff through that one-frame gap.
      if (phase === "act5" && hasCompletedAct4Vault && actFiveHandoffPending.current) return;
      if (scrollProgress < ACT_FOUR_ENTRY) {
        projectIndexRef.current = 0;
        if (projectIndex !== 0) setProjectIndex(0);
        if (phase !== "act3") transitionTo("act3");
      } else if (scrollProgress < ACT_FOUR_EXIT || hasCompletedAct4Vault) {
        if (phase !== "act4_exterior" && scrollProgress < ACT_FOUR_EXIT) transitionTo("act4_exterior");
        else if (scrollProgress >= ACT_FOUR_EXIT) {
          const next = scrollProgress < ACT_FIVE_TIMING.sceneExit ? "act5" : "act6";
          if (phase !== next) transitionTo(next);
        }
      } else {
        // Catch End/PageDown and large wheel bursts before Act V can render over
        // an uncompleted gate. The approved Act V checkpoint reset is untouched.
        setTrackProgress(ACT_FOUR_GATE_ANCHOR);
        transitionTo("act4_exterior");
        window.dispatchEvent(new CustomEvent("act-four-gate-pulse", { detail: { at: performance.now() } }));
      }
    }
  }, [hasCompletedAct4Vault, phase, projectIndex, scrollProgress, transitionTo]);

  useEffect(() => () => {
    clearWarpTimer();
    clearExitTimer();
  }, [clearExitTimer, clearWarpTimer]);

  useEffect(() => {
    let lastPulseAt = 0;
    let touchStartY: number | null = null;
    const getTrackProgressAt = (scrollY: number) => {
      const track = document.querySelector<HTMLElement>("[data-cinematic-track]");
      if (!track) return scrollProgressRef.current;
      const travel = Math.max(1, track.offsetHeight - window.innerHeight);
      return (scrollY - track.offsetTop) / travel;
    };
    const landOnGate = () => {
      setTrackProgress(ACT_FOUR_GATE_ANCHOR);
      transitionTo("act4_exterior");
      window.dispatchEvent(new CustomEvent("act-four-gate-pulse", { detail: { at: performance.now() } }));
    };
    const emitResistance = () => {
      const now = performance.now();
      if (now - lastPulseAt < 350) return;
      lastPulseAt = now;
      window.dispatchEvent(new CustomEvent("act-four-gate-pulse", { detail: { at: now } }));
    };
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY <= 0 || hasCompletedAct4Vault) return;
      if (phaseRef.current !== "act4_exterior" && phaseRef.current !== "act3") return;
      const current = Math.max(scrollProgressRef.current, getTrackProgressAt(window.scrollY));
      const projected = getTrackProgressAt(window.scrollY + event.deltaY);
      if (current < ACT_FOUR_ENTRY && projected < ACT_FOUR_ENTRY) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (current < ACT_FOUR_ENTRY) landOnGate();
      else emitResistance();
    };
    const onTouchStart = (event: TouchEvent) => { touchStartY = event.touches[0]?.clientY ?? null; };
    const onTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY;
      if (phaseRef.current !== "act4_exterior" && phaseRef.current !== "act3") { touchStartY = currentY ?? touchStartY; return; }
      if (touchStartY !== null && currentY !== undefined && currentY < touchStartY && !hasCompletedAct4Vault) {
        const current = Math.max(scrollProgressRef.current, getTrackProgressAt(window.scrollY));
        const projected = getTrackProgressAt(window.scrollY + touchStartY - currentY);
        if (current >= ACT_FOUR_ENTRY || projected >= ACT_FOUR_ENTRY) {
          event.preventDefault();
          event.stopImmediatePropagation();
          if (current < ACT_FOUR_ENTRY) landOnGate();
          else emitResistance();
        }
      }
      touchStartY = currentY ?? touchStartY;
    };
    const onTouchEnd = () => { touchStartY = null; };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!["ArrowDown", "PageDown", "End"].includes(event.key) || hasCompletedAct4Vault) return;
      if (phaseRef.current !== "act4_exterior" && phaseRef.current !== "act3") return;
      const current = Math.max(scrollProgressRef.current, getTrackProgressAt(window.scrollY));
      const distance = event.key === "ArrowDown" ? 48 : event.key === "PageDown" ? window.innerHeight * 0.88 : Number.POSITIVE_INFINITY;
      if (current < ACT_FOUR_ENTRY && getTrackProgressAt(window.scrollY + distance) < ACT_FOUR_ENTRY) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (current < ACT_FOUR_ENTRY) landOnGate();
      else emitResistance();
    };
    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    window.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });
    window.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { capture: true, passive: true });
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("touchend", onTouchEnd, { capture: true });
      window.removeEventListener("touchcancel", onTouchEnd, { capture: true });
      window.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, [hasCompletedAct4Vault, transitionTo]);

  const projectWorldLocked = TRANSITION_PHASES.has(phase);
  useEffect(() => {
    if (!projectWorldLocked) return;
    if (lockedScrollY.current === null) lockedScrollY.current = window.scrollY;
    const origin = lockedScrollY.current;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("act-four-scroll-lock", { detail: { locked: true } }));
    let frame = 0;
    if (phase !== "act4_warp_out") {
      const holdDocumentPosition = () => {
        if (Math.abs(window.scrollY - origin) > 0.5) window.scrollTo(0, origin);
        frame = requestAnimationFrame(holdDocumentPosition);
      };
      frame = requestAnimationFrame(holdDocumentPosition);
    }
    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      window.dispatchEvent(new CustomEvent("act-four-scroll-lock", { detail: { locked: false } }));
    };
  }, [phase, projectWorldLocked]);

  useEffect(() => {
    if (phase !== "act4_warp_in" && phase !== "act4_vault") return;
    wheelCarry.current = 0;
    lastWheelAt.current = 0;
    nextAdvanceAt.current = 0;
    wheelNeedsFreshGesture.current = false;
    stationFiveExitArmed.current = false;
    let touchStart: { y: number; startedAt: number } | null = null;
    const onWheel = (event: WheelEvent) => {
      const now = performance.now();
      const gestureGap = projectIndexRef.current === PROJECT_COUNT - 1
        ? STATION_FIVE_GESTURE_GAP_MS
        : WHEEL_GESTURE_GAP_MS;
      const startsFreshGesture = now - lastWheelAt.current >= gestureGap;
      lastWheelAt.current = now;
      if (phase !== "act4_vault") { wheelCarry.current = 0; event.preventDefault(); return; }
      if (now < nextAdvanceAt.current) { wheelCarry.current = 0; event.preventDefault(); return; }
      if (wheelNeedsFreshGesture.current) {
        wheelCarry.current = 0;
        if (!startsFreshGesture) { event.preventDefault(); return; }
        wheelNeedsFreshGesture.current = false;
      }
      wheelCarry.current += event.deltaY;
      if (Math.abs(wheelCarry.current) < WHEEL_THRESHOLD) { event.preventDefault(); return; }
      const direction = Math.sign(wheelCarry.current);
      wheelCarry.current = 0;
      const current = projectIndexRef.current;
      if (direction < 0 && current > 0) {
        event.preventDefault();
        nextAdvanceAt.current = now + PROJECT_ADVANCE_LOCK_MS;
        wheelNeedsFreshGesture.current = true;
        projectIndexRef.current = current - 1; setProjectIndex(current - 1); return;
      }
      if (direction > 0 && current < PROJECT_COUNT - 1) {
        event.preventDefault();
        nextAdvanceAt.current = now + PROJECT_ADVANCE_LOCK_MS;
        wheelNeedsFreshGesture.current = true;
        if (current === PROJECT_COUNT - 2) stationFiveExitArmed.current = false;
        projectIndexRef.current = current + 1; setProjectIndex(current + 1); return;
      }
      if (direction > 0 && current === PROJECT_COUNT - 1) {
        event.preventDefault();
        nextAdvanceAt.current = now + PROJECT_ADVANCE_LOCK_MS;
        if (!stationFiveExitArmed.current) {
          stationFiveExitArmed.current = true;
          wheelNeedsFreshGesture.current = true;
          return;
        }
        exitProjectWorld();
      } else event.preventDefault();
    };
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      touchStart = touch ? { y: touch.clientY, startedAt: performance.now() } : null;
    };
    const onTouchMove = (event: TouchEvent) => { if (phase === "act4_vault") event.preventDefault(); };
    const onTouchEnd = (event: TouchEvent) => {
      if (phase !== "act4_vault" || touchStart === null) { touchStart = null; return; }
      const endY = event.changedTouches[0]?.clientY;
      if (endY === undefined) { touchStart = null; return; }
      const { y: startY, startedAt } = touchStart;
      const distance = startY - endY;
      touchStart = null;
      if (startedAt < nextAdvanceAt.current || performance.now() < nextAdvanceAt.current) return;
      if (Math.abs(distance) < 36) return;
      const current = projectIndexRef.current;
      const direction = distance > 0 ? 1 : -1;
      if (direction < 0 && current > 0) {
        nextAdvanceAt.current = performance.now() + PROJECT_ADVANCE_LOCK_MS;
        wheelCarry.current = 0;
        wheelNeedsFreshGesture.current = true;
        projectIndexRef.current = current - 1; setProjectIndex(current - 1);
      } else if (direction > 0 && current < PROJECT_COUNT - 1) {
        nextAdvanceAt.current = performance.now() + PROJECT_ADVANCE_LOCK_MS;
        wheelCarry.current = 0;
        wheelNeedsFreshGesture.current = true;
        projectIndexRef.current = current + 1; setProjectIndex(current + 1);
      } else if (direction > 0 && current === PROJECT_COUNT - 1) {
        nextAdvanceAt.current = performance.now() + PROJECT_ADVANCE_LOCK_MS;
        wheelCarry.current = 0;
        exitProjectWorld();
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true, capture: true });
    return () => {
      window.removeEventListener("wheel", onWheel, { capture: true });
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("touchend", onTouchEnd, { capture: true });
    };
  }, [exitProjectWorld, phase]);

  useEffect(() => {
    if (phase !== "act4_vault") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditing = target instanceof HTMLElement
        && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (isEditing || event.altKey || event.ctrlKey || event.metaKey) return;

      if (event.key === "Escape") {
        event.preventDefault();
        exitProjectWorld();
        return;
      }

      if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key) || event.repeat) return;
      event.preventDefault();
      const current = projectIndexRef.current;
      const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
      if (forward && current === PROJECT_COUNT - 1) {
        exitProjectWorld();
        return;
      }
      const next = Math.max(0, Math.min(PROJECT_COUNT - 1, current + (forward ? 1 : -1)));
      if (next === current) return;
      wheelCarry.current = 0;
      nextAdvanceAt.current = 0;
      lastWheelAt.current = performance.now();
      wheelNeedsFreshGesture.current = true;
      stationFiveExitArmed.current = false;
      projectIndexRef.current = next;
      setProjectIndex(next);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [exitProjectWorld, phase]);

  const selectProject = useCallback((index: number) => {
    if (phaseRef.current !== "act4_vault" || !Number.isFinite(index)) return;
    const next = Math.max(0, Math.min(PROJECT_COUNT - 1, Math.round(index)));
    wheelCarry.current = 0;
    nextAdvanceAt.current = 0;
    lastWheelAt.current = performance.now();
    wheelNeedsFreshGesture.current = true;
    stationFiveExitArmed.current = false;
    projectIndexRef.current = next;
    setProjectIndex(next);
  }, []);

  return { phase, beginWarp, projectIndex, exitProjectWorld, selectProject, hasCompletedAct4Vault };
}
