import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Mic } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";

function PulsingCircle() {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.08, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale]);

  return (
    <Animated.View
      className="h-[92px] w-[92px] items-center justify-center rounded-full"
      style={{ backgroundColor: C.greenTint, transform: [{ scale }] }}
    >
      <LinearGradient
        colors={[C.green, C.greenDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="h-[66px] w-[66px] items-center justify-center rounded-full"
      >
        <Mic size={26} color={C.white} />
      </LinearGradient>
    </Animated.View>
  );
}

function VoiceBar({ delay = 0, baseHeight = 0.8 }) {
  const height = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(height, { toValue: 30, duration: baseHeight * 1000, useNativeDriver: false }),
        Animated.timing(height, { toValue: 6, duration: baseHeight * 1000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [height, delay, baseHeight]);

  return <Animated.View className="w-1 rounded-full" style={{ height, backgroundColor: C.green }} />;
}

export function VoiceModal({ close }) {
  return (
    <View className="absolute inset-0 items-end justify-end" style={{ backgroundColor: "rgba(22,36,28,0.6)" }}>
      <View className="w-full rounded-t-[28px] px-6 pb-[34px] pt-[26px]" style={{ backgroundColor: C.white, position: "relative" }}>
        <Pressable
          onPress={close}
          className="absolute h-[30px] w-[30px] items-center justify-center rounded-full"
          style={{ top: 18, right: 18, backgroundColor: C.canvas, zIndex: 1 }}
        >
          <X size={15} color={C.ink} />
        </Pressable>

        <View className="items-center">
          <Text className="text-[11.5px] font-extrabold uppercase tracking-[0.6px]" style={{ color: C.greenDeep }}>
            Je vous écoute
          </Text>

          <View className="my-[26px] flex-row items-center justify-center">
            <PulsingCircle />
          </View>

          <View className="mb-[18px] flex-row items-end justify-center" style={{ gap: 4, height: 30 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <VoiceBar key={i} delay={i * 80} baseHeight={0.4 + (i % 3) * 0.1} />
            ))}
          </View>

          <Text
            style={{ fontFamily: FONTS.displayItalic, color: C.inkSoft }}
            className="px-2 text-center text-[15px] leading-[23px]"
          >
            "J'ai mangé du riz, des haricots et une banane."
          </Text>

          <View className="mt-5 w-full rounded-2xl p-[14px]" style={{ backgroundColor: C.greenTint }}>
            <Text className="mb-[6px] text-[11px] font-extrabold" style={{ color: C.greenDeep }}>Repas identifié ✓</Text>
            <Text className="text-[12.5px]" style={{ color: C.inkSoft }}>≈ 430 kcal · P16 · G72 · L6</Text>
          </View>

          <Pressable onPress={close} className="mt-4 w-full items-center rounded-2xl py-[14px]" style={{ backgroundColor: C.green }}>
            <Text className="text-[13.5px] font-bold" style={{ color: C.white }}>Ajouter à mon journal</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default VoiceModal;
