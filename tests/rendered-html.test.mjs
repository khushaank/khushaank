import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("ships the stable draggable Khushaank pet and every reaction", async () => {
  const [page, pet, css] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/KhushaankPet.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<KhushaankPet \/>/);
  for (const reaction of ["waving", "jumping", "failed", "waiting", "running", "review"]) {
    assert.match(pet, new RegExp(`"${reaction}"`));
  }
  assert.match(pet, /setPointerCapture/);
  assert.match(pet, /khushaank-pet-position/);
  assert.match(pet, /pointermove/);
  assert.doesNotMatch(pet, /requestAnimationFrame/);
  assert.match(css, /background-image: url\("\/khushaank-pet\.webp"\)/);
  assert.match(css, /touch-action: none/);
  await access(new URL("../public/khushaank-pet.webp", import.meta.url));
});
