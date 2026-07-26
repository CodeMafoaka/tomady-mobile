import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Bell, Beef, Wheat, Droplet, Sparkles, UtensilsCrossed, ChevronRight } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";
import { USER } from "../data/mockData";
import { getProfile, getDailySummary } from "../services/tomadyBridge";

/* ───────────────────────────────────────────
   FadeIn — animation d'entrée stagger
   ─────────────────────────────────────────── */
function FadeInView({ delay = 0, children, style }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  );
}

/* ───────────────────────────────────────────
   MacroRow — barre de macro inline élégante
   ─────────────────────────────────────────── */
function MacroRow({ label, consumed, goal, color, Icon }) {
  const pct = Math.min(1, consumed / goal);
  return (
    <View className="flex-row items-center" style={{ gap: 10 }}>
      <View
        className="h-[28px] w-[28px] items-center justify-center rounded-full"
        style={{ backgroundColor: color + "18" }}
      >
        <Icon size={14} color={color} />
      </View>
      <View className="flex-1" style={{ gap: 4 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-[12px] font-semibold" style={{ color: C.muted }}>
            {label}
          </Text>
          <Text className="text-[12px] font-bold" style={{ color: C.ink }}>
            {consumed}
            <Text style={{ color: C.muted, fontWeight: "500" }}>/{goal}g</Text>
          </Text>
        </View>
        <View className="h-[5px] overflow-hidden rounded-full" style={{ backgroundColor: C.line }}>
          <View
            className="h-full rounded-full"
                            style={{
                              width: `${pct * 100}%`,
                              backgroundColor: color,
                            }}
                          />
                        </View>
      </View>
    </View>
  );
}

/* ───────────────────────────────────────────
   DashboardScreen
   ─────────────────────────────────────────── */
export function DashboardScreen({ go, profile: propProfile, meals: propMeals }) {
  const [localProfile, setLocalProfile] = useState(propProfile || USER);
  const todayMeals = propMeals || [];

  // Charger le profil depuis le bridge au montage
  useEffect(() => {
    (async () => {
      try {
        const bp = await getProfile();
        if (bp && bp.firstName) {
          // Charger le résumé du jour
          const today = new Date().toISOString().split('T')[0];
          const summary = await getDailySummary(today);
          setLocalProfile({
            ...bp,
            caloriesConsumed: summary?.calories ?? bp.caloriesConsumed ?? 0,
            protein: { ...bp.protein, consumed: summary?.protein.consumed ?? bp.protein?.consumed ?? 0 },
            carbs: { ...bp.carbs, consumed: summary?.carbs.consumed ?? bp.carbs?.consumed ?? 0 },
            fat: { ...bp.fat, consumed: summary?.fat.consumed ?? bp.fat?.consumed ?? 0 },
          });
        }
      } catch {}
    })();
  }, []);

  const p = propProfile || localProfile;
  const pct = Math.min(1, (p.caloriesConsumed || 0) / Math.max(1, p.calorieGoal || 2000));
  const remaining = Math.max(0, (p.calorieGoal || 2000) - (p.caloriesConsumed || 0));

  const macros = [
    { label: "Protéines", ...p.protein, color: C.green, Icon: Beef },
    { label: "Glucides", ...p.carbs, color: C.amber, Icon: Wheat },
    { label: "Lipides", ...p.fat, color: C.blue, Icon: Droplet },
  ];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-5 pb-1 pt-2">
        <View>
          <Text
            style={{ fontFamily: FONTS.display, color: C.ink }}
            className="text-[22px] font-semibold"
          >
            Bonjour, {p.name} 👋
          </Text>
          <Text className="mt-[2px] text-[14.5px]" style={{ color: C.muted }}>
            Votre résumé nutritionnel du jour.
          </Text>
        </View>
        <Pressable
          onPress={() => go("alerts")}
          accessibilityLabel="Alertes et notifications"
          accessibilityRole="button"
          className="h-[44px] w-[44px] items-center justify-center rounded-full"
          style={{ backgroundColor: C.white, borderColor: C.line, borderWidth: 1 }}
        >
          <Bell size={18} color={C.ink} />
          <View
            className="absolute h-[9px] w-[9px] rounded-full border-2"
            style={{ top: 7, right: 7, backgroundColor: C.coral, borderColor: C.white }}
          />
        </Pressable>
      </View>

      {/* ── Contenu scrollable ── */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {p.caloriesConsumed === 0 ? (
          /* ══════ État vide ══════ */
          <FadeInView>
            <View className="items-center justify-center py-[60px]" style={{ gap: 16 }}>
              <View
                className="h-[88px] w-[88px] items-center justify-center rounded-full"
                style={{ backgroundColor: C.greenTint }}
              >
                <UtensilsCrossed size={32} color={C.greenDeep} />
              </View>
              <Text className="text-center text-[20px] font-bold" style={{ color: C.ink }}>
                Aucun repas enregistré aujourd'hui
              </Text>
              <Text
                className="max-w-[280px] text-center text-[13px] leading-[20px]"
                style={{ color: C.muted }}
              >
                Commencez votre journal alimentaire en ajoutant votre premier repas.
              </Text>
              <Pressable
                onPress={() => go("assistant")}
                accessibilityLabel="Ajouter mon premier repas"
                accessibilityRole="button"
                className="mt-2 items-center rounded-2xl px-[28px] py-[14px] active:opacity-80"
                style={{
                  backgroundColor: C.green,
                  shadowColor: C.green,
                  shadowOpacity: 0.4,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 4,
                }}
              >
                <Text className="text-[14px] font-bold" style={{ color: C.white }}>
                  Ajouter mon premier repas
                </Text>
              </Pressable>
            </View>
          </FadeInView>
        ) : (
          /* ══════ Contenu normal ══════ */
          <>
            {/* ──────── Carte principale : calories + macros ──────── */}
            <FadeInView delay={0}>
              <View
                className="overflow-hidden rounded-[24px] p-[24px]"
                style={{
                  backgroundColor: C.white,
                  shadowColor: "#000",
                  shadowOpacity: 0.06,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 3,
                }}
              >
                {/* Rangée supérieure : chiffre + statut */}
                <View className="flex-row items-end justify-between">
                  <View>
                    <Text
                      className="text-[44px] leading-[44px] font-extrabold"
                      style={{ fontFamily: FONTS.display, color: C.ink }}
                    >
                      {p.caloriesConsumed}
                    </Text>
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Text className="text-[14px] font-semibold" style={{ color: C.muted }}>
                        sur {p.calorieGoal} kcal
                      </Text>
                      <View
                        className="h-[22px] items-center justify-center rounded-full px-[8px]"
                        style={{ backgroundColor: C.greenTint }}
                      >
                        <Text
                          className="text-[11px] font-bold"
                          style={{ color: C.greenDeep }}
                        >
                          {Math.round(pct * 100)}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Anneau de progression minimal (sans SVG, juste visuel) */}
                  <View className="items-end">
                    <Text className="text-[13px] font-semibold" style={{ color: C.amber }}>
                      {remaining > 0 ? `Il reste ${remaining} kcal` : "Objectif atteint !"}
                    </Text>
                    <Text className="mt-[2px] text-[12px]" style={{ color: C.muted }}>
                      {p.goal}
                    </Text>
                  </View>
                </View>

                {/* Barre de progression large */}
                <View className="mt-[18px] h-[8px] overflow-hidden rounded-full" style={{ backgroundColor: C.line }}>
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${pct * 100}%`, backgroundColor: C.green }}
                  />
                </View>

                {/* Séparateur léger */}
                <View className="my-[18px] h-[1px]" style={{ backgroundColor: C.line }} />

                {/* Macros inline */}
                <View style={{ gap: 14 }}>
                  {macros.map((m) => (
                    <MacroRow key={m.label} {...m} />
                  ))}
                </View>
              </View>
            </FadeInView>

            {/* ──────── Repas du jour ──────── */}
            <FadeInView delay={200}>
              <View>
                <View className="mb-[10px] flex-row items-center justify-between">
                  <Text
                    style={{ fontFamily: FONTS.display, color: C.ink }}
                    className="text-[16px] font-semibold"
                  >
                    Repas du jour
                  </Text>
                  <Pressable
                    onPress={() => go("journal")}
                    accessibilityLabel="Voir tous les repas"
                    accessibilityRole="button"
                    className="flex-row items-center active:opacity-60"
                    style={{ gap: 4 }}
                  >
                    <Text className="text-[12px] font-bold" style={{ color: C.greenDeep }}>
                      Voir tout
                    </Text>
                    <ChevronRight size={14} color={C.greenDeep} />
                  </Pressable>
                </View>

                <View
                  className="overflow-hidden rounded-[18px]"
                  style={{
                    backgroundColor: C.white,
                    shadowColor: "#000",
                    shadowOpacity: 0.04,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 2,
                  }}
                >
                  {todayMeals.length === 0 ? (
                    <View className="items-center py-6" style={{ gap: 8 }}>
                      <UtensilsCrossed size={20} color={C.muted} />
                      <Text className="text-[12px]" style={{ color: C.muted }}>
                        Aucun repas pour aujourd'hui
                      </Text>
                    </View>
                  ) : (
                    todayMeals.map((m, i) => {
                      const dotColor =
                        m.status === "good" ? C.green
                          : m.status === "warn" ? C.amber
                          : C.line;

                      return (
                        <Pressable
                          key={m.id || i}
                          onPress={() => {}}
                          className="flex-row px-4 py-[14px] active:opacity-60"
                          style={{
                            gap: 12,
                            borderBottomWidth: i < todayMeals.length - 1 ? 1 : 0,
                            borderBottomColor: C.line,
                          }}
                        >
                          {/* Timeline dot + ligne */}
                          <View className="items-center self-stretch justify-start" style={{ width: 14, gap: 2 }}>
                            <View
                              className="h-[10px] w-[10px] rounded-full"
                              style={{ backgroundColor: dotColor }}
                            />
                            {i < todayMeals.length - 1 && (
                              <View className="w-[1px] flex-1" style={{ backgroundColor: C.line }} />
                            )}
                          </View>

                          <View className="flex-1 justify-center">
                            <Text className="text-[14px] font-semibold" style={{ color: C.ink }}>
                              {m.name}
                            </Text>
                            <Text className="mt-[2px] text-[12px]" style={{ color: C.muted }}>
                              {m.time}
                            </Text>
                          </View>

                          <View
                            className="rounded-full px-[10px] py-[4px] justify-center"
                            style={{ backgroundColor: C.canvas }}
                          >
                            <Text className="text-[12px] font-bold" style={{ color: C.inkSoft }}>
                              {m.kcal} kcal
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })
                  )}
                </View>
              </View>
            </FadeInView>

            {/* ──────── AI Insight ──────── */}
            <FadeInView delay={350}>
              <View
                className="overflow-hidden rounded-[20px]"
                style={{
                  backgroundColor: C.white,
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 2,
                }}
              >
                <LinearGradient
                  colors={[C.greenTint, C.white]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="flex-row"
                  style={{ gap: 16, paddingVertical: 24, paddingHorizontal: 24 }}
                >
                  <View
                    className="h-[36px] w-[36px] items-center justify-center rounded-full"
                    style={{ backgroundColor: C.green }}
                  >
                    <Sparkles size={16} color={C.white} />
                  </View>
                  <View className="flex-1" style={{ gap: 6 }}>
                    <Text
                      className="text-[11px] font-extrabold uppercase tracking-[0.8px]"
                      style={{ color: C.greenDeep }}
                    >
                      Insight Tomady
                    </Text>
                    <Text
                      style={{ fontFamily: FONTS.displayItalic, color: C.inkSoft }}
                      className="text-[13px] leading-[22px]"
                    >
                      "Vous avez consommé moins de protéines que votre objectif aujourd'hui.
                      Essayez d'ajouter une source de protéines à votre prochain repas."
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            </FadeInView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default DashboardScreen;
