'use strict'

// Clase modelo de evento

class DatoMeteoModel {

    constructor(
        weatherCode, precipitationProbability, temperature
    ) {
        this.weatherCode = weatherCode;
        this.precipitationProbability = precipitationProbability;
        this.temperature = temperature;
    }

    convertToJson() {
        const serializado = JSON.stringify(this);

        return serializado;
    }
}

export default DatoMeteoModel;