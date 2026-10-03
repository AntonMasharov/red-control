import { Asset } from 'expo-asset';
import { Platform, Linking } from 'react-native';
import { openLocalFile } from './open-local-file';
import * as FS from 'expo-file-system/legacy';

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
  await openLocalFile(uri, source.mime);
}
