import React from 'react';
import { View, Text } from 'react-native';
import { useStoreSelector } from '../data/store';
import { activeElection, activePrecinct, hasSelectedContext } from '../data/model';
import { s, colors } from './theme';

export function ActiveContextHeader() {
  const selected = useStoreSelector(hasSelectedContext);
  const title = useStoreSelector((state) => activeElection(state).title);
  const number = useStoreSelector((state) => activePrecinct(state).number);
  return (
    <View
      accessibilityRole="summary"
      style={{
        gap: 8,
        flexShrink: 1,
        flexGrow: 1,
        minWidth: 0,
      }}
    >
      <Text style={{ fontSize: 16, lineHeight: 22, fontWeight: '600', color: colors.ink }}>
        {selected ? title : 'Выбрать выборы и УИК'}
      </Text>
      {selected ? (
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: colors.rose,
            borderRadius: 6,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ fontSize: 12, lineHeight: 18, fontWeight: '600', color: colors.red }}>
            {'УИК № ' + number}
          </Text>
        </View>
      ) : (
        <Text style={s.small}>Сначала выборы, затем участок</Text>
      )}
    </View>
  );
}
