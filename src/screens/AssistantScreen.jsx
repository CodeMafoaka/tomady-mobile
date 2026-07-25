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
          colors={[C.violet, C.violetDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-[42px] w-[42px] items-center justify-center rounded-full"
        >
          <Sparkles size={19} color={C.white} />
        </LinearGradient>
        <View className="flex-1">
          <Text style={{ fontFamily: FONTS.display, color: C.ink }} className="text-[16px] font-semibold">
            Assistant Tomady
          </Text>
          <Text className="text-[11.5px]" style={{ color: C.muted }}>Votre intelligence nutritionnelle personnelle</Text>
        </View>
        <View className="flex-row items-center rounded-full px-[9px] py-[5px]" style={{ backgroundColor: C.violetTint, gap: 5 }}>
          <View className="h-[6px] w-[6px] rounded-full" style={{ backgroundColor: C.violet }} />
          <Text className="text-[10.5px] font-bold" style={{ color: C.violetDeep }}>IA prête</Text>
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
                <View className="rounded-2xl border p-[14px]" style={{ backgroundColor: C.violetTint, borderColor: 'rgba(139,92,246,0.15)' }}>
                  <View className="mb-2 flex-row" style={{ gap: 14 }}>
                    <Text className="text-[12.5px] font-extrabold" style={{ color: C.violetDeep }}>{m.card.kcal} kcal</Text>
                    <Text className="text-[12.5px]" style={{ color: C.inkSoft }}>
                      P{m.card.p} · G{m.card.c} · L{m.card.f}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: FONTS.displayItalic, color: C.inkSoft }} className="text-[12.5px] leading-[19px]">
                    {m.card.note}
                  </Text>
                  <Pressable
                    accessibilityLabel="Enregistrer dans mon journal"
                    accessibilityRole="button"
                    className="mt-[10px] flex-row items-center justify-center rounded-[10px] py-[10px] active:opacity-80"
                    style={{ backgroundColor: C.violet, gap: 6 }}
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
          accessibilityLabel="Message"
          accessibilityRole="text"
          className="flex-1 rounded-full border px-4 py-3 text-[13px]"
          style={{ backgroundColor: C.card, borderColor: C.line, color: C.ink }}
        />
        <Pressable
          accessibilityLabel="Envoyer le message"
          accessibilityRole="button"
          className="h-[44px] w-[44px] items-center justify-center rounded-full active:opacity-80"
          style={{
            backgroundColor: C.ink,
            shadowColor: '#000',
            shadowOpacity: 0.15,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <Send size={16} color={C.white} />
        </Pressable>
        <Pressable
          onPress={openVoice}
          accessibilityLabel="Activer la reconnaissance vocale"
          accessibilityRole="button"
          className="h-[48px] w-[48px] items-center justify-center rounded-full active:opacity-80"
          style={{
            shadowColor: C.violet,
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          }}
        >
          <LinearGradient
            colors={[C.violet, C.violetDeep]}
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
