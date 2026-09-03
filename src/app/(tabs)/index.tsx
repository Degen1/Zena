import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

const SPACE_ID = process.env.EXPO_PUBLIC_CONTENTFUL_SPACE_ID || '5znos412atyf';
const ENVIRONMENT_ID = process.env.EXPO_PUBLIC_CONTENTFUL_ENV || 'Dejen';
const ACCESS_TOKEN =
  process.env.EXPO_PUBLIC_CONTENTFUL_CDA_TOKEN ||
  'agiwsOim7_UIbVYdtu10zP0n8p3Odo-v-HrQradFLEc';
const PAGE_SIZE = 20;

type NewsItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  url: string;
};

const FALLBACK_NEWS_ITEMS: NewsItem[] = [
  {
    id: 'fallback-bbc-tigrinya',
    title: 'BBC News ትግርኛ',
    description: 'Latest Tigrinya news from BBC News.',
    imageUrl: null,
    url: 'https://www.bbc.com/tigrinya',
  },
  {
    id: 'fallback-voa-tigrigna',
    title: 'VOA Tigrigna',
    description: 'News, audio, and video coverage in Tigrigna.',
    imageUrl: null,
    url: 'https://tigrigna.voanews.com/',
  },
  {
    id: 'fallback-sbs-tigrinya',
    title: 'SBS Tigrinya',
    description: 'Tigrinya programs and current affairs from SBS.',
    imageUrl: null,
    url: 'https://www.sbs.com.au/language/tigrinya',
  },
];

type ArticleCollectionResponse = {
  data?: {
    articleCollection?: {
      total?: number;
      items?: {
        sys: { id: string; firstPublishedAt?: string };
        title?: string;
        article?: string;
        url?: string;
        imageCollection?: { items?: { url?: string }[] };
      }[];
    };
  };
  errors?: { message?: string }[];
};

