import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Animated, Easing, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Leaf, SlidersHorizontal, X, RotateCcw } from "lucide-react-native";
import { C } from "../constant/theme";
import { TopBar } from "../components/TopBar";
import { StatusBadge } from "../components/StatusBadge";
import { FOODS, CATEGORIES, USER } from "../data/mockData";
import { searchFoods, getFoodCategories } from "../services/tomadyBridge";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const MACRO_OPTIONS = [
  { id: "protéines", label: "Protéines", desc: "Riche en protéines" },
  { id: "glucides", label: "Glucides", desc: "Riche en glucides" },
  { id: "lipides", label: "Lipides", desc: "Riche en lipides" },
];

/* ==============================================================
   Panneau de filtres (bottom sheet animé)
   ============================================================== */

function FilterSheet({
  visible,
  onClose,
  calMin,
  calMax,
  setCalMin,
  setCalMax,
  macroDom,
  setMacroDom,
  hideAllergens,
  setHideAllergens,
  onReset,
  activeCount,
  allergies = [],
}) {
  const slideUp = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      slideUp.setValue(SCREEN_HEIGHT);
      fadeIn.setValue(0);
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
    }
  }, [visible, slideUp, fadeIn]);

  if (!visible) return null;

  return (
    <Pressable
      className="absolute inset-0"
      style={{ backgroundColor: "rgba(22,36,28,0.6)", zIndex: 50 }}
      onPress={onClose}
      accessibilityLabel="Fermer les filtres"
      accessibilityRole="button"
    >
      <Pressable className="absolute bottom-0 left-0 right-0" onPress={() => {}}>
        <Animated.View
          className="w-full rounded-t-[32px] px-5 pb-[34px] pt-[22px]"
          style={{
            backgroundColor: C.white,
            transform: [{ translateY: slideUp }],
            opacity: fadeIn,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: -6 },
            elevation: 10,
            maxHeight: SCREEN_HEIGHT * 0.75,
          }}
        >
          {/* Handle */}
          <View className="mb-4 items-center">
            <View className="h-[4px] w-[36px] rounded-full" style={{ backgroundColor: C.line }} />
          </View>

          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[16px] font-bold" style={{ color: C.ink }}>
              Filtres{activeCount > 0 ? ` (${activeCount})` : ""}
            </Text>
            <View className="flex-row" style={{ gap: 8 }}>
              {activeCount > 0 && (
                <Pressable
                  onPress={onReset}
                  accessibilityLabel="Réinitialiser tous les filtres"
                  accessibilityRole="button"
                  className="flex-row items-center rounded-full px-[12px] py-[6px] active:opacity-70"
                  style={{ backgroundColor: C.canvas, gap: 5 }}
                >
                  <RotateCcw size={12} color={C.coral} />
                  <Text className="text-[11px] font-bold" style={{ color: C.coral }}>
                    Réinitialiser
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                accessibilityLabel="Fermer"
                accessibilityRole="button"
                className="h-[32px] w-[32px] items-center justify-center rounded-full"
                style={{ backgroundColor: C.canvas }}
              >
                <X size={14} color={C.ink} />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ gap: 20 }} showsVerticalScrollIndicator={false}>
            {/* --- Plage calorique --- */}
            <View>
              <Text className="mb-[8px] text-[11px] font-extrabold uppercase tracking-[0.5px]" style={{ color: C.muted }}>
                Plage calorique
              </Text>
              <View className="flex-row" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="mb-[4px] text-[10.5px]" style={{ color: C.muted }}>
                    Min (kcal)
                  </Text>
                  <TextInput
                    value={calMin}
                    onChangeText={setCalMin}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={C.muted}
                    accessibilityLabel="Calories minimum"
                    className="rounded-xl border px-[14px] py-[10px] text-[14px]"
                    style={{ backgroundColor: C.card, borderColor: C.line, color: C.ink }}
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-[4px] text-[10.5px]" style={{ color: C.muted }}>
                    Max (kcal)
                  </Text>
                  <TextInput
                    value={calMax}
                    onChangeText={setCalMax}
                    keyboardType="number-pad"
                    placeholder="9999"
                    placeholderTextColor={C.muted}
                    accessibilityLabel="Calories maximum"
                    className="rounded-xl border px-[14px] py-[10px] text-[14px]"
                    style={{ backgroundColor: C.card, borderColor: C.line, color: C.ink }}
                  />
                </View>
              </View>
            </View>

            {/* --- Macronutriment dominant --- */}
            <View>
              <Text className="mb-[8px] text-[11px] font-extrabold uppercase tracking-[0.5px]" style={{ color: C.muted }}>
                Macronutriment dominant
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {MACRO_OPTIONS.map((opt) => {
                  const isSelected = macroDom === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setMacroDom(isSelected ? null : opt.id)}
                      accessibilityLabel={`${opt.label} — ${opt.desc}`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      className="flex-1 rounded-xl border p-[12px] active:opacity-80"
                      style={{
                        minWidth: "30%",
                        borderColor: isSelected ? C.green : C.line,
                        backgroundColor: isSelected ? C.greenTint : C.card,
                      }}
                    >
                      <Text
                        className="text-[13px] font-bold"
                        style={{ color: isSelected ? C.greenDeep : C.ink }}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        className="mt-[2px] text-[10px]"
                        style={{ color: isSelected ? C.greenDeep : C.muted }}
                      >
                        {opt.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* --- Allergènes --- */}
            {allergies.length > 0 && (
              <View>
                <Text className="mb-[8px] text-[11px] font-extrabold uppercase tracking-[0.5px]" style={{ color: C.muted }}>
                  Allergènes
                </Text>
                <Pressable
                  onPress={() => setHideAllergens(!hideAllergens)}
                  accessibilityLabel={
                    hideAllergens
                      ? "Afficher les aliments contenant mes allergènes"
                      : "Masquer les aliments contenant mes allergènes"
                  }
                  accessibilityRole="switch"
                  accessibilityState={{ checked: hideAllergens }}
                  className="flex-row items-center justify-between rounded-xl border p-[14px] active:opacity-80"
                  style={{
                    borderColor: hideAllergens ? C.green : C.line,
                    backgroundColor: hideAllergens ? C.greenTint : C.card,
                  }}
                >
                  <View className="flex-1" style={{ gap: 2 }}>
                    <Text className="text-[13px] font-bold" style={{ color: C.ink }}>
                      Masquer mes allergènes
                    </Text>
                    <Text className="text-[11px]" style={{ color: C.muted }}>
                      {allergies.join(" · ")}
                    </Text>
                  </View>
                  <View
                    className="h-[26px] w-[44px] rounded-full p-[3px]"
                    style={{ backgroundColor: hideAllergens ? C.green : C.line }}
                  >
                    <View
                      className="h-[20px] w-[20px] rounded-full"
                      style={{
                        backgroundColor: C.white,
                        alignSelf: hideAllergens ? "flex-end" : "flex-start",
                      }}
                    />
                  </View>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Pressable>
  );
}

/* ==============================================================
   Écran : Catalogue avec filtres avancés
   ============================================================== */

export function CatalogueScreen({ go, openFood, profile: propProfile }) {
  const p = propProfile || USER;
  const [cat, setCat] = useState("Plats locaux");
  const [query, setQuery] = useState("");
  const [foodList, setFoodList] = useState(FOODS);
  const [categories, setCategories] = useState(CATEGORIES);

  // Filtres avancés
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [calMin, setCalMin] = useState("");
  const [calMax, setCalMax] = useState("");
  const [macroDom, setMacroDom] = useState(null);
  const [hideAllergens, setHideAllergens] = useState(false);

  // Nombre de filtres actifs
  const activeFilterCount =
    (calMin !== "" || calMax !== "" ? 1 : 0) +
    (macroDom !== null ? 1 : 0) +
    (hideAllergens ? 1 : 0);

  // Charger les aliments depuis le bridge au montage
  useEffect(() => {
    (async () => {
      try {
        const [foods, cats] = await Promise.all([
          searchFoods(""),
          getFoodCategories(),
        ]);
        if (foods.length > 0) setFoodList(foods);
        if (cats.length > 0) setCategories(cats);
      } catch {}
    })();
  }, []);

  // Filtrage combiné
  const list = foodList.filter((f) => {
    // Catégorie
    if (f.cat !== cat) return false;
    // Recherche texte
    if (!f.name.toLowerCase().includes(query.trim().toLowerCase())) return false;
    // Plage calorique
    if (calMin !== "") {
      const min = parseInt(calMin, 10);
      if (!isNaN(min) && f.kcal < min) return false;
    }
    if (calMax !== "") {
      const max = parseInt(calMax, 10);
      if (!isNaN(max) && f.kcal > max) return false;
    }
    // Macronutriment dominant
    if (macroDom === "protéines" && !(f.p >= f.c && f.p >= f.f)) return false;
    if (macroDom === "glucides" && !(f.c >= f.p && f.c >= f.f)) return false;
    if (macroDom === "lipides" && !(f.f >= f.p && f.f >= f.c)) return false;
    // Allergènes
    if (hideAllergens && f.allergens && f.allergens.some((a) => p.allergies.includes(a))) return false;
    return true;
  });

  const resetFilters = () => {
    setCalMin("");
    setCalMax("");
    setMacroDom(null);
    setHideAllergens(false);
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      <TopBar title="Explorer" />

      {/* Barre de recherche + icône filtre */}
      <View className="px-5 pb-3">
        <View
          className="flex-row items-center rounded-[14px] border px-[14px] py-[11px]"
          style={{ backgroundColor: C.card, borderColor: C.line, gap: 10 }}
        >
          <Search size={16} color={C.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un aliment ou un plat..."
            placeholderTextColor={C.muted}
            accessibilityLabel="Rechercher un aliment"
            className="flex-1 text-[13.5px]"
            style={{ color: C.ink }}
          />
          <Pressable
            onPress={() => setFiltersOpen(true)}
            accessibilityLabel="Ouvrir les filtres avancés"
            accessibilityRole="button"
            className="relative h-[36px] w-[36px] items-center justify-center rounded-full active:opacity-70"
            style={{ backgroundColor: activeFilterCount > 0 ? C.greenTint : "transparent" }}
          >
            <SlidersHorizontal size={16} color={activeFilterCount > 0 ? C.greenDeep : C.muted} />
            {activeFilterCount > 0 && (
              <View
                className="absolute -right-[2px] -top-[2px] h-[16px] min-w-[16px] items-center justify-center rounded-full px-[3px]"
                style={{ backgroundColor: C.coral }}
              >
                <Text className="text-[9px] font-bold" style={{ color: C.white }}>
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Catégories */}
      <View className="h-[36px] justify-center mb-2">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}
      >          {categories.map((c) => {
          const active = cat === c;
          return (
            <Pressable
              key={c}
              onPress={() => setCat(c)}
              accessibilityLabel={`Catégorie ${c}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              className="rounded-full border px-[14px] py-2"
              style={{ backgroundColor: active ? C.green : C.card, borderColor: active ? C.green : C.line }}
            >
              <Text className="text-[12.5px] font-bold" style={{ color: active ? C.white : C.inkSoft }}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      </View>

      {/* Résultats */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 12 }}>
        {list.length === 0 && (
          <View className="mt-[30px] items-center" style={{ gap: 8 }}>
            <Text className="text-center text-[13px]" style={{ color: C.muted }}>
              Aucun aliment ne correspond à vos critères.
            </Text>
            {activeFilterCount > 0 && (
              <Pressable
                onPress={resetFilters}
                accessibilityLabel="Réinitialiser les filtres"
                accessibilityRole="button"
                className="flex-row items-center rounded-full px-[14px] py-[7px] active:opacity-70"
                style={{ backgroundColor: C.coralTint, gap: 5 }}
              >
                <RotateCcw size={12} color={C.coral} />
                <Text className="text-[11.5px] font-bold" style={{ color: C.coral }}>
                  Réinitialiser les filtres
                </Text>
              </Pressable>
            )}
          </View>
        )}
        {list.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => openFood(f)}
            accessibilityLabel={`${f.name} — ${f.kcal} kcal`}
            accessibilityRole="button"
            className="flex-row rounded-[18px] border p-[14px]"
            style={{ backgroundColor: C.card, borderColor: C.line, gap: 14 }}
          >
            <View
              className="h-[58px] w-[58px] items-center justify-center rounded-full"
              style={{ backgroundColor: C.greenTint }}
            >
              <Leaf size={22} color={C.greenDeep} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold" style={{ color: C.ink }}>
                {f.name}
              </Text>
              <Text className="mt-[2px] text-[11.5px]" style={{ color: C.muted }}>
                {f.kcal} kcal · P{f.p} · G{f.c} · L{f.f}
              </Text>
              <View className="mt-2">
                <StatusBadge level={f.status} />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Bottom sheet de filtres */}
      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        calMin={calMin}
        calMax={calMax}
        setCalMin={setCalMin}
        setCalMax={setCalMax}
        macroDom={macroDom}
        setMacroDom={setMacroDom}
        hideAllergens={hideAllergens}
        setHideAllergens={setHideAllergens}
        onReset={resetFilters}
        activeCount={activeFilterCount}
        allergies={p.allergies}
      />
    </SafeAreaView>
  );
}

export default CatalogueScreen;
