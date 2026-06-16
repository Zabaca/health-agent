import { useEffect, useRef } from "react";
import { Animated, type StyleProp, type ViewStyle } from "react-native";

/**
 * Wraps children in a gentle, looping attention pulse (scale + opacity).
 * Used to draw the eye to pending-action affordances like invite badges.
 */
export function PulsingView({
  children,
  style,
  minOpacity = 0.55,
  maxScale = 1.18,
  duration = 700,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  minOpacity?: number;
  maxScale?: number;
  duration?: number;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, duration]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, maxScale] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, minOpacity] });

  return <Animated.View style={[style, { transform: [{ scale }], opacity }]}>{children}</Animated.View>;
}
