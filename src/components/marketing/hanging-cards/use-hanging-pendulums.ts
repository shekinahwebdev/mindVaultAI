"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

import {
  HANGING_CARD_PHYSICS,
  clamp,
  hangingPose,
  limitsForSpan,
  stepPendulum,
  type PendulumConfig,
} from "./pendulum";

type PendulumNodes = {
  column: HTMLDivElement | null;
  card: HTMLDivElement | null;
  ring: HTMLSpanElement | null;
};

type Runtime = {
  angle: number;
  velocity: number;
  twist: number;
  length: number;
  lengthLocked: boolean;
  dragging: boolean;
  idle: boolean;
  delayUntil: number;
  pointerTime: number;
  grabOffset: number;
};

const MOBILE_QUERY = "(max-width: 767px)";
const REDUCE_QUERY = "(prefers-reduced-motion: reduce)";

function createRuntime(angle: number): Runtime {
  return {
    angle,
    velocity: 0,
    twist: 0,
    length: 72,
    lengthLocked: false,
    dragging: false,
    idle: true,
    delayUntil: 0,
    pointerTime: 0,
    grabOffset: 0,
  };
}

function swingSpan(width: number) {
  if (width < 1024) return 0.48;
  if (width < 1200) return 0.76;
  return 1;
}

function setElementLayer(element: HTMLDivElement | null, layer: string) {
  if (!element) return;
  element.style.zIndex = layer;
}

