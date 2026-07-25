import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Plus, Check, Info } from "lucide-react-native";
import { C, FONTS } from "../constant/theme";
import { TopBar } from "../components/TopBar";

/* ---------- constantes ---------- */

const ACTIVITY_LEVELS = [
  { id: "sédentaire", label: "Sédentaire", desc: "Peu ou pas d'exercice" },
  { id: "modéré", label: "Modéré", desc: "Exercice 3–5× / semaine" },
  { id: "actif", label: "Actif", desc: "Exercice intense 6–7× / semaine" },
];

const GOALS = [
  { id: "Perte de poids", label: "Perte de poids", desc: "Déficit calorique progressif" },
  { id: "Prise de masse", label: "Prise de masse", desc: "Excédent calorique contrôlé" },
  { id: "Stabilisation", label: "Stabilisation", desc: "Maintien du poids actuel" },
];

const ALLERGY_OPTIONS = [
  "Arachides", "Fruits de mer", "Lait", "Œufs", "Soja",
  "Gluten", "Noix", "Sésame", "Poisson", "Sulfites",
];

const INTOLERANCE_OPTIONS = [
  "Lactose", "Gluten", "Fructose", "Histamine", "Légumineuses", "Caféine", "Levure",
];

const CONDITION_OPTIONS = [
  "Diabète de type 2", "Hypertension", "Cholestérol élevé",
  "Reflux gastrique", "Anémie", "Troubles thyroïdiens", "Syndrome métabolique",
];

/* ---------- validation ---------- */

function validate(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "Le prénom est requis";
  if (!form.lastName.trim()) errors.lastName = "Le nom est requis";

  const age = parseInt(form.age, 10);
  if (isNaN(age) || age <= 0 || age > 150) errors.age = "Âge invalide (1–150)";

  const weight = parseFloat(form.weight);
  if (isNaN(weight) || weight <= 0 || weight > 500) errors.weight = "Poids invalide (1–500 kg)";

  const height = parseInt(form.height, 10);
  if (isNaN(height) || height <= 0 || height > 300) errors.height = "Taille invalide (1–300 cm)";

  if (height > 0 && weight > 0) {
    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);
    if (bmi < 10 || bmi > 60) errors.weight = "Poids / taille incohérents (IMC hors plage)";
  }

  return errors;
}

/* ==============================================================
   Écran : Édition du profil santé
   ============================================================== */

