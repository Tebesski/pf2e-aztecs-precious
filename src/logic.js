import { MODULE_ID, SETTINGS, PHYSICAL_ITEM_TYPES } from "./constants.js"
import { injectDynamicStyles } from "./styles.js"

function getShadow(data) {
   if (!data.hasShadow) return "none"
   return data.shadowType === "sweetener"
      ? `0px 0px 1px ${data.shadowColor}`
      : `1px 1px 1px ${data.shadowColor}`
}

function getHighestRarity(actor, allRarities) {
   if (!actor || !actor.items) return null

   let highest = null
   let highestOrder = Infinity

   for (const item of actor.items) {
      if (!PHYSICAL_ITEM_TYPES.includes(item.type)) continue

      const rarity = item.system?.traits?.rarity || "common"
      const data = allRarities[rarity]
      if (data && data.order !== undefined) {
         if (data.order < highestOrder) {
            highestOrder = data.order
            highest = { key: rarity, data: data }
         }
      }
   }
   return highest
}

// --- PIXI BEAM GENERATOR ---
const beamTextures = {}

const activeBeams = new Set()
let globalTickerAdded = false

const globalBeamTicker = () => {
   activeBeams.forEach((sprite) => {
      if (!sprite.destroyed) sprite.rotation += 0.005
   })
}

function getBeamTexture(colorHex) {
   if (beamTextures[colorHex]) return beamTextures[colorHex]

   const size = 400
   const canvas = document.createElement("canvas")
   canvas.width = size
   canvas.height = size
   const ctx = canvas.getContext("2d")

   const cx = size / 2,
      cy = size / 2,
      r = size / 2

   ctx.fillStyle = colorHex
   const angle = Math.PI / 12
   for (let i = 0; i < 24; i += 2) {
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, i * angle, (i + 1) * angle)
      ctx.lineTo(cx, cy)
      ctx.fill()
   }

   ctx.globalCompositeOperation = "destination-in"
   const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
   rg.addColorStop(0, "rgba(0,0,0,0)")
   rg.addColorStop(0.18, "rgba(0,0,0,0)")
   rg.addColorStop(0.32, "rgba(0,0,0,0.8)")
   rg.addColorStop(0.65, "rgba(0,0,0,0)")
   rg.addColorStop(1, "rgba(0,0,0,0)")

   ctx.fillStyle = rg
   ctx.fillRect(0, 0, size, size)

   const texture = PIXI.Texture.from(canvas)
   texture.baseTexture.update()

   beamTextures[colorHex] = texture
   return texture
}

function refreshPixiBeamForToken(token) {
   if (!token || !token.document) return

   const lootEnabled = game.settings.get(MODULE_ID, SETTINGS.LOOT_DROP_ENABLE)
   const beamsEnabled = game.settings.get(MODULE_ID, SETTINGS.LOOT_BEAM_ENABLE)
   const isDropLoot =
      token.document.getFlag(MODULE_ID, "isDropLoot") ||
      (token.actor && token.actor.getFlag(MODULE_ID, "isDropLoot"))

   if (!lootEnabled || !beamsEnabled || !isDropLoot || !token.actor) {
      removePixiBeam(token)
      return
   }

   // Optional future optimization: cache this combined object and only update it when settings change
   const customs = game.settings.get(MODULE_ID, SETTINGS.CUSTOM_RARITIES) || {}
   const defaults =
      game.settings.get(MODULE_ID, SETTINGS.DEFAULT_RARITIES) || {}
   const allRarities = { ...defaults, ...customs }

   const highest = getHighestRarity(token.actor, allRarities)

   if (!highest || !highest.data.useBeam) {
      removePixiBeam(token)
      return
   }

   const color = highest.data.beamColor || highest.data.color

   if (!token._aztecBeam || token._aztecBeam.destroyed) {
      const texture = getBeamTexture(color)
      const sprite = new PIXI.Sprite(texture)

      sprite.anchor.set(0.5)
      sprite.zIndex = -1
      token.sortableChildren = true

      token.addChild(sprite)

      if (!globalTickerAdded && canvas.app?.ticker) {
         canvas.app.ticker.add(globalBeamTicker)
         globalTickerAdded = true
      }
      activeBeams.add(sprite)

      token._aztecBeam = sprite
      token._aztecBeamColor = color
   } else if (token._aztecBeamColor !== color) {
      token._aztecBeam.texture = getBeamTexture(color)
      token._aztecBeamColor = color
   }

   token._aztecBeam.x = token.w / 2
   token._aztecBeam.y = token.h / 2

   const scaleMultiplier = Math.max(token.w, token.h) / 130
   token._aztecBeam.scale.set(scaleMultiplier)
}

