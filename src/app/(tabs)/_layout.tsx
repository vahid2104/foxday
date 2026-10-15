import { Tabs } from 'expo-router';

import { FoxTabBar } from '@/components/FoxTabBar';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FoxTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="money" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="health" />
    </Tabs>
  );
}
