"use client";

import { useEffect, useRef, useState } from "react";

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
const reactions: Exclude<Pose, "idle" | "running-right" | "running-left" | "look">[] = [
  "waving",
  "jumping",
  "running",
  "review",
  "waiting",
  "failed",
];

export default function KhushaankPet() {
  const pet = useRef<HTMLButtonElement>(null);
  const poseRef = useRef<Pose>("running-left");
  const reactionTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reactionIndex = useRef(0);
  const lookFrame = useRef(0);
  const [pose, setPose] = useState<Pose>("running-left");
  const [frame, setFrame] = useState(0);

  const show = (next: Pose, duration = 0) => {
    clearTimeout(reactionTimer.current);
    poseRef.current = next;
    setPose(next);
    setFrame(0);
    if (duration) {
      reactionTimer.current = setTimeout(() => {
        const fallback: Pose = pet.current?.dataset.direction === "right" ? "running-right" : "running-left";
        poseRef.current = fallback;
        setPose(fallback);
      }, duration);
    }
  };

  useEffect(() => {
    if (pose === "look") return;
    const count = poses[pose][1];
    const timer = setInterval(() => setFrame((current) => (current + 1) % count), 130);
    return () => clearInterval(timer);
  }, [pose]);

  useEffect(() => {
    const node = pet.current;
    if (!node) return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = Math.max(20, innerWidth - 150);
    let y = Math.min(140, innerHeight / 3);
    let vx = reducedMotion ? 0 : -78;
    let vy = reducedMotion ? 0 : 48;
    let previous = performance.now();
    let animation = 0;

    const move = (now: number) => {
      const elapsed = Math.min((now - previous) / 1000, 0.04);
      previous = now;
      if (!reducedMotion && !["look", "waving", "waiting", "review", "failed"].includes(poseRef.current)) {
        x += vx * elapsed;
        y += vy * elapsed;
        const maxX = Math.max(12, innerWidth - node.offsetWidth - 12);
        const maxY = Math.max(12, innerHeight - node.offsetHeight - 12);
        if (x <= 12 || x >= maxX) {
          vx *= -1;
          x = Math.min(maxX, Math.max(12, x));
          const next: Pose = vx > 0 ? "running-right" : "running-left";
          node.dataset.direction = vx > 0 ? "right" : "left";
          poseRef.current = next;
          setPose(next);
        }
        if (y <= 12 || y >= maxY) {
          vy *= -1;
          y = Math.min(maxY, Math.max(12, y));
          show("jumping", 650);
        }
      }
      node.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      animation = requestAnimationFrame(move);
    };

    animation = requestAnimationFrame(move);
    const look = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      if (Math.hypot(dx, dy) > 260) return;
      lookFrame.current = Math.round(((Math.atan2(dx, -dy) * 180) / Math.PI + 360) / 22.5) % 16;
      show("look", 550);
      setFrame(lookFrame.current);
    };
    const jump = () => show("jumping", 700);
    addEventListener("pointermove", look, { passive: true });
    addEventListener("scroll", jump, { passive: true });
    return () => {
      cancelAnimationFrame(animation);
      removeEventListener("pointermove", look);
      removeEventListener("scroll", jump);
      clearTimeout(reactionTimer.current);
    };
  }, []);

  const [row, column] = pose === "look"
    ? [frame < 8 ? 9 : 10, frame % 8]
    : [poses[pose][0], frame];

  return (
    <button
      ref={pet}
      className="khushaank-pet"
      type="button"
      data-direction="left"
      aria-label={`Khushaank is ${pose.replaceAll("-", " ")}. Activate for another reaction.`}
      title="Tap Khushaank for a reaction"
      onPointerEnter={() => show("waving", 900)}
      onClick={() => {
        show(reactions[reactionIndex.current], 1100);
        reactionIndex.current = (reactionIndex.current + 1) % reactions.length;
      }}
      style={{ backgroundPosition: `${column * -96}px ${row * -104}px` }}
    />
  );
}
