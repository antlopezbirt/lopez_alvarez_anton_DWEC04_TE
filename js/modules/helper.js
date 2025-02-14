'use strict'

// Se importa el modelo para modelar los datos que se reciban

import EventoModel from "../../models/EventoModel.js";


//---------- FUNCIONES A IMPORTAR POR EL FLUJO PRINCIPAL ----------


// Devuelve una promesa con eventos recuperados de la API y modelados

function recuperarEventos(endpoint, precioTope, territorio, numEventos, pag, idEvento = null) {

  if(idEvento != null) endpoint += idEvento;

  return new Promise(function(resolve, reject) {

    // Ataca a la API y le pide los datos
    $.ajax({
      url: endpoint, 
      data: {_elements: numEventos, _page: pag},
      cache: true,
      success: function(data) {

        // Requisito: modela los datos recibidos y los acumula en un array

        // Si hay mas de un evento llega en un array llamado "items", se itera para modelarlo
        if (data.hasOwnProperty('items')) {

          let eventoModelArray = new Array();

          for (const evento of data.items) {

            // Se descartan los que no cumplan con el precio máximo
            if((parseInt(evento.priceEs) <= precioTope || evento.priceEs == 'Gratis') && (territorio == 0 || evento.provinceNoraCode == territorio)) {
              const eventoModelado = new EventoModel(
                evento.id, evento.descriptionEs, evento.endDate, evento.startDate,
                evento.sourceNameEs, evento.sourceUrlEs, evento.openingHoursEs,
                evento.images, evento.municipalityLatitude, evento.establishmentEs,
                evento.municipalityEs, evento.municipalityLongitude, evento.nameEs,
                evento.priceEs, evento.type, evento.typeEs
              )

              eventoModelArray.push(eventoModelado);
            }
          }

          // Resuelve la promesa con los datos modelados
          resolve(eventoModelArray);
        
        // Si solo hay un item, se considera que cumple con el precio y se modela tal cual y se devuelve
        } else {
          const eventoModelado = new EventoModel(
            data.id, data.descriptionEs, data.endDate, data.startDate,
            data.sourceNameEs, data.sourceUrlEs, data.openingHoursEs,
            data.images, data.municipalityLatitude, data.establishmentEs,
            data.municipalityEs, data.municipalityLongitude, data.nameEs,
            data.priceEs, data.type, data.typeEs
          )
          resolve(eventoModelado);
        }
      },
      error: function(error) {
        reject(error);
      }
    });
  })
}



// Recibe un array de modelos de evento y devuelve un array de elementos HTML

function generarListadoEventos(eventosModel) {

  let listadoEventos = new Array();

  eventosModel.forEach(evento => {

    // Si el evento viene sin imagen se coloca una imagen generica
    const imagenUrl = evento.imagenes.length > 0 ? evento.imagenes[0].imageUrl : './img/imagen-placeholder.jpg';

    // Requisito: uso de JS nativo (para crear elementos)

    const contenedorTarjeta = document.createElement('div');
    contenedorTarjeta.classList.add('col-sm-12', 'col-md-6', 'col-lg-4', 'py-3');

    const tarjeta = document.createElement('div');
    tarjeta.classList.add('card');

    const badgePrecio = document.createElement('span');
    badgePrecio.classList.add('badge', 'badge-precio');
    badgePrecio.innerText = evento.precio.toUpperCase();

    const imagenTarjeta = document.createElement('img');
    imagenTarjeta.classList.add('card-img-top')
    imagenTarjeta.setAttribute('src', imagenUrl);
    imagenTarjeta.setAttribute('loading', 'lazy');

    const badgeTipoEvento = document.createElement('span');
    badgeTipoEvento.classList.add('badge', 'badge-tipo--' + evento.tipo);
    badgeTipoEvento.innerText = evento.tipoNombre;

    const cuerpoTarjeta = document.createElement('div');
    cuerpoTarjeta.classList.add('card-body', 'position-relative');

    const parrafoTitulo = document.createElement('p');
    parrafoTitulo.classList.add('card-title', 'h6', 'text-center', 'mt-2');
    parrafoTitulo.innerText = evento.nombre;

    const parrafoInfo = document.createElement('p');
    parrafoInfo.classList.add('text-center');
    parrafoInfo.innerHTML = evento.fechaIni.toLocaleDateString();
    
    // Si el evento dura más de un día se añade la fecha de fin
    if (evento.fechaFin != null && evento.fechaFin != evento.fechaIni) {
      parrafoInfo.innerHTML += (' - ' + evento.fechaFin.toLocaleDateString());
    }
    
    if (evento.horarioApertura != null) parrafoInfo.innerHTML += ' - ' + evento.horarioApertura; 
    
    parrafoInfo.innerHTML += '<br>' + evento.localidad;
    
    const botonMasInfo = document.createElement('button');
    botonMasInfo.classList.add('btn', 'btn-outline-info', 'boton-info', 'w-100');
    botonMasInfo.setAttribute('id', evento.id);
    botonMasInfo.setAttribute('type', 'button');
    botonMasInfo.innerText = '+INFO';

    cuerpoTarjeta.append(badgeTipoEvento, parrafoTitulo, parrafoInfo, botonMasInfo);

    tarjeta.append(badgePrecio, imagenTarjeta, cuerpoTarjeta);

    contenedorTarjeta.append(tarjeta);

    listadoEventos.push(contenedorTarjeta);
  });

  return listadoEventos;
}


// Estila los botones de precio tope

function estilarBotonesPrecio(precioTope) {
  const botonesPrecio = $("[id^='precio']");
  for(const boton of botonesPrecio) {

    if(boton.id.replace("precio", "") == precioTope) {
      boton.classList.add('btn-success');
      boton.classList.remove('btn-outline-success');
    } else {
      boton.classList.add('btn-outline-success');
      boton.classList.remove('btn-success');
    }
  }
}


// Selecciona el territorio en el select

function seleccionarTerritorio(territorio) {
  const opcion = $("#territorio" + territorio);
  
  opcion.prop('selected', true);
}


export { recuperarEventos, generarListadoEventos, estilarBotonesPrecio, seleccionarTerritorio };