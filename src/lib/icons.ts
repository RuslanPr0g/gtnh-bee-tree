// Bee icon = Forestry's drone texture layers, tinted like the game does
// (outline: color 1, body: color 2, stripes: untinted). Textures are 16px wide; animated ones use frame 0.
import outlineUrl from '../assets/bee/drone.outline.png';
import bodyUrl from '../assets/bee/body1.png';
import stripesUrl from '../assets/bee/drone.body2.png';
import type { Species } from './graph';

const layers = [outlineUrl, bodyUrl, stripesUrl].map((src) => {
  const img = new Image();
  img.src = src;
  return img;
});

export const iconsReady: Promise<void> = Promise.all(layers.map((i) => i.decode())).then(
  () => undefined,
);

export const hex = (n: number) => '#' + ((n >>> 0) & 0xffffff).toString(16).padStart(6, '0');

const cache = new Map<string, string>();

export function beeIconUrl(s: Species): string {
  const hit = cache.get(s.uid);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const x = c.getContext('2d')!;
  [s.color, s.color2, 0xffffff].forEach((col, i) => {
    const l = document.createElement('canvas');
    l.width = l.height = 16;
    const lx = l.getContext('2d')!;
    lx.drawImage(layers[i], 0, 0, 16, 16, 0, 0, 16, 16);
    lx.globalCompositeOperation = 'multiply';
    lx.fillStyle = hex(col);
    lx.fillRect(0, 0, 16, 16);
    lx.globalCompositeOperation = 'destination-in';
    lx.drawImage(layers[i], 0, 0, 16, 16, 0, 0, 16, 16);
    x.drawImage(l, 0, 0);
  });
  const url = c.toDataURL();
  cache.set(s.uid, url);
  return url;
}
