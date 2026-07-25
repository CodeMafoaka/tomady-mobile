import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Smile, Meh, Frown, Plus, UtensilsCrossed } from "lucide-react-native";
import { C } from "../constant/theme";
import { TopBar } from "../components/TopBar";
import { StatusBadge } from "../components/StatusBadge";
import { MEALS_TODAY } from "../data/mockData";

const DAYS = ["Hier", "Aujourd'hui", "Demain"];
const FEELINGS = [
  { id: "energique", Icon: Smile, label: "Énergique", color: C.green },
  { id: "normal", Icon: Meh, label: "Normal", color: C.amber },
  { id: "fatigue", Icon: Frown, label: "Fatigué", color: C.coral },
];
const MEAL_LABELS = ["Petit-déjeuner", "Déjeuner", "Collation", "Dîner"];

export function JournalScreen({ go, meals: propMeals }) {
  const meals = propMeals || MEALS_TODAY;
  const [dayIdx, setDayIdx] = useState(1);
  const [moodSel, setMoodSel] = useState(null);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      <TopBar title="Mon journal" />

      <View className="flex-row items-center justify-between px-5 pb-[14px]">
        <Pressable
          onPress={() => setDayIdx(Math.max(0, dayIdx - 1))}
          accessibilityLabel="Jour précédent"
          accessibilityRole="button"
          className="h-[44px] w-[44px] items-center justify-center rounded-full border active:opacity-70"
          style={{ backgroundColor: C.card, borderColor: C.line }}
        >
          <ChevronLeft size={16} color={C.ink} />
        </Pressable>
        <Text className="text-[14.5px] font-bold" style={{ color: C.ink }}>{DAYS[dayIdx]}</Text>
        <Pressable
          onPress={() => setDayIdx(Math.min(2, dayIdx + 1))}
          accessibilityLabel="Jour suivant"
          accessibilityRole="button"
          className="h-[44px] w-[44px] items-center justify-center rounded-full border active:opacity-70"
          style={{ backgroundColor: C.card, borderColor: C.line }}
        >
          <ChevronRight size={16} color={C.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 12 }}>
        {meals.length === 0 ? (
          /* ---------- État vide ---------- */
          <View className="items-center justify-center py-[60px]" style={{ gap: 14 }}>
            <View
              className="h-[72px] w-[72px] items-center justify-center rounded-full"
              style={{ backgroundColor: C.greenTint }}
            >
              <UtensilsCrossed size={26} color={C.greenDeep} />
            </View>
            <Text className="text-center text-[17px] font-bold" style={{ color: C.ink }}>
              Aucun repas pour ce jour
            </Text>
            <Text className="text-center text-[13px] leading-[20px]" style={{ color: C.muted }}>
              Ajoutez vos repas depuis l'assistant Tomady pour commencer à suivre votre alimentation.
            </Text>
            <Pressable
              onPress={() => go("assistant")}
              accessibilityLabel="Ajouter un repas"
              accessibilityRole="button"
              className="mt-2 flex-row items-center rounded-2xl px-[20px] py-[13px] active:opacity-80"
              style={{
                backgroundColor: C.green,
                shadowColor: C.green,
                shadowOpacity: 0.4,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 4,
                gap: 6,
              }}
            >
              <Plus size={16} color={C.white} />
              <Text className="text-[13px] font-bold" style={{ color: C.white }}>
                Ajouter un repas
              </Text>
            </Pressable>
          </View>
        ) : (
          meals.map((m, i) => (
          <View key={i} className="rounded-[18px] border p-4" style={{ backgroundColor: C.card, borderColor: C.line }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-extrabold uppercase tracking-[0.5px]" style={{ color: C.muted }}>
                {MEAL_LABELS[i]}
              </Text>
              <Text className="text-[11.5px]" style={{ color: C.muted }}>{m.time}</Text>
            </View>

            {m.kcal ? (
              <>
                <Text className="mt-[6px] text-[14.5px] font-bold" style={{ color: C.ink }}>{m.name}</Text>
                <View className="mt-[10px] flex-row items-center justify-between">
                  <Text className="text-[12.5px] font-semibold" style={{ color: C.inkSoft }}>{m.kcal} kcal</Text>
                  <StatusBadge level={m.status} textOverride={m.status === "good" ? "Équilibré" : "Modération"} />
                </View>
                <View className="mt-3 border-t pt-3" style={{ borderColor: C.line }}>
                  <Text className="mb-[6px] text-[11px]" style={{ color: C.muted }}>
                    Comment vous êtes-vous senti(e) ?
                  </Text>
                  <View className="flex-row" style={{ gap: 8 }}>
                    {FEELINGS.map(({ id, Icon, label, color }) => {
                      const isSelected = moodSel === id;
                      return (
                        <Pressable
                          key={id}
                          onPress={() => setMoodSel(isSelected ? null : id)}
                          accessibilityLabel={label}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                          className="flex-row items-center rounded-full border px-[12px] py-[7px]"
                          style={{
                            backgroundColor: isSelected ? color : C.canvas,
                            borderColor: isSelected ? color : C.line,
                            gap: 5,
                          }}
                        >
                          <Icon size={13} color={isSelected ? C.white : C.inkSoft} />
                          <Text
                            className="text-[11px] font-semibold"
                            style={{ color: isSelected ? C.white : C.inkSoft }}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </>
            ) : (
              <Pressable
                onPress={() => go("assistant")}
                accessibilityLabel="Ajouter un repas"
                accessibilityRole="button"
                className="mt-[10px] flex-row items-center justify-center rounded-xl border-[1.5px] border-dashed py-3 active:opacity-70"
                style={{ borderColor: C.greenLine, backgroundColor: C.greenTint, gap: 6 }}
              >
                <Plus size={15} color={C.greenDeep} />
                <Text className="text-[13px] font-bold" style={{ color: C.greenDeep }}>Ajouter un repas</Text>
              </Pressable>
            )}
          </View>
        )))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default JournalScreen;
