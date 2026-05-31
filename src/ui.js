import { MODULE_ID, SETTINGS } from "./constants.js"
import { hexToRgba } from "./styles.js"
import { applyShadowToElement } from "./logic.js"

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class CustomRaritiesMenu extends HandlebarsApplicationMixin(
   ApplicationV2,
) {
   static DEFAULT_OPTIONS = {
      id: "aztecs-precious-menu",
      window: {
         title: "AZTEC.UI.ManagerTitle",
         resizable: true,
         contentTag: "form",
         contentClasses: ["standard-form", "scrollable"],
      },
      position: { width: 700, height: 750 },
      form: {
         handler: CustomRaritiesMenu.prototype._updateObject,
         submitOnChange: false,
         closeOnSubmit: false,
      },
   }

   static PARTS = {
      main: { template: `modules/${MODULE_ID}/templates/rarity-settings.hbs` },
   }

   _canRender(options) {
      if (!game.user.isGM) {
         ui.notifications.error(
            "Aztec's Precious | Only Game Masters can access the Rarity Manager.",
         )
         return false
      }
      return super._canRender(options)
   }

   async _prepareContext(options) {
      const defaults =
         game.settings.get(MODULE_ID, SETTINGS.DEFAULT_RARITIES) || {}
      const customs =
         game.settings.get(MODULE_ID, SETTINGS.CUSTOM_RARITIES) || {}

      for (const [k, v] of Object.entries(defaults)) {
         v.isDefault = true
         v.key = k
      }
      for (const [k, v] of Object.entries(customs)) {
         v.isDefault = false
         v.key = k
      }

      const allRarities = Object.values(defaults).concat(Object.values(customs))
      allRarities.sort((a, b) => (a.order || 0) - (b.order || 0))

      return {
         allRarities,
         effectOptions: {
            none: "AZTEC.UI.EffectNone",
            glow: "AZTEC.UI.EffectGlow",
            shimmer: "AZTEC.UI.EffectShimmer",
            pulse: "AZTEC.UI.EffectPulse",
            hologram: "AZTEC.UI.EffectHologram",
            rainbow: "AZTEC.UI.EffectRainbow",
            bigElectro: "AZTEC.UI.EffectBigElectro",
            neonGlass: "AZTEC.UI.EffectNeonGlass",
            void: "AZTEC.UI.EffectVoid",
            toxic: "AZTEC.UI.EffectToxic",
            purpleElectro: "AZTEC.UI.EffectPurpleElectro",
            pulseBorder: "AZTEC.UI.EffectPulseBorder",
         },
      }
   }

   _onRender(context, options) {
      super._onRender(context, options)
      const html = $(this.element)

      let draggedItem = null

      html.on("mousedown", ".drag-handle", function () {
         $(this).closest(".rarity-item").attr("draggable", true)
      })

      html.on("mouseup mouseleave", ".drag-handle", function () {
         $(this).closest(".rarity-item").attr("draggable", false)
      })

      html.on("dragstart", ".rarity-item", function (e) {
         draggedItem = this
         e.originalEvent.dataTransfer.effectAllowed = "move"
         $(this).css("opacity", "0.4")
      })

      html.on("dragend", ".rarity-item", function (e) {
         $(this).css("opacity", "1")
         $(this).attr("draggable", false)
         draggedItem = null
      })

      html.on("dragover", ".rarity-item", function (e) {
         e.preventDefault()
         e.originalEvent.dataTransfer.dropEffect = "move"
      })

      html.on("drop", ".rarity-item", function (e) {
         e.preventDefault()
         if (draggedItem && this !== draggedItem) {
            const allItems = html.find(".rarity-item").toArray()
            const draggedIndex = allItems.indexOf(draggedItem)
            const droppedIndex = allItems.indexOf(this)

            if (draggedIndex < droppedIndex) {
               $(this).after(draggedItem)
            } else {
               $(this).before(draggedItem)
            }

            html.find(".rarity-item").each((index, el) => {
               $(el).find(".sort-order").val(index)
            })
         }
      })

      html.find(".rarity-item").each((_, el) => {
         this.#updateRowPreview($(el))
      })

      html.on("change", "color-picker, select[name*='.iconEffect']", (e) => {
         const row = $(e.currentTarget).closest(".rarity-item")
         this.#updateRowPreview(row)
      })

      html.on("click", ".match-beam-color", (e) => {
         e.preventDefault()
         const row = $(e.currentTarget).closest(".rarity-item")
         const uiColor = row.find('color-picker[name*=".color"]').val()
         row.find('color-picker[name*=".beamColor"]').val(uiColor)
      })

      html.on("click", ".add-rarity", async (e) => {
         e.preventDefault()
         document.activeElement?.blur()

         const newKey = foundry.utils.randomID()
         const newOrder = html.find(".rarity-item").length

         const effectOptions = {
            none: "AZTEC.UI.EffectNone",
            glow: "AZTEC.UI.EffectGlow",
            shimmer: "AZTEC.UI.EffectShimmer",
            pulse: "AZTEC.UI.EffectPulse",
            electro: "AZTEC.UI.EffectElectro",
            hologram: "AZTEC.UI.EffectHologram",
            rainbow: "AZTEC.UI.EffectRainbow",
            bigElectro: "AZTEC.UI.EffectBigElectro",
            neonGlass: "AZTEC.UI.EffectNeonGlass",
            void: "AZTEC.UI.EffectVoid",
            toxic: "AZTEC.UI.EffectToxic",
            purpleElectro: "AZTEC.UI.EffectPurpleElectro",
            pulseBorder: "AZTEC.UI.EffectPulseBorder",
         }

         const newRowHTML =
            await foundry.applications.handlebars.renderTemplate(
               `modules/${MODULE_ID}/templates/new-rarity-row.hbs`,
               { newKey, order: newOrder, effectOptions },
            )
         const appended = $(newRowHTML).appendTo(html.find(".unified-list"))

         this.#updateRowPreview(appended)
      })

      html.on("click", ".delete-rarity", async (e) => {
         e.preventDefault()
         const key = e.currentTarget.dataset.key
         const labelInput =
            html
               .find(`.rarity-item[data-key="${key}"] input[name*=".label"]`)
               .val() || "this rarity"

         const confirmed = await foundry.applications.api.DialogV2.confirm({
            window: { title: "Delete Rarity" },
            content: `<p>Are you sure you want to delete <strong>${labelInput}</strong>?</p>`,
            rejectClose: false,
         })

         if (confirmed) {
            html.find(`.rarity-item[data-key="${key}"]`).remove()
            html.find(".rarity-item").each((index, el) => {
               $(el).find(".sort-order").val(index)
            })
         }
      })

      html.on("click", ".reset-default", (e) => {
         e.preventDefault()
         const key = e.currentTarget.dataset.key
         const row = $(e.currentTarget).closest(".rarity-item")

         const baselines = {
            common: {
               label: "Common",
               color: "#323232",
               beamColor: "#d4af37",
               useBeam: false,
               dropSound: "",
               sound: "",
            },
            uncommon: {
               label: "Uncommon",
               color: "#98513d",
               beamColor: "#d4af37",
               useBeam: false,
               dropSound: "",
               sound: "",
            },
            rare: {
               label: "Rare",
               color: "#002664",
               beamColor: "#002664",
               useBeam: true,
               dropSound: "",
               sound: `modules/${MODULE_ID}/assets/audio/rare.ogg`,
            },
            unique: {
               label: "Unique",
               color: "#54166e",
               beamColor: "#54166e",
               useBeam: true,
               dropSound: "",
               sound: "",
            },
         }
         const base = baselines[key]
         if (!base) return

         row.find(`input[name*=".label"]`).val(base.label)
         row.find(`color-picker[name*=".color"]`).val(base.color)
         row.find(`color-picker[name*=".beamColor"]`).val(base.beamColor)
         row.find(`input[name*=".useBeam"]`)[0].checked = base.useBeam
         row.find(`file-picker[name*=".sound"]`).val(base.sound)
         row.find(`file-picker[name*=".dropSound"]`).val(base.dropSound)
         row.find(`select[name*=".iconEffect"]`).val("none")
         row.find(`input[name*=".shadowType"]`).val("sweetener")
         row.find(`input[name*=".shadowColor"]`).val("#000000")

         const shadowToggle = row.find(`input[name*=".hasShadow"]`)[0]
         if (shadowToggle) shadowToggle.checked = false
         row.find(".edit-shadow").hide()

         this.#updateRowPreview(row)
         ui.notifications.info(`Aztec's Precious | ${base.label} reverted.`)
      })

      html.on("change", ".shadow-toggle", async (e) => {
         const checkbox = e.currentTarget
         const row = $(checkbox).closest(".rarity-item")
         if (checkbox.checked) {
            row.find(".edit-shadow").show()
            await this.#openShadowDialog(row, checkbox)
         } else {
            row.find(".edit-shadow").hide()
            this.#updateRowPreview(row)
         }
      })

      html.on("click", ".edit-shadow", async (e) => {
         const row = $(e.currentTarget).closest(".rarity-item")
         await this.#openShadowDialog(row)
      })

      html.on("click", ".export-pack", this.#exportPack.bind(this))
      html.on("click", ".import-pack", this.#importPack.bind(this))
   }

   #updateRowPreview(row) {
      const key = row.data("key")

      const labelInput = row.find(`input[name*=".label"]`)
      const color = row.find(`color-picker[name*=".color"]`).val() || "#ffffff"
      const hasShadow = row.find(`input[name*=".hasShadow"]`).is(":checked")
      const shadowType =
         row.find(`input[name*=".shadowType"]`).val() || "sweetener"
      const shadowColor =
         row.find(`input[name*=".shadowColor"]`).val() || "#000000"
      const fxSelect = row.find(`select[name*=".iconEffect"]`).val() || "none"

      const previewText = row.find(".preview-text")
      const previewWrapper = row.find(".aztec-icon-wrapper")

      labelInput.css("color", color)
      labelInput.css("background", "#f9f9f9")
      previewText.css("color", color)

      const mockData = {
         hasShadow: hasShadow,
         shadowType: shadowType,
         shadowColor: shadowColor,
         holoShadow: row.find('input[name$=".holoShadow"]').val() || "#00ffff",
         holoShadow2:
            row.find('input[name$=".holoShadow2"]').val() || "#ff00ff",
      }
      applyShadowToElement(labelInput, mockData)
      applyShadowToElement(previewText, mockData)

      previewWrapper.removeClass((index, className) => {
         return (
            className.match(/\baztec-(effect|global-inset|preview)\S*/g) || []
         ).join(" ")
      })

      let previewStyle = row.find("style.aztec-preview-style")
      if (!previewStyle.length) {
         previewStyle = $("<style class='aztec-preview-style'></style>")
         row.find(".rarity-preview").prepend(previewStyle)
      }

      const glowColor = hexToRgba(color, 0.5)
      const globalInsetRgba = hexToRgba(color, 0.8)
      const shimmerColor = hexToRgba(color, 0.6)

      let css = `
        .aztec-preview-global-inset-${key} { position: relative !important; }
        .aztec-preview-global-inset-${key}::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            box-shadow: inset 0px 0px 4px 1px ${globalInsetRgba} !important;
            pointer-events: none; z-index: 9;
        }
        .aztec-preview-effect-shimmer-${key} { position: relative !important; overflow: hidden !important; }
        .aztec-preview-effect-shimmer-${key}::after {
            content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(105deg, transparent 20%, ${shimmerColor} 50%, transparent 80%);
            background-size: 200% 100%; background-repeat: no-repeat;
            animation: aztec-shimmer-anim 3s infinite linear;
            pointer-events: none; z-index: 10;
        }
        .aztec-preview-effect-glow-${key} { box-shadow: 0 0 15px 3px ${glowColor} !important; overflow: visible !important; }
        .aztec-preview-effect-pulse-${key} {
            --aztec-pulse-color1: ${color};
            --aztec-pulse-color2: ${shadowColor || color};
            animation: aztec-pulse-generic 1.5s infinite ease-in-out !important;
            overflow: visible !important;
        }
        .aztec-preview-effect-hologram-${key} {
            position: relative !important; overflow: hidden !important;
            border: 2px solid ${hexToRgba(color, 0.5)} !important;
            box-shadow: 0 0 15px ${hexToRgba(color, 0.3)} !important;
            background: ${hexToRgba(color, 0.1)} !important;
        }
        .aztec-preview-effect-hologram-${key}::after {
            content: ''; position: absolute; left: 0; right: 0; height: 2px;
            background: linear-gradient(to right, transparent, ${hexToRgba(color, 0.8)}, transparent);
            top: 0; animation: aztec-hologram-scan 2s linear infinite; filter: blur(1px);
            pointer-events: none; z-index: 2;
        }
        .aztec-preview-effect-rainbow-${key} { position: relative !important; z-index: 0 !important; }
        .aztec-preview-effect-rainbow-${key}::before {
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
         css += `
        .aztec-preview-effect-${b.id}-${key} { position: relative !important; overflow: visible !important; }
        .aztec-preview-effect-${b.id}-${key}::after {
            content: ''; position: absolute; top: -20%; left: -20%; width: 140%; height: 140%;
            background-image: url('/modules/${MODULE_ID}/assets/borders/${b.file}.webp');
            background-size: 100% 100%; background-repeat: no-repeat; pointer-events: none; z-index: 10;
        }
         `
      })

      previewStyle.html(css)

      const useGlobalInset = game.settings.get(
         MODULE_ID,
         SETTINGS.GLOBAL_INSET_SHADOW,
      )

      if (useGlobalInset)
         previewWrapper.addClass(`aztec-preview-global-inset-${key}`)
      if (fxSelect !== "none")
         previewWrapper.addClass(`aztec-preview-effect-${fxSelect}-${key}`)
   }

   async #openShadowDialog(row, checkboxToRevert = null) {
      const prefix = "rarities"
      const key = row.data("key")
      const label = row.find(`input[name$=".label"]`).val() || "New Rarity"
      const baseColor =
         row.find(`color-picker[name$=".color"]`).val() || "#ffffff"

      const typeInput = row.find('input[name$=".shadowType"]')
      const currentType = typeInput.val() || "sweetener"

      const colorInput = row.find('input[name$=".shadowColor"]')
      const currentColor = colorInput.val() || "#000000"

      const holoShadowInput = row.find('input[name$=".holoShadow"]')
      const holoShadow2Input = row.find('input[name$=".holoShadow2"]')

      const templateData = {
         label,
         baseColor,
         currentColor,
         isSweetener: currentType === "sweetener",
         isEpic: currentType === "epic",
         isHologram: currentType === "hologram",
         isRainbow: currentType === "rainbow",
         isFire: currentType === "fire",
         isMetallic: currentType === "metallic",
         holoShadow: holoShadowInput.val() || "#00ffff",
         holoShadow2: holoShadow2Input.val() || "#ff00ff",
      }

      const contentHTML = await foundry.applications.handlebars.renderTemplate(
         `modules/${MODULE_ID}/templates/shadow-dialog.hbs`,
         templateData,
      )

      let isSaved = false

      await foundry.applications.api.DialogV2.wait({
         window: { title: `Shadow Settings: ${label}` },
         content: contentHTML,
         render: (event) => {
            const appElement = $(event.target.element)
            const updatePreview = () => {
               const sType = appElement.find("#preview-shadow-type").val()
               const sColor = appElement.find("#preview-shadow-color").val()
               const hShadow1 = appElement.find("#preview-holo-shadow").val()
               const hShadow2 = appElement.find("#preview-holo-shadow2").val()

               const mockData = {
                  hasShadow: true,
                  shadowType: sType,
                  shadowColor: sColor,
                  holoShadow: hShadow1,
                  holoShadow2: hShadow2,
               }
               applyShadowToElement(appElement.find("#preview-text"), mockData)

               appElement
                  .find(".holo-settings")
                  .css("display", sType === "hologram" ? "flex" : "none")
               appElement
                  .find(".standard-shadow-settings")
                  .css(
                     "display",
                     sType === "hologram" ||
                        sType === "rainbow" ||
                        sType === "fire"
                        ? "none"
                        : "flex",
                  )
               appElement
                  .find(".standard-shadow-settings")
                  .css("display", sType === "hologram" ? "none" : "flex")
            }
            appElement.on(
               "change",
               "#preview-shadow-type, #preview-shadow-color, #preview-holo-shadow, #preview-holo-shadow2",
               updatePreview,
            )
            updatePreview()
         },
         buttons: [
            {
               action: "save",
               icon: "fa-solid fa-check",
               label: "Apply Shadow",
               callback: (event, button, dialog) => {
                  const appElement = $(dialog.element)
                  typeInput.val(appElement.find("#preview-shadow-type").val())
                  colorInput.val(appElement.find("#preview-shadow-color").val())
                  holoShadowInput.val(
                     appElement.find("#preview-holo-shadow").val(),
                  )
                  holoShadow2Input.val(
                     appElement.find("#preview-holo-shadow2").val(),
                  )
                  isSaved = true
                  this.#updateRowPreview(row)
               },
            },
         ],
         close: () => {
            if (!isSaved && checkboxToRevert) {
               checkboxToRevert.checked = false
               row.find(".edit-shadow").hide()
               this.#updateRowPreview(row)
            }
         },
      })
   }

   async #exportPack(event) {
      event.preventDefault()
      const defaults = game.settings.get(MODULE_ID, SETTINGS.DEFAULT_RARITIES)
      const customs = game.settings.get(MODULE_ID, SETTINGS.CUSTOM_RARITIES)

      const exportData = {
         source: "Aztec's Precious",
         version: game.modules.get(MODULE_ID).version || "1.0.0",
         defaults,
         customs,
      }

      foundry.utils.saveDataToFile(
         JSON.stringify(exportData, null, 2),
         "text/json",
         "aztecs-rarity-pack.json",
      )
   }

   async #importPack(event) {
      event.preventDefault()
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".json"

      input.onchange = async () => {
         const file = input.files[0]
         if (!file) return

         try {
            const text = await foundry.utils.readTextFromFile(file)
            const data = JSON.parse(text)

            if (
               data.source !== "Aztec's Precious" ||
               !data.defaults ||
               !data.customs
            ) {
               return ui.notifications.error(
                  "Aztec's Precious | Invalid Rarity Pack file.",
               )
            }

            await foundry.applications.api.DialogV2.wait({
               window: { title: "Import Rarity Pack" },
               content: `
                  <p>How would you like to import this Rarity Pack?</p>
                  <hr>
                  <p><strong>Merge:</strong> Keeps your existing custom rarities. Updates existing ones if names match, and adds new ones from the pack.</p>
                  <p><strong>Overwrite:</strong> Deletes all your current custom rarities and completely replaces them with this pack.</p>
               `,
               buttons: [
                  {
                     action: "merge",
                     icon: "fa-solid fa-compress-arrows-alt",
                     label: "Merge",
                     callback: async () =>
                        await this.#processImport(data, "merge"),
                  },
                  {
                     action: "overwrite",
                     icon: "fa-solid fa-trash",
                     label: "Overwrite",
                     callback: async () =>
                        await this.#processImport(data, "overwrite"),
                  },
                  {
                     action: "cancel",
                     icon: "fa-solid fa-times",
                     label: "Cancel",
                  },
               ],
            })
         } catch (e) {
            console.error("Aztec's Precious | Import failed:", e)
            ui.notifications.error(
               "Aztec's Precious | Failed to parse JSON file.",
            )
         }
      }

      input.click()
   }

   async #processImport(data, mode) {
      const currentDefaults = game.settings.get(
         MODULE_ID,
         SETTINGS.DEFAULT_RARITIES,
      )
      const currentCustoms = game.settings.get(
         MODULE_ID,
         SETTINGS.CUSTOM_RARITIES,
      )

      let finalDefaults = {}
      let finalCustoms = {}

      if (mode === "overwrite") {
         finalDefaults = data.defaults
         finalCustoms = data.customs
      } else if (mode === "merge") {
         finalDefaults = foundry.utils.mergeObject(
            currentDefaults,
            data.defaults,
         )
         finalCustoms = { ...currentCustoms }

         const existingLabels = new Map()
         for (const [k, v] of Object.entries(finalDefaults))
            existingLabels.set(v.label.toLowerCase(), k)
         for (const [k, v] of Object.entries(finalCustoms))
            existingLabels.set(v.label.toLowerCase(), k)

         for (const [importKey, importData] of Object.entries(data.customs)) {
            const cleanLabel = importData.label.toLowerCase()

            if (existingLabels.has(cleanLabel)) {
               const targetKey = existingLabels.get(cleanLabel)
               if (finalCustoms[targetKey]) {
                  finalCustoms[targetKey] = {
                     ...finalCustoms[targetKey],
                     ...importData,
                     key: targetKey,
                  }
               }
            } else {
               let newKey = importKey
               if (finalDefaults[newKey] || finalCustoms[newKey])
                  newKey = foundry.utils.randomID()

               importData.key = newKey
               finalCustoms[newKey] = importData
               existingLabels.set(cleanLabel, newKey)
            }
         }
      }

      await game.settings.set(
         MODULE_ID,
         SETTINGS.DEFAULT_RARITIES,
         finalDefaults,
      )
      await game.settings.set(MODULE_ID, SETTINGS.CUSTOM_RARITIES, finalCustoms)

      ui.notifications.info(
         `Aztec's Precious | Rarity pack ${mode === "merge" ? "merged" : "imported"} successfully!`,
      )

      this.close()
      foundry.applications.settings.SettingsConfig.reloadConfirm({
         world: true,
      })
   }

   async _updateObject(event, form, formData) {
      const expanded = foundry.utils.expandObject(formData.object)

      if (!expanded || !expanded.rarities || !expanded.rarities.common) {
         return
      }

      const oldCustoms = game.settings.get(MODULE_ID, SETTINGS.CUSTOM_RARITIES)
      const finalDefaults = {}
      const finalCustoms = {}
      const seenLabels = new Set()

      for (const [key, data] of Object.entries(expanded.rarities)) {
         const cleanLabel = (data.label || "").trim()
         if (!cleanLabel)
            return ui.notifications.warn(
               "Aztec's Precious | Rarity labels cannot be empty.",
            )

         if (seenLabels.has(cleanLabel.toLowerCase())) {
            return ui.notifications.warn(
               `Aztec's Precious | Duplicate rarity name found: "${cleanLabel}".`,
            )
         }
         seenLabels.add(cleanLabel.toLowerCase())

         const isDefault = String(data.isDefault) === "true"

         const processedData = {
            label: cleanLabel,
            color: data.color,
            hasShadow: Boolean(data.hasShadow),
            shadowType: data.shadowType || "sweetener",
            shadowColor: data.shadowColor || "#000000",
            holoShadow: data.holoShadow || "#00ffff",
            holoShadow2: data.holoShadow2 || "#ff00ff",
            sound: data.sound || "",
            dropSound: data.dropSound || "",
            iconEffect: data.iconEffect || "none",
            order: Number(data.order) || 0,
            beamColor: data.beamColor || data.color,
            useBeam: Boolean(data.useBeam),
         }

         if (isDefault) {
            finalDefaults[key] = processedData
         } else {
            processedData.dcMod = Number(data.dcMod) || 0
            finalCustoms[key] = processedData
         }
      }

      const deletedKeys = Object.keys(oldCustoms).filter(
         (key) => !finalCustoms[key],
      )
      if (deletedKeys.length > 0)
         await this.#cleanupDeletedRarities(deletedKeys)

      await game.settings.set(
         MODULE_ID,
         SETTINGS.DEFAULT_RARITIES,
         finalDefaults,
      )
      await game.settings.set(MODULE_ID, SETTINGS.CUSTOM_RARITIES, finalCustoms)

      this.close()
      foundry.applications.settings.SettingsConfig.reloadConfirm({
         world: true,
      })
   }

   async #cleanupDeletedRarities(deletedKeys) {
      const itemUpdates = game.items
         .filter((i) => deletedKeys.includes(i.system.traits?.rarity))
         .map((i) => ({ _id: i.id, "system.traits.rarity": "common" }))
      if (itemUpdates.length) await Item.updateDocuments(itemUpdates)

      for (const actor of game.actors) {
         const actorItemUpdates = actor.items
            .filter((i) => deletedKeys.includes(i.system.traits?.rarity))
            .map((i) => ({ _id: i.id, "system.traits.rarity": "common" }))
         if (actorItemUpdates.length)
            await actor.updateEmbeddedDocuments("Item", actorItemUpdates)
      }

      for (const scene of game.scenes) {
         for (const token of scene.tokens) {
            if (token.isLinked || !token.actor) continue
            const tokenItemUpdates = token.actor.items
               .filter((i) => deletedKeys.includes(i.system.traits?.rarity))
               .map((i) => ({ _id: i.id, "system.traits.rarity": "common" }))
            if (tokenItemUpdates.length)
               await token.actor.updateEmbeddedDocuments(
                  "Item",
                  tokenItemUpdates,
               )
         }
      }
   }
}
