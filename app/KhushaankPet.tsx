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
  running: [7, 6],
  review: [8, 6],
} as const;

type Pose = keyof typeof poses | "look";
type Position = { x: number; y: number };

const reactions: Exclude<Pose, "idle" | "running-right" | "running-left" | "look">[] = [
  "waving",
  "jumping",
  "running",
  "review",
  "waiting",
  "failed",
];

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export default function KhushaankPet() {
  const pet = useRef<HTMLButtonElement>(null);
  const poseRef = useRef<Pose>("look");
  const reactionTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reactionIndex = useRef(0);
  const lookFrame = useRef(0);
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
  const [pose, setPose] = useState<Pose>("look");
  const [frame, setFrame] = useState(0);
  const [dragging, setDragging] = useState(false);

  const show = useCallback((next: Pose, duration = 0) => {
    clearTimeout(reactionTimer.current);
    if (poseRef.current !== next) {
      poseRef.current = next;
      setPose(next);
      setFrame(next === "look" ? lookFrame.current : 0);
    }
    if (duration) {
      reactionTimer.current = setTimeout(() => {
        poseRef.current = "look";
        setPose("look");
        setFrame(lookFrame.current);
      }, duration);
    }
  }, []);

  const place = useCallback((next: Position, save = false) => {
    const node = pet.current;
    if (!node) return false;
    const maxX = Math.max(12, innerWidth - node.offsetWidth - 12);
    const maxY = Math.max(12, innerHeight - node.offsetHeight - 12);
    const bounded = {
      x: clamp(next.x, 12, maxX),
      y: clamp(next.y, 12, maxY),
    };
    position.current = bounded;
    node.style.transform = `translate3d(${bounded.x}px, ${bounded.y}px, 0)`;
    if (save) localStorage.setItem("khushaank-pet-position", JSON.stringify(bounded));
    return bounded.x !== next.x || bounded.y !== next.y;
  }, []);

  useEffect(() => {
    if (pose === "look" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const count = poses[pose][1];
    const timer = setInterval(() => setFrame((current) => (current + 1) % count), 130);
    return () => clearInterval(timer);
  }, [pose]);

  useEffect(() => {
    const node = pet.current;
    if (!node) return;
    const fallback = { x: innerWidth - node.offsetWidth - 24, y: innerHeight - node.offsetHeight - 24 };
    let initial = fallback;
    try {
      const saved = JSON.parse(localStorage.getItem("khushaank-pet-position") ?? "null");
      if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) initial = saved;
    } catch {
      // Ignore an invalid device-local position and use the safe corner.
    }
    place(initial);

    const lookAtPointer = (event: PointerEvent) => {
      if (drag.current.active || !["look", "idle"].includes(poseRef.current)) return;
      const rect = node.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      lookFrame.current = Math.round(((Math.atan2(dx, -dy) * 180) / Math.PI + 360) / 22.5) % 16;
      poseRef.current = "look";
      setPose("look");
      setFrame(lookFrame.current);
    };
    const resize = () => place(position.current, true);
    const busy = () => !drag.current.active && show("running", 500);
    const wait = () => show("waiting");
    const welcomeBack = () => show("waving", 850);

    addEventListener("pointermove", lookAtPointer, { passive: true });
    addEventListener("resize", resize);
    addEventListener("scroll", busy, { passive: true });
    addEventListener("blur", wait);
    addEventListener("focus", welcomeBack);
    return () => {
      removeEventListener("pointermove", lookAtPointer);
      removeEventListener("resize", resize);
      removeEventListener("scroll", busy);
      removeEventListener("blur", wait);
      removeEventListener("focus", welcomeBack);
      clearTimeout(reactionTimer.current);
    };
  }, [place, show]);

  const startDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
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
    show("running");
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
    else if (Math.abs(dy) > Math.abs(dx)) show("jumping");
    else if (Math.abs(dx) > 1) show(dx > 0 ? "running-right" : "running-left");
  };

  const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.active || event.pointerId !== drag.current.pointerId) return;
    drag.current.active = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    place(position.current, true);
    show(drag.current.moved ? "review" : "jumping", 850);
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
    show(hitEdge ? "failed" : delta.y ? "jumping" : delta.x > 0 ? "running-right" : "running-left", 650);
  };

  const [row, column] = pose === "look"
    ? [frame < 8 ? 9 : 10, frame % 8]
    : [poses[pose][0], frame];

  return (
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
      onPointerEnter={() => !drag.current.active && show("waving", 800)}
      onKeyDown={moveWithKeyboard}
      onClick={() => {
        if (drag.current.moved) {
          drag.current.moved = false;
          return;
        }
        show(reactions[reactionIndex.current], 1000);
        reactionIndex.current = (reactionIndex.current + 1) % reactions.length;
      }}
      style={{ backgroundPosition: `${column * -96}px ${row * -104}px` }}
    />
  );
}
