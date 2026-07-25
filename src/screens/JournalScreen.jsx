import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Smile, Meh, Frown, Plus, Trash2, UtensilsCrossed } from "lucide-react-native";
import { C } from "../constant/theme";
import { TopBar } from "../components/TopBar";
import { StatusBadge } from "../components/StatusBadge";
import { getMealsForDate, updateMealFeeling, deleteMealEntry } from "../services/database";

const DAYS = ["Hier", "Aujourd'hui", "Demain"];
const FEELINGS = [
  { id: "energique", Icon: Smile, label: "Énergique", color: C.green },
  { id: "normal", Icon: Meh, label: "Normal", color: C.amber },
  { id: "fatigue", Icon: Frown, label: "Fatigué", color: C.coral },
];
const MEAL_LABELS = ["Petit-déjeuner", "Déjeuner", "Collation", "Dîner"];

/**
 * Calcule la date (YYYY-MM-DD) à partir de l'index de navigation.
 *   0 = hier, 1 = aujourd'hui, 2 = demain
 */
function getDateStr(dayIdx) {
  const d = new Date();
  d.setDate(d.getDate() + (dayIdx - 1));
  return d.toISOString().split("T")[0];
}

export function JournalScreen({ go, onMealDeleted }) {
  const [dayIdx, setDayIdx] = useState(1);
  const [dayMeals, setDayMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingFeelings, setSavingFeelings] = useState({});
  const isFirstRender = useRef(true);

  // Chargement des repas depuis SQLite
  const loadMealsForDay = useCallback(async (idx) => {
    setLoading(true);
    try {
      const dateStr = getDateStr(idx);
      const meals = await getMealsForDate(dateStr);
      setDayMeals(meals);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au premier montage (today)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      loadMealsForDay(1);
    }
  }, [loadMealsForDay]);

  // Recharger quand on change de jour
  const handleDayChange = (newIdx) => {
    if (newIdx === dayIdx) return;
    setDayIdx(newIdx);
    loadMealsForDay(newIdx);
  };

  // Supprimer un repas
  const handleDelete = (meal) => {
    Alert.alert(
      "Supprimer ce repas",
      `Êtes-vous sûr de vouloir supprimer « ${meal.name} » ?\n\nCette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            await deleteMealEntry(meal.id);
            await loadMealsForDay(dayIdx);
            onMealDeleted?.();
          },
        },
      ],
    );
  };

  // Sauvegarder le ressenti dans SQLite
  const handleFeeling = async (mealId, feelingId) => {
    if (savingFeelings[mealId]) return;

    const meal = dayMeals.find((m) => m.id === mealId);
    const newFeeling = meal?.feeling === feelingId ? null : feelingId;

    setSavingFeelings((prev) => ({ ...prev, [mealId]: true }));

    try {
      await updateMealFeeling(mealId, newFeeling);
      setDayMeals((prev) =>
        prev.map((m) => (m.id === mealId ? { ...m, feeling: newFeeling } : m)),
      );
    } finally {
      setSavingFeelings((prev) => ({ ...prev, [mealId]: false }));
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      <TopBar title="Mon journal" />

      {/* ── Navigation des jours ── */}
      <View className="flex-row items-center justify-between px-5 pb-[14px]">
        <Pressable
          onPress={() => handleDayChange(Math.max(0, dayIdx - 1))}
          accessibilityLabel="Jour précédent"
          accessibilityRole="button"
          className="h-[44px] w-[44px] items-center justify-center rounded-full border active:opacity-70"
          style={{ backgroundColor: C.card, borderColor: C.line }}
        >
          <ChevronLeft size={16} color={C.ink} />
        </Pressable>
        <Text className="text-[14.5px] font-bold" style={{ color: C.ink }}>
          {DAYS[dayIdx]}
        </Text>
        <Pressable
          onPress={() => handleDayChange(Math.min(2, dayIdx + 1))}
          accessibilityLabel="Jour suivant"
          accessibilityRole="button"
          className="h-[44px] w-[44px] items-center justify-center rounded-full border active:opacity-70"
          style={{ backgroundColor: C.card, borderColor: C.line }}
        >
          <ChevronRight size={16} color={C.ink} />
        </Pressable>
      </View>

      {/* ── Liste des repas ── */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 12 }}>
        {loading ? (
          <View className="items-center justify-center py-[60px]">
            <ActivityIndicator size="large" color={C.green} />
          </View>
        ) : dayMeals.length === 0 ? (
          /* ── État vide ── */
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
          /* ── Repas ── */
          dayMeals.map((m) => {
            const label =
              m.meal_order !== null && m.meal_order >= 0 && m.meal_order < MEAL_LABELS.length
                ? MEAL_LABELS[m.meal_order]
                : null;

            return (
              <View
                key={m.id}
                className="rounded-[18px] border p-4"
                style={{ backgroundColor: C.card, borderColor: C.line }}
              >
                {/* En-tête : label + heure + supprimer */}
                <View className="flex-row items-center justify-between">
                  <Text
                    className="text-[11px] font-extrabold uppercase tracking-[0.5px]"
                    style={{ color: C.muted }}
                  >
                    {label || "Repas"}
                  </Text>
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Text className="text-[11.5px]" style={{ color: C.muted }}>
                      {m.time}
                    </Text>
                    <Pressable
                      onPress={() => handleDelete(m)}
                      accessibilityLabel={`Supprimer ${m.name}`}
                      accessibilityRole="button"
                      className="h-[28px] w-[28px] items-center justify-center rounded-full active:opacity-60"
                      style={{ backgroundColor: C.canvas }}
                    >
                      <Trash2 size={13} color={C.coral} />
                    </Pressable>
                  </View>
                </View>

                <Text className="mt-[6px] text-[14.5px] font-bold" style={{ color: C.ink }}>
                  {m.name}
                </Text>

                {/* Calories + statut */}
                <View className="mt-[10px] flex-row items-center justify-between">
                  <Text className="text-[12.5px] font-semibold" style={{ color: C.inkSoft }}>
                    {m.kcal} kcal
                    {m.protein_g ? ` · P${m.protein_g}` : ""}
                    {m.carbs_g ? ` · G${m.carbs_g}` : ""}
                    {m.fat_g ? ` · L${m.fat_g}` : ""}
                  </Text>
                  <StatusBadge
                    level={m.status}
                    textOverride={m.status === "good" ? "Équilibré" : "Modération"}
                  />
                </View>

                {/* ── Ressenti ── */}
                <View className="mt-3 border-t pt-3" style={{ borderColor: C.line }}>
                  <Text className="mb-[6px] text-[11px]" style={{ color: C.muted }}>
                    Comment vous êtes-vous senti(e) ?
                  </Text>
                  <View className="flex-row" style={{ gap: 8 }}>
                    {FEELINGS.map(({ id, Icon, label, color }) => {
                      const isSelected = m.feeling === id;
                      const isSaving = savingFeelings[m.id];
                      return (
                        <Pressable
                          key={id}
                          onPress={() => handleFeeling(m.id, id)}
                          disabled={isSaving}
                          accessibilityLabel={label}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: isSelected }}
                          className="flex-row items-center rounded-full border px-[12px] py-[7px] active:opacity-70"
                          style={{
                            backgroundColor: isSelected ? color : C.canvas,
                            borderColor: isSelected ? color : C.line,
                            gap: 5,
                            opacity: isSaving ? 0.6 : 1,
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
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default JournalScreen;
