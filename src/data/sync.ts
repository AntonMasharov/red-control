import { OutboxItem } from './model';

// Future headquarters adapter: the server must deduplicate by item.id.
// Nothing is transmitted or marked as sent until a real adapter is supplied.
export interface HeadquartersAdapter {
  send(events: readonly OutboxItem[]): Promise<{ acknowledgedIds: string[] }>;
}
export async function sendPending(adapter: HeadquartersAdapter, events: readonly OutboxItem[]) {
  const receipt = await adapter.send(events);
  const sent = new Set(events.map((e) => e.id));
  if (receipt.acknowledgedIds.some((id) => !sent.has(id)))
    throw new Error('Invalid server receipt');
  return new Set(receipt.acknowledgedIds);
}
