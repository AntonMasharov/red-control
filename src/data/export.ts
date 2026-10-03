import { Platform, Share } from 'react-native';
export async function exportText(
  filename: string,
  text: string,
  type = 'text/plain;charset=utf-8',
) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    try {
      document.body.appendChild(a);
      a.click();
    } finally {
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } else {
    await Share.share({ title: filename, message: text });
  }
}
