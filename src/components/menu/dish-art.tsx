// Зураггүй бүтээгдэхүүнд зориулсан нэгэн хэв маягийн, дээрээс харсан хоолны чимэглэл.
// Ресторан өөрийн зургийг оруулбал энэ чимэглэлийн оронд бодит зураг харагдана.
import type { ReactNode } from "react";

const BG: Record<string, string> = {
  warm: "#efe4d3",
  cream: "#f1ead9",
  sage: "#e3e6d6",
  clay: "#efdccf",
  stone: "#e6e1d8",
  dusk: "#e4dcd4",
};

const PLATE = "#fbf8f2";
const PLATE_RIM = "#e9e1d3";
const SHADOW = "rgba(60,40,20,0.12)";

function Plate({ r = 66, children }: { r?: number; children?: ReactNode }) {
  return (
    <g>
      <ellipse cx="102" cy="106" rx={r + 4} ry={r + 4} fill={SHADOW} />
      <circle cx="100" cy="100" r={r} fill={PLATE} stroke={PLATE_RIM} strokeWidth="1.5" />
      <circle cx="100" cy="100" r={r - 12} fill="none" stroke={PLATE_RIM} strokeWidth="1" />
      {children}
    </g>
  );
}

function Bowl({ fill, children, r = 58 }: { fill: string; children?: ReactNode; r?: number }) {
  return (
    <g>
      <ellipse cx="103" cy="107" rx={r + 6} ry={r + 6} fill={SHADOW} />
      <circle cx="100" cy="100" r={r + 4} fill="#f7f1e6" stroke="#e2d8c6" strokeWidth="1.5" />
      <circle cx="100" cy="100" r={r - 4} fill={fill} />
      <circle cx="100" cy="100" r={r - 4} fill="url(#sheen)" />
      {children}
    </g>
  );
}

function Dumpling({ x, y, s = 1, rot = 0, fill = "#f6efe0" }: { x: number; y: number; s?: number; rot?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx="1.5" cy="3" rx="17" ry="15" fill={SHADOW} />
      <ellipse cx="0" cy="0" rx="16" ry="14" fill={fill} stroke="#e4d8c2" strokeWidth="1" />
      <path d="M-7 -4 Q0 -10 7 -4 M-9 1 Q0 -6 9 1 M-6 5 Q0 0 6 5" fill="none" stroke="#dccdb2" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="0" cy="-3" r="2" fill="#e2d4bb" />
    </g>
  );
}

function Leaf({ x, y, rot, fill = "#7d9461", s = 1 }: { x: number; y: number; rot: number; fill?: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 -14 C10 -8 10 8 0 14 C-10 8 -10 -8 0 -14Z" fill={fill} />
      <path d="M0 -12 L0 12" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    </g>
  );
}

function Cup({ liquid, children, saucer = true }: { liquid: string; children?: ReactNode; saucer?: boolean }) {
  return (
    <g>
      {saucer ? (
        <>
          <ellipse cx="103" cy="106" rx="66" ry="66" fill={SHADOW} />
          <circle cx="100" cy="100" r="62" fill={PLATE} stroke={PLATE_RIM} strokeWidth="1.5" />
        </>
      ) : null}
      <path d="M140 92 q22 0 22 14 q0 14 -22 14" fill="none" stroke="#efe7da" strokeWidth="9" strokeLinecap="round" />
      <circle cx="100" cy="100" r="42" fill="#f4eee3" stroke="#e1d6c4" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="35" fill={liquid} />
      {children}
    </g>
  );
}

const Noodles = ({ color = "#ead7a8" }: { color?: string }) => (
  <g fill="none" stroke={color} strokeWidth="5" strokeLinecap="round">
    <path d="M62 92 q10 -10 20 0 t20 0 t20 0 t18 2" />
    <path d="M60 104 q10 -10 20 0 t20 0 t20 0 t20 0" />
    <path d="M66 116 q10 -10 20 0 t20 0 t20 0 t14 -2" />
    <path d="M74 80 q8 -8 16 0 t16 0 t16 0" />
    <path d="M78 128 q8 -8 16 0 t16 0 t16 0" />
  </g>
);

