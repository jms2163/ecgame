import BootstrapUI from "./BootstrapUI.js";


const Bootstrap = {

    async initialize(){

        BootstrapUI.initialize();

        BootstrapUI.mark("Bootstrap loaded");

        BootstrapUI.ready();

    }

};


export default Bootstrap;
