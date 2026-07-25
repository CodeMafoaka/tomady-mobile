import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Leaf } from "lucide-react-native";
import { C } from "../constant/theme";
import { TopBar } from "../components/TopBar";
import { StatusBadge } from "../components/StatusBadge";
import { FOODS, CATEGORIES } from "../data/mockData";

export function CatalogueScreen({ go, openFood }) {
  const [cat, setCat] = useState("Plats locaux");
  const list = FOODS.filter((f) => f.cat === cat);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      <TopBar title="Explorer" />

      <View className="px-5 pb-3">
        <View
          className="flex-row items-center rounded-[14px] border px-[14px] py-[11px]"
          style={{ backgroundColor: C.card, borderColor: C.line, gap: 10 }}
        >
          <Search size={16} color={C.muted} />
          <Text className="text-[13.5px]" style={{ color: C.muted }}>Rechercher un aliment ou un plat...</Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 14, gap: 8 }}
      >
        {CATEGORIES.map((c) => {
          const active = cat === c;
          return (
            <Pressable
              key={c}
              onPress={() => setCat(c)}
              className="rounded-full border px-[14px] py-2"
              style={{ backgroundColor: active ? C.green : C.card, borderColor: active ? C.green : C.line }}
            >
              <Text className="text-[12.5px] font-bold" style={{ color: active ? C.white : C.inkSoft }}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 12 }}>
        {list.length === 0 && (
          <Text className="mt-[30px] text-center text-[13px]" style={{ color: C.muted }}>
            Aucun aliment dans cette catégorie pour l'instant.
          </Text>
        )}
        {list.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => openFood(f)}
            className="flex-row rounded-[18px] border p-[14px]"
            style={{ backgroundColor: C.card, borderColor: C.line, gap: 14 }}
          >
            <View className="h-[58px] w-[58px] items-center justify-center rounded-full" style={{ backgroundColor: C.greenTint }}>
              <Leaf size={22} color={C.greenDeep} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold" style={{ color: C.ink }}>{f.name}</Text>
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
    </SafeAreaView>
  );
}

export default CatalogueScreen;
