import React, { useEffect } from "react";
import { StyleProp, StyleSheet, View, ViewStyle, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withRepeat,
  Easing,
  cancelAnimation,
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
const ORB_SCALE = 1.4;
const BORDER_WIDTH = 0.5;

export const AIAssistantButton: React.FC<AIAssistantButtonProps> = ({
  onPress,
  isListening = false,
  isActive = false,
  size = DEFAULT_SIZE,
  style,
}) => {
  // Shared values pour la physique de pression et d'animation
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.4);

  // Configuration exacte du feedback tactile (style Pinterest Lens/Visual Search)
  const handlePressIn = () => {
    scale.value = withTiming(0.92, {
      duration: 100,
      easing: Easing.out(Easing.quad),
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      stiffness: 300,
      damping: 18,
      mass: 0.8,
    });
  };

  // Animation de respiration/pulsation active (détection visuelle)
  useEffect(() => {
    if (isListening || isActive) {
      pulseScale.value = withRepeat(
        withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
      pulseOpacity.value = withRepeat(
        withTiming(0.85, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      cancelAnimation(pulseOpacity);
      pulseScale.value = withTiming(1, { duration: 250 });
      pulseOpacity.value = withTiming(0.4, { duration: 250 });
    }
  }, [isListening, isActive]);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animatedPulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
      opacity: pulseOpacity.value,
    };
  });

  const speed = isListening ? "listening" : isActive ? "active" : "idle";
  const containerSize = size * ORB_SCALE;
  const orbSize = containerSize * 0.9;

  return (
    <View style={[styles.wrapper, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityLabel="Assistant IA - Recherche Visuelle"
        accessibilityRole="button"
        style={[styles.pressableArea, { width: containerSize, height: containerSize }]}
      >
        <Animated.View
          style={[
            styles.frame,
            animatedButtonStyle,
            {
              width: containerSize,
              height: containerSize,
              borderRadius: containerSize / 2,
            },
          ]}
        >
          {/* Couche d'onde/glow pulsante */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              animatedPulseStyle,
              {
                borderRadius: containerSize / 2,
                backgroundColor: "rgba(255, 255, 255, 0.15)",
              },
            ]}
          />

          {/* Orbe visuel principal */}
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

          {/* Cœur/Bordure de finition */}
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
  },
  pressableArea: {
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#e60023", // Rouge signature Pinterest (ou adaptez à votre thème)
    borderWidth: BORDER_WIDTH,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  core: {
    position: "absolute",
    backgroundColor: "transparent",
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
});

export default AIAssistantButton;