function removePixiBeam(token) {
   if (token._aztecBeam) {
      activeBeams.delete(token._aztecBeam) // Remove from global tracker
      if (!token._aztecBeam.destroyed) token._aztecBeam.destroy()
      token._aztecBeam = null
      token._aztecBeamColor = null
   }
}

function updateAllPixiBeams() {
   if (!canvas?.ready) return
   for (const token of canvas.tokens.placeables) {
      refreshPixiBeamForToken(token)
   }
}

async function checkAndDeleteEmptyLoot(actor) {
   if (
      !game.settings.get(MODULE_ID, SETTINGS.LOOT_DROP_ENABLE) ||
      !game.settings.get(MODULE_ID, SETTINGS.LOOT_DELETE_EMPTY)
   )
      return

   const currentActor = game.actors.get(actor.id)
   if (!currentActor) return

   let hasLoot = false
   for (const i of currentActor.items) {
      if (PHYSICAL_ITEM_TYPES.includes(i.type) && i.system?.quantity !== 0) {
         hasLoot = true
         break
      }
   }

   if (!hasLoot) {
      const activeTokens = currentActor.getActiveTokens()
      const tokenIds = activeTokens.map((t) => t.id)
      if (tokenIds.length > 0 && canvas.scene) {
         await canvas.scene.deleteEmbeddedDocuments("Token", tokenIds)
      }
      await currentActor.delete()
      updateAllPixiBeams()
   }
}

async function dropLootForActor(actor) {
   const lootEnabled = game.settings.get(MODULE_ID, SETTINGS.LOOT_DROP_ENABLE)
   if (!lootEnabled) return

   const dropPCs = game.settings.get(MODULE_ID, SETTINGS.LOOT_DROP_PCS_ENABLE)
   if (actor.type === "character" && !dropPCs) return
   if (actor.type !== "npc" && actor.type !== "character") return

   if (actor.getFlag(MODULE_ID, "lootDropped")) return

   const itemsToMove = actor.items.filter((i) =>
      PHYSICAL_ITEM_TYPES.includes(i.type),
   )

   if (itemsToMove.length === 0) return

   let npcToken
   if (actor.isToken) npcToken = actor.token
   else npcToken = actor.getActiveTokens()[0]?.document
   if (!npcToken) return

   await actor.setFlag(MODULE_ID, "lootDropped", true)

   const size = canvas.grid.size
   const offsets = [
      { x: size, y: 0 },
      { x: -size, y: 0 },
      { x: 0, y: size },
      { x: 0, y: -size },
      { x: size, y: size },
      { x: -size, y: -size },
      { x: size, y: -size },
      { x: -size, y: size },
      { x: 0, y: 0 },
   ]

   let dropX = npcToken.x
   let dropY = npcToken.y

   for (const offset of offsets) {
      const testX = npcToken.x + offset.x
      const testY = npcToken.y + offset.y
      const isOccupied = canvas.tokens.placeables.some(
         (t) => t.document.x === testX && t.document.y === testY,
      )
      if (!isOccupied) {
         dropX = testX
         dropY = testY
         break
      }
   }

   const defaultName =
      game.settings.get(MODULE_ID, SETTINGS.LOOT_DEFAULT_NAME) || "Dropped Loot"
   let defaultImage =
      game.settings.get(MODULE_ID, SETTINGS.LOOT_DEFAULT_IMAGE) ||
      "icons/containers/bags/sack-leather-tan.webp"

   const lootActor = await Actor.create({
      name: defaultName,
      type: "loot",
      img: defaultImage,
      system: { lootSheetType: "Loot" },
      ownership: { default: 2 },
      prototypeToken: { texture: { src: defaultImage }, actorLink: true },
      flags: { [MODULE_ID]: { isDropLoot: true } },
   })

   const tokenData = {
      ...lootActor.prototypeToken.toObject(),
      actorId: lootActor.id,
      actorLink: true,
      x: dropX,
      y: dropY,
      hidden: npcToken.hidden || npcToken.document?.hidden || false,
      flags: { [MODULE_ID]: { isDropLoot: true } },
   }

   await canvas.scene.createEmbeddedDocuments("Token", [tokenData])
   const itemData = itemsToMove.map((i) => i.toObject())
   await lootActor.createEmbeddedDocuments("Item", itemData)
   await actor.deleteEmbeddedDocuments(
      "Item",
      itemsToMove.map((i) => i.id),
   )
}

