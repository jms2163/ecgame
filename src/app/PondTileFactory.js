// --------------------------------------------------
// PondTileFactory.js
// Creates environmental tiles for the Pond world
// --------------------------------------------------

const PondTileFactory = {

    create(x, y) {

        return {

            x,
            y,

            biome: "open_water",
            
            microbiomes: {
                background: "open_water",
                substrate: null,
                overlay: null
            },

            physics: {
                temperature: 25.0,
                light: 0.8,
                oxygen: 0.8,
                ph: 7.0,
                pressure: 1.0,
                uv: 0.05
            },

            chemistry: {

                nutrients: {
                    glucose: 10,
                    nitrates: 5,
                    phosphates: 2
                },

                signals: {
    folate: 0.0,
    n_formyl_peptides: 0.0,
    scfa: 0.0,
    camp: 0.0,
    cyanotoxins: 0.0,
    ammonia: 0.0
},

                toxins: {
                    h2o2: 0.0,
                    ammonia: 0.01
                },

                buffers: {
                    bicarbonate: 1.0
                }

            },

            hazards: [],
            entities: [],
            discovered: false,
            observed: false

        };

    }

};

export default PondTileFactory;