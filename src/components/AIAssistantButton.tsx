import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle, Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { AIOrb } from "./AIOrb";
import { C } from "../constant/theme";

interface AIAssistantButtonProps {
  onPress?: () => void;
  isListening?: boolean;
  isActive?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_SIZE = 56;
// L'orbe est rendu plus grand que le bouton lui-même : le halo flouté
// déborde volontairement autour du disque central, comme sur la référence.
const ORB_SCALE = 2.5;

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({
  onPress,
  isListening = false,
  isActive = false,
  size = DEFAULT_SIZE,
  style,
}) => {
  const scale = useSharedValue(1);
  const press = useSharedValue(0);

  const handlePressIn = () => {
    press.value = withTiming(1, { duration: 90, easing: Easing.out(Easing.quad) });
  };

  const handlePressOut = () => {
    press.value = withSpring(0, { stiffness: 260, damping: 14 });
    scale.value = withSequence(
      withTiming(1.05, { duration: 120, easing: Easing.out(Easing.quad) }),
      withSpring(1, { stiffness: 300, damping: 15 }),
    );
  };

  const buttonScaleStyle = useAnimatedStyle(() => {
    const squish = 1 - press.value * 0.08;
    return { transform: [{ scale: scale.value * squish }] };
  });

  const speed = isListening ? "listening" : isActive ? "active" : "idle";
  const orbSize = size * ORB_SCALE;

  return (
    <View style={[styles.wrapper, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel="Assistant IA"
        accessibilityRole="button"
        style={[styles.pressableArea, { width: orbSize, height: orbSize }]}
      >
        <Animated.View style={buttonScaleStyle}>
          {/* Vrai orbe flouté : plusieurs masses de couleur mélangées, comme la référence */}
          <AIOrb size={orbSize} speed={speed} />

          {/* Cœur sombre au centre, pour garder un disque net cliquable */}
          <View
            style={[
              styles.core,
              {
                width: size * 0.5,
                height: size * 0.5,
                borderRadius: (size * 0.5) / 2,
                top: (orbSize - size * 0.5) / 2,
                left: (orbSize - size * 0.5) / 2,
              },
            ]}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  pressableArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  core: {
    position: "absolute",
    backgroundColor: "rgba(9, 9, 11, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
  },
});

export default AIAssistantButton;