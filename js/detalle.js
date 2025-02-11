'use strict'

import {recuperarEventos, generarListadoEventos, estilarBotonesPrecio} from "./modules/helper.js";

//---------------------------------- GLOBAL -----------------------------------

const eventoDiv = $('#evento');
const numEventosRelacionados = 200;
let pag = 1
const endpointTodosEventos = 'https://api.euskadi.eus/culture/events/v1.0/events/upcoming/';
const endpointUnEvento = 'https://api.euskadi.eus/culture/events/v1.0/events/'

// Se obtiene el ID del evento a detallar
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const eventoId = urlParams.get('id');

// Si no hay ID se redirecciona al index
if(eventoId == null) {
  window.alert('No se ha encontrado el identificador del evento');
  window.location.assign('../index.html');
}

// Se determina el precio tope
const topeUrl = urlParams.get('top');
if(topeUrl != null) sessionStorage.setItem('precioTope', topeUrl);
const topeStorage = sessionStorage.getItem('precioTope');
const precioTope = topeStorage != null ? topeStorage : 5;


//--------------------------- PUNTO DE ENTRADA --------------------------------

$(document).ready(function() {

  // Se estilan los filtros de precio según el precio elegido

  estilarBotonesPrecio(precioTope);

  // Muestra el loading

  eventoDiv.append($('<div class="contenedor-loading">CARGANDO...</div>'));

  recuperarEventos(endpointUnEvento, precioTope, 1, pag, eventoId)
    .then(function(eventoModel) {
      mostrarEvento(eventoModel);
      recuperarEventos(endpointTodosEventos, precioTope, numEventosRelacionados, pag)
      .then(function(eventosModel) {
        mostrarRelacionados(eventosModel, eventoModel.id, eventoModel.tipo)
        registrarOyentes();
      })
      .catch(function(error) {
        console.log(error);
      })
    })
    .catch(function(error) {
      console.log(error);
    })
})


//----------------------------- FUNCIONES -------------------------------------

function mostrarEvento(evento) {

  // Oculta el loading
  $('.contenedor-loading').css("display", "none");

  eventoDiv.append('<div id="info" class="row"></div>');

  $('#info').append('<div id="imagenes" class="col-sm-12 col-md-6 py-3"></div>');

  for (const imagen of evento.imagenes) {
    $('#imagenes').append('<img src="' + imagen.imageUrl + '" class="img-fluid rounded mx-auto mb-3 d-block">');
  }

  $('#info').append(
    '<div class="col-sm-12 col-md-6 py-3">'
      + '<div class="card py-3">'
          + '<span class="badge badge-precio">' + evento.precio + '</span>'
          + '<div class="card-body">'
              + '<h5 class="card-title">' + evento.nombre + '</h5>'
              + '<p><ul><li>Fecha: ' + evento.fechaIni.toLocaleDateString() + '</li>'
                  + ''
                  + '<li>Hora: ' + evento.horarioApertura + '</li>'
                  + '<li>Lugar: ' + evento.local + ' (' + evento.localidad + ')</li>'
              + '</ul></p><p>' + evento.descripcion + '</p><button id="' + evento.id +'" type="button" class="btn btn-outline-info w-100">Ver info</button>'
          + '</div>'
        + '</div>'
    + '</div>'
  );

  // Corrige los iframes demasiados anchos (YouTube, etc.) que vienen en la descripcion
  $('iframe').attr("width", "100%");

  // Se genera y muestra el mapa de Leaflet con las coordenadas del evento

  eventoDiv.append('<div id="mapa" class="row mt-3"><div class="h5">Ubicación:</div></div>');
  $('#mapa').append('<div id="map" class="rounded py-3 my-3"></div></div>');

  var map = L.map('map').setView([evento.latitud, evento.longitud], 15);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  var marker = L.marker([evento.latitud, evento.longitud]).addTo(map);

}


// Muestra un apartado con tres eventos relacionados con el evento detallado

function mostrarRelacionados(eventos, idEvento, tipo) {

  let contador = 0;
  let relacionadosAMostrar = new Array();

  // Se seleccionan tres eventos relacionados (mismo tipo, evitando el que ya se ha mostrado arriba)
  eventos.forEach(evento => {
    if (contador === 3) return;

    if(evento.tipo === tipo && evento.id != idEvento) {
      relacionadosAMostrar.push(evento);
      contador++;
    }
  });

  // Si ha habido ocurrencias, se muestra el apartado
  if(relacionadosAMostrar.length > 0) {
    eventoDiv.append('<div id="relacionados" class="row mt-3"><div class="h5">Eventos relacionados:</div></div>');
    $('#relacionados').append(generarListadoEventos(relacionadosAMostrar))
  }
}

function registrarOyentes() {
  $('button').click(function() {

    window.location.assign('./detalle.html?id=' + this.id);
  })
}