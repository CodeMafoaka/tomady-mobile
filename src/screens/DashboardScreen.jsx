import { useEffect, useRef } from "react";
import { View, Text, Pressable, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, Beef, Wheat, Droplet, Sparkles, Plus } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";
import { Blob } from "../components/Blob";
import { GrowthRing } from "../components/GrowthRing";
import { USER, MEALS_TODAY } from "../data/mockData";

function FadeInView({ delay = 0, children, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function DashboardScreen({ go }) {
  const pct = USER.caloriesConsumed / USER.calorieGoal;
  const remaining = USER.calorieGoal - USER.caloriesConsumed;

  const macros = [
    { label: "Protéines", ...USER.protein, color: C.green, Icon: Beef },
    { label: "Glucides", ...USER.carbs, color: C.amber, Icon: Wheat },
    { label: "Lipides", ...USER.fat, color: C.blue, Icon: Droplet },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      <View className="flex-row items-center justify-between px-5 pb-1 pt-2">
        <View>
          <Text style={{ fontFamily: FONTS.display, color: C.ink }} className="text-[20px] font-semibold">
            Bonjour, {USER.name} 👋
          </Text>
          <Text className="mt-[2px] text-[14.5px]" style={{ color: C.muted }}>
            Voici votre résumé nutritionnel du jour.
          </Text>
        </View>
        <Pressable
          onPress={() => go("alerts")}
          accessibilityLabel="Alertes et notifications"
          accessibilityRole="button"
          className="h-[44px] w-[44px] items-center justify-center rounded-full border"
          style={{ backgroundColor: C.white, borderColor: C.line }}
        >
          <Bell size={18} color={C.ink} />
          <View
            className="absolute h-[8px] w-[8px] rounded-full border-2"
            style={{ top: 8, right: 8, backgroundColor: C.coral, borderColor: C.white }}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 100, gap: 20 }}>
        {/* goal card animation */}
        <FadeInView delay={0}>
        <LinearGradient
          colors={[C.ink, "#223B2C"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          className="overflow-hidden rounded-[24px] p-[22px]"
          style={{ position: "relative" }}
        >
          <Blob size={140} color="rgba(46,204,113,0.18)" style={{ top: -40, right: -30 }} />
          <View className="flex-row items-center" style={{ gap: 18, zIndex: 1 }}>
            <GrowthRing
              percent={pct}
              size={110}
              stroke={10}
              trackColor="rgba(255,255,255,0.14)"
              label={
                <Text className="text-[20px] font-extrabold" style={{ color: C.white }}>
                  {USER.caloriesConsumed}
                </Text>
              }
              sublabel={<Text className="text-[12px]" style={{ color: "rgba(255,255,255,0.7)" }}>/ {USER.calorieGoal} kcal</Text>}
            />
            <View className="flex-1">
              <Text className="text-[13px] font-bold uppercase tracking-[1px]" style={{ color: "rgba(255,255,255,0.65)" }}>
                Objectif du jour
              </Text>
              <Text
                style={{ fontFamily: FONTS.display, color: C.white }}
                className="mt-[6px] text-[17px] font-semibold leading-[22px]"
              >
                Encore <Text style={{ color: C.green }}>{remaining} kcal</Text> disponibles
              </Text>
              <Text className="mt-[6px] text-[13.5px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                {USER.goal}
              </Text>
            </View>
          </View>
        </LinearGradient>
        </FadeInView>

        {/* macros avec stagger */}
        <View className="flex-row" style={{ gap: 10 }}>
          {macros.map((m, idx) => (
            <FadeInView key={m.label} delay={150 + idx * 100} style={{ flex: 1 }}>
            <View
              className="rounded-[18px] border-0 px-3 py-[14px]"
              style={{
                backgroundColor: C.card,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: 2,
              }}
            >
              <m.Icon size={16} color={m.color} />
              <Text className="mt-2 text-[15px] font-extrabold" style={{ color: C.ink }}>
                {m.consumed}
                <Text className="text-[13px] font-semibold" style={{ color: C.muted }}>/{m.goal}g</Text>
              </Text>
              <Text className="mt-[1px] text-[12.5px]" style={{ color: C.muted }}>
                {m.label}
              </Text>
              <View className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: C.line }}>
                <View
                  className="h-full"
                  style={{ width: `${Math.min(100, (m.consumed / m.goal) * 100)}%`, backgroundColor: m.color }}
                />
              </View>
            </View>
            </FadeInView>
          ))}
        </View>

        {/* meals timeline */}
        <FadeInView delay={500}>
        <View>
          <View className="mb-[10px] flex-row items-center justify-between">
            <Text style={{ fontFamily: FONTS.display, color: C.ink }} className="text-[15.5px] font-semibold">
              Repas du jour
            </Text>
            <Pressable
              onPress={() => go("journal")}
              accessibilityLabel="Voir tous les repas"
              accessibilityRole="button"
            >
              <Text className="text-xs font-bold" style={{ color: C.greenDeep }}>
                Voir tout
              </Text>
            </Pressable>
          </View>
          <View className="overflow-hidden rounded-[18px] border-0 shadow-sm" style={{ backgroundColor: C.card }}>
            {MEALS_TODAY.map((m, i) => (
              <View
                key={i}
                className="flex-row items-center px-4 py-[13px]"
                style={{
                  gap: 12,
                  borderBottomWidth: i < MEALS_TODAY.length - 1 ? 1 : 0,
                  borderBottomColor: C.line,
                }}
              >
                <View
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: m.status === "good" ? C.green : m.status === "warn" ? C.amber : C.line }}
                />
                <View className="flex-1">
                  <Text className="text-[13.5px] font-semibold" style={{ color: m.kcal ? C.ink : C.muted }}>
                    {m.name}
                  </Text>
                  <Text className="text-[13px]" style={{ color: C.muted }}>{m.time}</Text>
                </View>
                {m.kcal ? (
                  <Text className="text-[12.5px] font-bold" style={{ color: C.inkSoft }}>{m.kcal} kcal</Text>
                ) : (
                  <Plus size={16} color={C.green} />
                )}
              </View>
            ))}
          </View>
        </View>
        </FadeInView>

        {/* AI insight */}
        <FadeInView delay={650}>
        <View
          className="flex-row rounded-[20px] border-0 p-[18px]"
          style={{
            backgroundColor: C.violetTint,
            gap: 12,
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: C.violet }}>
            <Sparkles size={16} color={C.white} />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-extrabold uppercase tracking-[0.5px]" style={{ color: C.violetDeep }}>
              Insight de Gemmify
            </Text>
            <Text
              style={{ fontFamily: FONTS.displayItalic, color: C.inkSoft }}
              className="mt-[5px] text-sm leading-[21px]"
            >
              "Vous avez consommé moins de protéines que votre objectif aujourd'hui. Essayez d'ajouter une source de
              protéines à votre prochain repas."
            </Text>
          </View>
        </View>
        </FadeInView>

      </ScrollView>

      {/* FAB - Ajouter un repas */}
      <Pressable
        onPress={() => go("assistant")}
        accessibilityLabel="Ajouter un repas"
        accessibilityRole="button"
        className="absolute bottom-6 right-5 h-[60px] w-[60px] items-center justify-center rounded-full active:opacity-80"
        style={{
          backgroundColor: C.ink,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        }}
      >
        <Plus size={24} color={C.white} />
      </Pressable>
    </SafeAreaView>
  );
}

export default DashboardScreen;
