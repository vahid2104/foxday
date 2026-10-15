import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Button } from '@/components/form';
import { Foxy, type FoxyMood } from '@/components/Foxy';
import { Text } from '@/components/ui';
import { radius, spacing, useTheme } from '@/theme';

/**
 * Foxy ilə mərkəzi pəncərə (Figma: "07 · Təbrik", "08 · Buraxılan vərdiş").
 * happy → Foxy hoppanır; sad → yavaşca yellənir.
 */
export function FoxyModal({
  mood,
  title,
  children,
  cta,
  background,
}: {
  mood: FoxyMood;
  title: string;
  children?: ReactNode;
  cta: string;
  background?: ReactNode;
}) {
  const { colors } = useTheme();
  const appear = useSharedValue(0);
  const motion = useSharedValue(0);

  useEffect(() => {
    appear.set(withSpring(1, { damping: 12, stiffness: 140 }));
    motion.set(
      mood === 'happy'
        ? withRepeat(withSequence(withTiming(-14, { duration: 280, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) })), 4)
        : withRepeat(withSequence(withTiming(-6, { duration: 900 }), withTiming(6, { duration: 900 })), -1, true),
    );
  }, [appear, motion, mood]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: appear.get(),
    transform: [{ scale: 0.85 + appear.get() * 0.15 }],
  }));
  const foxStyle = useAnimatedStyle(() =>
    mood === 'happy' ? { transform: [{ translateY: motion.get() }] } : { transform: [{ rotate: `${motion.get()}deg` }] },
  );

  return (
    <View style={styles.root}>
      <Pressable style={styles.scrim} onPress={() => router.back()} />
      {background}
      <Animated.View style={[styles.card, { backgroundColor: colors.bgSurface }, cardStyle]}>
        <Animated.View style={foxStyle}>
          <Foxy mood={mood} size={140} />
        </Animated.View>
        <Text variant="h1" style={{ textAlign: 'center' }}>
          {title}
        </Text>
        {children}
        <Button label={cta} onPress={() => router.back()} style={{ alignSelf: 'stretch', marginTop: spacing.sm }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(23,20,18,0.6)' },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius.xl + 4,
    paddingHorizontal: spacing['2xl'],
    paddingTop: 28,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.md,
  },
});
