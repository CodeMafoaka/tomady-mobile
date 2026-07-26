import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Leaf, ShieldAlert } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";
import { TopBar } from "../components/TopBar";
import { StatusBadge } from "../components/StatusBadge";
import { USER, FOODS } from "../data/mockData";
import { getProfile, getFoodDetails } from "../services/tomadyBridge";

export function FoodDetailScreen({ food, go, profile: propProfile }) {
  const [p, setP] = useState(propProfile || USER);
  const [f, setF] = useState(food || FOODS[0]);

  // Charger les données depuis le bridge au montage
  useEffect(() => {
    (async () => {
      try {
        const [profile, details] = await Promise.all([
          getProfile(),
          food ? getFoodDetails(food.id) : null,
        ]);
        if (profile) setP(profile);
        if (details?.food) setF(details.food);
      } catch {}
    })();
  }, [food]);
  const isGood = f.status === "good";

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.white }}>
      <TopBar title="Détail" onBack={() => go("catalogue")} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}>
        <LinearGradient
          colors={[C.greenTint, C.amberTint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mb-4 h-[170px] w-full items-center justify-center rounded-[28px]"
        >
          <Leaf size={52} color={C.greenDeep} />
        </LinearGradient>

        <View className="flex-row items-start justify-between">
          <View>
            <Text style={{ fontFamily: FONTS.display, color: C.ink }} className="text-[21px] font-semibold">
              {f.name}
            </Text>
            <Text className="mt-1 text-[12.5px]" style={{ color: C.muted }}>{f.cat}</Text>
          </View>
          <StatusBadge level={f.status} />
        </View>

        <View className="mt-[18px] flex-row" style={{ gap: 8 }}>
          {[["Kcal", f.kcal], ["Protéines", f.p + "g"], ["Glucides", f.c + "g"], ["Lipides", f.f + "g"]].map(([l, v]) => (
            <View key={l} className="flex-1 items-center rounded-[14px] px-2 py-3" style={{ backgroundColor: C.canvas }}>
              <Text className="text-[14.5px] font-extrabold" style={{ color: C.ink }}>{v}</Text>
              <Text className="mt-[2px] text-[10px]" style={{ color: C.muted }}>{l}</Text>
            </View>
          ))}
        </View>

        <View
          className="mt-5 rounded-[18px] border p-4"
          style={{ backgroundColor: isGood ? C.greenTint : C.amberTint, borderColor: isGood ? C.greenLine : "#FBD98F" }}
        >
          <Text
            className="text-[11.5px] font-extrabold uppercase tracking-[0.4px]"
            style={{ color: isGood ? C.greenDeep : C.amberDeep }}
          >
            Pourquoi Tomady vous recommande ce plat
          </Text>
          <Text style={{ fontFamily: FONTS.displayItalic, color: C.inkSoft }} className="mt-2 text-[13.5px] leading-[21px]">
            {isGood
              ? `Ce plat est riche en protéines et peut contribuer à votre objectif "${p.goal}".`
              : `Ce plat est plus riche en lipides que vos habitudes récentes — à consommer occasionnellement.`}
          </Text>
        </View>

        <View className="mt-3 flex-row rounded-[18px] p-4" style={{ backgroundColor: C.coralTint, gap: 10 }}>
          <ShieldAlert size={17} color={C.coral} style={{ marginTop: 1 }} />
          <View className="flex-1">
            <Text className="text-[12.5px] font-extrabold" style={{ color: C.coralDeep }}>Attention</Text>
            <Text className="mt-1 text-[12.5px] leading-[19px]" style={{ color: C.coralDeep2 }}>
              Vérifiez la présence d'allergènes ({p.allergies.join(", ")}) avant de consommer ce plat en dehors de
              chez vous.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="flex-row px-5 pb-[30px]" style={{ gap: 10 }}>
        <Pressable
          onPress={() => go("journal")}
          accessibilityLabel="Ajouter au journal"
          accessibilityRole="button"
          className="flex-1 items-center rounded-2xl py-[15px] active:opacity-80"
          style={{
            backgroundColor: C.green,
            shadowColor: C.green,
            shadowOpacity: 0.3,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 3,
          }}
        >
          <Text className="text-[13.5px] font-bold" style={{ color: C.white }}>Ajouter au journal</Text>
        </Pressable>
        <Pressable
          onPress={() => go("assistant")}
          accessibilityLabel="Demander à l'assistant IA"
          accessibilityRole="button"
          className="flex-1 items-center rounded-2xl border py-[15px] active:opacity-70"
          style={{ backgroundColor: C.canvas, borderColor: C.line }}
        >
          <Text className="text-[13.5px] font-bold" style={{ color: C.ink }}>Demander à l'IA</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default FoodDetailScreen;
