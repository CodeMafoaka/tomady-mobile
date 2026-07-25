import React, { useEffect } from "react";
import { StyleProp, StyleSheet, View, ViewStyle, Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  cancelAnimation,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { C } from "../constant/theme";

interface AIAssistantButtonProps {
  onPress?: () => void;
  isListening?: boolean;
  isActive?: boolean;
  style?: StyleProp<ViewStyle>;
}

const BUTTON_SIZE = 56;

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({
  onPress,
  isListening = false,
  isActive = false,
  style,
}) => {
  /* ---- Shared Values ---- */
  const pulse = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  /* ---- Animations ---- */
  useEffect(() => {
    // 1. Pulsation du halo lumineux
    const pulseDuration = isListening ? 1200 : 2500;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: pulseDuration, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: pulseDuration, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );

    // 2. Rotation continue pour l'effet fluide
    const rotationDuration = isListening ? 4000 : 8000;
    rotation.value = withRepeat(
      withTiming(360, { duration: rotationDuration, easing: Easing.linear }),
      -1,
      false,
    );
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(rotation);
    };
  }, [isListening]);

  /* ---- Animated Styles ---- */
  const glowStyle = useAnimatedStyle(() => {
    const scaleGlow = interpolate(pulse.value, [0, 1], [0.9, isListening ? 1.35 : 1.15]);
    const opacityGlow = interpolate(pulse.value, [0, 1], [0.35, isListening ? 0.85 : 0.55]);
    return {
      transform: [{ scale: scaleGlow }],
      opacity: opacityGlow,
    };
  });

  const orbRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const buttonScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  /* ---- Handlers ---- */
  const handlePressIn = () => {
    scale.value = withTiming(0.92, { duration: 100 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 300, damping: 15 });
  };

  return (
    <View style={[styles.wrapper, style]}>
      {/* 1. Halo lumineux d'arrière-plan pulsant */}
      <Animated.View style={[styles.glowLayer, glowStyle]}>
        <LinearGradient
          colors={["#ec4899", "#a855f7", "#06b6d4"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        />
      </Animated.View>

      {/* 2. Bouton principal */}
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
            buttonScaleStyle,
            isActive && styles.buttonBodyActive,
          ]}
        >
          {/* Couche arc-en-ciel en rotation — anneau extérieur */}
          <Animated.View style={[styles.rainbowRing, orbRotateStyle]}>
            <LinearGradient
              colors={["#3b82f6", "#ec4899", "#eab308", "#06b6d4"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientFill}
            />
          </Animated.View>

          {/* Rond noir intérieur — cache le centre du rainbow pour ne laisser qu'un anneau visible */}
          <View style={styles.darkCore} />

          {/* Cœur central effet glassmorphism */}
          <View style={styles.glassCore} />
        </Animated.View>
      </Pressable>

      {/* Label */}
      <Text
        style={[
          styles.label,
          { color: isActive ? C.violet : C.greenDeep },
        ]}
      >
        Assistant
      </Text>
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
    width: BUTTON_SIZE + 14,
    height: BUTTON_SIZE + 14,
    borderRadius: (BUTTON_SIZE + 14) / 2,
    overflow: "hidden",
  },
  pressableArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonBody: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
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
    width: BUTTON_SIZE - 8,
    height: BUTTON_SIZE - 8,
    borderRadius: (BUTTON_SIZE - 8) / 2,
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
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
  },
});

export default AIAssistantButton;
