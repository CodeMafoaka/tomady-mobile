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

interface AIAssistantButtonProps {
  onPress?: () => void;
  isListening?: boolean;
  isActive?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_SIZE = 42;
// Halo plus contenu : juste un peu plus grand que le disque, pas un halo géant.
const ORB_SCALE = 1.4;
const BORDER_WIDTH = 0.1;

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
  // L'orbe lui-même est généré un peu plus grand que le cadre visible,
  // puis coupé net par overflow:hidden + bordure ci-dessous, pour un
  // rendu compact et bien défini plutôt qu'un halo qui déborde partout.
  const containerSize = size * ORB_SCALE;
  const orbSize = containerSize * 0.9;

  return (
    <View style={[styles.wrapper, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel="Assistant IA"
        accessibilityRole="button"
        style={[styles.pressableArea, { width: containerSize, height: containerSize }]}
      >
        <Animated.View
          style={[
            styles.frame,
            buttonScaleStyle,
            {
              width: containerSize,
              height: containerSize,
              borderRadius: containerSize / 2,
              borderWidth: BORDER_WIDTH
            },
          ]}
        >
          {/* Vrai orbe flouté, centré et rogné au cadre par overflow:hidden */}
          <View
            style={{
              position: "absolute",
              width: orbSize,
              height: orbSize,
              top: (containerSize - orbSize) / 2,
              left: (containerSize - orbSize) / 2,
            }}
          >
            <AIOrb size={orbSize} speed={speed} />
          </View>

          {/* Cœur sombre au centre, pour garder un disque net cliquable */}
          <View
            style={[
              styles.core,
              {
                width: size * 0.5,
                height: size * 0.5,
                borderRadius: (size * 0.5) / 2,
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
    gap: 4,
  },
  pressableArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#ac0479ff",
  },
  core: {
    position: "absolute",
    backgroundColor: "rgba(23, 23, 255, 0.33)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
  },
});

export default AIAssistantButton;