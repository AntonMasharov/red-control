import React, { useState } from 'react';
import { View } from 'react-native';
import { catalog } from '../content/catalog';
import type { Commission } from '../data/architecture/entities';
import { RowLink, Notice } from './components';
const labels = { IKSRF: 'ИКСРФ', OIK: 'ОИК', TIK: 'ТИК', UIK: 'УИК' };
export function CommissionTree({
  electionId,
  query,
  selectedId,
  onSelect,
}: {
  electionId: string;
  query: string;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const nodes = Object.values(catalog.campaigns[electionId]?.commissions || {});
  const search = query.trim().toLocaleLowerCase('ru');
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const visible = new Set<string>();
  const addParents = (node: Commission) => {
    let current: Commission | undefined = node;
    while (current) {
      visible.add(current.id);
      current = current.parentId ? byId[current.parentId] : undefined;
    }
  };
  const matches = (n: Commission) =>
    [n.title, n.number, n.region, n.address].join(' ').toLocaleLowerCase('ru').includes(search);
  // Matching a parent keeps its whole subtree searchable and selectable.
  for (const n of nodes) {
    let ancestor: Commission | undefined = n;
    while (ancestor) {
      if (matches(ancestor)) {
        addParents(n);
        break;
      }
      ancestor = ancestor.parentId ? byId[ancestor.parentId] : undefined;
    }
  }
  const render = (parentId: string | null, depth = 0): React.ReactNode =>
    nodes
      .filter((n) => n.parentId === parentId && visible.has(n.id))
      .map((n) => {
        const open = !!search || expanded[n.id] === true;
        return (
          <View key={n.id} style={{ marginLeft: depth ? 12 : 0 }}>
            <RowLink
              title={labels[n.kind] + ' · ' + n.title + (n.id === selectedId ? ' · выбран' : '')}
              subtitle={n.kind === 'UIK' ? n.address : undefined}
              icon={
                n.kind === 'UIK'
                  ? n.id === selectedId
                    ? 'check-circle'
                    : 'map-pin'
                  : open
                    ? 'chevron-down'
                    : 'chevron-right'
              }
              onPress={() =>
                n.kind === 'UIK'
                  ? onSelect(n.id)
                  : setExpanded((previous) => ({ ...previous, [n.id]: !open }))
              }
            />
            {n.kind !== 'UIK' && open && render(n.id, depth + 1)}
          </View>
        );
      });
  return <View>{visible.size ? render(null) : <Notice>Комиссии не найдены.</Notice>}</View>;
}