export function useHangingPendulums() {
  const nodes = useRef<PendulumNodes[]>(
    HANGING_CARD_PHYSICS.map(() => ({
      column: null,
      card: null,
      ring: null,
    })),
  );
  const sims = useRef<Runtime[]>(HANGING_CARD_PHYSICS.map((config) => createRuntime(config.restAngle)));
  const configsRef = useRef(HANGING_CARD_PHYSICS.map((config) => ({ ...config })));
  const installationRef = useRef<HTMLDivElement>(null);
  const sharedAnchorRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const threadLinesRef = useRef<(SVGLineElement | null)[]>(HANGING_CARD_PHYSICS.map(() => null));
  const mobileRef = useRef(false);
  const reducedRef = useRef(false);
  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const lastFrameRef = useRef(0);
  const stepFrameRef = useRef<(now: number) => void>(() => {});
  const stepIdleRef = useRef<(now: number) => void>(() => {});
  const idleLoopRef = useRef(false);

  const updateThreadGeometry = useCallback(() => {
    const install = installationRef.current;
    const anchor = sharedAnchorRef.current;
    if (!install || !anchor) return;

    const installRect = install.getBoundingClientRect();
    const anchorRect = anchor.getBoundingClientRect();
    const x1 = anchorRect.left + anchorRect.width / 2 - installRect.left;
    const y1 = anchorRect.top + anchorRect.height / 2 - installRect.top;

    nodes.current.forEach((node, index) => {
      const line = threadLinesRef.current[index];
      const ring = node.ring;
      if (!line || !ring) return;
      const ringRect = ring.getBoundingClientRect();
      const x2 = ringRect.left + ringRect.width / 2 - installRect.left;
      const y2 = ringRect.top + ringRect.height / 2 - installRect.top;
      line.setAttribute("x1", String(x1));
      line.setAttribute("y1", String(y1));
      line.setAttribute("x2", String(x2));
      line.setAttribute("y2", String(y2));
    });
  }, []);

  const configFor = useCallback((index: number): PendulumConfig => {
    const card = configsRef.current[index] ?? HANGING_CARD_PHYSICS[index];
    const span = mobileRef.current ? 0 : swingSpan(window.innerWidth);
    const limits = limitsForSpan(card, span);
    if (!reducedRef.current) return limits;
    return { ...limits, stiffness: 18, damping: 14 };
  }, []);

  const layoutTiltRad = useCallback((index: number) => {
    const layout = HANGING_CARD_PHYSICS[index]?.id;
    if (layout === "save") return -0.06;
    if (layout === "find") return 0.06;
    return 0;
  }, []);

  const applyPose = useCallback(
    (index: number) => {
      const anchor = sharedAnchorRef.current;
      const node = nodes.current[index];
      const sim = sims.current[index];
      const config = configsRef.current[index] ?? HANGING_CARD_PHYSICS[index];
      if (!anchor || !node?.card || !sim || !config) return;

      const anchorRect = anchor.getBoundingClientRect();
      const ax = anchorRect.left + anchorRect.width / 2;
      const ay = anchorRect.top + anchorRect.height / 2;
      const length = sim.length;
      const theta = sim.angle;
      const restTheta = config.restAngle;

      const targetX = ax + Math.sin(theta) * length;
      const targetY = ay + Math.cos(theta) * length;
      const restX = ax + Math.sin(restTheta) * length;
      const restY = ay + Math.cos(restTheta) * length;

      const pose = hangingPose(theta, sim.twist, length);
      const dx = targetX - restX;
      const dy = targetY - restY;
      const tilt = -pose.tilt + layoutTiltRad(index);

      node.card.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${tilt}rad)`;
      updateThreadGeometry();
    },
    [layoutTiltRad, updateThreadGeometry],
  );

  const calibrateLayout = useCallback(() => {
    const anchor = sharedAnchorRef.current;
    if (!anchor) return;

    sims.current.forEach((_, index) => {
      const card = nodes.current[index]?.card;
      if (!card) return;
      card.style.transform = `rotate(${layoutTiltRad(index)}rad)`;
    });

    const anchorRect = anchor.getBoundingClientRect();
    const ax = anchorRect.left + anchorRect.width / 2;
    const ay = anchorRect.top + anchorRect.height / 2;

    sims.current.forEach((sim, index) => {
      const ring = nodes.current[index]?.ring;
      const cfg = configsRef.current[index];
      if (!ring || !cfg) return;
      const ringRect = ring.getBoundingClientRect();
      const dx = ringRect.left + ringRect.width / 2 - ax;
      const dy = ringRect.top + ringRect.height / 2 - ay;
      const length = Math.hypot(dx, dy);
      if (length < 28) return;

      const restAngle = Math.atan2(dx, Math.max(dy, 12));
      const swing = index === 1 ? 0.2 : 0.24;

      cfg.restAngle = restAngle;
      cfg.minAngle = restAngle - swing;
      cfg.maxAngle = restAngle + swing;
      sim.length = length;
      sim.lengthLocked = true;
      sim.angle = restAngle;
      sim.velocity = 0;
      sim.twist = 0;
    });

    sims.current.forEach((_, index) => applyPose(index));
    updateThreadGeometry();
  }, [applyPose, layoutTiltRad, updateThreadGeometry]);

  const setWillChange = useCallback((index: number, active: boolean) => {
    const node = nodes.current[index];
    const value = active ? "transform" : "";
    if (node?.card) node.card.style.willChange = value;
  }, []);

  const syncDraggingCursor = useCallback(() => {
    const dragging = sims.current.some((sim) => sim.dragging);
    document.body.classList.toggle("hanging-card-dragging", dragging);
  }, []);

  const stopIdleLoop = useCallback(() => {
    idleLoopRef.current = false;
    if (!runningRef.current && rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const stopLoop = useCallback(() => {
    runningRef.current = false;
    stopIdleLoop();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, [stopIdleLoop]);

  const stepIdleFrame = useCallback(
    (now: number) => {
      if (!idleLoopRef.current || mobileRef.current || reducedRef.current) return;
      if (sims.current.some((sim) => sim.dragging || !sim.idle)) {
        idleLoopRef.current = false;
        return;
      }

      const t = now / 1000;
      HANGING_CARD_PHYSICS.forEach((template, index) => {
        if (template.idleAmplitude < 0.001) return;
        const sim = sims.current[index];
        const card = configsRef.current[index];
        if (!sim || !card) return;
        sim.angle = card.restAngle + template.idleAmplitude * Math.sin(t * 0.5 + template.idlePhase);
        sim.velocity = 0;
        sim.twist = 0;
        applyPose(index);
      });

      rafRef.current = requestAnimationFrame((time) => stepIdleRef.current(time));
    },
    [applyPose],
  );

  const startIdleLoop = useCallback(() => {
    if (idleLoopRef.current || mobileRef.current || reducedRef.current) return;
    if (sims.current.some((sim) => sim.dragging || !sim.idle)) return;
    idleLoopRef.current = true;
    rafRef.current = requestAnimationFrame((time) => stepIdleRef.current(time));
  }, []);

  const stepFrame = useCallback(
    (now: number) => {
      const dt = Math.min((now - lastFrameRef.current) / 1000, 0.034);
      lastFrameRef.current = now;
      let active = false;

      sims.current.forEach((sim, index) => {
        if (sim.dragging) {
          active = true;
          return;
        }
        if (sim.idle) return;
        if (now < sim.delayUntil) {
          active = true;
          return;
        }

        const next = stepPendulum(sim, configFor(index), dt);
        sim.angle = next.angle;
        sim.velocity = next.velocity;
        sim.twist = next.twist;
        applyPose(index);

        const restAngle = configsRef.current[index]?.restAngle ?? HANGING_CARD_PHYSICS[index].restAngle;
        if (next.velocity === 0 && next.twist === 0 && next.angle === restAngle) {
          sim.idle = true;
          setWillChange(index, false);
          setElementLayer(nodes.current[index]?.column ?? null, "");
          return;
        }
        active = true;
      });

      if (active) {
        rafRef.current = requestAnimationFrame((time) => stepFrameRef.current(time));
        return;
      }
      runningRef.current = false;
      rafRef.current = 0;
      updateThreadGeometry();
      startIdleLoop();
    },
    [applyPose, configFor, setWillChange, startIdleLoop, updateThreadGeometry],
  );

  const ensureLoop = useCallback(() => {
    if (runningRef.current || mobileRef.current) return;
    stopIdleLoop();
    runningRef.current = true;
    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame((time) => stepFrameRef.current(time));
  }, [stopIdleLoop]);

  const restAll = useCallback(() => {
    sims.current.forEach((sim, index) => {
      const config = configsRef.current[index] ?? HANGING_CARD_PHYSICS[index];
      sim.angle = config.restAngle;
      sim.velocity = 0;
      sim.twist = 0;
      sim.dragging = false;
      sim.idle = true;
      sim.delayUntil = 0;
      sim.lengthLocked = false;
      applyPose(index);
      setWillChange(index, false);
      setElementLayer(nodes.current[index]?.column ?? null, "");
    });
    syncDraggingCursor();
    stopLoop();
    calibrateLayout();
  }, [applyPose, calibrateLayout, setWillChange, stopLoop, syncDraggingCursor]);

  useLayoutEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    const reduceQuery = window.matchMedia(REDUCE_QUERY);

    stepFrameRef.current = stepFrame;
    stepIdleRef.current = stepIdleFrame;

    const readMode = () => {
      mobileRef.current = mobileQuery.matches;
      reducedRef.current = reduceQuery.matches;
    };

    const playEntrance = () => {
      const now = performance.now();
      const span = swingSpan(window.innerWidth);
      sims.current.forEach((sim, index) => {
        const card = configsRef.current[index] ?? HANGING_CARD_PHYSICS[index];
        const template = HANGING_CARD_PHYSICS[index];
        const limits = limitsForSpan(card, span);
        sim.angle = clamp(card.restAngle + template.entranceOffset * span, limits.minAngle, limits.maxAngle);
        sim.velocity = template.entranceOffset * 0.28 * span;
        sim.twist = 0;
        sim.dragging = false;
        sim.idle = false;
        sim.lengthLocked = false;
        sim.delayUntil = now + 220 + index * 165;
        setWillChange(index, true);
        applyPose(index);
      });
      stopIdleLoop();
      ensureLoop();
    };

    const sync = (allowEntrance: boolean) => {
      readMode();
      if (mobileRef.current || reducedRef.current || !allowEntrance) {
        calibrateLayout();
        restAll();
        return;
      }
      calibrateLayout();
      playEntrance();
    };

    sync(true);

    const onModeChange = () => {
      const wasMobile = mobileRef.current;
      readMode();
      if (mobileRef.current) {
        calibrateLayout();
        restAll();
        return;
      }
      if (wasMobile || reducedRef.current) {
        calibrateLayout();
        restAll();
      }
    };

    const onResize = () => {
      stopIdleLoop();
      sims.current.forEach((sim) => {
        sim.lengthLocked = false;
      });
      calibrateLayout();
    };

    const onHide = () => {
      if (document.hidden) stopLoop();
      else if (sims.current.some((sim) => !sim.idle || sim.dragging)) ensureLoop();
    };

    mobileQuery.addEventListener("change", onModeChange);
    reduceQuery.addEventListener("change", onModeChange);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onHide);

    return () => {
      mobileQuery.removeEventListener("change", onModeChange);
      reduceQuery.removeEventListener("change", onModeChange);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onHide);
      document.body.classList.remove("hanging-card-dragging");
      stopLoop();
    };
  }, [applyPose, calibrateLayout, ensureLoop, restAll, setWillChange, stepFrame, stepIdleFrame, stopIdleLoop, stopLoop]);

  const angleFromPointer = useCallback((_index: number, clientX: number, clientY: number) => {
    const anchor = sharedAnchorRef.current;
    if (!anchor) return sims.current[0]?.angle ?? 0;
    const rect = anchor.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    return Math.atan2(dx, Math.max(dy, 16));
  }, []);

  const onPointerDown = useCallback(
    (index: number, event: ReactPointerEvent<HTMLElement>) => {
      if (mobileRef.current || event.button !== 0) return;
      const sim = sims.current[index];
      if (!sim) return;
      sim.dragging = true;
      sim.idle = false;
      sim.delayUntil = 0;
      sim.velocity = 0;
      sim.pointerTime = performance.now();
      sim.grabOffset = sim.angle - angleFromPointer(index, event.clientX, event.clientY);
      stopIdleLoop();
      applyPose(index);
      setWillChange(index, true);
      setElementLayer(nodes.current[index]?.column ?? null, "30");
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Capture can fail if the pointer is already gone.
      }
      syncDraggingCursor();
      ensureLoop();
    },
    [angleFromPointer, applyPose, ensureLoop, setWillChange, stopIdleLoop, syncDraggingCursor],
  );

  const onPointerMove = useCallback(
    (index: number, event: ReactPointerEvent<HTMLElement>) => {
      const sim = sims.current[index];
      if (!sim?.dragging) return;
      const now = performance.now();
      const dt = Math.max((now - sim.pointerTime) / 1000, 0.001);
      const limits = configFor(index);
      const nextAngle = clamp(
        angleFromPointer(index, event.clientX, event.clientY) + sim.grabOffset,
        limits.minAngle,
        limits.maxAngle,
      );
      const instant = (nextAngle - sim.angle) / dt;
      sim.velocity = clamp(sim.velocity * 0.35 + instant * 0.65, -2.6, 2.6);
      sim.angle = nextAngle;
      sim.twist += (clamp(sim.velocity * 0.038, -0.09, 0.09) - sim.twist) * 0.32;
      sim.pointerTime = now;
      applyPose(index);
    },
    [angleFromPointer, applyPose, configFor],
  );

  const endDrag = useCallback(
    (index: number) => {
      const sim = sims.current[index];
      if (!sim?.dragging) return;
      sim.dragging = false;
      sim.idle = false;
      if (reducedRef.current) sim.velocity = 0;
      else sim.velocity = clamp(sim.velocity, -2.2, 2.2);
      syncDraggingCursor();
      stopIdleLoop();
      ensureLoop();
    },
    [ensureLoop, stopIdleLoop, syncDraggingCursor],
  );

  const onKeyDown = useCallback(
    (index: number, event: ReactKeyboardEvent<HTMLElement>) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;

      if (mobileRef.current) {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        const next = clamp(index + direction, 0, HANGING_CARD_PHYSICS.length - 1);
        const target = scroller.querySelectorAll<HTMLElement>("[data-hanging-card]")[next];
        if (!target) return;
        const left = target.offsetLeft - (scroller.clientWidth - target.offsetWidth) / 2;
        scroller.scrollTo({
          left,
          behavior: reducedRef.current ? "auto" : "smooth",
        });
        return;
      }

      if (reducedRef.current) return;
      const sim = sims.current[index];
      if (!sim || sim.dragging) return;
      sim.idle = false;
      sim.delayUntil = 0;
      sim.velocity = clamp(sim.velocity + direction * 1.1, -2.4, 2.4);
      setWillChange(index, true);
      ensureLoop();
    },
    [ensureLoop, setWillChange],
  );

  const bind = useCallback(
    (index: number) => ({
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => onPointerDown(index, event),
      onPointerMove: (event: ReactPointerEvent<HTMLElement>) => onPointerMove(index, event),
      onPointerUp: () => endDrag(index),
      onPointerCancel: () => endDrag(index),
      onLostPointerCapture: () => endDrag(index),
      onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => onKeyDown(index, event),
    }),
    [endDrag, onKeyDown, onPointerDown, onPointerMove],
  );

  const attachmentRefs = useMemo(() => {
    const bindNode =
      (key: keyof PendulumNodes) => (index: number) => (element: PendulumNodes[keyof PendulumNodes]) => {
        nodes.current[index][key] = element as never;
      };
    const threadLineRefs = HANGING_CARD_PHYSICS.map(
      (_, index) => (element: SVGLineElement | null) => {
        threadLinesRef.current[index] = element;
      },
    );
    return {
      columnRefs: HANGING_CARD_PHYSICS.map((_, index) => bindNode("column")(index)),
      cardRefs: HANGING_CARD_PHYSICS.map((_, index) => bindNode("card")(index)),
      ringRefs: HANGING_CARD_PHYSICS.map((_, index) => bindNode("ring")(index)),
      threadLineRefs,
    };
  }, []);

  return {
    installationRef,
    sharedAnchorRef,
    scrollerRef,
    bind,
    ...attachmentRefs,
  };
}
