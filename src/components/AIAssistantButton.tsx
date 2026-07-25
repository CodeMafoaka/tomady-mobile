import React, { useEffect, useRef } from "react";
import { StyleProp, StyleSheet, View, ViewStyle, Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  cancelAnimation,
  Easing,
  interpolate,
  interpolateColor,
  type SharedValue,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { C } from "../constant/theme";

interface AIAssistantButtonProps {
  onPress?: () => void;
  isListening?: boolean;
  isActive?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_SIZE = 56;
const ORBIT_DOTS = 3;

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({
  onPress,
  isListening = false,
  isActive = false,
  size = DEFAULT_SIZE,
  style,
}) => {
  /* ---------------------------------------------------------------- */
  /* Shared values                                                     */
  /* ---------------------------------------------------------------- */
  const breathe = useSharedValue(0); // slow inner breathing (idle "alive" feel)
  const pulseOuter = useSharedValue(0); // outer halo pulse
  const pulseInner = useSharedValue(0); // inner halo pulse (phase-shifted)
  const ringRotation = useSharedValue(0); // main gradient ring rotation
  const ringRotationReverse = useSharedValue(0); // counter-rotating inner ring
  const orbit = useSharedValue(0); // orbiting particles progress
  const press = useSharedValue(0); // press-in squish
  const scale = useSharedValue(1);
  const ripple = useSharedValue(0); // press ripple burst, 0 -> 1 one-shot
  const wave1 = useSharedValue(0.4);
  const wave2 = useSharedValue(0.4);
  const wave3 = useSharedValue(0.4);

  const mounted = useRef(false);

  /* ---------------------------------------------------------------- */
  /* Idle / ambient animations                                         */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    return () => cancelAnimation(breathe);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Reactive animations (listening / active state)                    */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const outerDuration = isListening ? 900 : 2200;
    const innerDuration = isListening ? 1100 : 2600;

    pulseOuter.value = withRepeat(
      withSequence(
        withTiming(1, { duration: outerDuration, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: outerDuration, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      true,
    );

    // phase-shifted so the two halos never breathe in perfect sync
    pulseInner.value = withDelay(
      outerDuration / 2,
      withRepeat(
        withSequence(
          withTiming(1, { duration: innerDuration, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: innerDuration, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );

    const ringDuration = isListening ? 3200 : 9000;
    ringRotation.value = withRepeat(
      withTiming(360, { duration: ringDuration, easing: Easing.linear }),
      -1,
      false,
    );
    ringRotationReverse.value = withRepeat(
      withTiming(-360, { duration: ringDuration * 1.6, easing: Easing.linear }),
      -1,
      false,
    );

    orbit.value = withRepeat(
      withTiming(360, { duration: isListening ? 2400 : 6000, easing: Easing.linear }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(pulseOuter);
      cancelAnimation(pulseInner);
      cancelAnimation(ringRotation);
      cancelAnimation(ringRotationReverse);
      cancelAnimation(orbit);
    };
  }, [isListening]);

  /* ---------------------------------------------------------------- */
  /* Listening waveform — three bars breathing out of phase             */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!isListening) {
      wave1.value = withTiming(0.4, { duration: 200 });
      wave2.value = withTiming(0.4, { duration: 200 });
      wave3.value = withTiming(0.4, { duration: 200 });
      return;
    }

    const makeWave = (sv: SharedValue<number>, delay: number, duration: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.25, { duration, easing: Easing.inOut(Easing.quad) }),
          ),
          -1,
          true,
        ),
      );
    };

    makeWave(wave1, 0, 340);
    makeWave(wave2, 120, 300);
    makeWave(wave3, 60, 380);

    return () => {
      cancelAnimation(wave1);
      cancelAnimation(wave2);
      cancelAnimation(wave3);
    };
  }, [isListening]);

  /* ---------------------------------------------------------------- */
  /* Animated styles                                                   */
  /* ---------------------------------------------------------------- */
  const outerGlowStyle = useAnimatedStyle(() => {
    const s = interpolate(pulseOuter.value, [0, 1], [0.95, isListening ? 1.45 : 1.2]);
    const o = interpolate(pulseOuter.value, [0, 1], [0.25, isListening ? 0.8 : 0.45]);
    return { transform: [{ scale: s }], opacity: o };
  });

  const innerGlowStyle = useAnimatedStyle(() => {
    const s = interpolate(pulseInner.value, [0, 1], [0.85, isListening ? 1.2 : 1.05]);
    const o = interpolate(pulseInner.value, [0, 1], [0.2, isListening ? 0.6 : 0.35]);
    return { transform: [{ scale: s }], opacity: o };
  });

  const coreBreatheStyle = useAnimatedStyle(() => {
    const s = interpolate(breathe.value, [0, 1], [1, 1.045]);
    return { transform: [{ scale: isListening ? 1 : s }] };
  });

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const ringReverseStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotationReverse.value}deg` }],
    opacity: 0.5,
  }));

  const buttonScaleStyle = useAnimatedStyle(() => {
    const squish = interpolate(press.value, [0, 1], [1, 0.9]);
    return { transform: [{ scale: scale.value * squish }] };
  });

  const rippleStyle = useAnimatedStyle(() => {
    const s = interpolate(ripple.value, [0, 1], [0.4, 1.9]);
    const o = interpolate(ripple.value, [0, 1], [0.45, 0]);
    return { transform: [{ scale: s }], opacity: o };
  });

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      press.value,
      [0, 1],
      [isActive ? C.violet : C.greenDeep, isActive ? C.violet : C.greenDeep],
    ),
  }));

  const waveBarStyle = (sv: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      transform: [{ scaleY: interpolate(sv.value, [0, 1], [0.3, 1]) }],
      opacity: interpolate(sv.value, [0, 1], [0.5, 1]),
    }));

  const wave1Style = waveBarStyle(wave1);
  const wave2Style = waveBarStyle(wave2);
  const wave3Style = waveBarStyle(wave3);

  /* ---------------------------------------------------------------- */
  /* Handlers                                                           */
  /* ---------------------------------------------------------------- */
  const handlePressIn = () => {
    press.value = withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) });
  };

  const handlePressOut = () => {
    press.value = withSpring(0, { stiffness: 260, damping: 14 });
    scale.value = withSequence(
      withTiming(1.04, { duration: 120, easing: Easing.out(Easing.quad) }),
      withSpring(1, { stiffness: 300, damping: 15 }),
    );
    ripple.value = 0;
    ripple.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.quad) });
  };

  /* ---------------------------------------------------------------- */
  /* Orbiting particles — positioned via rotate + fixed translateX      */
  /* ---------------------------------------------------------------- */
  const orbitRadius = size / 2 + 10;
  const dots = Array.from({ length: ORBIT_DOTS });

  return (
    <View style={[styles.wrapper, style]}>
      {/* Outer breathing halo */}
      <Animated.View
        style={[
          styles.glowLayer,
          { width: size + 24, height: size + 24, borderRadius: (size + 24) / 2 },
          outerGlowStyle,
        ]}
      >
        <LinearGradient
          colors={["#ec4899", "#a855f7", "#06b6d4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        />
      </Animated.View>

      {/* Inner phase-shifted halo, adds depth */}
      <Animated.View
        style={[
          styles.glowLayer,
          { width: size + 12, height: size + 12, borderRadius: (size + 12) / 2 },
          innerGlowStyle,
        ]}
      >
        <LinearGradient
          colors={["#06b6d4", "#a855f7", "#ec4899"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientFill}
        />
      </Animated.View>

      {/* Orbiting particles, only visible when active/listening */}
      {(isActive || isListening) &&
        dots.map((_, i) => {
          const dotStyle = useAnimatedStyle(() => {
            const angle = orbit.value + (360 / ORBIT_DOTS) * i;
            return {
              transform: [
                { rotate: `${angle}deg` },
                { translateX: orbitRadius },
                { rotate: `${-angle}deg` },
              ],
            };
          });
          return (
            <Animated.View key={i} style={[styles.orbitDot, dotStyle]}>
              <View style={styles.orbitDotInner} />
            </Animated.View>
          );
        })}

      {/* Press ripple burst */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ripple,
          { width: size, height: size, borderRadius: size / 2 },
          rippleStyle,
        ]}
      />

      {/* Main button */}
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel="Assistant IA"
        accessibilityRole="button"
        style={styles.pressableArea}
      >
        <Animated.View
          style={[
            styles.buttonBody,
            { width: size, height: size, borderRadius: size / 2 },
            buttonScaleStyle,
            isActive && styles.buttonBodyActive,
          ]}
        >
          {/* Counter-rotating faint ring for parallax depth */}
          <Animated.View style={[styles.rainbowRing, ringReverseStyle]}>
            <LinearGradient
              colors={["#06b6d4", "#3b82f6", "#a855f7"]}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientFill}
            />
          </Animated.View>

          {/* Main rotating gradient ring */}
          <Animated.View style={[styles.rainbowRing, ringStyle]}>
            <LinearGradient
              colors={["#3b82f6", "#ec4899", "#eab308", "#06b6d4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientFill}
            />
          </Animated.View>

          {/* Dark core, masks ring center */}
          <View
            style={[
              styles.darkCore,
              { width: size - 8, height: size - 8, borderRadius: (size - 8) / 2 },
            ]}
          />

          {/* Glass core — breathes idle, shows waveform when listening */}
          <Animated.View style={[styles.glassCore, coreBreatheStyle]}>
            {isListening ? (
              <View style={styles.waveRow}>
                <Animated.View style={[styles.waveBar, wave1Style]} />
                <Animated.View style={[styles.waveBar, styles.waveBarMid, wave2Style]} />
                <Animated.View style={[styles.waveBar, wave3Style]} />
              </View>
            ) : (
              <View style={styles.dot} />
            )}
          </Animated.View>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    transform: [{ translateY: -16 }],
  },
  glowLayer: {
    position: "absolute",
    overflow: "hidden",
  },
  pressableArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(168, 85, 247, 0.6)",
  },
  orbitDot: {
    position: "absolute",
    width: 6,
    height: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  orbitDotInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#e879f9",
    shadowColor: "#e879f9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  buttonBody: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonBodyActive: {
    shadowOpacity: 0.55,
    shadowRadius: 14,
  },
  rainbowRing: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.75,
  },
  gradientFill: {
    flex: 1,
  },
  darkCore: {
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  glassCore: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(9, 9, 11, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e879f9",
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2.5,
    height: 14,
  },
  waveBar: {
    width: 2.5,
    height: 12,
    borderRadius: 1.5,
    backgroundColor: "#e879f9",
  },
  waveBarMid: {
    height: 14,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
  },
});

export default AIAssistantButton;