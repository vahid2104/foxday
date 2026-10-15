import { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { palette } from '@/theme';

const COLORS = [palette.orange400, palette.blue500, palette.green500, palette.purple500, palette.red500, palette.orange200];
const COUNT = 46;

// Sabit "təsadüfi" ədədlər — hər açılışda eyni, amma təbii görünür
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

function Piece({ i, width, height }: { i: number; width: number; height: number }) {
  const progress = useSharedValue(0);
  const startX = rand(i) * width;
  const drift = (rand(i + 100) - 0.5) * 160;
  const size = 6 + rand(i + 200) * 7;
  const round = rand(i + 300) > 0.6;
  const spins = 2 + rand(i + 400) * 4;
  const delay = rand(i + 500) * 500;
  const duration = 1800 + rand(i + 600) * 1400;

  useEffect(() => {
    progress.set(withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) })));
  }, [progress, delay, duration]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: p < 0.85 ? 1 : (1 - p) / 0.15,
      transform: [
        { translateX: startX + drift * p },
        { translateY: -40 + (height * 0.9 + 40) * p },
        { rotate: `${spins * 360 * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        { width: round ? size : size * 0.6, height: round ? size : size * 1.6, borderRadius: round ? size / 2 : 2 },
        { backgroundColor: COLORS[i % COLORS.length] },
        style,
      ]}
    />
  );
}

/** Ekran boyu yağan konfetti (təbrik üçün). */
export function Confetti() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: COUNT }, (_, i) => (
        <Piece key={i} i={i} width={width} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, left: 0 },
});
