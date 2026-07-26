import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, Send, Mic, Check } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";
import { SUGGESTIONS } from "../data/mockData";
import { AIStatusBadge } from "../components/AIStatusBadge";
import { getModelStatus, startStreamingSession, analyzeMeal } from "../services/tomadyBridge";
import { getChatMessages, addChatMessage } from "../services/database";

export function AssistantScreen({ openVoice, addMeal }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedCards, setSavedCards] = useState({});
  const [streamingText, setStreamingText] = useState("");
  const [modelStatus, setModelStatus] = useState("loading");
  const scrollRef = useRef(null);
  const streamCleanupRef = useRef(null);

  // Charger l'historique et le statut du modèle au montage
  useEffect(() => {
    (async () => {
      const saved = await getChatMessages();
      if (saved.length > 0) setMessages(saved);
      const status = await getModelStatus();
      setModelStatus(status.loaded ? "ready" : status.usingMock ? "ready" : "unavailable");
    })();
    // Cleanup streaming on unmount
    return () => {
      streamCleanupRef.current?.();
    };
  }, []);

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    // Cancel any existing stream
    streamCleanupRef.current?.();

    const userMsg = { from: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreamingText("");

    // Sauvegarder le message utilisateur dans SQLite
    await addChatMessage({ role: "user", text_content: text });

    try {
      // Utiliser le vrai streaming Gemma 4 via le bridge natif
      let fullResponse = "";
      let card = null;

      streamCleanupRef.current = startStreamingSession(
        text,
        // onToken: chaque token reçu du modèle
        (token) => {
          fullResponse += token;
          setStreamingText(fullResponse);
          // Auto-scroll pendant le streaming
          requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
        },
        // onComplete: streaming terminé
        async (completeText) => {
          // Analyser la réponse pour extraire la card nutritionnelle si applicable
          try {
            const analysis = await analyzeMeal(text);
            card = analysis.card;
          } catch {}

          const aiMsg = { from: "ai", text: completeText, card };
          setMessages((prev) => [...prev, aiMsg]);
          setStreamingText("");
          setLoading(false);
          streamCleanupRef.current = null;

          // Sauvegarder la réponse IA dans SQLite
          await addChatMessage({
            role: "assistant",
            text_content: completeText,
            card_kcal: card?.kcal ?? null,
            card_p: card?.p ?? null,
            card_c: card?.c ?? null,
            card_f: card?.f ?? null,
            card_note: card?.note || null,
          });

          requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
        },
        // onError
        async (error) => {
          const errMsg = "Désolé, une erreur est survenue pendant l'analyse. Réessayez.";
          setMessages((prev) => [...prev, { from: "ai", text: errMsg }]);
          setStreamingText("");
          setLoading(false);
          streamCleanupRef.current = null;

          await addChatMessage({ role: "assistant", text_content: errMsg });
        }
      );
    } catch (e) {
      const errMsg = "Désolé, une erreur est survenue pendant l'analyse. Réessayez.";
      setMessages((prev) => [...prev, { from: "ai", text: errMsg }]);
      setStreamingText("");
      setLoading(false);

      await addChatMessage({ role: "assistant", text_content: errMsg });
    }
  };

  const saveCard = (index, card) => {
    setSavedCards((prev) => ({ ...prev, [index]: true }));
    addMeal?.({ name: card.note?.slice(0, 40) || "Repas via Assistant", kcal: card.kcal, status: "good" });
  };

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
        <AIStatusBadge status={modelStatus} />
      </View>

      <View className="flex-1">
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 12 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m, i) =>
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
                    onPress={() => saveCard(i, m.card)}
                    disabled={!!savedCards[i]}
                    accessibilityLabel="Enregistrer dans mon journal"
                    accessibilityRole="button"
                    className="mt-[10px] flex-row items-center justify-center rounded-[10px] py-[10px] active:opacity-80"
                    style={{ backgroundColor: savedCards[i] ? C.muted : C.violet, gap: 6 }}
                  >
                    <Check size={13} color={C.white} />
                    <Text className="text-xs font-bold" style={{ color: C.white }}>
                      {savedCards[i] ? "Enregistré ✓" : "Enregistrer dans mon journal"}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )
        )}
        {/* ── Streaming en cours (tokens en temps réel) ── */}
        {loading && streamingText ? (
          <View className="self-start" style={{ maxWidth: "88%" }}>
            <View
              className="rounded-[16px] rounded-bl-[4px] border px-[15px] py-[11px]"
              style={{ backgroundColor: C.card, borderColor: C.violet + "40" }}
            >
              <Text className="text-[13.5px] leading-[20px]" style={{ color: C.inkSoft }}>
                {streamingText}
                <Text style={{ color: C.violet }}>▊</Text>
              </Text>
            </View>
          </View>
        ) : loading ? (
          <View className="self-start flex-row items-center rounded-[16px] rounded-bl-[4px] border px-[15px] py-[11px]" style={{ backgroundColor: C.card, borderColor: C.line, gap: 8 }}>
            <ActivityIndicator size="small" color={C.violet} />
            <Text className="text-[12.5px]" style={{ color: C.muted }}>Gemba 4 réfléchit...</Text>
          </View>
        ) : null}
      </ScrollView>
      </View>

      {/* --- Suggestions --- */}
      {SUGGESTIONS.length > 0 && (
        <View className="h-[40px] justify-center">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}
          >
            {SUGGESTIONS.map((s) => (
              <Pressable
                key={s}
                onPress={() => send(s)}
                className="rounded-full border px-[14px] py-[7px] active:opacity-70"
                style={{ backgroundColor: C.white, borderColor: C.line }}
              >
                <Text className="text-[11.5px] font-medium" style={{ color: C.inkSoft }}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* --- Barre de saisie premium --- */}
      <View
        className="px-5 pb-[100px] pt-3"
        style={{
          backgroundColor: C.canvas,
          borderTopWidth: 1,
          borderTopColor: "rgba(231,237,233,0.6)",
          shadowColor: "#000",
          shadowOpacity: 0.04,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 3,
        }}
      >
        <View
          className="flex-row items-end rounded-[20px] border p-[5px]"
          style={{
            backgroundColor: C.white,
            borderColor: input.trim() ? C.violet : C.line,
            shadowColor: input.trim() ? C.violet : "transparent",
            shadowOpacity: input.trim() ? 0.08 : 0,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: input.trim() ? 2 : 0,
            gap: 6,
          }}
        >
          {/* Champ de texte multiligne */}
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send()}
            returnKeyType="send"
            placeholder="Écrire un message..."
            placeholderTextColor={C.muted}
            multiline
            numberOfLines={1}
            accessibilityLabel="Message"
            accessibilityRole="text"
            className="flex-1 max-h-[100px] px-3 py-[10px] text-[14px] leading-[20px]"
            style={{ color: C.ink, minHeight: 40 }}
          />

          {/* Bouton vocal */}
          <Pressable
            onPress={openVoice}
            accessibilityLabel="Activer la reconnaissance vocale"
            accessibilityRole="button"
            className="h-[38px] w-[38px] items-center justify-center rounded-full active:opacity-80"
          >
            <LinearGradient
              colors={[C.violet, C.violetDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="h-full w-full items-center justify-center rounded-full"
            >
              <Mic size={16} color={C.white} />
            </LinearGradient>
          </Pressable>

          {/* Bouton envoyer */}
          <Pressable
            onPress={() => send()}
            disabled={loading || !input.trim()}
            accessibilityLabel="Envoyer le message"
            accessibilityRole="button"
            className="h-[38px] w-[38px] items-center justify-center rounded-full active:opacity-80"
            style={{
              backgroundColor: input.trim() ? C.violet : C.line,
              transform: [{ scale: input.trim() ? 1 : 0.95 }],
            }}
          >
            <Send size={15} color={input.trim() ? C.white : C.muted} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default AssistantScreen;