const Bits = ({ items }: { items: Array<[number, number, string, number?]> }) => (
  <g>
    {items.map(([x, y, c, r = 4], i) => (
      <rect key={i} x={x - r} y={y - r * 0.6} width={r * 2} height={r * 1.2} rx="1.5" fill={c} transform={`rotate(${(i * 37) % 90} ${x} ${y})`} />
    ))}
  </g>
);

function art(key: string): { bg: string; node: ReactNode } {
  switch (key) {
    case "buuz":
      return {
        bg: BG.warm,
        node: (
          <Plate>
            {[0, 60, 120, 180, 240, 300].map((a, i) => {
              const rad = (a * Math.PI) / 180;
              return <Dumpling key={i} x={100 + Math.cos(rad) * 30} y={100 + Math.sin(rad) * 30} rot={a + 90} />;
            })}
            <Dumpling x={100} y={100} s={0.92} />
          </Plate>
        ),
      };
    case "khuushuur":
      return {
        bg: BG.clay,
        node: (
          <Plate>
            {[
              [84, 88, -20],
              [118, 92, 25],
              [98, 122, 180],
            ].map(([x, y, r], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
                <path d="M-28 6 A28 26 0 0 1 28 6 Z" fill="#c98c47" stroke="#a96f33" strokeWidth="1.2" />
                <path d="M-26 6 L26 6" stroke="#8d5a28" strokeWidth="2.5" strokeDasharray="3 3" />
                <path d="M-14 -8 q6 -4 12 0" stroke="rgba(255,240,210,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>
            ))}
          </Plate>
        ),
      };
    case "bansh":
      return {
        bg: BG.cream,
        node: (
          <Plate>
            {Array.from({ length: 9 }).map((_, i) => {
              const a = (i / 9) * Math.PI * 2;
              const rr = i % 2 ? 22 : 34;
              return <Dumpling key={i} x={100 + Math.cos(a) * rr} y={100 + Math.sin(a) * rr} s={0.62} rot={i * 40} fill="#d9a865" />;
            })}
            <circle cx="148" cy="62" r="12" fill="#4a3426" stroke="#e6dccb" strokeWidth="3" />
          </Plate>
        ),
      };
    case "soup":
      return {
        bg: BG.sage,
        node: (
          <Bowl fill="#d9b06a">
            <Dumpling x={84} y={92} s={0.7} rot={20} />
            <Dumpling x={114} y={88} s={0.7} rot={-30} />
            <Dumpling x={100} y={116} s={0.7} rot={70} />
            <Bits items={[[76, 116, "#e08a3c", 3], [126, 112, "#e08a3c", 3], [100, 74, "#6f8d4e", 2.5], [88, 128, "#6f8d4e", 2.5], [124, 100, "#6f8d4e", 2.5]]} />
          </Bowl>
        ),
      };
    case "noodleSoup":
      return {
        bg: BG.stone,
        node: (
          <Bowl fill="#cf9f5c">
            <Noodles color="#f0deb2" />
            <Bits items={[[80, 96, "#7a4a33", 5], [118, 110, "#7a4a33", 5], [104, 84, "#e08a3c", 3.5], [92, 120, "#6f8d4e", 2.5]]} />
          </Bowl>
        ),
      };
    case "borscht":
      return {
        bg: BG.dusk,
        node: (
          <Bowl fill="#9e3b32">
            <path d="M96 96 q10 -14 20 0 q-6 10 -14 6" fill="#f6efe6" />
            <Bits items={[[78, 110, "#c8644a", 4], [122, 118, "#c8644a", 4], [110, 78, "#6f8d4e", 2.5], [86, 82, "#7a4a33", 4]]} />
          </Bowl>
        ),
      };
    case "tsuivan":
      return {
        bg: BG.warm,
        node: (
          <Plate>
            <g fill="none" stroke="#e6c789" strokeWidth="6" strokeLinecap="round">
              {Array.from({ length: 9 }).map((_, i) => (
                <path key={i} d={`M${62 + (i % 3) * 6} ${70 + i * 7} l${58 - (i % 2) * 10} ${(i % 3) * 4 - 4}`} />
              ))}
            </g>
            <Bits
              items={[
                [80, 82, "#7a4a33", 6], [118, 96, "#7a4a33", 6], [96, 118, "#7a4a33", 6], [130, 80, "#7a4a33", 5],
                [72, 110, "#e08a3c", 4], [110, 128, "#e08a3c", 4], [124, 114, "#e08a3c", 4],
                [92, 96, "#9bb27a", 4], [138, 104, "#9bb27a", 4], [84, 130, "#9bb27a", 4],
              ]}
            />
          </Plate>
        ),
      };
    case "rice":
      return {
        bg: BG.cream,
        node: (
          <Plate>
            <circle cx="88" cy="96" r="30" fill="#f6f1e6" />
            {Array.from({ length: 40 }).map((_, i) => (
              <ellipse key={i} cx={88 + Math.cos(i * 2.4) * (i % 26)} cy={96 + Math.sin(i * 2.4) * (i % 26)} rx="2.6" ry="1.2" fill="#e6dccb" transform={`rotate(${i * 23} ${88 + Math.cos(i * 2.4) * (i % 26)} ${96 + Math.sin(i * 2.4) * (i % 26)})`} />
            ))}
            <Bits items={[[122, 104, "#7a4a33", 6], [116, 124, "#7a4a33", 6], [132, 86, "#e08a3c", 4], [104, 132, "#9bb27a", 4], [136, 118, "#9bb27a", 4]]} />
          </Plate>
        ),
      };
    case "goulash":
      return {
        bg: BG.clay,
        node: (
          <Plate>
            <circle cx="80" cy="100" r="26" fill="#f6f1e6" />
            <path d="M100 70 q40 4 40 30 q0 28 -40 30 q12 -30 0 -60Z" fill="#8a4a2c" />
            <Bits items={[[118, 92, "#6b3520", 6], [124, 112, "#6b3520", 6], [110, 104, "#c27a3a", 3]]} />
          </Plate>
        ),
      };
    case "grill":
      return {
        bg: BG.stone,
        node: (
          <Plate>
            {[78, 100, 122].map((y, i) => (
              <g key={i}>
                <line x1="54" y1={y} x2="146" y2={y - 6} stroke="#b89b74" strokeWidth="2.5" strokeLinecap="round" />
                {[70, 90, 110, 130].map((x, j) => (
                  <rect key={j} x={x - 8} y={y - 8 - j * 1.5} width="16" height="14" rx="4" fill={j % 2 ? "#7a4128" : "#8f5233"} />
                ))}
              </g>
            ))}
            <Leaf x={140} y={130} rot={30} s={0.7} />
          </Plate>
        ),
      };
    case "khorkhog":
      return {
        bg: BG.dusk,
        node: (
          <g>
            <ellipse cx="104" cy="108" rx="70" ry="70" fill={SHADOW} />
            <circle cx="100" cy="100" r="66" fill="#3d3a36" />
            <circle cx="100" cy="100" r="56" fill="#5a4030" />
            {[[78, 84], [118, 80], [96, 112], [126, 116], [72, 118]].map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y} rx="11" ry="9" fill="#6e6a64" />
            ))}
            <Bits items={[[96, 86, "#8f5233", 7], [110, 100, "#8f5233", 7], [84, 102, "#e08a3c", 5], [114, 126, "#d9b98a", 6]]} />
          </g>
        ),
      };
    case "salad":
      return {
        bg: BG.sage,
        node: (
          <Bowl fill="#eef0e2" r={60}>
            {[[80, 84, 20], [116, 80, -30], [92, 112, 80], [124, 112, 40], [100, 94, 0], [72, 108, -60]].map(([x, y, r], i) => (
              <Leaf key={i} x={x} y={y} rot={r} fill={i % 2 ? "#7d9461" : "#9fb57d"} s={1.2} />
            ))}
            {[[106, 120], [84, 96], [124, 96]].map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="8" fill="#c8513f" />
                <circle cx={x} cy={y} r="3" fill="#e8a08c" />
              </g>
            ))}
            {[[96, 76], [110, 104]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="7" fill="#cfe0b5" stroke="#9fb57d" strokeWidth="1.5" />
            ))}
          </Bowl>
        ),
      };
    case "breakfast":
      return {
        bg: BG.cream,
        node: (
          <g>
            <rect x="26" y="40" width="152" height="124" rx="10" fill="#c9a77d" />
            <rect x="32" y="46" width="140" height="112" rx="8" fill="#d8bb93" />
            <circle cx="74" cy="100" r="34" fill={PLATE} stroke={PLATE_RIM} />
            <Dumpling x={64} y={92} s={0.7} />
            <Dumpling x={86} y={96} s={0.7} rot={40} />
            <Dumpling x={72} y={114} s={0.7} rot={80} />
            <circle cx="136" cy="84" r="24" fill="#f4eee3" stroke="#e1d6c4" />
            <circle cx="136" cy="84" r="19" fill="#d8c3a0" />
            <circle cx="136" cy="128" r="16" fill="#f4eee3" />
            <Bits items={[[132, 126, "#e3e8cf", 3], [140, 130, "#e08a3c", 2.5], [136, 122, "#e3e8cf", 3]]} />
          </g>
        ),
      };
    case "omelette":
      return {
        bg: BG.warm,
        node: (
          <Plate>
            <path d="M60 104 Q100 54 142 100 Q100 126 60 104Z" fill="#f0c55c" />
            <path d="M68 102 Q100 66 134 98" fill="none" stroke="#e2a93a" strokeWidth="2" />
            <Bits items={[[96, 92, "#6f8d4e", 2], [110, 98, "#6f8d4e", 2], [86, 100, "#6f8d4e", 2]]} />
            <rect x="96" y="114" width="40" height="22" rx="4" fill="#d7a560" transform="rotate(-12 116 125)" />
          </Plate>
        ),
      };
    case "boortsog":
      return {
        bg: BG.clay,
        node: (
          <Plate>
            {[[76, 86, 10], [104, 80, -20], [126, 98, 30], [90, 110, -5], [116, 122, 15], [72, 118, 40], [100, 100, 60]].map(([x, y, r], i) => (
              <rect key={i} x={x - 13} y={y - 8} width="26" height="16" rx="5" fill={i % 2 ? "#c88d4b" : "#b9793a"} transform={`rotate(${r} ${x} ${y})`} />
            ))}
            <circle cx="140" cy="66" r="13" fill="#d99a2b" stroke="#efe5d2" strokeWidth="3" />
          </Plate>
        ),
      };
    case "cake":
      return {
        bg: BG.dusk,
        node: (
          <Plate>
            <path d="M70 124 L130 124 L104 66 Z" fill="#f4e7cf" />
            <path d="M70 124 L104 66 L130 124" fill="none" stroke="#d6b27a" strokeWidth="5" strokeLinejoin="round" />
            <path d="M80 112 L104 72 L122 112 Z" fill="#e58a2e" opacity="0.85" />
            {[[94, 98], [108, 104], [102, 86]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3.5" fill="#f2a63c" />
            ))}
            <Leaf x={136} y={84} rot={40} s={0.55} fill="#6f8d4e" />
          </Plate>
        ),
      };
    case "dairy":
      return {
        bg: BG.stone,
        node: (
          <Plate>
            {[[78, 84], [100, 78], [122, 88], [84, 108], [108, 104], [128, 112], [96, 126]].map(([x, y], i) => (
              <rect key={i} x={x - 9} y={y - 6} width="18" height="12" rx="3" fill={i % 3 === 0 ? "#efe3c4" : i % 3 === 1 ? "#f7f1e2" : "#e2c58f"} transform={`rotate(${i * 25} ${x} ${y})`} />
            ))}
          </Plate>
        ),
      };
    case "milkTea":
      return { bg: BG.cream, node: <Cup liquid="#d9c4a1"><circle cx="92" cy="92" r="8" fill="rgba(255,255,255,0.25)" /></Cup> };
    case "coffee":
      return { bg: BG.stone, node: <Cup liquid="#4a2d1f"><circle cx="100" cy="100" r="27" fill="#7a4c2f" /><circle cx="100" cy="100" r="27" fill="none" stroke="#a4703f" strokeWidth="2" /></Cup> };
    case "latte":
      return {
        bg: BG.warm,
        node: (
          <Cup liquid="#9a6a43">
            <path d="M100 82 C84 82 82 102 100 120 C118 102 116 82 100 82Z" fill="#f4e8d4" />
            <path d="M100 86 L100 116 M92 92 q8 6 16 0 M90 100 q10 7 20 0 M93 108 q7 5 14 0" stroke="#9a6a43" strokeWidth="1.5" fill="none" />
          </Cup>
        ),
      };
    case "iced":
      return {
        bg: BG.sage,
        node: (
          <g>
            <ellipse cx="104" cy="108" rx="48" ry="48" fill={SHADOW} />
            <circle cx="100" cy="100" r="44" fill="#efe8dc" opacity="0.7" stroke="#d9cfbf" strokeWidth="2" />
            <circle cx="100" cy="100" r="38" fill="#a8774f" />
            {[[88, 88], [110, 92], [96, 112], [116, 112]].map(([x, y], i) => (
              <rect key={i} x={x - 9} y={y - 9} width="18" height="18" rx="4" fill="rgba(255,255,255,0.45)" transform={`rotate(${i * 20} ${x} ${y})`} />
            ))}
            <line x1="118" y1="76" x2="150" y2="40" stroke="#2b2926" strokeWidth="5" strokeLinecap="round" />
          </g>
        ),
      };
    case "juice":
      return {
        bg: BG.clay,
        node: (
          <g>
            <ellipse cx="104" cy="108" rx="46" ry="46" fill={SHADOW} />
            <circle cx="100" cy="100" r="42" fill="#efe8dc" opacity="0.8" stroke="#d9cfbf" strokeWidth="2" />
            <circle cx="100" cy="100" r="36" fill="#e8892c" />
            <circle cx="100" cy="100" r="36" fill="url(#sheen)" />
            {[[150, 140], [160, 128], [146, 128]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="6" fill="#f0a23a" />
            ))}
          </g>
        ),
      };
    case "soda":
      return {
        bg: BG.dusk,
        node: (
          <g>
            <ellipse cx="104" cy="108" rx="40" ry="40" fill={SHADOW} />
            <circle cx="100" cy="100" r="38" fill="#9a2f2a" />
            <circle cx="100" cy="100" r="31" fill="#cfcac2" />
            <circle cx="100" cy="100" r="27" fill="#e2ddd4" />
            <rect x="90" y="84" width="20" height="10" rx="5" fill="#b9b3a9" />
            <circle cx="100" cy="106" r="5" fill="#b9b3a9" />
          </g>
        ),
      };
    case "airag":
      return { bg: BG.stone, node: <Bowl fill="#f3eee4"><circle cx="90" cy="92" r="10" fill="rgba(255,255,255,0.6)" /></Bowl> };
    case "water":
      return {
        bg: BG.sage,
        node: (
          <g>
            <ellipse cx="104" cy="108" rx="36" ry="36" fill={SHADOW} />
            <circle cx="100" cy="100" r="34" fill="#d8e3e3" stroke="#bfcfcf" strokeWidth="2" />
            <circle cx="100" cy="100" r="16" fill="#4f7d84" />
            <circle cx="100" cy="100" r="10" fill="#6c99a0" />
          </g>
        ),
      };
    default:
      return { bg: BG.cream, node: <Plate /> };
  }
}

