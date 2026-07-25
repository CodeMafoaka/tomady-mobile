import { View, Text, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { User, Settings, Lock, Download, Trash2, ChevronRight, Info } from "lucide-react-native";
import { C } from "../constant/theme";
import { TopBar } from "../components/TopBar";
import { GrowthRing } from "../components/GrowthRing";
import { USER } from "../data/mockData";

const SETTINGS_ROWS = [
  ["Préférences alimentaires", User],
  ["Confidentialité des données", Lock],
  ["Exporter mes données", Download],
  ["Supprimer mon compte", Trash2],
];

export function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      <TopBar title="Profil" right={<Settings size={17} color={C.ink} />} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100, gap: 14 }}>
        <View className="flex-row items-center rounded-[20px] border p-4" style={{ backgroundColor: C.card, borderColor: C.line, gap: 14 }}>
          <LinearGradient
            colors={[C.green, C.greenDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-[58px] w-[58px] items-center justify-center rounded-full"
          >
            <User size={24} color={C.white} />
          </LinearGradient>
          <View>
            <Text className="text-[17px] font-semibold" style={{ color: C.ink }}>{USER.name}</Text>
            <Text className="mt-[2px] text-[11.5px]" style={{ color: C.muted }}>{USER.region}</Text>
            <Text className="mt-[2px] text-[11.5px]" style={{ color: C.muted }}>68 kg · 1,65 m · Actif</Text>
          </View>
        </View>

        <View className="rounded-[20px] border p-4" style={{ backgroundColor: C.card, borderColor: C.line }}>
          <Text className="mb-[10px] text-[11px] font-extrabold uppercase tracking-[0.5px]" style={{ color: C.muted }}>Objectif</Text>
          <View className="flex-row items-center" style={{ gap: 14 }}>
            <GrowthRing
              percent={0.55}
              size={70}
              stroke={7}
              label={<Text className="text-xs font-extrabold" style={{ color: C.ink }}>55%</Text>}
              sublabel={null}
            />
            <View>
              <Text className="text-sm font-bold" style={{ color: C.ink }}>{USER.goal}</Text>
              <Text className="mt-[2px] text-xs" style={{ color: C.muted }}>
                {USER.weight.current} kg → {USER.weight.target} kg
              </Text>
            </View>
          </View>
        </View>

        <View className="rounded-[20px] border p-4" style={{ backgroundColor: C.card, borderColor: C.line }}>
          <Text className="mb-[10px] text-[11px] font-extrabold uppercase tracking-[0.5px]" style={{ color: C.muted }}>Santé</Text>
          <View className="flex-row flex-wrap" style={{ gap: 7 }}>
            {USER.allergies.map((a) => (
              <View key={a} className="rounded-full px-[10px] py-[5px]" style={{ backgroundColor: C.coralTint }}>
                <Text className="text-[11.5px] font-bold" style={{ color: C.coral }}>{a}</Text>
              </View>
            ))}
            {USER.conditions.map((a) => (
              <View key={a} className="rounded-full px-[10px] py-[5px]" style={{ backgroundColor: C.amberTint }}>
                <Text className="text-[11.5px] font-bold" style={{ color: C.amberDeep }}>{a}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="overflow-hidden rounded-[20px] border" style={{ backgroundColor: C.card, borderColor: C.line }}>
          {SETTINGS_ROWS.map(([label, Icon], i, arr) => {
            const isDanger = label.includes("Supprimer");
            return (
              <Pressable
                key={label}
                accessibilityLabel={label}
                accessibilityRole="button"
                className="flex-row items-center px-4 py-[14px] active:opacity-70"
                style={{ gap: 12, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: C.line }}
              >
                <Icon size={16} color={isDanger ? C.coral : C.inkSoft} />
                <Text className="flex-1 text-[13.5px] font-semibold" style={{ color: isDanger ? C.coral : C.ink }}>{label}</Text>
                <ChevronRight size={15} color={C.muted} />
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row rounded-2xl p-[14px]" style={{ backgroundColor: C.amberTint, gap: 9 }}>
          <Info size={15} color={C.amberDeep} style={{ marginTop: 1 }} />
          <Text className="flex-1 text-[11px] leading-[17px]" style={{ color: C.amberDeep2 }}>
            Gemmify fournit des informations générales de suivi et de bien-être. Ces recommandations ne remplacent
            pas l'avis d'un médecin. En cas de problème de santé, consultez un professionnel qualifié.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default ProfileScreen;