export function injectRarities() {
   const customs = game.settings.get(MODULE_ID, SETTINGS.CUSTOM_RARITIES) || {}
   const defaults =
      game.settings.get(MODULE_ID, SETTINGS.DEFAULT_RARITIES) || {}
   const allRarities = { ...defaults, ...customs }
   let lastDropSoundTime = 0

   injectDynamicStyles(allRarities)

   for (const [key, data] of Object.entries(allRarities)) {
      CONFIG.PF2E.rarityTraits[key] = data.label

      if (["common", "uncommon", "rare", "unique"].includes(key)) {
         const i18nKey = `PF2E.Rarity${key.charAt(0).toUpperCase() + key.slice(1)}`
         if (game.i18n.translations.PF2E) {
            foundry.utils.setProperty(
               game.i18n.translations,
               i18nKey,
               data.label,
            )
         }
      }
   }

   const systemDataModels = [CONFIG.Item.dataModels, CONFIG.Actor.dataModels]
   for (const models of systemDataModels) {
      if (!models) continue
      for (const model of Object.values(models)) {
         const rarityField = foundry.utils.getProperty(
            model,
            "schema.fields.traits.fields.rarity",
         )

         if (rarityField && rarityField.choices) {
            if (rarityField.choices instanceof Set) {
               for (const key of Object.keys(allRarities)) {
                  rarityField.choices.add(key)
               }
            } else if (Array.isArray(rarityField.choices)) {
               const newChoices = [...rarityField.choices]
               for (const key of Object.keys(allRarities)) {
                  if (!newChoices.includes(key)) newChoices.push(key)
               }
               rarityField.choices = newChoices
            } else if (typeof rarityField.choices === "object") {
               const newChoices = { ...rarityField.choices }
               for (const [key, data] of Object.entries(allRarities)) {
                  newChoices[key] = data.label
               }
               rarityField.choices = newChoices
            }
         }
      }
   }

   Hooks.on("canvasReady", updateAllPixiBeams)
   Hooks.on("drawToken", refreshPixiBeamForToken)
   Hooks.on("refreshToken", refreshPixiBeamForToken)

   Hooks.on("deleteToken", (tokenDoc, options, userId) => {
      if (!game.user.isGM || game.user.id !== game.users.activeGM?.id) return

      if (tokenDoc.getFlag(MODULE_ID, "isDropLoot")) {
         const actorId = tokenDoc.actorId
         setTimeout(async () => {
            const checkActor = game.actors.get(actorId)
            if (checkActor && checkActor.type === "loot") {
               await checkActor.delete()
            }
         }, 500)
      }
   })

   Hooks.on("updateActor", async (actor, update, options, userId) => {
      if (!game.user.isGM || game.user.id !== game.users.activeGM?.id) return

      const hp = foundry.utils.getProperty(update, "system.attributes.hp.value")
      if (hp !== undefined) {
         if (hp <= 0) {
            await dropLootForActor(actor)
         } else if (hp > 0) {
            await actor.setFlag(MODULE_ID, "lootDropped", false)
         }
      }
   })

   Hooks.on("createItem", async (item, options, userId) => {
      const slug = item.slug || item.system?.slug
      if (
         item.type === "condition" &&
         slug === "dead" &&
         item.parent instanceof Actor
      ) {
         if (game.user.isGM && game.user.id === game.users.activeGM?.id) {
            await dropLootForActor(item.parent)
         }
      }

      if (!item.parent || !(item.parent instanceof Actor)) return
      const actor = item.parent
      const lootEnabled = game.settings.get(
         MODULE_ID,
         SETTINGS.LOOT_DROP_ENABLE,
      )

      if (
         actor.type === "loot" &&
         actor.getFlag(MODULE_ID, "isDropLoot") &&
         lootEnabled
      ) {
         updateAllPixiBeams()

         const highest = getHighestRarity(actor, allRarities)
         let soundToPlay = game.settings.get(
            MODULE_ID,
            SETTINGS.LOOT_DEFAULT_DROP_SOUND,
         )

         if (highest && highest.data.dropSound)
            soundToPlay = highest.data.dropSound

         const dropSoundEnabled = game.settings.get(
            MODULE_ID,
            SETTINGS.LOOT_DROP_SOUND_ENABLE,
         )

         if (soundToPlay && dropSoundEnabled) {
            const now = Date.now()
            if (now - lastDropSoundTime > 1000) {
               lastDropSoundTime = now
               AudioHelper.play(
                  { src: soundToPlay, volume: 0.8, autoplay: true },
                  false,
               )
            }
         }
         return
      }

      const playInventorySound = game.settings.get(
         MODULE_ID,
         SETTINGS.PLAY_SOUND_INVENTORY,
      )
      if (playInventorySound && actor.type !== "loot") {
         if (userId !== game.user.id) return
         const rarity = item.system?.traits?.rarity || "common"
         const soundPath = allRarities[rarity]?.sound
         if (soundPath)
            AudioHelper.play(
               { src: soundPath, volume: 0.8, autoplay: true },
               false,
            )
      }
   })

   Hooks.on("updateItem", async (item, update, options, userId) => {
      if (game.user.isGM && game.user.id === game.users.activeGM?.id) {
         const actor = item.parent
         if (
            actor &&
            actor.type === "loot" &&
            actor.getFlag(MODULE_ID, "isDropLoot")
         ) {
            await checkAndDeleteEmptyLoot(actor)
         }
      }

      if (item.parent && item.parent.type === "loot") updateAllPixiBeams()
   })

   Hooks.on("deleteItem", async (item, options, userId) => {
      if (game.user.isGM && game.user.id === game.users.activeGM?.id) {
         const slug = item.slug || item.system?.slug
         if (
            item.type === "condition" &&
            slug === "dead" &&
            item.parent instanceof Actor
         ) {
            await item.parent.setFlag(MODULE_ID, "lootDropped", false)
         }

         const actor = item.parent
         if (
            actor &&
            actor.type === "loot" &&
            actor.getFlag(MODULE_ID, "isDropLoot")
         ) {
            await checkAndDeleteEmptyLoot(actor)
         }
      }

      if (item.parent && item.parent.type === "loot") updateAllPixiBeams()
   })

   const applyItemPilesRarity = (...args) => {
      let htmlEl = null
      let targetItem = null

      args.forEach((arg) => {
         if (arg instanceof HTMLElement) htmlEl = arg
         else if (arg && arg.jquery) htmlEl = arg[0]
         else if (arg && typeof arg === "object") {
            const possibleItem = arg.item || arg.vaultItem || arg
            if (
               possibleItem.documentName === "Item" ||
               (possibleItem.type && possibleItem.system)
            ) {
               targetItem = possibleItem
            }
         }
      })

      if (!htmlEl || !targetItem) return

      const rarity = targetItem.system?.traits?.rarity || "common"
      const customData = allRarities[rarity]
      if (!customData) return

      const $el = $(htmlEl)

      let titleEl = $el
         .find(
            ".item-piles-name, .item-piles-text, .item-piles-title, .item-name",
         )
         .first()
      if (!titleEl.length && $el.is("[class*='-name'], [class*='-title']"))
         titleEl = $el

      let imageEl = $el
         .find(".item-piles-img-container, .item-piles-image, .item-image, img")
         .first()
      if (
         !imageEl.length &&
         $el.is("img, [class*='-image'], [class*='-img-container']")
      )
         imageEl = $el
      if (!imageEl.length) imageEl = $el

      if (titleEl.length) {
         titleEl.css("color", customData.color)
         titleEl.css("text-shadow", getShadow(customData))
      }

      if (imageEl.length) {
         const useGlobalInset = game.settings.get(
            MODULE_ID,
            SETTINGS.GLOBAL_INSET_SHADOW,
         )

         imageEl.removeClass((index, className) => {
            return (
               className.match(/\baztec-(effect|global-inset)\S*/g) || []
            ).join(" ")
         })

         if (useGlobalInset) imageEl.addClass(`aztec-global-inset-${rarity}`)
         if (customData.iconEffect && customData.iconEffect !== "none") {
            imageEl.addClass(`aztec-effect-${customData.iconEffect}-${rarity}`)
         }
      }

      $el.find("span").each((_, span) => {
         const $span = $(span)
         if ($span.text().trim().toLowerCase() === rarity.toLowerCase()) {
            $span.text(customData.label) // Replace with "Well-Made"
            $span.css("color", customData.color) // Colorize it!
            $span.css("text-shadow", getShadow(customData))
         }
      })
   }

   Hooks.on("item-piles-renderPileItem", applyItemPilesRarity)
   Hooks.on("item-piles-renderMerchantItem", applyItemPilesRarity)

   Hooks.on("renderVaultApp", (app, htmlData) => {
      const targetNode = app.element
         ? app.element[0]
         : htmlData instanceof HTMLElement
           ? htmlData
           : htmlData[0]
      if (!targetNode) return

      setTimeout(() => {
         const useGlobalInset = game.settings.get(
            MODULE_ID,
            SETTINGS.GLOBAL_INSET_SHADOW,
         )

         const actorId = app.actor?.id || app.options?.svelte?.props?.actor?._id
         const actor = game.actors.get(actorId)
         if (!actor) return

         for (let gridItem of targetNode.querySelectorAll(".grid-item")) {
            const itemName = gridItem.getAttribute("data-fast-tooltip")
            if (!itemName) continue

            if (gridItem.dataset.aztecProcessed === itemName) continue

            const item = actor.items.find((i) => i.name === itemName)
            if (!item) continue

            const rarity = item.system?.traits?.rarity || "common"
            const customData = allRarities[rarity]
            if (!customData) continue

            gridItem.className = gridItem.className
               .replace(/\baztec-(effect|global-inset)\S*/g, "")
               .trim()

            if (useGlobalInset)
               gridItem.classList.add(`aztec-global-inset-${rarity}`)
            if (customData.iconEffect && customData.iconEffect !== "none") {
               gridItem.classList.add(
                  `aztec-effect-${customData.iconEffect}-${rarity}`,
               )
            }

            gridItem.dataset.aztecProcessed = itemName
         }
      }, 50)
   })

   Hooks.on("closeActorSheet", (app) => {
      if (app.actor?.type === "loot") app._aztecOpenSoundPlayed = false
   })

   Hooks.on("renderActorSheet", (app, html, data) => {
      const useGlobalInset = game.settings.get(
         MODULE_ID,
         SETTINGS.GLOBAL_INSET_SHADOW,
      )

      if (app.actor?.type === "loot" && !app._aztecOpenSoundPlayed) {
         app._aztecOpenSoundPlayed = true
         const lootEnabled = game.settings.get(
            MODULE_ID,
            SETTINGS.LOOT_DROP_ENABLE,
         )

         const openSoundEnabled = game.settings.get(
            MODULE_ID,
            SETTINGS.LOOT_OPEN_SOUND_ENABLE,
         )

         if (lootEnabled && openSoundEnabled) {
            const openSound = game.settings.get(
               MODULE_ID,
               SETTINGS.LOOT_DEFAULT_OPEN_SOUND,
            )
            if (openSound)
               AudioHelper.play(
                  { src: openSound, volume: 0.8, autoplay: true },
                  false,
               )
         }
      }

      const raritySelect = html.find(
         'select[data-property="system.traits.rarity"], select[name="system.traits.rarity"], select[name="system.traits.rarity.value"]',
      )
      for (const key of Object.keys(customs))
         raritySelect.find(`option[value="${key}"]`).remove()

      const strikes = app.actor?.system?.actions || []
      html.find(".strikes-list .strike").each((_, el) => {
         const actionIndex = $(el).data("action-index")
         const strike = strikes[actionIndex]
         if (!strike || !strike.item) return

         const rarity = strike.item.system?.traits?.rarity || "common"
         if (allRarities[rarity]) {
            const customData = allRarities[rarity]
            const titleEl = $(el).find(".name a")
            titleEl.css("color", customData.color)
            titleEl.css("text-shadow", getShadow(customData))
         }
      })

      html.find("li[data-item-id]").each((_, el) => {
         const itemId = $(el).data("item-id")
         const item = app.actor.items.get(itemId)
         if (!item) return

         const rarity = item.system?.traits?.rarity || "common"
         if (allRarities[rarity]) {
            const customData = allRarities[rarity]
            const titleEl = $(el).find(".item-name h4")
            const imageEl = $(el).find(".item-image")

            titleEl.css("color", customData.color)
            titleEl.css("text-shadow", getShadow(customData))

            if (useGlobalInset) imageEl.addClass(`aztec-global-inset-${rarity}`)
            if (customData.iconEffect && customData.iconEffect !== "none") {
               imageEl.addClass(
                  `aztec-effect-${customData.iconEffect}-${rarity}`,
               )
            }
         }
      })
   })

   Hooks.on("renderItemSheet", (app, html, data) => {
      const useGlobalInset = game.settings.get(
         MODULE_ID,
         SETTINGS.GLOBAL_INSET_SHADOW,
      )

      if (!PHYSICAL_ITEM_TYPES.includes(app.item.type)) {
         const raritySelect = html.find(
            'select[data-property="system.traits.rarity"], select[name="system.traits.rarity"]',
         )
         for (const key of Object.keys(customs))
            raritySelect.find(`option[value="${key}"]`).remove()
         return
      }

      const rarity = app.item.system.traits?.rarity || "common"
      if (allRarities[rarity]) {
         const customData = allRarities[rarity]
         const titleInput = html.find('input[name="name"]')

         titleInput.css("color", customData.color)
         titleInput.css("text-shadow", getShadow(customData))

         if (
            (customData.iconEffect && customData.iconEffect !== "none") ||
            useGlobalInset
         ) {
            const sheetImg = html.find(".sheet-header img")
            if (sheetImg.length) {
               if (!sheetImg.parent().hasClass("aztec-icon-wrapper")) {
                  sheetImg.wrap(
                     '<div class="aztec-icon-wrapper" style="display: block; flex: 0 0 64px; width: 64px; min-width: 64px; max-width: 64px; height: 64px; min-height: 64px; max-height: 64px; margin-right: 0.5rem; border-radius: 4px; position: relative; box-sizing: border-box;"></div>',
                  )
                  sheetImg.css({
                     width: "100%",
                     height: "100%",
                     "max-width": "100%",
                     "max-height": "100%",
                     margin: "0",
                     padding: "0",
                     border: "none",
                     display: "block",
                     "object-fit": "cover",
                     "border-radius": "2px",
                  })
               }
               if (useGlobalInset)
                  sheetImg
                     .parent()
                     .addClass(`aztec-global-inset-large-${rarity}`)
               if (customData.iconEffect && customData.iconEffect !== "none") {
                  sheetImg
                     .parent()
                     .addClass(
                        `aztec-effect-${customData.iconEffect}-${rarity}`,
                     )
               }
            }
         }
      }
   })

   Hooks.on("renderChatMessage", (message, html, data) => {
      const item = message.item
      if (!item) return

      const useGlobalInset = game.settings.get(
         MODULE_ID,
         SETTINGS.GLOBAL_INSET_SHADOW,
      )

      const rarity = item.system?.traits?.rarity || "common"
      if (allRarities[rarity]) {
         const customData = allRarities[rarity]
         const titleEl = html.find(
            ".flavor-text h4.action, .pf2e.chat-card .card-header h3",
         )

         titleEl.css("color", customData.color)
         titleEl.css("text-shadow", getShadow(customData))

         if (
            (customData.iconEffect && customData.iconEffect !== "none") ||
            useGlobalInset
         ) {
            const chatImg = html.find(".pf2e.chat-card .card-header img")
            if (chatImg.length) {
               if (!chatImg.parent().hasClass("aztec-icon-wrapper")) {
                  chatImg.wrap(
                     '<div class="aztec-icon-wrapper" style="display: block; flex: 0 0 2.2em; width: 2.2em; min-width: 2.2em; max-width: 2.2em; height: 2.2em; min-height: 2.2em; max-height: 2.2em; margin: 1px 8px 1px 2px; border-radius: 4px; position: relative; box-sizing: border-box;"></div>',
                  )
                  chatImg.css({
                     width: "100%",
                     height: "100%",
                     "max-width": "100%",
                     "max-height": "100%",
                     margin: "0",
                     padding: "0",
                     border: "none",
                     display: "block",
                     "object-fit": "cover",
                     "border-radius": "2px",
                  })
               }
               if (useGlobalInset)
                  chatImg.parent().addClass(`aztec-global-inset-${rarity}`)
               if (customData.iconEffect && customData.iconEffect !== "none") {
                  chatImg
                     .parent()
                     .addClass(
                        `aztec-effect-${customData.iconEffect}-${rarity}`,
                     )
               }
            }
         }
      }
   })

   Hooks.on("renderIdentifyItemPopup", (app, html, data) => {
      const item = app.item || app.object || data.object
      if (!item) return

      const rarity = item.system?.traits?.rarity || "common"
      const customs =
         game.settings.get(MODULE_ID, SETTINGS.CUSTOM_RARITIES) || {}

      const modifier = customs[rarity]?.dcMod || 0
      if (modifier === 0) return

      if (app.dcs) {
         for (const [skill, dc] of Object.entries(app.dcs)) {
            app.dcs[skill] = dc + modifier
         }
      }

      html.find("[data-dc]").each((_, el) => {
         const $el = $(el)
         const oldDC = parseInt($el.attr("data-dc"), 10)
         if (!isNaN(oldDC)) {
            const newDC = oldDC + modifier
            $el.attr("data-dc", newDC)
            const originalText = $el.text()
            $el.text(originalText.replace(oldDC.toString(), newDC.toString()))
         }
      })
   })
}
