// --------------------------------------------------
// Bootstrap.js
// Initializes ECGame in dependency order
// --------------------------------------------------

import TimeManager from "./TimeManager.js";
import GameStateManager from "./GameStateManager.js";
import DataLoader from "./DataLoader.js";
import SaveManager from "./SaveManager.js";
import ZoneManager from "./ZoneManager.js";
import NavigationUI from "./NavigationUI.js";
import ZoneCatalog from "./ZoneCatalog.js";
import DevConsole from "./DevConsole.js";
import ResourceManager from "./ResourceManager.js";
import QuestManager from "./QuestManager.js";
import QuestDrawerUI from "./QuestDrawerUI.js";
import QuantumAutoCollectorManager from "./QuantumAutoCollectorManager.js";
import AtomizerManager from "./AtomizerManager.js";
import AtomizerUI from "./AtomizerUI.js";
import MoleculeLabManager from "./MoleculeLabManager.js";
import PlayerProfileManager from "./PlayerProfileManager.js";
import PlayerBadgeDrawer from "./PlayerBadgeDrawer.js";


const Bootstrap = {

    async initialize() {

        DevConsole.initialize();

        await DataLoader.loadAll();

        GameStateManager.initialize();

        SaveManager.initialize();
        SaveManager.load();
        PlayerProfileManager.initialize();

        ResourceManager.initialize();
        // Global initialization keeps enabled Quantum
        // autocollectors running in every zone while the
        // game is open.
        QuantumAutoCollectorManager.initialize();
        TimeManager.start();
        QuestManager.initialize();

        ZoneManager.initialize();
        NavigationUI.initialize();
        QuestDrawerUI.initialize();
        PlayerBadgeDrawer.initialize();
        AtomizerManager.initialize();
        AtomizerUI.initialize();
        // Domain initialization is global so timestamp-based
        // synthesis can reconcile even before the zone is opened.
        MoleculeLabManager.initialize();

        const requestedZoneId =
            GameStateManager.getCurrentZoneId();

        const initialResult =
            ZoneManager.enterZone(
                requestedZoneId
            );

        if (!initialResult.entered) {
            const fallbackZoneId =
                ZoneCatalog.getDefaultZoneId();

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
