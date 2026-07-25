import { View, Text, ActivityIndicator } from "react-native";
import { C } from "../constant/theme";

export type ModelStatus = "loading" | "ready" | "unavailable";

export function AIStatusBadge({ status }: { status?: ModelStatus }) {
  const s = status ?? "ready";

  if (s === "loading") {
    return (
      <View
        className="flex-row items-center rounded-full px-[9px] py-[5px]"
        style={{ backgroundColor: C.violetTint, gap: 5 }}
      >
        <ActivityIndicator size={8} color={C.violetDeep} />
        <Text className="text-[10.5px] font-bold" style={{ color: C.violetDeep }}>
          Modèle en cours de chargement
        </Text>
      </View>
    );
  }

  if (s === "unavailable") {
    return (
      <View
        className="flex-row items-center rounded-full px-[9px] py-[5px]"
        style={{ backgroundColor: C.coralTint, gap: 5 }}
      >
        <View className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: C.coral }} />
        <Text className="text-[10.5px] font-bold" style={{ color: C.coral }}>
          Modèle indisponible
        </Text>
      </View>
    );
  }

  // ready
  return (
    <View
      className="flex-row items-center rounded-full px-[9px] py-[5px]"
      style={{ backgroundColor: C.violetTint, gap: 5 }}
    >
      <View className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: C.violet }} />
      <Text className="text-[10.5px] font-bold" style={{ color: C.violetDeep }}>
        IA locale prête · hors-ligne
      </Text>
    </View>
  );
}

export default AIStatusBadge;
