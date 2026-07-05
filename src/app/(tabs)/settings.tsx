import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemePreference, useAppTheme } from '@/contexts/theme-context';

const THEME_VALUES: ThemePreference[] = ['light', 'system', 'dark'];
const THEME_LABELS = ['ብርሃን', 'ተቀያሪ', 'ጸልማት'];

export default function SettingsScreen() {
  const { colorScheme, preference, setPreference } = useAppTheme();
  const colors = colorScheme === 'dark'
    ? { background: '#0B0B0B', text: '#FFFFFF', border: '#222222', accent: '#3B82F6' }
    : { background: '#F7F7F7', text: '#111111', border: '#E6E6E6', accent: '#2563EB' };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={styles.content}>
        <View style={styles.segmentBlock}>
          <Text style={[styles.segmentTitle, { color: colors.text }]}>ልጪ</Text>
          <SegmentedControl
            activeFontStyle={styles.segmentActiveFont}
            backgroundColor="transparent"
            fontStyle={{ color: colors.text, fontSize: 13, fontWeight: '600' }}
            onChange={(event) =>
              setPreference(THEME_VALUES[event.nativeEvent.selectedSegmentIndex] ?? 'system')
            }
            selectedIndex={Math.max(0, THEME_VALUES.indexOf(preference))}
            style={styles.segmented}
            tintColor={colors.accent}
            values={THEME_LABELS}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: 12, padding: 16, paddingTop: 18 },
  segmentBlock: { gap: 8 },
  segmentTitle: { fontSize: 15, fontWeight: '700' },
  segmented: { height: 46 },
  segmentActiveFont: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
