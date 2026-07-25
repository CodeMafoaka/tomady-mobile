import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, Send, Mic, Check } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";
import { CHAT, SUGGESTIONS } from "../data/mockData";

export function AssistantScreen({ openVoice }) {
  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      <View className="flex-row items-center px-5 pb-[14px] pt-[6px]" style={{ gap: 12 }}>
        <LinearGradient
          colors={[C.green, C.greenDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-[42px] w-[42px] items-center justify-center rounded-full"
        >
          <Sparkles size={19} color={C.white} />
        </LinearGradient>
        <View className="flex-1">
          <Text style={{ fontFamily: FONTS.display, color: C.ink }} className="text-[16px] font-semibold">
            Assistant Gemmify
          </Text>
          <Text className="text-[11.5px]" style={{ color: C.muted }}>Votre intelligence nutritionnelle personnelle</Text>
        </View>
        <View className="flex-row items-center rounded-full px-[9px] py-[5px]" style={{ backgroundColor: C.greenTint, gap: 5 }}>
          <View className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: C.green }} />
          <Text className="text-[10.5px] font-bold" style={{ color: C.greenDeep }}>IA prête</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 12 }}>
        {CHAT.map((m, i) =>
          m.from === "user" ? (
            <View
              key={i}
              className="self-end rounded-[16px] rounded-br-[4px] px-[15px] py-[11px]"
              style={{ backgroundColor: C.ink, maxWidth: "82%" }}
            >
              <Text className="text-[13.5px]" style={{ color: C.white }}>{m.text}</Text>
            </View>
          ) : (
            <View key={i} className="self-start" style={{ maxWidth: "88%", gap: 8 }}>
              <View
                className="rounded-[16px] rounded-bl-[4px] border px-[15px] py-[11px]"
                style={{ backgroundColor: C.card, borderColor: C.line }}
              >
                <Text className="text-[13.5px]" style={{ color: C.inkSoft }}>{m.text}</Text>
              </View>
              {m.card && (
                <View className="rounded-2xl border p-[14px]" style={{ backgroundColor: C.greenTint, borderColor: C.greenLine }}>
                  <View className="mb-2 flex-row" style={{ gap: 14 }}>
                    <Text className="text-[12.5px] font-extrabold" style={{ color: C.greenDeep }}>{m.card.kcal} kcal</Text>
                    <Text className="text-[12.5px]" style={{ color: C.inkSoft }}>
                      P{m.card.p} · G{m.card.c} · L{m.card.f}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: FONTS.displayItalic, color: C.inkSoft }} className="text-[12.5px] leading-[19px]">
                    {m.card.note}
                  </Text>
                  <Pressable
                    className="mt-[10px] flex-row items-center justify-center rounded-[10px] py-[10px]"
                    style={{ backgroundColor: C.green, gap: 6 }}
                  >
                    <Check size={13} color={C.white} />
                    <Text className="text-xs font-bold" style={{ color: C.white }}>Enregistrer dans mon journal</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )
        )}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10, gap: 8 }}
      >
        {SUGGESTIONS.map((s) => (
          <View key={s} className="rounded-full border px-[13px] py-2" style={{ backgroundColor: C.card, borderColor: C.line }}>
            <Text className="text-[11.5px]" style={{ color: C.inkSoft }}>{s}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row items-center px-5 pb-7 pt-[6px]" style={{ gap: 10 }}>
        <TextInput
          placeholder="Écrire un message..."
          placeholderTextColor={C.muted}
          className="flex-1 rounded-full border px-4 py-3 text-[13px]"
          style={{ backgroundColor: C.card, borderColor: C.line, color: C.ink }}
        />
        <Pressable className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: C.ink }}>
          <Send size={16} color={C.white} />
        </Pressable>
        <Pressable onPress={openVoice} className="h-[46px] w-[46px] items-center justify-center rounded-full">
          <LinearGradient
            colors={[C.green, C.greenDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="h-full w-full items-center justify-center rounded-full"
          >
            <Mic size={19} color={C.white} />
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default AssistantScreen;
