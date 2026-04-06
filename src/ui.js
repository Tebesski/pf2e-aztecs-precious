import { MODULE_ID, SETTINGS } from "./constants.js"

export class CustomRaritiesMenu extends FormApplication {
   static get defaultOptions() {
      return foundry.utils.mergeObject(super.defaultOptions, {
         id: "aztecs-precious-menu",
         title: game.i18n.localize("AZTEC.UI.ManagerTitle"),
         template: `modules/${MODULE_ID}/templates/rarity-settings.hbs`,
         width: 700,
         height: "auto",
         closeOnSubmit: false,
      })
   }

   async _render(force, options) {
      if (!game.user.isGM)
         return ui.notifications.error(
            "Aztec's Precious | Only Game Masters can access the Rarity Manager.",
         )
      return super._render(force, options)
   }

   getData() {
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
         },
      }
   }

   activateListeners(html) {
      super.activateListeners(html)

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

      html.on("change", "color-picker, select[name$='.iconEffect']", (e) => {
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
         const newKey = foundry.utils.randomID()
         const newOrder = html.find(".rarity-item").length

         const newRowHTML = await renderTemplate(
            `modules/${MODULE_ID}/templates/new-rarity-row.hbs`,
            { newKey, order: newOrder },
         )
         const appended = $(newRowHTML).appendTo(html.find(".unified-list"))

         this.#updateRowPreview(appended)
         this.setPosition({ height: "auto" })
      })

      html.on("click", ".delete-rarity", async (e) => {
         e.preventDefault()
         const key = e.currentTarget.dataset.key
         const labelInput =
            html
               .find(`.rarity-item[data-key="${key}"] input[name*=".label"]`)
               .val() || "this rarity"

         const confirmed = await Dialog.confirm({
            title: "Delete Rarity",
            content: `<p>Are you sure you want to delete <strong>${labelInput}</strong>?</p>`,
            yes: () => true,
            no: () => false,
            defaultYes: false,
         })

         if (confirmed) {
            html.find(`.rarity-item[data-key="${key}"]`).remove()
            html.find(".rarity-item").each((index, el) => {
               $(el).find(".sort-order").val(index)
            })
            this.setPosition({ height: "auto" })
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
      labelInput.css("background", "transparent")
      previewText.css("color", color)

      if (hasShadow) {
         const shadowStr =
            shadowType === "sweetener"
               ? `0px 0px 1px ${shadowColor}`
               : `1px 1px 1px ${shadowColor}`
         labelInput.css("text-shadow", shadowStr)
         previewText.css("text-shadow", shadowStr)
      } else {
         labelInput.css("text-shadow", "none")
         previewText.css("text-shadow", "none")
      }

      previewWrapper.removeClass((index, className) => {
         return (
            className.match(/\baztec-(effect|global-inset)\S*/g) || []
         ).join(" ")
      })

      const useGlobalInset = game.settings.get(
         MODULE_ID,
         SETTINGS.GLOBAL_INSET_SHADOW,
      )

      if (useGlobalInset) previewWrapper.addClass(`aztec-global-inset-${key}`)
      if (fxSelect !== "none")
         previewWrapper.addClass(`aztec-effect-${fxSelect}-${key}`)
   }

   async #openShadowDialog(row, checkboxToRevert = null) {
      const prefix = "rarities"
      const key = row.data("key")
      const label =
         row.find(`input[name="${prefix}.${key}.label"]`).val() || "New Rarity"
      const typeInput = row.find(`input[name="${prefix}.${key}.shadowType"]`)
      const colorInput = row.find(`input[name="${prefix}.${key}.shadowColor"]`)
      const baseColor =
         row.find(`color-picker[name="${prefix}.${key}.color"]`).val() ||
         "#ffffff"

      const currentType = typeInput.val() || "sweetener"
      const currentColor = colorInput.val() || "#000000"

      const templateData = {
         label,
         baseColor,
         currentColor,
         isSweetener: currentType === "sweetener",
         isEpic: currentType === "epic",
      }
      const contentHTML = await renderTemplate(
         `modules/${MODULE_ID}/templates/shadow-dialog.hbs`,
         templateData,
      )

      let isSaved = false

      new Dialog({
         title: `Shadow Settings: ${label}`,
         content: contentHTML,
         render: (dlgHtml) => {
            const updatePreview = () => {
               const sType = dlgHtml.find("#preview-shadow-type").val()
               const sColor = dlgHtml.find("#preview-shadow-color").val()
               const cssShadow =
                  sType === "sweetener"
                     ? `0px 0px 1px ${sColor}`
                     : `1px 1px 1px ${sColor}`
               dlgHtml.find("#preview-text").css("text-shadow", cssShadow)
            }
            dlgHtml.on(
               "change",
               "#preview-shadow-type, #preview-shadow-color",
               updatePreview,
            )
            updatePreview()
         },
         buttons: {
            save: {
               icon: '<i class="fas fa-check"></i>',
               label: "Apply Shadow",
               callback: (dlgHtml) => {
                  typeInput.val(dlgHtml.find("#preview-shadow-type").val())
                  colorInput.val(dlgHtml.find("#preview-shadow-color").val())
                  isSaved = true
                  this.#updateRowPreview(row)
               },
            },
         },
         default: "save",
         close: () => {
            if (!isSaved && checkboxToRevert) {
               checkboxToRevert.checked = false
               row.find(".edit-shadow").hide()
               this.#updateRowPreview(row)
            }
         },
      }).render(true)
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

      saveDataToFile(
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
            const text = await readTextFromFile(file)
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

            new Dialog({
               title: "Import Rarity Pack",
               content: `
                  <p>How would you like to import this Rarity Pack?</p>
                  <hr>
                  <p><strong>Merge:</strong> Keeps your existing custom rarities. Updates existing ones if names match, and adds new ones from the pack.</p>
                  <p><strong>Overwrite:</strong> Deletes all your current custom rarities and completely replaces them with this pack.</p>
               `,
               buttons: {
                  merge: {
                     icon: '<i class="fas fa-compress-arrows-alt"></i>',
                     label: "Merge",
                     callback: async () =>
                        await this.#processImport(data, "merge"),
                  },
                  overwrite: {
                     icon: '<i class="fas fa-trash"></i>',
                     label: "Overwrite",
                     callback: async () =>
                        await this.#processImport(data, "overwrite"),
                  },
                  cancel: {
                     icon: '<i class="fas fa-times"></i>',
                     label: "Cancel",
                  },
               },
               default: "merge",
            }).render(true)
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
      SettingsConfig.reloadConfirm({ world: true })
   }

   async _updateObject(event, formData) {
      const expanded = foundry.utils.expandObject(formData)
      const oldCustoms = game.settings.get(MODULE_ID, SETTINGS.CUSTOM_RARITIES)

      const finalDefaults = {}
      const finalCustoms = {}
      const seenLabels = new Set()

      if (expanded.rarities) {
         for (const [key, data] of Object.entries(expanded.rarities)) {
            const cleanLabel = data.label.trim()
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
      SettingsConfig.reloadConfirm({ world: true })
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
