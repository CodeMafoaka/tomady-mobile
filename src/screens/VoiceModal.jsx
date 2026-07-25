import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, Easing, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X, Mic } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function PulsingCircle() {
  const scale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.15, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [scale, ringOpacity]);

  return (
    <View className="items-center justify-center" style={{ width: 130, height: 130 }}>
      {/* outer ring */}
      <Animated.View
        className="absolute h-[130px] w-[130px] rounded-full"
        style={{ backgroundColor: C.green, opacity: ringOpacity }}
      />
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
    </View>
  );
}

function VoiceBar({ delay = 0, baseHeight = 0.8 }) {
  const height = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(height, { toValue: 32, duration: baseHeight * 1000, useNativeDriver: false }),
        Animated.timing(height, { toValue: 6, duration: baseHeight * 1000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [height, delay, baseHeight]);

  return <Animated.View className="w-[3px] rounded-full" style={{ height, backgroundColor: C.green }} />;
}

export function VoiceModal({ close }) {
  const slideUp = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideUp, fadeIn]);

  return (
    <Pressable
      className="absolute inset-0"
      style={{ backgroundColor: "rgba(22,36,28,0.6)" }}
      onPress={close}
      accessibilityLabel="Fermer le modal vocal"
      accessibilityRole="button"
    >
      <Pressable
        className="absolute bottom-0 left-0 right-0"
        onPress={() => {}}
      >
        <Animated.View
          className="w-full rounded-t-[32px] px-6 pb-[34px] pt-[26px]"
          style={{
            backgroundColor: C.white,
            transform: [{ translateY: slideUp }],
            opacity: fadeIn,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: -6 },
            elevation: 10,
          }}
        >
          {/* Handle */}
          <View className="mb-4 items-center">
            <View
              className="h-[4px] w-[36px] rounded-full"
              style={{ backgroundColor: C.line }}
            />
          </View>

          <Pressable
            onPress={close}
            accessibilityLabel="Fermer"
            accessibilityRole="button"
            className="absolute h-[36px] w-[36px] items-center justify-center rounded-full"
            style={{ top: 20, right: 20, backgroundColor: C.canvas, zIndex: 1 }}
          >
            <X size={15} color={C.ink} />
          </Pressable>

          <View className="items-center">
            <Text className="text-[11.5px] font-extrabold uppercase tracking-[0.8px]" style={{ color: C.greenDeep }}>
              Je vous écoute
            </Text>

            <View className="my-[22px] flex-row items-center justify-center">
              <PulsingCircle />
            </View>

            <View className="mb-[18px] flex-row items-end justify-center" style={{ gap: 5, height: 32 }}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <VoiceBar key={i} delay={i * 70} baseHeight={0.3 + (i % 3) * 0.12} />
              ))}
            </View>

            <Text
              style={{ fontFamily: FONTS.displayItalic, color: C.inkSoft }}
              className="px-2 text-center text-[15px] leading-[23px]"
            >
              "J'ai mangé du riz, des haricots et une banane."
            </Text>

            <View
              className="mt-5 w-full rounded-2xl p-[14px]"
              style={{
                backgroundColor: C.violetTint,
                borderWidth: 1,
                borderColor: 'rgba(139,92,246,0.15)',
              }}
            >
              <Text className="mb-[6px] text-[11px] font-extrabold" style={{ color: C.violetDeep }}>Repas identifié ✓</Text>
              <Text className="text-[12.5px]" style={{ color: C.inkSoft }}>≈ 430 kcal · P16 · G72 · L6</Text>
            </View>

            <Pressable
              onPress={close}
              accessibilityLabel="Ajouter à mon journal"
              accessibilityRole="button"
              className="mt-4 w-full items-center rounded-2xl py-[15px] active:opacity-80"
              style={{
                backgroundColor: C.green,
                shadowColor: C.green,
                shadowOpacity: 0.4,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4,
              }}
            >
              <Text className="text-[13.5px] font-bold" style={{ color: C.white }}>Ajouter à mon journal</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Pressable>
    </Pressable>
  );
}

export default VoiceModal;
