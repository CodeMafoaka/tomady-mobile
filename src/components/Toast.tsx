import { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { Check } from "lucide-react-native";
import { C } from "../constant/theme";

export function Toast({ message, onDone }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Fade in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 2.5s
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 10,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDone?.();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, [opacity, translateY, onDone]);

  return (
    <Animated.View
      className="absolute bottom-[100px] left-5 right-5 flex-row items-center rounded-[14px] px-[16px] py-[13px]"
      style={{
        backgroundColor: C.ink,
        opacity,
        transform: [{ translateY }],
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
        gap: 10,
      }}
    >
      <View
        className="h-[22px] w-[22px] items-center justify-center rounded-full"
        style={{ backgroundColor: C.green }}
      >
        <Check size={12} color={C.white} strokeWidth={3} />
      </View>
      <Text
        className="flex-1 text-[13px] font-semibold"
        style={{ color: C.white }}
      >
        {message}
      </Text>
    </Animated.View>
  );
}

export default Toast;
