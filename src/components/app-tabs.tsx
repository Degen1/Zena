import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

export default function AppTabs() {
  const { colorScheme } = useAppTheme();
  const colors = Colors[colorScheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>ዜና</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>መማረጺ</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf="slider.horizontal.3"
          drawable="ic_menu_preferences"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
