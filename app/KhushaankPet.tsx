"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const poses = {
  idle: [0, 6],
  "running-right": [1, 8],
  "running-left": [2, 8],
  waving: [3, 4],
  jumping: [4, 5],
  failed: [5, 8],
  waiting: [6, 6],
  review: [8, 6],
} as const;

type Pose = keyof typeof poses | "look";
type Position = { x: number; y: number };

const reactions: Exclude<Pose, "idle" | "running-right" | "running-left" | "look">[] = [
  "waving",
  "review",
  "waiting",
  "jumping",
];

const HEAD_MOVE_DELAY = 10_000;
const ROAM_DELAY = 20_000;
const ROAM_DURATION = 1_900;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export default function KhushaankPet() {
  const stage = useRef<HTMLDivElement>(null);
  const pet = useRef<HTMLButtonElement>(null);
  const poseRef = useRef<Pose>("idle");
  const reactionTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const headTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const roamTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const roamFinishTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const greetingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const recordActivity = useRef<() => void>(() => undefined);
  const reactionIndex = useRef(0);
  const position = useRef<Position>({ x: 24, y: 24 });
  const drag = useRef({
    active: false,
    moved: false,
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
    lastX: 0,
    lastY: 0,
  });
  const [pose, setPose] = useState<Pose>("idle");
  const [frame, setFrame] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [greeting, setGreeting] = useState("Hi, there.");

  const show = useCallback((next: Pose, duration = 0) => {
    clearTimeout(reactionTimer.current);
    if (poseRef.current !== next) {
      poseRef.current = next;
      setPose(next);
      setFrame(0);
    }
    if (duration) {
      reactionTimer.current = setTimeout(() => {
        poseRef.current = "idle";
        setPose("idle");
        setFrame(0);
      }, duration);
    }
  }, []);

  const place = useCallback((next: Position, save = false) => {
    const node = stage.current;
    if (!node) return false;
    const maxX = Math.max(12, innerWidth - node.offsetWidth - 12);
    const maxY = Math.max(12, innerHeight - node.offsetHeight - 12);
    const bounded = {
      x: clamp(next.x, 12, maxX),
      y: clamp(next.y, 12, maxY),
    };
    position.current = bounded;
    node.style.transform = `translate3d(${bounded.x}px, ${bounded.y}px, 0)`;
    if (save) {
      try {
        localStorage.setItem("khushaank-pet-position", JSON.stringify(bounded));
      } catch {
        // Storage can be unavailable in private or restricted browser contexts.
      }
    }
    return bounded.x !== next.x || bounded.y !== next.y;
  }, []);

  useEffect(() => {
    if (pose === "idle" || pose === "look" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const count = poses[pose][1];
    const timer = setInterval(() => setFrame((current) => (current + 1) % count), 130);
    return () => clearInterval(timer);
  }, [pose]);

  useEffect(() => {
    const node = stage.current;
    if (!node) return;

    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fallback = { x: innerWidth - node.offsetWidth - 24, y: innerHeight - node.offsetHeight - 24 };
    let initial = fallback;
    try {
      const saved = JSON.parse(localStorage.getItem("khushaank-pet-position") ?? "null");
      if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) initial = saved;
    } catch {
      // Ignore an invalid device-local position and use the safe corner.
    }
    place(initial);

    const stopRoaming = () => {
      if (node.dataset.roaming !== "true") return;
      const rect = node.getBoundingClientRect();
      clearTimeout(roamFinishTimer.current);
      node.dataset.roaming = "false";
      node.style.transition = "none";
      position.current = { x: rect.left, y: rect.top };
      node.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
      show("idle");
    };

    const scheduleIdleBehavior = () => {
      clearTimeout(headTimer.current);
      clearTimeout(roamTimer.current);
      if (reducedMotion) return;

      headTimer.current = setTimeout(() => {
        if (drag.current.active || node.dataset.roaming === "true") return;
        setFrame(Math.random() > 0.5 ? 1 : 15);
        poseRef.current = "look";
        setPose("look");
        reactionTimer.current = setTimeout(() => show("idle"), 950);
      }, HEAD_MOVE_DELAY);

      roamTimer.current = setTimeout(() => {
        if (drag.current.active) return scheduleIdleBehavior();
        const runRight = position.current.x + node.offsetWidth / 2 < innerWidth / 2;
        const destination = {
          x: runRight ? innerWidth - node.offsetWidth - 18 : 18,
          y: Math.random() > 0.5 ? 18 : innerHeight - node.offsetHeight - 18,
        };

        node.dataset.roaming = "true";
        node.style.transition = `transform ${ROAM_DURATION}ms cubic-bezier(.45,.05,.55,.95)`;
        show(runRight ? "running-right" : "running-left");
        place(destination);
        roamFinishTimer.current = setTimeout(() => {
          node.dataset.roaming = "false";
          node.style.transition = "none";
          place(position.current, true);
          show("idle");
          scheduleIdleBehavior();
        }, ROAM_DURATION);
      }, ROAM_DELAY);
    };

    recordActivity.current = () => {
      stopRoaming();
      scheduleIdleBehavior();
    };

    const resize = () => {
      stopRoaming();
      place(position.current, true);
      scheduleIdleBehavior();
    };
    const activity = () => recordActivity.current();

    addEventListener("pointermove", activity, { passive: true });
    addEventListener("pointerdown", activity, { passive: true });
    addEventListener("keydown", activity);
    addEventListener("scroll", activity, { passive: true });
    addEventListener("resize", resize);
    scheduleIdleBehavior();

    show("waving", 1_500);
    greetingTimers.current = [
      setTimeout(() => setGreeting("I am Khushaank Gupta."), 1_500),
      setTimeout(() => setGreeting(""), 3_900),
    ];

    return () => {
      removeEventListener("pointermove", activity);
      removeEventListener("pointerdown", activity);
      removeEventListener("keydown", activity);
      removeEventListener("scroll", activity);
      removeEventListener("resize", resize);
      clearTimeout(reactionTimer.current);
      clearTimeout(headTimer.current);
      clearTimeout(roamTimer.current);
      clearTimeout(roamFinishTimer.current);
      greetingTimers.current.forEach(clearTimeout);
    };
  }, [place, show]);

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    recordActivity.current();
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = {
      active: true,
      moved: false,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    show("idle");
  };

  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active || event.pointerId !== drag.current.pointerId) return;
    const dx = event.clientX - drag.current.lastX;
    const dy = event.clientY - drag.current.lastY;
    drag.current.moved ||= Math.hypot(dx, dy) > 2;
    drag.current.lastX = event.clientX;
    drag.current.lastY = event.clientY;
    const hitEdge = place({
      x: event.clientX - drag.current.offsetX,
      y: event.clientY - drag.current.offsetY,
    });
    if (hitEdge) show("failed");
    else if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 1) {
      show(dx > 0 ? "running-right" : "running-left");
    } else {
      show("idle");
    }
  };

  const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active || event.pointerId !== drag.current.pointerId) return;
    drag.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    place(position.current, true);
    show("idle");
    recordActivity.current();
  };

  const moveWithKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const movement: Record<string, Position> = {
      ArrowLeft: { x: -24, y: 0 },
      ArrowRight: { x: 24, y: 0 },
      ArrowUp: { x: 0, y: -24 },
      ArrowDown: { x: 0, y: 24 },
    };
    const delta = movement[event.key];
    if (!delta) return;
    event.preventDefault();
    const hitEdge = place({ x: position.current.x + delta.x, y: position.current.y + delta.y }, true);
    show(
      hitEdge
        ? "failed"
        : delta.x > 0
          ? "running-right"
          : delta.x < 0
            ? "running-left"
            : "idle",
      650,
    );
  };

  const [row, column] = pose === "look"
    ? [frame < 8 ? 9 : 10, frame % 8]
    : [poses[pose][0], frame];

  return (
    <div ref={stage} className="khushaank-pet-stage" data-roaming="false">
      {greeting ? (
        <span className="khushaank-pet-message" role="status" aria-live="polite">
          {greeting}
        </span>
      ) : null}
      <button
        ref={pet}
        className="khushaank-pet"
        type="button"
        data-dragging={dragging}
        aria-label={`Khushaank is ${pose.replaceAll("-", " ")}. Drag to move or activate for another reaction.`}
        title="Drag Khushaank anywhere, or click for a reaction"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onKeyDown={moveWithKeyboard}
        onClick={() => {
          if (drag.current.moved) {
            drag.current.moved = false;
            return;
          }
          show(reactions[reactionIndex.current], 1_000);
          reactionIndex.current = (reactionIndex.current + 1) % reactions.length;
          recordActivity.current();
        }}
        style={{ backgroundPosition: `${column * -96}px ${row * -104}px` }}
      />
    </div>
  );
}
