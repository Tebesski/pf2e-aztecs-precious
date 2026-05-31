import { MODULE_ID } from "./constants.js"

export function hexToRgba(hex, alpha) {
   hex = (hex || "#ffffff").replace("#", "")
   let r = 0,
      g = 0,
      b = 0
   if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
   } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16)
      g = parseInt(hex.substring(2, 4), 16)
      b = parseInt(hex.substring(4, 6), 16)
   }
   return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function injectDynamicStyles(allRarities) {
   const existing = document.getElementById(`${MODULE_ID}-dynamic-styles`)
   if (existing) existing.remove()

   let cssString = ":root {\n"
   for (const [key, data] of Object.entries(allRarities)) {
      cssString += `  --color-rarity-${key}: ${data.color};\n`
      cssString += `  --rarity-${key}: ${data.color};\n`
   }
   cssString += "}\n\n"

   cssString += `
   #aztecs-precious-menu select option,
   #preview-shadow-type option {
      color: #ffffff !important;
      background-color: #222222 !important;
   }
   color-picker::part(input) { color: #ffffff !important; }
   color-picker input { color: #ffffff !important; }
   \n`

   cssString += `
   @keyframes aztec-shimmer-anim {
      0% { background-position: 200% 0; }
      35% { background-position: -200% 0; }
      100% { background-position: -200% 0; }
   }
   
   @keyframes aztec-pulse-generic {
      0% { box-shadow: 0px 0px 15px 3px var(--aztec-pulse-color1); }
      50% { box-shadow: 0px 0px 15px 3px var(--aztec-pulse-color2); }
      100% { box-shadow: 0px 0px 15px 3px var(--aztec-pulse-color1); }
   }\n
   
   @keyframes aztec-hologram-scan {
      0% { top: -10%; }
      100% { top: 110%; }
   }

@keyframes aztec-hologram-text-glitch {
      0%, 100% { text-shadow: 0 0 8px var(--aztec-holo-color), -1px -1px 2px color-mix(in srgb, var(--aztec-holo-glitch1) 50%, transparent), 1px 1px 2px color-mix(in srgb, var(--aztec-holo-glitch2) 50%, transparent); }
      15% { text-shadow: 0 0 8px var(--aztec-holo-color), 3px 1px 3px color-mix(in srgb, var(--aztec-holo-glitch1) 50%, transparent), -2px -1px 1px color-mix(in srgb, var(--aztec-holo-glitch2) 50%, transparent); }
      30% { text-shadow: 0 0 8px var(--aztec-holo-color), -2px -1px 1px color-mix(in srgb, var(--aztec-holo-glitch1) 50%, transparent), 3px 1px 3px color-mix(in srgb, var(--aztec-holo-glitch2) 50%, transparent); }
      45% { text-shadow: 0 0 8px var(--aztec-holo-color), 1px 1px 4px color-mix(in srgb, var(--aztec-holo-glitch1) 50%, transparent), -3px -1px 2px color-mix(in srgb, var(--aztec-holo-glitch2) 50%, transparent); }
      60% { text-shadow: 0 0 8px var(--aztec-holo-color), -1px 1px 2px color-mix(in srgb, var(--aztec-holo-glitch1) 50%, transparent), 1px -1px 3px color-mix(in srgb, var(--aztec-holo-glitch2) 50%, transparent); }
      75% { text-shadow: 0 0 8px var(--aztec-holo-color), 2px -1px 3px color-mix(in srgb, var(--aztec-holo-glitch1) 50%, transparent), -1px 1px 1px color-mix(in srgb, var(--aztec-holo-glitch2) 50%, transparent); }
      90% { text-shadow: 0 0 8px var(--aztec-holo-color), -3px 1px 2px color-mix(in srgb, var(--aztec-holo-glitch1) 50%, transparent), 2px -1px 4px color-mix(in srgb, var(--aztec-holo-glitch2) 50%, transparent); }
   }\n
   
   @keyframes aztec-glowing {
      0% { background-position: 0 0; }
      50% { background-position: 400% 0; }
      100% { background-position: 0 0; }
   }
   
   @keyframes aztec-rainbow-aura {
      100%, 0% { text-shadow: 0 0 8px rgb(255,0,0); }
      8% { text-shadow: 0 0 8px rgb(255,127,0); }
      16% { text-shadow: 0 0 8px rgb(255,255,0); }
      25% { text-shadow: 0 0 8px rgb(127,255,0); }
      33% { text-shadow: 0 0 8px rgb(0,255,0); }
      41% { text-shadow: 0 0 8px rgb(0,255,127); }
      50% { text-shadow: 0 0 8px rgb(0,255,255); }
      58% { text-shadow: 0 0 8px rgb(0,127,255); }
      66% { text-shadow: 0 0 8px rgb(0,0,255); }
      75% { text-shadow: 0 0 8px rgb(127,0,255); }
      83% { text-shadow: 0 0 8px rgb(255,0,255); }
      91% { text-shadow: 0 0 8px rgb(255,0,127); }
   }

   @keyframes aztec-rainbow-bg {
      100%, 0% { background-color: rgb(255,0,0); }
      8% { background-color: rgb(255,127,0); }
      16% { background-color: rgb(255,255,0); }
      25% { background-color: rgb(127,255,0); }
      33% { background-color: rgb(0,255,0); }
      41% { background-color: rgb(0,255,127); }
      50% { background-color: rgb(0,255,255); }
      58% { background-color: rgb(0,127,255); }
      66% { background-color: rgb(0,0,255); }
      75% { background-color: rgb(127,0,255); }
      83% { background-color: rgb(255,0,255); }
      91% { background-color: rgb(255,0,127); }
   }

   @keyframes aztec-fire-aura {
      0%, 100% { text-shadow: 0 1px 1px #000, 0 -1px 2px #fff, 0 -2px 4px #dcbc16, 0 -4px 8px #ff8951, 0 -6px 12px #ff0000; }
      25% { text-shadow: 0 1px 1px #000, 0 -1px 3px #fff, 0 -3px 5px #dcbc16, 0 -5px 10px #ff8951, 0 -7px 14px #ff0000; }
      50% { text-shadow: 0 1px 1px #000, 0 -2px 2px #fff, 0 -2px 4px #dcbc16, 0 -4px 9px #ff8951, 0 -5px 11px #ff0000; }
      75% { text-shadow: 0 1px 1px #000, 0 -1px 3px #fff, 0 -4px 6px #dcbc16, 0 -6px 11px #ff8951, 0 -8px 16px #ff0000; }
   }

   @keyframes aztec-fire-bg {
      0% { background-position: 0% 100%; }
      100% { background-position: 0% 0%; }
   }
   
   @keyframes aztec-metallic-aura {
      0%, 100% { 
         text-shadow: 
            -1px -1px 0px color-mix(in srgb, var(--aztec-holo-color) 80%, white),
            1px 1px 0px color-mix(in srgb, var(--aztec-holo-color) 30%, black),
            2px 2px 2px rgba(0,0,0,0.8),
            0 0 8px var(--aztec-holo-color); 
      }
      50% { 
         text-shadow: 
            1px 1px 0px color-mix(in srgb, var(--aztec-holo-color) 80%, white),
            -1px -1px 0px color-mix(in srgb, var(--aztec-holo-color) 30%, black),
            2px 2px 2px rgba(0,0,0,0.8),
            0 0 12px color-mix(in srgb, var(--aztec-holo-color) 50%, white); 
      }
   }
   `

   cssString += `
   .aztec-loot-beam-container {
      position: absolute; pointer-events: none; z-index: 15;
      width: 300px; height: 300px; opacity: 0.8; transform-origin: center center;
   }
   .aztec-loot-beam-spin {
      width: 100%; height: 100%; border-radius: 50%;
      animation: aztec-spin-beam 15s linear infinite;
   }
   @keyframes aztec-spin-beam {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
   }
   `

   for (const [key, data] of Object.entries(allRarities)) {
      const rawShadow = data.hasShadow
         ? data.shadowType === "sweetener"
            ? `0px 0px 1px ${data.shadowColor}`
            : `1px 1px 1px ${data.shadowColor}`
         : "none"
      const glowColor = hexToRgba(data.color, 0.5)
      const globalInsetRgba = hexToRgba(data.color, 0.8)
      const shimmerColor = hexToRgba(data.color, 0.6)

      cssString += `
      .aztec-loot-beam-${key} {
         background: repeating-conic-gradient(
            transparent 0deg 15deg, 
            ${data.beamColor || data.color} 15deg 30deg
         );
         mask-image: radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0.8) 32%, rgba(0,0,0,0) 65%);
         -webkit-mask-image: radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0.8) 32%, rgba(0,0,0,0) 65%);
      }
      `

      cssString += `
        .aztec-global-inset-${key} { position: relative !important; }
        .aztec-global-inset-${key}::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            box-shadow: inset 0px 0px 4px 1px ${globalInsetRgba} !important;
            pointer-events: none; z-index: 9;
        }

        .aztec-global-inset-large-${key} { position: relative !important; }
        .aztec-global-inset-large-${key}::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            box-shadow: inset 0px 0px 10px 3px ${globalInsetRgba} !important;
            pointer-events: none; z-index: 9;
        }

        .aztec-effect-shimmer-${key} { position: relative !important; overflow: hidden !important; }
        .aztec-effect-shimmer-${key}::after {
            content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(105deg, transparent 20%, ${shimmerColor} 50%, transparent 80%);
            background-size: 200% 100%;
            background-repeat: no-repeat;
            animation: aztec-shimmer-anim 3s infinite linear;
            pointer-events: none; z-index: 10;
        }

        .aztec-effect-glow-${key} { box-shadow: 0 0 15px 3px ${glowColor} !important; overflow: visible !important; }
        
        .aztec-effect-pulse-${key} { 
            --aztec-pulse-color1: ${data.color};
            --aztec-pulse-color2: ${data.shadowColor || data.color};
            animation: aztec-pulse-generic 1.5s infinite ease-in-out !important; 
            overflow: visible !important; 
        }

         .aztec-effect-hologram-${key} {
            position: relative !important;
            overflow: hidden !important;
            border: 2px solid ${hexToRgba(data.color, 0.5)} !important;
            box-shadow: 0 0 15px ${hexToRgba(data.color, 0.3)} !important;
            background: ${hexToRgba(data.color, 0.1)} !important;
        }
        .aztec-effect-hologram-${key}::after {
            content: ''; position: absolute; left: 0; right: 0; height: 2px;
            background: linear-gradient(to right, transparent, ${hexToRgba(data.color, 0.8)}, transparent);
            top: 0; animation: aztec-hologram-scan 2s linear infinite; filter: blur(1px);
            pointer-events: none; z-index: 2;
        }

.aztec-effect-rainbow-${key} { position: relative !important; z-index: 0 !important; }
        .aztec-effect-rainbow-${key}::before {
            content: ''; position: absolute; top: -2px; left: -2px;
            background: linear-gradient(45deg, #ff0000, #ff7300, #fffb00, #48ff00, #00ffd5, #002bff, #7a00ff, #ff00c8, #ff0000);
            background-size: 400%; z-index: -1; filter: blur(5px);
            width: calc(100% + 4px); height: calc(100% + 4px);
            animation: aztec-glowing 20s linear infinite; border-radius: 4px;
        }
        `

      const webpBorders = [
         { id: "bigElectro", file: "bigElectro" },
         { id: "neonGlass", file: "neonGlass" },
         { id: "void", file: "void" },
         { id: "toxic", file: "toxic" },
         { id: "purpleElectro", file: "purpleElectro" },
         { id: "pulseBorder", file: "pulse" },
      ]

      webpBorders.forEach((b) => {
         cssString += `
        .aztec-effect-${b.id}-${key} { position: relative !important; overflow: visible !important; }
        .aztec-effect-${b.id}-${key}::after {
            content: ''; position: absolute; top: -20%; left: -20%; width: 140%; height: 140%;
            background-image: url('/modules/${MODULE_ID}/assets/borders/${b.file}.webp');
            background-size: 100% 100%; background-repeat: no-repeat; pointer-events: none; z-index: 10;
        }
         `
      })

      let tagBgRule = `background-color: ${data.color} !important;`
      let tagAnimList = []
      let textAnimList = []
      let textShadowRule = ""

      if (data.iconEffect === "rainbow") {
         tagAnimList.push("aztec-rainbow-bg 2.5s linear infinite")
         tagBgRule = `background-color: ${data.color};`
      }

      if (data.hasShadow) {
         if (data.shadowType === "hologram") {
            tagAnimList.push("aztec-hologram-text-glitch 0.8s infinite")
            textAnimList.push("aztec-hologram-text-glitch 0.8s infinite")
         } else if (data.shadowType === "rainbow") {
            tagAnimList.push("aztec-rainbow-aura 2.5s linear infinite")
            textAnimList.push("aztec-rainbow-aura 2.5s linear infinite")
         } else if (data.shadowType === "fire") {
            textAnimList.push("aztec-fire-aura 0.6s alternate infinite")
         } else if (data.shadowType === "metallic") {
            textAnimList.push("aztec-metallic-aura 2s ease-in-out infinite")
         } else if (data.shadowType === "sweetener") {
            textShadowRule = `text-shadow: 0px 0px 1px ${data.shadowColor} !important;`
         } else {
            textShadowRule = `text-shadow: 1px 1px 1px ${data.shadowColor} !important;`
         }
      }

      const tagAnimRule =
         tagAnimList.length > 0
            ? `animation: ${tagAnimList.join(", ")} !important;`
            : ""
      const textAnimRule =
         textAnimList.length > 0
            ? `animation: ${textAnimList.join(", ")} !important;`
            : ""

      cssString += `
        .tag.rarity.${key}, .tag.rarity[data-value="${key}"], .tag.rarity[value="${key}"], 
        select.tag.rarity.${key}, select.tag.rarity[data-value="${key}"], select.tag.rarity option[value="${key}"],
        .tags .tag.rarity.${key}, .tags .tag.rarity[data-value="${key}"] { 
            ${tagBgRule}
            border: 1px solid var(--color-border-trait) !important;
            ${textShadowRule}
            --aztec-holo-color: ${data.shadowColor || "#000000"};
            --aztec-holo-glitch1: ${data.holoShadow || "#00ffff"};
            --aztec-holo-glitch2: ${data.holoShadow2 || "#ff00ff"};
            ${tagAnimRule}
        }
        
        .actor.sheet .inventory .item-name h4:not(:hover).rarity-${key} { 
            color: ${data.color} !important; 
            border-color: ${data.color} !important; 
            ${textShadowRule}
            --aztec-holo-color: ${data.shadowColor || "#000000"};
            --aztec-holo-glitch1: ${data.holoShadow || "#00ffff"};
            --aztec-holo-glitch2: ${data.holoShadow2 || "#ff00ff"};
            ${textAnimRule}
        }
      `
   }

   const style = document.createElement("style")
   style.id = `${MODULE_ID}-dynamic-styles`
   style.innerHTML = cssString
   document.head.appendChild(style)
}
