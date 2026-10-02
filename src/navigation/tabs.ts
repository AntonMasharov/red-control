import type { IconName } from '../ui/components';
export type TabId = 'info' | 'roadmap' | 'complaints' | 'contacts';
export const tabs: { id: TabId; title: string; short: string; icon: IconName }[] = [
  { id: 'info', title: 'Информация', short: 'Инфо', icon: 'book-open' },
  { id: 'roadmap', title: 'Дорожная карта', short: 'Этапы', icon: 'map' },
  { id: 'complaints', title: 'Подготовить жалобу', short: 'Жалобы', icon: 'file-text' },
  { id: 'contacts', title: 'Связь со штабом', short: 'Штаб', icon: 'phone' },
];
