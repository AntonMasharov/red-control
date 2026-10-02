import { Platform } from 'react-native';
import * as FS from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';

export async function openLocalFile(uri: string, mime: string) {
  if (Platform.OS === 'android') {
    const contentUri = await FS.getContentUriAsync(uri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      type: mime,
      // Allow the selected viewer to read the file from our FileProvider.
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
    });
    return;
  }
  await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle: 'Открыть исходный файл' });
}
