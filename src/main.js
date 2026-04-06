import { registerSettings } from "./settings.js"
import { injectRarities } from "./logic.js"

Hooks.once("init", () => {
   registerSettings()
   injectRarities()
})
