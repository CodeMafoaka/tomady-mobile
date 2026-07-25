import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flame, Beef, Heart, Sparkles, Check, Info } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";
import { TopBar } from "../components/TopBar";

const GOALS = [
  { t: "Perdre du poids", d: "Un déficit calorique progressif et durable.", icon: Flame },
  { t: "Prendre de la masse", d: "Plus de protéines, plus d'énergie.", icon: Beef },
  { t: "Maintenir mon poids", d: "Un équilibre stable au quotidien.", icon: Heart },
  { t: "Améliorer ma condition physique", d: "Nutrition alignée avec vos entraînements.", icon: Sparkles },
];

export function GoalScreen({ go }) {
  const [sel, setSel] = useState("Perte de poids");

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.white }}>
      <TopBar title="Votre objectif" onBack={() => go("personalInfo")} />

      <View className="px-5 pb-1">
        {/* Step progress indicator */}
        <View className="flex-row items-center" style={{ gap: 8 }}>
          {[1, 2, 3, 4, 5].map((step) => (
            <View key={step} className="flex-1 flex-row items-center">
              <View
                className="h-2 flex-1 rounded-full"
                style={{
                  backgroundColor: step <= 3 ? C.green : C.line,
                  opacity: step <= 3 ? 1 : 0.5,
                }}
              />
            </View>
          ))}
        </View>
        <View className="mt-[6px] flex-row justify-between">
          {["Bienvenue", "Infos", "Objectif", "Profil", "Prêt"].map((label, i) => (
            <Text
              key={label}
              className="text-[10.5px] font-semibold"
              style={{ color: i <= 2 ? C.greenDeep : C.muted, opacity: i <= 2 ? 1 : 0.5 }}
            >
              {label}
            </Text>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        {GOALS.map(({ t, d, icon: Icon }) => {
          const isSel = sel === t;
          return (
            <Pressable
              key={t}
              onPress={() => setSel(t)}
              accessibilityLabel={t}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSel }}
              className="flex-row items-center rounded-[18px] border-[1.5px] p-4 active:opacity-80"
              style={{
                gap: 14,
                borderColor: isSel ? C.green : C.line,
                backgroundColor: isSel ? C.greenTint : C.card,
                shadowColor: isSel ? C.green : 'transparent',
                shadowOpacity: isSel ? 0.15 : 0,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
                elevation: isSel ? 3 : 0,
              }}
            >
              <View
                className="h-11 w-11 items-center justify-center rounded-[14px] border"
                style={{ backgroundColor: isSel ? C.green : C.white, borderColor: isSel ? C.green : C.line }}
              >
                <Icon size={20} color={isSel ? C.white : C.greenDeep} />
              </View>
              <View className="flex-1">
                <Text className="text-[14.5px] font-bold" style={{ color: C.ink }}>
                  {t}
                </Text>
                <Text className="mt-[2px] text-[12.5px]" style={{ color: C.muted }}>
                  {d}
                </Text>
              </View>
              {isSel && <Check size={18} color={C.greenDeep} />}
            </Pressable>
          );
        })}

        <View className="mt-2 flex-row rounded-[14px] p-[14px]" style={{ backgroundColor: C.amberTint, gap: 10 }}>
          <Info size={16} color={C.amberDeep} style={{ marginTop: 1 }} />
          <Text className="flex-1 text-xs leading-[18px]" style={{ color: C.amberDeep2 }}>
            Les recommandations de Tomady ne remplacent pas les conseils d'un médecin ou d'un professionnel de santé.
          </Text>
        </View>
      </ScrollView>

      <View className="px-5 pb-[30px]">          
        <Pressable
            onPress={() => go("dashboard")}
            accessibilityLabel="Continuer"
            accessibilityRole="button"
            className="w-full items-center rounded-2xl py-[15px] active:opacity-80"
            style={{
              backgroundColor: C.green,
              shadowColor: C.green,
              shadowOpacity: 0.4,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 4,
            }}
          >
            <Text className="text-[15px] font-bold" style={{ color: C.white }}>
              Continuer
            </Text>
          </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default GoalScreen;