export default function HomeScreen() {
  const router = useRouter();
  const { colorScheme } = useAppTheme();
  const theme = Colors[colorScheme];
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<NewsItem[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const loadNews = useCallback(async (pageToLoad = 0, append = false) => {
    // Keep the initial effect asynchronous before updating React state.
    await Promise.resolve();

    if (!SPACE_ID || !ACCESS_TOKEN) {
      setError('Contentful configuration is missing.');
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    try {
      if (append) {
        setLoadMoreError(null);
      } else {
        setError(null);
        setLoadMoreError(null);
      }
      const response = await fetch(
        `https://graphql.contentful.com/content/v1/spaces/${SPACE_ID}/environments/${ENVIRONMENT_ID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            query: `query PaginatedArticles($limit: Int!, $skip: Int!) {
              articleCollection(order: sys_firstPublishedAt_DESC, limit: $limit, skip: $skip) {
                total
                items {
                  sys { id firstPublishedAt }
                  title
                  article
                  url
                  imageCollection { items { url } }
                }
              }
            }`,
            variables: {
              limit: PAGE_SIZE,
              skip: pageToLoad * PAGE_SIZE,
            },
          }),
        }
      );
      if (!response.ok) throw new Error(`Contentful returned ${response.status}.`);

      const data = (await response.json()) as ArticleCollectionResponse;
      if (data.errors?.length) {
        throw new Error(data.errors[0].message || 'Contentful GraphQL error.');
      }
      const fetchedItems = (data.data?.articleCollection?.items ?? []).map((article) => ({
          id: article.sys.id,
          title: article.title || 'Untitled',
          description: article.article || '',
          imageUrl: article.imageCollection?.items?.[0]?.url || null,
          url: article.url || '',
        }));
      if (append) {
        setItems((currentItems) => {
          const existingIds = new Set(currentItems.map((item) => item.id));
          return [...currentItems, ...fetchedItems.filter((item) => !existingIds.has(item.id))];
        });
      } else {
        setItems(fetchedItems.length ? fetchedItems : FALLBACK_NEWS_ITEMS);
      }
      setPage(pageToLoad);
      setTotal(data.data?.articleCollection?.total ?? fetchedItems.length);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to load news.';
      if (append) {
        setLoadMoreError(message);
      } else {
        setItems(FALLBACK_NEWS_ITEMS);
        setPage(0);
        setTotal(FALLBACK_NEWS_ITEMS.length);
        setError(message);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadNews();
    }, 0);

    return () => clearTimeout(timeout);
  }, [loadNews]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return items;
    return items.filter((item) =>
      `${item.title} ${item.description}`.toLocaleLowerCase().includes(normalized)
    );
  }, [items, query]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void loadNews();
            }}
            tintColor={theme.text}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.brand, { color: theme.text }]}>ዜና</Text>
            <View
              style={[
                styles.searchBox,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <TextInput
                accessibilityLabel="Search news"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={Keyboard.dismiss}
                placeholder="ኣብዚ ድለዩ..."
                placeholderTextColor={theme.textSecondary}
                returnKeyType="search"
                style={[styles.input, { color: theme.text }]}
              />
              <Pressable
                accessibilityLabel="Search"
                accessibilityRole="button"
                onPress={Keyboard.dismiss}
                style={styles.searchButton}>
                <SymbolView
                  name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
                  size={20}
                  tintColor="#fff"
                />
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Open ${item.title}`}
            onPress={() =>
              router.push({
                pathname: '/web-viewer',
                params: {
                  description: item.description,
                  imageUrl: item.imageUrl || '',
                  title: item.title,
                  url: item.url,
                },
              })
            }
            style={styles.card}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} resizeMode="cover" style={styles.image} />
            ) : (
              <View style={[styles.image, styles.placeholder, { backgroundColor: theme.backgroundElement }]}>
                <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>ዜና</Text>
              </View>
            )}
            <View style={styles.cardText}>
              <Text numberOfLines={2} style={[styles.title, { color: theme.text }]}> 
                {item.title}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.state}>
            {loading ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <>
                <Text style={[styles.stateTitle, { color: theme.text }]}>
                  {error ? 'News sources are available while the feed refreshes.' : 'No news found'}
                </Text>
                {error ? (
                  <Pressable onPress={() => void loadNews()} style={styles.retryButton}>
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </View>
        }
        ListFooterComponent={
          !error && items.length < total ? (
            <View style={styles.continueContainer}>
              {loadMoreError ? (
                <Text style={[styles.loadMoreError, { color: theme.textSecondary }]}>
                  Could not load more stories. Please try again.
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={loadingMore}
                onPress={() => {
                  setLoadingMore(true);
                  void loadNews(page + 1, true);
                }}
                style={[styles.continueButton, loadingMore && styles.continueButtonDisabled]}>
                {loadingMore ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.continueButtonText}>ቀጽል</Text>
                )}
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 104 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 2 },
  brand: { fontSize: 26, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  searchBox: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  input: { flex: 1, fontSize: 16, minHeight: 32 },
  searchButton: {
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    marginLeft: 10,
    width: 36,
  },
  card: { marginHorizontal: 16, marginTop: 14 },
  image: { aspectRatio: 16 / 9, borderRadius: 14, overflow: 'hidden', width: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 24, fontWeight: '800' },
  cardText: { paddingBottom: 10, paddingHorizontal: 12, paddingTop: 12 },
  title: { fontSize: 18, fontWeight: '700', lineHeight: 22 },
  state: { alignItems: 'center', justifyContent: 'center', minHeight: 220, padding: 24 },
  stateTitle: { fontSize: 15, textAlign: 'center' },
  retryButton: { backgroundColor: '#007AFF', borderRadius: 10, marginTop: 14, paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: '#fff', fontWeight: '700' },
  continueContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  continueButton: {
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 13,
    width: '100%',
  },
  continueButtonDisabled: { opacity: 0.6 },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  loadMoreError: { fontSize: 14, marginBottom: 12, textAlign: 'center' },
});
