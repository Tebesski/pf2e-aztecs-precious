import { MODULE_ID, SETTINGS } from "./constants.js"
import { CustomRaritiesMenu } from "./ui.js"

export function registerSettings() {
   game.settings.registerMenu(MODULE_ID, "rarityConfigMenu", {
      name: "AZTEC.UI.ManagerTitle",
      label: "AZTEC.Settings.ManagerLabel",
      icon: "fas fa-gem",
      type: CustomRaritiesMenu,
      restricted: true,
   })

   game.settings.register(MODULE_ID, SETTINGS.PLAY_SOUND_INVENTORY, {
      name: "AZTEC.Settings.PlaySoundName",
      hint: "AZTEC.Settings.PlaySoundHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
   })

   game.settings.register(MODULE_ID, SETTINGS.GLOBAL_INSET_SHADOW, {
      name: "AZTEC.Settings.GlobalShadowName",
      hint: "AZTEC.Settings.GlobalShadowHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
   })

   game.settings.register(MODULE_ID, SETTINGS.LOOT_DROP_ENABLE, {
      name: "AZTEC.Settings.DropEnableName",
      hint: "AZTEC.Settings.DropEnableHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
   })

   game.settings.register(MODULE_ID, SETTINGS.LOOT_DROP_PCS_ENABLE, {
      name: "AZTEC.Settings.DropPCsName",
      hint: "AZTEC.Settings.DropPCsHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: false,
   })

   game.settings.register(MODULE_ID, SETTINGS.LOOT_BEAM_ENABLE, {
      name: "AZTEC.Settings.BeamEnableName",
      hint: "AZTEC.Settings.BeamEnableHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
   })

   game.settings.register(MODULE_ID, SETTINGS.LOOT_DROP_SOUND_ENABLE, {
      name: "AZTEC.Settings.DropSoundEnableName",
      hint: "AZTEC.Settings.DropSoundEnableHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
   })

   game.settings.register(MODULE_ID, SETTINGS.LOOT_OPEN_SOUND_ENABLE, {
      name: "AZTEC.Settings.OpenSoundEnableName",
      hint: "AZTEC.Settings.OpenSoundEnableHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
   })

   game.settings.register(MODULE_ID, SETTINGS.LOOT_DELETE_EMPTY, {
      name: "AZTEC.Settings.DeleteEmptyName",
      hint: "AZTEC.Settings.DeleteEmptyHint",
      scope: "world",
      config: true,
      type: Boolean,
      default: true,
   })

   game.settings.register(MODULE_ID, SETTINGS.LOOT_DEFAULT_IMAGE, {
      name: "AZTEC.Settings.DefaultImageName",
      hint: "AZTEC.Settings.DefaultImageHint",
      scope: "world",
      config: true,
      type: String,
      filePicker: "image",
      default: "icons/containers/bags/sack-leather-tan.webp",
   })

   game.settings.register(MODULE_ID, SETTINGS.LOOT_DEFAULT_NAME, {
      name: "AZTEC.Settings.DefaultNameName",
      hint: "AZTEC.Settings.DefaultNameHint",
      scope: "world",
      config: true,
      type: String,
      default: "Dropped Loot",
   })

   game.settings.register(MODULE_ID, SETTINGS.LOOT_DEFAULT_DROP_SOUND, {
      name: "AZTEC.Settings.DefaultDropSoundName",
      scope: "world",
      config: true,
      type: String,
      filePicker: "audio",
      default: `modules/${MODULE_ID}/assets/audio/lootbagCommon.ogg`,
   })

   game.settings.register(MODULE_ID, SETTINGS.LOOT_DEFAULT_OPEN_SOUND, {
      name: "AZTEC.Settings.DefaultOpenSoundName",
      scope: "world",
      config: true,
      type: String,
      filePicker: "audio",
      default: `modules/${MODULE_ID}/assets/audio/lootOpen.ogg`,
   })

   game.settings.register(MODULE_ID, SETTINGS.CUSTOM_RARITIES, {
      name: "Custom Rarities Data",
      scope: "world",
      config: false,
      type: Object,
      default: {},
   })

   game.settings.register(MODULE_ID, SETTINGS.DEFAULT_RARITIES, {
      name: "Default Rarities Data",
      scope: "world",
      config: false,
      type: Object,
      default: {
         common: {
            label: "Common",
            color: "#323232",
            hasShadow: false,
            shadowType: "sweetener",
            shadowColor: "#000000",
            sound: "",
            dropSound: "",
            iconEffect: "none",
            order: 13,
            beamColor: "#d4af37",
            useBeam: false,
         },
         uncommon: {
            label: "Uncommon",
            color: "#98513d",
            hasShadow: false,
            shadowType: "sweetener",
            shadowColor: "#000000",
            sound: ``,
            dropSound: `modules/${MODULE_ID}/assets/audio/lootbagUncommon.ogg`,
            iconEffect: "none",
            order: 6,
            beamColor: "#d4af37",
            useBeam: false,
         },
         rare: {
            label: "Rare",
            color: "#002664",
            hasShadow: false,
            shadowType: "sweetener",
            shadowColor: "#000000",
            sound: `modules/${MODULE_ID}/assets/audio/rare.ogg`,
            dropSound: `modules/${MODULE_ID}/assets/audio/lootbagRare.ogg`,
            iconEffect: "glow",
            order: 5,
            beamColor: "#002664",
            useBeam: true,
         },
         unique: {
            label: "Unique",
            color: "#54166e",
            hasShadow: false,
            shadowType: "sweetener",
            shadowColor: "#000000",
            sound: `modules/${MODULE_ID}/assets/audio/superb.ogg`,
            dropSound: `modules/${MODULE_ID}/assets/audio/lootbagEpic.ogg`,
            iconEffect: "shimmer",
            order: 4,
            beamColor: "#54166e",
            useBeam: true,
         },
      },
   })
}

