// --------------------------------------------------
// DevConsole.js
// Development-only console access to game systems
// --------------------------------------------------

import GameStateManager from "./GameStateManager.js";
import ZoneManager from "./ZoneManager.js";
import SaveManager from "./SaveManager.js";
import PondWorld from "./PondWorld.js";
import PondController from "./PondController.js";
import PondPerception from "./PondPerception.js";
import PondWorldGenerator from "./PondWorldGenerator.js";

const DevConsole = {

    initialize() {

        window.ECGame = {

            GameStateManager,
            ZoneManager,
            SaveManager,
            PondWorld,
            PondController,
            PondPerception,
            PondWorldGenerator
            

        };

        console.log(
            "DevConsole initialized. Use window.ECGame to access development tools."
        );

    }

};

export default DevConsole;