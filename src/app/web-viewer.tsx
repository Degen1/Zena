import { useLocalSearchParams } from 'expo-router';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

export default function WebViewerScreen() {
  const params = useLocalSearchParams<{
    description?: string | string[];
    imageUrl?: string | string[];
    title?: string | string[];
    url?: string | string[];
  }>();
  const description = Array.isArray(params.description)
    ? params.description[0]
    : params.description;
  const title = Array.isArray(params.title) ? params.title[0] : params.title;
  const url = Array.isArray(params.url) ? params.url[0] : params.url;
  const imageUrl = Array.isArray(params.imageUrl) ? params.imageUrl[0] : params.imageUrl;
  const { colorScheme } = useAppTheme();
  const theme = Colors[colorScheme];
  const article = (
    <ScrollView contentContainerStyle={styles.article} showsVerticalScrollIndicator={false}>
      {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}
      <Text style={[styles.title, { color: theme.text }]}>{title || 'News article'}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.text }]}>{description}</Text>
      ) : (
        <Text style={[styles.description, { color: theme.textSecondary }]}>Article unavailable.</Text>
      )}
      {url ? (
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(url)} style={styles.button}>
          <Text style={styles.buttonText}>Open original source</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: theme.background }]}>
      {description ? (
        article
      ) : url ? (
        <WebView
          renderError={() => article}
          source={{ uri: url }}
          startInLoadingState
          style={[styles.webView, { backgroundColor: theme.background }]}
        />
      ) : (
        article
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
  article: { paddingBottom: 48, paddingHorizontal: 20 },
  description: { fontSize: 17, lineHeight: 28, marginTop: 18 },
  image: { aspectRatio: 16 / 9, borderRadius: 14, marginBottom: 22, width: '100%' },
  title: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  webView: { flex: 1 },
});
