import { catalog, blocks } from './catalog';
import type { IconName } from '../ui/components';
export { default as manifest } from '../core/constants/app-settings.generated.json';
export const stages = blocks;
export type Stage = (typeof stages)[number];
export const laws = Object.values(catalog.laws);
export type Law = (typeof laws)[number];
export const lessons = Object.values(catalog.topics).map((t) => ({
  ...t,
  icon: t.icon as IconName,
}));