export function DishArt({ artKey, className, title }: { artKey?: string | null; className?: string; title?: string }) {
  const { bg, node } = art(artKey ?? "default");
  return (
    <svg viewBox="0 0 200 200" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="sheen" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={bg} />
      <rect width="200" height="200" fill="url(#sheen)" opacity="0.6" />
      {node}
    </svg>
  );
}

export const ART_KEYS = [
  ["buuz", "Бууз"], ["khuushuur", "Хуушуур"], ["bansh", "Банш"], ["soup", "Шөл"], ["noodleSoup", "Гурилтай шөл"],
  ["borscht", "Борщ"], ["tsuivan", "Цуйван"], ["rice", "Будаа"], ["goulash", "Гуляш"], ["grill", "Шорлог"],
  ["khorkhog", "Хорхог"], ["salad", "Салат"], ["breakfast", "Өглөөний цай"], ["omelette", "Омлет"], ["boortsog", "Боорцог"],
  ["cake", "Бялуу"], ["dairy", "Цагаан идээ"], ["milkTea", "Сүүтэй цай"], ["coffee", "Кофе"], ["latte", "Латте"],
  ["iced", "Хүйтэн ундаа"], ["juice", "Шүүс"], ["soda", "Лааз ундаа"], ["airag", "Айраг"], ["water", "Ус"],
] as const;