export function ProfileEditScreen({ onBack, onSave, profile }) {
  /* ---- état local du formulaire ---- */
  const [form, setForm] = useState({
    firstName: profile.firstName || profile.name || "",
    lastName: profile.lastName || "",
    age: profile.age?.toString() || "",
    height: profile.height?.toString() || "",
    weight: profile.weight?.current?.toString() || "",
    goal: profile.goal || "Perte de poids",
    activityLevel: profile.activityLevel || "modéré",
    allergies: [...(profile.allergies || [])],
    intolerances: [...(profile.intolerances || [])],
    conditions: [...(profile.conditions || [])],
    restrictedFoods: [...(profile.restrictedFoods || [])],
  });

  const [errors, setErrors] = useState({});
  const [tagInputs, setTagInputs] = useState({
    allergies: "",
    intolerances: "",
    conditions: "",
    restrictedFoods: "",
  });

  /* ---- helpers ---- */

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addTag = (category, raw) => {
    const clean = raw.trim();
    if (!clean) return;
    setForm((prev) => ({
      ...prev,
      [category]: prev[category].includes(clean) ? prev[category] : [...prev[category], clean],
    }));
    setTagInputs((prev) => ({ ...prev, [category]: "" }));
  };

  const removeTag = (category, tag) => {
    setForm((prev) => ({ ...prev, [category]: prev[category].filter((t) => t !== tag) }));
  };

  const handleSave = () => {
    const newErrors = validate(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onSave({
      ...profile,
      name: form.firstName,
      firstName: form.firstName,
      lastName: form.lastName,
      age: parseInt(form.age, 10),
      height: parseInt(form.height, 10),
      weight: { ...profile.weight, current: parseFloat(form.weight) },
      goal: form.goal,
      activityLevel: form.activityLevel,
      allergies: form.allergies,
      intolerances: form.intolerances,
      conditions: form.conditions,
      restrictedFoods: form.restrictedFoods,
    });
  };

  /* ---- sous-composants rendus ---- */

  const renderField = (label, field, opts = {}) => {
    const { keyboard = "default", placeholder = "", suffix = "" } = opts;
    const hasError = !!errors[field];
    return (
      <View className="mb-4">
        <Text className="mb-[6px] text-[11px] font-extrabold uppercase tracking-[0.5px]" style={{ color: C.muted }}>
          {label}
        </Text>
        <View
          className="flex-row items-center rounded-xl border"
          style={{ backgroundColor: C.white, borderColor: hasError ? C.coral : C.line }}
        >
          <TextInput
            value={form[field]}
            onChangeText={(v) => updateField(field, v)}
            placeholder={placeholder}
            keyboardType={keyboard}
            accessibilityLabel={label}
            className="flex-1 rounded-xl px-[14px] py-[10px] text-[14px]"
            style={{ color: C.ink }}
          />
          {suffix ? (
            <Text className="mr-[14px] text-[12px] font-semibold" style={{ color: C.muted }}>
              {suffix}
            </Text>
          ) : null}
        </View>
        {hasError ? (
          <Text className="mt-[4px] text-[11px]" style={{ color: C.coral }}>
            {errors[field]}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderSelect = (label, options, value, onChange) => (
    <View className="mb-4">
      <Text className="mb-[8px] text-[11px] font-extrabold uppercase tracking-[0.5px]" style={{ color: C.muted }}>
        {label}
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {options.map((opt) => {
          const isSelected = value === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onChange(opt.id)}
              accessibilityLabel={`${opt.label} — ${opt.desc}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              className="flex-1 rounded-xl border p-[12px] active:opacity-80"
              style={{
                minWidth: "30%",
                borderColor: isSelected ? C.green : C.line,
                backgroundColor: isSelected ? C.greenTint : C.white,
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  className="text-[13px] font-bold"
                  style={{ color: isSelected ? C.greenDeep : C.ink }}
                >
                  {opt.label}
                </Text>
                {isSelected && <Check size={14} color={C.greenDeep} />}
              </View>
              <Text
                className="mt-[2px] text-[10.5px]"
                style={{ color: isSelected ? C.greenDeep : C.muted }}
              >
                {opt.desc}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderTagSection = (category, label, placeholder, suggestions) => {
    const isEmpty = form[category].length === 0;
    const showNoData = isEmpty && !tagInputs[category].trim();
    return (
      <View className="mb-4">
        <Text className="mb-[8px] text-[11px] font-extrabold uppercase tracking-[0.5px]" style={{ color: C.muted }}>
          {label}
        </Text>

        {/* Tags existants */}
        <View className="mb-2 flex-row flex-wrap" style={{ gap: 6 }}>
          {showNoData ? (
            <Text className="text-[12px] leading-[20px]" style={{ color: C.muted }}>
              Aucun{label.includes("Intol") ? "e" : "s"} renseigné{label.includes("Intol") ? "e" : "s"}
            </Text>
          ) : (
            form[category].map((tag) => (
              <Pressable
                key={tag}
                onPress={() => removeTag(category, tag)}
                accessibilityLabel={`Retirer ${tag}`}
                accessibilityRole="button"
                className="flex-row items-center rounded-full px-[12px] py-[6px] active:opacity-70"
                style={{ backgroundColor: C.greenTint, gap: 4 }}
              >
                <Text className="text-[12px] font-semibold" style={{ color: C.greenDeep }}>
                  {tag}
                </Text>
                <X size={11} color={C.greenDeep} />
              </Pressable>
            ))
          )}
        </View>

        {/* Champ d'ajout */}
        <View className="flex-row" style={{ gap: 8 }}>
          <TextInput
            value={tagInputs[category]}
            onChangeText={(t) => setTagInputs((prev) => ({ ...prev, [category]: t }))}
            placeholder={placeholder}
            onSubmitEditing={() => addTag(category, tagInputs[category])}
            returnKeyType="done"
            accessibilityLabel={`Ajouter ${label.toLowerCase()}`}
            className="flex-1 rounded-xl border px-[14px] py-[10px] text-[13px]"
            style={{ backgroundColor: C.white, borderColor: C.line, color: C.ink }}
          />
          <Pressable
            onPress={() => addTag(category, tagInputs[category])}
            disabled={!tagInputs[category].trim()}
            accessibilityLabel="Ajouter"
            accessibilityRole="button"
            className="h-[42px] w-[42px] items-center justify-center rounded-xl active:opacity-80"
            style={{ backgroundColor: tagInputs[category].trim() ? C.green : C.line }}
          >
            <Plus size={18} color={tagInputs[category].trim() ? C.white : C.muted} />
          </Pressable>
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View className="mt-2 flex-row flex-wrap" style={{ gap: 6 }}>
            {suggestions
              .filter((s) => !form[category].includes(s))
              .map((s) => (
                <Pressable
                  key={s}
                  onPress={() => addTag(category, s)}
                  accessibilityLabel={`Ajouter ${s}`}
                  accessibilityRole="button"
                  className="rounded-full border px-[12px] py-[5px] active:opacity-70"
                  style={{ borderColor: C.line, backgroundColor: C.canvas }}
                >
                  <Text className="text-[11px]" style={{ color: C.muted }}>
                    + {s}
                  </Text>
                </Pressable>
              ))}
          </View>
        )}
      </View>
    );
  };

  /* ---- rendu principal ---- */

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: C.canvas }}>
      <TopBar title="Modifier mon profil" onBack={onBack} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ============= Section Identité ============= */}
          <View
            className="rounded-[20px] border p-4"
            style={{ backgroundColor: C.card, borderColor: C.line }}
          >
            <Text
              className="mb-[14px] text-[11px] font-extrabold uppercase tracking-[0.5px]"
              style={{ color: C.greenDeep }}
            >
              Identité
            </Text>

            <View className="flex-row" style={{ gap: 10 }}>
              <View className="flex-1">
                {renderField("Prénom", "firstName", { placeholder: "Votre prénom" })}
              </View>
              <View className="flex-1">
                {renderField("Nom", "lastName", { placeholder: "Votre nom" })}
              </View>
            </View>

            <View className="flex-row" style={{ gap: 10 }}>
              <View className="flex-1">
                {renderField("Âge", "age", { keyboard: "number-pad", placeholder: "28" })}
              </View>
              <View className="flex-1">
                {renderField("Poids", "weight", { keyboard: "decimal-pad", placeholder: "68", suffix: "kg" })}
              </View>
              <View className="flex-1">
                {renderField("Taille", "height", { keyboard: "number-pad", placeholder: "165", suffix: "cm" })}
              </View>
            </View>
          </View>

          {/* ============= Section Objectif & Activité ============= */}
          <View
            className="rounded-[20px] border p-4"
            style={{ backgroundColor: C.card, borderColor: C.line }}
          >
            <Text
              className="mb-[14px] text-[11px] font-extrabold uppercase tracking-[0.5px]"
              style={{ color: C.greenDeep }}
            >
              Objectif &amp; Activité
            </Text>

            {renderSelect("Objectif physique", GOALS, form.goal, (v) => updateField("goal", v))}
            {renderSelect("Niveau d'activité", ACTIVITY_LEVELS, form.activityLevel, (v) =>
              updateField("activityLevel", v),
            )}
          </View>

          {/* ============= Section Santé ============= */}
          <View
            className="rounded-[20px] border p-4"
            style={{ backgroundColor: C.card, borderColor: C.line }}
          >
            <Text
              className="mb-[14px] text-[11px] font-extrabold uppercase tracking-[0.5px]"
              style={{ color: C.greenDeep }}
            >
              Santé
            </Text>

            {renderTagSection("allergies", "Allergies", "Ajouter une allergie…", ALLERGY_OPTIONS)}

            <View className="mb-3 border-t" style={{ borderColor: C.line }} />

            {renderTagSection("intolerances", "Intolérances", "Ajouter une intolérance…", INTOLERANCE_OPTIONS)}

            <View className="mb-3 border-t" style={{ borderColor: C.line }} />

            {renderTagSection("conditions", "Maladies / Conditions", "Ajouter une condition…", CONDITION_OPTIONS)}

            <View className="mb-3 border-t" style={{ borderColor: C.line }} />

            {renderTagSection("restrictedFoods", "Aliments interdits (prescription médicale)", "Ajouter un aliment…", [])}
          </View>

          {/* Avertissement */}
          <View className="flex-row rounded-[14px] p-[14px]" style={{ backgroundColor: C.amberTint, gap: 10 }}>
            <Info size={16} color={C.amberDeep} style={{ marginTop: 1 }} />
            <Text className="flex-1 text-[11px] leading-[17px]" style={{ color: C.amberDeep2 }}>
              Ces informations nous aident à personnaliser vos recommandations. Consultez toujours un
              médecin pour des conseils adaptés à votre santé.
            </Text>
          </View>

          {/* Bouton Enregistrer */}
          <Pressable
            onPress={handleSave}
            accessibilityLabel="Enregistrer les modifications du profil"
            accessibilityRole="button"
            className="mb-4 w-full items-center rounded-2xl py-[16px] active:opacity-80"
            style={{
              backgroundColor: C.green,
              shadowColor: C.green,
              shadowOpacity: 0.4,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 4,
            }}
          >
            <Text className="text-[15px] font-bold" style={{ color: C.white }}>
              Enregistrer les modifications
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ProfileEditScreen;
