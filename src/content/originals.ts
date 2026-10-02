import { Asset } from 'expo-asset';
import { Platform, Linking } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FS from 'expo-file-system/legacy';
import * as Picker from 'expo-document-picker';

export async function openOriginal(source: {
  id?: string;
  asset: number;
  name: string;
  mime: string;
}) {
  const asset = Asset.fromModule(source.asset);
  if (Platform.OS === 'web') {
    await Linking.openURL(asset.uri);
    return;
  }
  await asset.downloadAsync();
  const uri = FS.cacheDirectory + source.name;
  await FS.copyAsync({ from: asset.localUri || asset.uri, to: uri });
  await Sharing.shareAsync(uri, { mimeType: source.mime, dialogTitle: 'Открыть исходный файл' });
}
export async function pickText() {
  const result = await Picker.getDocumentAsync({
    type: ['text/plain', 'application/json'],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const file = result.assets[0];
  if ((file.size || 0) > 10 * 1024 * 1024) throw new Error('Файл больше 10 МБ');
  return Platform.OS === 'web' ? await file.file!.text() : await FS.readAsStringAsync(file.uri);
}
