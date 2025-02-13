'use strict'

// Clase modelo de evento

class EventoModel {

    constructor(
        id, descripcion, fechaFin, fechaIni, fuente, fuenteUrl, horarioApertura, 
        imagenes, latitud, local, localidad, longitud, nombre, precio, 
        tipo, tipoNombre
    ) {

        this.id = id;
        this.descripcion = descripcion;
        this.fechaFin = new Date(fechaFin);
        this.fechaIni = new Date(fechaIni);
        this.fuente = fuente;
        this.fuenteUrl = fuenteUrl;
        this.horarioApertura = horarioApertura;
        this.imagenes = imagenes;
        this.latitud = latitud;
        this.local = local;
        this.localidad = localidad;
        this.longitud = longitud;
        this.nombre = nombre;
        this.precio = precio;
        this.tipo = tipo;
        this.tipoNombre = tipoNombre
    }

    convertToJson() {
        const serializado = JSON.stringify(this);

        return serializado;
    }
}

export default EventoModel;