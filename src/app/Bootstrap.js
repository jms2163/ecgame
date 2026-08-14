// --------------------------------------------------
// Bootstrap.js
// Initializes ECGame in dependency order
// --------------------------------------------------

import GameStateManager
    from "./GameStateManager.js";
import DataLoader from "./DataLoader.js";
import SaveManager from "./SaveManager.js";
import ZoneManager from "./ZoneManager.js";
import NavigationUI from "./NavigationUI.js";
import ZoneCatalog from "./ZoneCatalog.js";
import DevConsole from "./DevConsole.js";
import ResourceManager
    from "./ResourceManager.js";
import QuestManager from "./QuestManager.js";
import QuestDrawerUI
    from "./QuestDrawerUI.js";

const Bootstrap = {

    async initialize() {

        DevConsole.initialize();

        await DataLoader.loadAll();

        GameStateManager.initialize();

        SaveManager.initialize();
        SaveManager.load();

        ResourceManager.initialize();
        QuestManager.initialize();

        ZoneManager.initialize();
        NavigationUI.initialize();
        QuestDrawerUI.initialize();

        const requestedZoneId =
            GameStateManager
                .getCurrentZoneId();

        const initialResult =
            ZoneManager.enterZone(
                requestedZoneId
            );

        if (!initialResult.entered) {
            const fallbackZoneId =
                ZoneCatalog
                    .getDefaultZoneId();

            const fallbackResult =
                ZoneManager.enterZone(
                    fallbackZoneId
                );

            if (!fallbackResult.entered) {
                throw new Error(
                    "ECGame could not activate its default zone"
                );
            }
        }

        NavigationUI.refresh();

        console.log(
            "ECGame bootstrap complete."
        );

        return true;

    }

};

export default Bootstrap;
