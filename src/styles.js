import { MODULE_ID } from "./constants.js"

function hexToRgba(hex, alpha) {
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
   }\n`

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

        .tag.rarity.${key}, .tag.rarity[data-value="${key}"], .tag.rarity[value="${key}"], 
        select.tag.rarity.${key}, select.tag.rarity[data-value="${key}"], select.tag.rarity option[value="${key}"],
        .tags .tag.rarity.${key}, .tags .tag.rarity[data-value="${key}"] { 
            background-color: ${data.color} !important; border: solid var(--color-border-trait) !important;
        }
        .actor.sheet .inventory .item-name h4:not(:hover).rarity-${key} { color: ${data.color} !important; border-color: ${data.color} !important; }
        `

      if (data.hasShadow) {
         cssString += `
            .tag.rarity.${key}, .tag.rarity[data-value="${key}"], .tag.rarity[value="${key}"], 
            select.tag.rarity.${key}, select.tag.rarity[data-value="${key}"], .tags .tag.rarity.${key},
            .tags .tag.rarity[data-value="${key}"], .actor.sheet .inventory .item-name h4:not(:hover).rarity-${key} {
                text-shadow: ${rawShadow} !important;
            }
            `
      }
   }

   const style = document.createElement("style")
   style.id = `${MODULE_ID}-dynamic-styles`
   style.innerHTML = cssString
   document.head.appendChild(style)
}
