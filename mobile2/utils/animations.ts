import { Animated } from 'react-native';

// Horizontal shake mirroring the design's CSS keyframes
// (0 → -amp → +amp → -0.66 → +0.66 → -0.33 → +0.33 → 0) over `duration` ms.
// Drives a translateX Animated.Value; useNativeDriver for smoothness.
export function shake(value: Animated.Value, amplitude = 6, duration = 400): void {
  const step = duration / 7;
  value.setValue(0);
  Animated.sequence([
    Animated.timing(value, { toValue: -amplitude,        duration: step, useNativeDriver: true }),
    Animated.timing(value, { toValue: amplitude,         duration: step, useNativeDriver: true }),
    Animated.timing(value, { toValue: -amplitude * 0.66, duration: step, useNativeDriver: true }),
    Animated.timing(value, { toValue: amplitude * 0.66,  duration: step, useNativeDriver: true }),
    Animated.timing(value, { toValue: -amplitude * 0.33, duration: step, useNativeDriver: true }),
    Animated.timing(value, { toValue: amplitude * 0.33,  duration: step, useNativeDriver: true }),
    Animated.timing(value, { toValue: 0,                 duration: step, useNativeDriver: true }),
  ]).start();
}
