import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

export default function WebViewerScreen() {
  const params = useLocalSearchParams<{
    description?: string | string[];
    title?: string | string[];
    url?: string | string[];
  }>();
  const description = Array.isArray(params.description)
    ? params.description[0]
    : params.description;
  const title = Array.isArray(params.title) ? params.title[0] : params.title;
  const url = Array.isArray(params.url) ? params.url[0] : params.url;
  const { colorScheme } = useAppTheme();
  const theme = Colors[colorScheme];
  const fallback = (
    <View style={styles.state}>
      <Text style={[styles.title, { color: theme.text }]}>
        {title || 'News article'}
      </Text>
      {description ? (
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {description}
        </Text>
      ) : null}
      {url ? (
        <Pressable
          accessibilityRole="link"
          onPress={() => Linking.openURL(url)}
          style={styles.button}>
          <Text style={styles.buttonText}>Open article</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: theme.background }]}>
      {url ? (
        <WebView
          renderError={() => fallback}
          renderLoading={() => (
            <View style={styles.state}>
              <ActivityIndicator color={theme.text} />
            </View>
          )}
          source={{ uri: url }}
          startInLoadingState
          style={[styles.webView, { backgroundColor: theme.background }]}
        />
      ) : (
        fallback
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    marginTop: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  description: { fontSize: 15, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  state: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  webView: { flex: 1 },
});
