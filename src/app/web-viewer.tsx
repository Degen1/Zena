import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

export default function WebViewerScreen() {
  const params = useLocalSearchParams<{ url?: string | string[] }>();
  const url = Array.isArray(params.url) ? params.url[0] : params.url;
  const { colorScheme } = useAppTheme();
  const theme = Colors[colorScheme];

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: theme.background }]}>
      {url ? (
        <WebView
          source={{ uri: url }}
          style={[styles.webView, { backgroundColor: theme.background }]}
        />
      ) : (
        <View style={styles.container} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webView: { flex: 1 },
});
