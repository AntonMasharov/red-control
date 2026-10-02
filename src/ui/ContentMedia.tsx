import React from 'react';
import { Image, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { Media } from '../data/architecture/entities';
import { catalog } from '../content/catalog';
import { sourceAssets, openSource } from '../content/repository';
import { RowLink } from './components';
import { useFeedback } from './feedback';
import { s } from './theme';
function BundledVideo({ asset }: { asset: number }) {
  const player = useVideoPlayer(asset);
  return (
    <VideoView player={player} nativeControls style={{ width: '100%', aspectRatio: 16 / 9 }} />
  );
}
export function ContentMedia({ media }: { media: readonly Media[] }) {
  const { notify } = useFeedback();
  return (
    <View style={{ gap: 12 }}>
      {media.map((m, index) => {
        const source = catalog.sources[m.sourceId];
        const asset = source?.assetKey ? sourceAssets[source.assetKey] : undefined;
        return (
          <View key={index}>
            {asset && m.kind === 'image' ? (
              <Image
                source={asset}
                accessibilityLabel={m.alt}
                resizeMode="contain"
                style={{ width: '100%', height: 280 }}
              />
            ) : asset && m.kind === 'video' ? (
              <BundledVideo asset={asset} />
            ) : (
              <RowLink
                title={m.alt}
                subtitle={asset ? 'Открыть материал' : 'Файл ещё не добавлен'}
                icon="file"
                onPress={() => {
                  void openSource(m.sourceId).catch((e) => notify(e.message));
                }}
              />
            )}
            <Text style={s.small}>{m.alt}</Text>
          </View>
        );
      })}
    </View>
  );
}
