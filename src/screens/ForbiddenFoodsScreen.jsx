import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ShieldAlert, AlertTriangle, Target, Info, ChevronRight } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";
import { TopBar } from "../components/TopBar";
import { FOODS, USER } from "../data/mockData";
import { getProfile, searchFoods } from "../services/tomadyBridge";

/* ---------- logique de groupement ---------- */

async function buildGroups(profile) {
  const groups = [];

  // Charger les aliments depuis le bridge si possible
  let availableFoods = FOODS;
  try {
    const foods = await searchFoods("");
    if (foods.length > 0) availableFoods = foods;
  } catch {}

  // 1. Allergies — croise profile.allergies avec les aliments
  const allergenFoods = availableFoods.filter(
    (f) => f.allergens && f.allergens.some((a) => profile.allergies.includes(a)),
  );
  if (profile.allergies.length > 0) {
    groups.push({
      key: "allergie",
      title: "Allergies",
      icon: ShieldAlert,
      bg: C.coralTint,
      fg: C.coral,
      items: [
        ...profile.allergies.map((a) => ({ label: a, type: "allergen" })),
        ...allergenFoods.map((f) => ({ label: f.name, type: "food", food: f })),
      ],
    });
  }

  // 2. Recommandation médicale — forbiddenByDoctor + conditions
  const medicalItems = [];
  if (profile.forbiddenByDoctor?.length > 0) {
    profile.forbiddenByDoctor.forEach((item) => {
      const found = availableFoods.find(
        (f) => f.name.toLowerCase().includes(item.toLowerCase()) || item.toLowerCase().includes(f.name.toLowerCase()),
      );
      medicalItems.push(found ? { label: found.name, type: "food", food: found } : { label: item, type: "text" });
    });
  }
  if (profile.conditions?.length > 0) {
    profile.conditions.forEach((c) => {
      medicalItems.push({ label: c, type: "condition" });
    });
  }
  if (medicalItems.length > 0) {
    groups.push({
      key: "medical",
      title: "Recommandation médicale",
      icon: AlertTriangle,
      bg: C.amberTint,
      fg: C.amberDeep,
      items: medicalItems,
    });
  }

  // 3. Objectif personnel — basé sur le goal
  const goalFoods = availableFoods.filter((f) => {
    if (profile.goal === "Perte de poids") return f.status === "bad" || f.kcal > 400;
    if (profile.goal === "Prise de masse") return f.status === "bad";
    return false;
  });
  if (goalFoods.length > 0) {
    groups.push({
      key: "goal",
      title: "Objectif personnel",
      icon: Target,
      bg: C.greenTint,
      fg: C.greenDeep,
      items: goalFoods.map((f) => ({ label: f.name, type: "food", food: f })),
    });
  }

  return groups;
}

/* ==============================================================
   Écran : Aliments à éviter
   ============================================================== */

export function ForbiddenFoodsScreen({ go, openFood, profile: propProfile }) {
  const [p, setP] = useState(propProfile || USER);
  const [groups, setGroups] = useState([]);

  // Charger le profil et construire les groupes au montage
  useEffect(() => {
    (async () => {
      try {
        const profile = await getProfile();
        const resolvedProfile = propProfile || profile || USER;
        setP(resolvedProfile);
        const result = await buildGroups(resolvedProfile);
        setGroups(result);
      } catch {
        const resolvedProfile = propProfile || USER;
        setP(resolvedProfile);
        buildGroups(resolvedProfile).then(setGroups);
      }
    })();
  }, [propProfile]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      <TopBar title="Aliments à éviter" onBack={() => go("profile")} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 14 }}>
        {groups.length === 0 && (
          <View className="items-center justify-center py-[50px]" style={{ gap: 12 }}>
            <View
              className="h-[64px] w-[64px] items-center justify-center rounded-full"
              style={{ backgroundColor: C.greenTint }}
            >
              <ShieldAlert size={24} color={C.greenDeep} />
            </View>
            <Text className="text-center text-[16px] font-bold" style={{ color: C.ink }}>
              Aucune restriction enregistrée
            </Text>
            <Text className="text-center text-[13px] leading-[19px]" style={{ color: C.muted }}>
              Ajoutez vos allergies, conditions médicales ou aliments interdits depuis votre profil pour voir la liste apparaître ici.
            </Text>
          </View>
        )}

        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <View
              key={group.key}
              className="overflow-hidden rounded-[20px] border"
              style={{ backgroundColor: C.card, borderColor: C.line }}
            >
              {/* En-tête du groupe */}
              <View
                className="flex-row items-center px-4 py-[14px]"
                style={{ backgroundColor: group.bg, gap: 10 }}
              >
                <Icon size={16} color={group.fg} />
                <Text className="text-[13px] font-extrabold uppercase tracking-[0.5px]" style={{ color: group.fg }}>
                  {group.title}
                </Text>
                <View
                  className="ml-auto rounded-full px-[8px] py-[2px]"
                  style={{ backgroundColor: group.fg + "20" }}
                >
                  <Text className="text-[10px] font-bold" style={{ color: group.fg }}>
                    {group.items.length}
                  </Text>
                </View>
              </View>

              {/* Liste des items */}
              {group.items.map((item, i) => (
                <View
                  key={item.label + i}
                  className="px-4 py-[12px]"
                  style={{
                    borderBottomWidth: i < group.items.length - 1 ? 1 : 0,
                    borderBottomColor: C.line,
                  }}
                >
                  <View className="flex-row items-center" style={{ gap: 10 }}>
                    <View
                      className="h-[6px] w-[6px] rounded-full"
                      style={{ backgroundColor: group.fg }}
                    />
                    <Text className="flex-1 text-[13.5px] font-semibold" style={{ color: C.ink }}>
                      {item.label}
                    </Text>
                    {item.type === "allergen" && (
                      <View className="rounded-full px-[8px] py-[3px]" style={{ backgroundColor: group.bg }}>
                        <Text className="text-[9px] font-bold" style={{ color: group.fg }}>
                          Allergène
                        </Text>
                      </View>
                    )}
                    {item.type === "condition" && (
                      <View className="rounded-full px-[8px] py-[3px]" style={{ backgroundColor: group.bg }}>
                        <Text className="text-[9px] font-bold" style={{ color: group.fg }}>
                          Condition
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Bouton Voir dans le catalogue */}
                  {item.type === "food" && item.food && (
                    <Pressable
                      onPress={() => openFood?.(item.food)}
                      accessibilityLabel={`Voir ${item.label} dans le catalogue`}
                      accessibilityRole="button"
                      className="mt-[6px] ml-[16px] flex-row items-center self-start rounded-[8px] px-[10px] py-[6px] active:opacity-70"
                      style={{ backgroundColor: C.canvas, gap: 4 }}
                    >
                      <Text className="text-[10.5px] font-bold" style={{ color: C.greenDeep }}>
                        Voir dans le catalogue
                      </Text>
                      <ChevronRight size={10} color={C.greenDeep} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          );
        })}

        {/* Disclaimer médical */}
        <View className="flex-row items-center justify-center pt-2" style={{ gap: 6 }}>
          <Info size={12} color={C.muted} />
          <Text className="text-[11px] leading-[16px]" style={{ color: C.muted }}>
            Ces informations ne remplacent pas l'avis d'un professionnel de santé.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ForbiddenFoodsScreen;
