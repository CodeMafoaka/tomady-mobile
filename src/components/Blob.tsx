import { View } from "react-native";
import { C } from "../constant/theme";

/**
 * Blob organique décoratif — positionné en absolute par le parent.
 * Passez `style` avec top/left/right/bottom pour le placer.
 */
export function Blob({ size = 96, color = C.greenTint, style = {} }) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          backgroundColor: color,
          position: "absolute",
          borderRadius: size, // approx. "blob" — RN n'a pas de border-radius asymétrique par coin arrondi organique
        },
        style,
      ]}
    />
  );
}

export default Blob;
