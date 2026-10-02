import React from 'react';
import MarkdownDisplay, { MarkdownIt } from 'react-native-markdown-display';
import { Linking } from 'react-native';
import { openSource } from '../content/repository';
import { useFeedback } from './feedback';
import { colors } from './theme';

const parser = MarkdownIt({ html: false, linkify: true, typographer: true });
export function Markdown({ children }: { children: string }) {
  const { notify } = useFeedback();
  return (
    <MarkdownDisplay
      markdownit={parser}
      style={{
        body: { color: colors.ink, fontSize: 15, lineHeight: 24 },
        link: { color: colors.red },
      }}
      onLinkPress={(url) => {
        const operation = url.startsWith('source:')
          ? openSource(url.slice(7))
          : /^https?:\/\//i.test(url)
            ? Linking.openURL(url)
            : Promise.reject(new Error('Эта ссылка не поддерживается.'));
        void operation.catch((e) =>
          notify(e instanceof Error ? e.message : 'Не удалось открыть ссылку.'),
        );
        return false;
      }}
    >
      {children}
    </MarkdownDisplay>
  );
}
