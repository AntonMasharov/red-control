import React, { useEffect } from 'react';
import { AppState, Text, View } from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { lessonVideos } from '../content/lesson-videos';
import { s } from './theme';

export function LessonVideo({ videoId }: { videoId: string }) {
  const video = lessonVideos[videoId];
  const player = useVideoPlayer(video.source);
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') player.pause();
    });
    return () => subscription.remove();
  }, [player]);
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.sectionTitle}>{video.title}</Text>
      <VideoView
        player={player}
        nativeControls
        contentFit="contain"
        style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#111', borderRadius: 12 }}
      />
      <Text style={s.small}>
        {status === 'error'
          ? 'Не удалось загрузить видео. Закройте урок и попробуйте открыть его снова.'
          : ''}
      </Text>
    </View>
  );
}
