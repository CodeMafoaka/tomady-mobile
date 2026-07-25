import { View, Text, Pressable } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";

export function TopBar({ title, onBack, right }) {
  return (
    <View className="flex-row items-center justify-between px-5 pb-[14px] pt-[6px]">
      <View className="w-[44px]">
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityLabel="Retour"
            accessibilityRole="button"
            className="h-[44px] w-[44px] items-center justify-center rounded-full border"
            style={{ backgroundColor: C.card, borderColor: C.line }}
          >
            <ArrowLeft size={18} color={C.ink} />
          </Pressable>
        ) : null}
      </View>
      <Text style={{ fontFamily: FONTS.display, color: C.ink }} className="text-[17px] font-semibold">
        {title}
      </Text>
      <View className="w-[44px] items-center justify-center">{right}</View>
    </View>
  );
}

export default TopBar;
