import { View } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import { C } from "../constant/theme";

/**
 * GrowthRing — anneau de progression avec un "bourgeon" (bud) qui avance
 * à la pointe de l'arc. `label` / `sublabel` sont des éléments <Text> à
 * afficher au centre.
 */
export function GrowthRing({
  percent,
  size = 168,
  stroke = 14,
  label,
  sublabel,
  trackColor = C.greenTint,
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, percent));
  const angle = -90 + p * 360;
  const rad = (angle * Math.PI) / 180;
  const cx = size / 2;
  const cy = size / 2;
  const bx = cx + r * Math.cos(rad);
  const by = cy + r * Math.sin(rad);

  return (
    <View
      style={{ width: size, height: size }}
      accessibilityLabel={`Progression : ${Math.round(p * 100)}%`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p * 100) }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="gemRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={C.green} />
            <Stop offset="100%" stopColor={C.greenDeep} />
          </LinearGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="url(#gemRingGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference * p} ${circumference}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <Circle cx={bx} cy={by} r={stroke * 0.62} fill={C.white} stroke={C.greenDeep} strokeWidth={2.5} />
        <Circle cx={bx} cy={by} r={stroke * 0.3} fill={C.green} />
      </Svg>
      <View
        pointerEvents="none"
        className="absolute inset-0 items-center justify-center"
      >
        {label}
        {sublabel}
      </View>
    </View>
  );
}

export default GrowthRing;
