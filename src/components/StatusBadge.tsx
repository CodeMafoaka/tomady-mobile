import { View, Text } from "react-native";
import { C } from "../constant/theme";

export function StatusBadge({ level, textOverride }) {
  const map = {
    good: { bg: C.greenTint, fg: C.greenDeep, dot: C.green, text: textOverride || "Recommandé pour vous" },
    warn: { bg: C.amberTint, fg: C.amberDeep, dot: C.amber, text: textOverride || "À consommer avec modération" },
    bad: { bg: C.coralTint, fg: C.coralDeep, dot: C.coral, text: textOverride || "À éviter selon votre profil" },
  }[level];

  return (
    <View
      className="flex-row items-center self-start rounded-full px-[10px] py-[5px]"
      style={{ backgroundColor: map.bg, gap: 6 }}
    >
      <View className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: map.dot }} />
      <Text className="text-[11.5px] font-bold" style={{ color: map.fg }}>
        {map.text}
      </Text>
    </View>
  );
}

export default StatusBadge;
