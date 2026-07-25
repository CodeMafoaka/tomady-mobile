import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polyline, Circle } from "react-native-svg";
import { Sparkles } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";
import { TopBar } from "../components/TopBar";
import { Blob } from "../components/Blob";
import { USER, WEIGHT_DATA } from "../data/mockData";

const RANGES = ["7j", "30j", "3m", "1a"];
const CAL_BARS = [0.7, 0.85, 1.0, 0.6, 0.95, 1.1, 0.62];
const CAL_DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const TRENDS = [
  "Vous mangez davantage le soir.",
  "Votre consommation de protéines augmente.",
  "Vous êtes plus énergique après les repas riches en légumes.",
  "Le mofo sucré est souvent associé à un inconfort digestif.",
];

// Petit graphique en ligne (remplace recharts, indisponible en React Native)
function WeightChart({ data, width = 300, height = 130, min = 62, max = 76 }) {
  const padding = 10;
  const stepX = (width - padding * 2) / (data.length - 1);
  const points = data.map((d, i) => {
    const x = padding + i * stepX;
    const y = padding + (1 - (d.kg - min) / (max - min)) * (height - padding * 2);
    return { x, y };
  });
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <View>
      <Svg width={width} height={height}>
        <Polyline points={polylinePoints} fill="none" stroke={C.greenDeep} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={C.green} />
        ))}
      </Svg>
      <View className="mt-1 flex-row justify-between">
        {data.map((d) => (
          <Text key={d.d} className="text-[10px]" style={{ color: C.muted }}>{d.d}</Text>
        ))}
      </View>
    </View>
  );
}

export function StatsScreen() {
  const [range, setRange] = useState("30j");

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      <TopBar title="Statistiques" />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 16 }}>
        {/* weight evolution */}
        <View className="rounded-[20px] border p-[18px]" style={{ backgroundColor: C.card, borderColor: C.line }}>
          <View className="flex-row items-center justify-between">
            <Text style={{ fontFamily: FONTS.display, color: C.ink }} className="text-[15px] font-semibold">
              Évolution du poids
            </Text>
            <View className="flex-row" style={{ gap: 4 }}>
              {RANGES.map((r) => {
                const active = range === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setRange(r)}
                    accessibilityLabel={`Période : ${r}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className="rounded-[8px] px-2 py-[5px]"
                    style={{ backgroundColor: active ? C.green : "transparent" }}
                  >
                    <Text className="text-[10.5px] font-bold" style={{ color: active ? C.white : C.muted }}>{r}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mb-1 mt-3 flex-row" style={{ gap: 16 }}>
            <View>
              <Text className="text-[17px] font-extrabold" style={{ color: C.ink }}>{USER.weight.current} kg</Text>
              <Text className="text-[10px]" style={{ color: C.muted }}>Actuel</Text>
            </View>
            <View>
              <Text className="text-[17px] font-extrabold" style={{ color: C.muted }}>{USER.weight.start} kg</Text>
              <Text className="text-[10px]" style={{ color: C.muted }}>Initial</Text>
            </View>
            <View>
              <Text className="text-[17px] font-extrabold" style={{ color: C.greenDeep }}>{USER.weight.target} kg</Text>
              <Text className="text-[10px]" style={{ color: C.muted }}>Objectif</Text>
            </View>
          </View>

          <View className="mt-[6px] items-center">
            <WeightChart data={WEIGHT_DATA} />
          </View>
        </View>

        {/* calories vs objectif */}
        <View className="rounded-[20px] border p-[18px]" style={{ backgroundColor: C.card, borderColor: C.line }}>
          <Text style={{ fontFamily: FONTS.display, color: C.ink }} className="mb-3 text-[15px] font-semibold">
            Calories vs objectif
          </Text>
          <View className="flex-row items-end" style={{ gap: 8, height: 90 }}>
            {CAL_BARS.map((v, i) => (
              <View key={i} className="flex-1 items-center" style={{ gap: 6 }}>
                <View
                  className="w-full rounded-[6px]"
                  style={{ height: Math.min(v, 1) * 80, backgroundColor: v > 1 ? C.amber : C.green }}
                />
                <Text className="text-[9.5px]" style={{ color: C.muted }}>{CAL_DAYS[i]}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* trends */}
        <LinearGradient
          colors={[C.ink, "#223B2C"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          className="overflow-hidden rounded-[20px] p-[18px]"
          style={{ position: "relative" }}
        >
          <Blob size={100} color="rgba(46,204,113,0.16)" style={{ bottom: -30, right: -20 }} />
          <View className="flex-row items-center" style={{ gap: 8, zIndex: 1 }}>
            <Sparkles size={15} color={C.green} />
            <Text className="text-[11px] font-extrabold uppercase tracking-[0.5px]" style={{ color: C.white }}>
              Vos tendances
            </Text>
          </View>
          <View className="mt-[10px]" style={{ gap: 9, zIndex: 1 }}>
            {TRENDS.map((t, i) => (
              <View key={i} className="flex-row" style={{ gap: 8 }}>
                <Text style={{ color: C.green }}>•</Text>
                <Text className="flex-1 text-[12.5px] leading-[19px]" style={{ color: "rgba(255,255,255,0.85)" }}>{t}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

export default StatsScreen;
