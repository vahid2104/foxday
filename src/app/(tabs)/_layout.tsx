import { Redirect, Tabs } from 'expo-router';

import { FoxTabBar } from '@/components/FoxTabBar';
import { useSettings } from '@/store/settings';

export default function TabLayout() {
  // Ayarlar kök layout-da artıq yüklənib — ilk açılışda onboarding göstər
  const onboardingDone = useSettings((s) => s.onboardingDone);
  if (!onboardingDone) return <Redirect href="/onboarding" />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FoxTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="money" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="health" />
    </Tabs>
  );
}