Hooks.on("renderSettingsConfig", (app, htmlData) => {
   const html = htmlData instanceof HTMLElement ? htmlData : htmlData[0]

   const toggleDependencies = () => {
      const masterToggle = html.querySelector(
         `input[name="${MODULE_ID}.${SETTINGS.LOOT_DROP_ENABLE}"]`,
      )

      if (!masterToggle) return

      const dependentSettings = [
         SETTINGS.LOOT_DROP_PCS_ENABLE,
         SETTINGS.LOOT_BEAM_ENABLE,
         SETTINGS.LOOT_DROP_SOUND_ENABLE,
         SETTINGS.LOOT_OPEN_SOUND_ENABLE,
         SETTINGS.LOOT_DELETE_EMPTY,
         SETTINGS.LOOT_DEFAULT_IMAGE,
         SETTINGS.LOOT_DEFAULT_NAME,
         SETTINGS.LOOT_DEFAULT_DROP_SOUND,
         SETTINGS.LOOT_DEFAULT_OPEN_SOUND,
      ]

      const isEnabled = masterToggle.checked

      dependentSettings.forEach((settingName) => {
         const input = html.querySelector(
            `[name="${MODULE_ID}.${settingName}"]`,
         )

         if (input) {
            const formGroup = input.closest(".form-group")
            if (formGroup) {
               const interactiveElements = formGroup.querySelectorAll(
                  "input, select, button",
               )

               interactiveElements.forEach((el) => {
                  el.disabled = !isEnabled
               })

               formGroup.style.opacity = isEnabled ? "1" : "0.5"
               formGroup.style.pointerEvents = isEnabled ? "auto" : "none"
            }
         }
      })
   }

   toggleDependencies()

   html.addEventListener("change", (e) => {
      if (e.target.name === `${MODULE_ID}.${SETTINGS.LOOT_DROP_ENABLE}`) {
         toggleDependencies()
      }
   })
})
