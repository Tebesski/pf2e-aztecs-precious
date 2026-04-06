# PF2e Aztec's Precious

A module for PF2e that completely overhauls item rarities and also enables for an animated loot drop.

![managerShowcase](https://github.com/user-attachments/assets/0f402250-c9fb-432d-94d4-b4d3a76f34b8)

![itemsShowcase](https://github.com/user-attachments/assets/3efbca96-1542-46d5-ac81-8662e9077d6f)

Loot drop showcase (with SFX):
https://github.com/user-attachments/assets/62498946-dd76-4baf-b72b-356cccd06a37

## How to Use

To configure your rarities, go to **Game Settings > Aztec's Precious** and click **Open Rarity Manager**. Here you can build custom rarities and also adjust default rarities.
To see the loot system in action reduce an NPC's HP to 0. Their inventory will be automatically moved into a newly spawned token on the map, with SFX and a visual radial beams if enabled.

## Core Features

* **Custom Rarity manager:** Create custom rarities (e.g., Epic, Legendary, Junk), set their UI colors, SFX, VFX, and define DC modifiers for identifying them.
* **Dynamic loot drops:** Automatically drops a token on the map when an actor dies, transferring all their inventory into this token.
* **Loot beams:** Projects a rotating, colored radial beam underneath dropped loot.
* **Custom SFX:** Assign audio files for adding items into the inventory, loot drops, loot token opening. 
* **Item icon and name FX:** Enhances items' icon borders and names with visual effects based on item rarity.
* **Import/Export:** Easily share or back up your custom rarity configurations via JSON.

## Supported Languages

* English
* Русский
* Українська

## Installation

In Foundry VTT, go to the **Add-on Modules** tab, click **Install Module**, and paste the following into the **Manifest URL** field:
`https://github.com/Tebesski/pf2e-aztecs-precious/releases/latest/download/module.json`
