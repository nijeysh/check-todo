import { Alert, Platform, Share } from 'react-native';

/** 확인 창. 웹은 브라우저 confirm, 앱은 네이티브 Alert */
export function confirm(title: string, message: string, okText = '확인'): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: '취소', style: 'cancel', onPress: () => resolve(false) },
      { text: okText, style: 'destructive', onPress: () => resolve(true) },
    ]),
  );
}

/** 백업 JSON 내보내기. 웹은 파일 다운로드, 앱은 공유 시트 */
export async function exportText(filename: string, text: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: filename, message: text });
}

/** 웹 전용: 파일을 골라 텍스트로 읽는다 */
export function pickTextFile(): Promise<string | null> {
  if (Platform.OS !== 'web') return Promise.resolve(null);
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = async () => resolve(input.files?.[0] ? await input.files[0].text() : null);
    input.click();
  });
}
