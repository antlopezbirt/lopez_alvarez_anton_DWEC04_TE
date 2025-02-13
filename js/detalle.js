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

// Se determina el precio tope
const topeUrl = urlParams.get('top');
if(topeUrl != null) sessionStorage.setItem('precioTope', topeUrl);
const topeStorage = sessionStorage.getItem('precioTope');
const precioTope = topeStorage != null ? topeStorage : 5;

// Constantes de la Meteo
const endpointMeteo = 'https://api.open-meteo.com/v1/forecast';
const datosHourlyMeteo = 'temperature_2m,precipitation_probability,weather_code';
const rutaFicheroMeteo = '../data/codigos-meteo.json';
let codigosMeteo = null;



//--------------------------- PUNTO DE ENTRADA --------------------------------

$(document).ready(function() {

  // Carga el fichero de códigos meteorológicos

  $.getJSON(rutaFicheroMeteo, function(data) {
    codigosMeteo = data;
    });

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
      //window.alert('No se han encontrado eventos con ese identificador');
      //window.location.assign('../index.html');
    })
})


//----------------------------- FUNCIONES -------------------------------------

function mostrarEvento(evento) {

  // Oculta el loading
  $('.contenedor-loading').css("display", "none");

  // Pinta la maquetacion

  eventoDiv.append('<div id="info" class="row"></div>');
  eventoDiv.append('<div id="grafismos" class="col-sm-12 col-md-6 py-3"></div>');
  $('#grafismos').append('<div id="fotos" class="row"></div>');
  $('#fotos').append('<div id="imagenes" class="col-12 py-3"></div>');
  $('#grafismos').append('<div id="meteo" class="row"></div>');
  $('#meteo').append('<div id="prevision-meteo" class="col-12 py-3"></div>');

  // Si el evento viene sin imagen se coloca una imagen generica
  const imagenUrl = evento.imagenes.length > 0 ? evento.imagenes[0].imageUrl : '../img/imagen-placeholder.jpg';

  $('#imagenes').append('<img src="' + imagenUrl + '" class="img-fluid rounded mx-auto mb-3 d-block">');

  // Si no hay hora se asume que es a las 20:00 a efectos de meteorologia

  const hora = evento.horarioApertura == null ? '20:00' : evento.horarioApertura;
  let timeStampMeteo = new Date(evento.fechaIni);
  const arrayHora = hora.split(":");

  timeStampMeteo.setHours(arrayHora[0]);
  timeStampMeteo.setMinutes(arrayHora[1]);
  timeStampMeteo = timeStampMeteo.toISOString(); // Sale una hora GMT
  timeStampMeteo = timeStampMeteo.substring(0, 16);

  recuperarMeteo(endpointMeteo, evento.latitud, evento.longitud, datosHourlyMeteo, timeStampMeteo)
    .then(function(datosMeteo) {

      $('#prevision-meteo').append('<div class="h5">Previsión meteorológica del evento</div>');
      $('#prevision-meteo').append('<img style="background-color: black" src="' + codigosMeteo[datosMeteo.hourly.weather_code].day.image + '">');
      $('#prevision-meteo').append('<p>Probabilidad de lluvia: ' + datosMeteo.hourly.precipitation_probability + '%</p>');
      $('#prevision-meteo').append('<p>Temperatura: ' + datosMeteo.hourly.temperature_2m + '°C</p>');
      


    })



  
  // REQUISITO: uso de JS nativo (para crear la tarjeta de descripcion)

  const contenedorTarjeta = document.createElement('div');
  contenedorTarjeta.classList.add('col-sm-12', 'col-md-6', 'py-3');

  const tarjeta = document.createElement('div');
  tarjeta.classList.add('card', 'py-3');

  const cuerpoTarjeta = document.createElement('div');
  cuerpoTarjeta.classList.add('card-body');

  const parrafoNombre = document.createElement('p');
  parrafoNombre.classList.add('card-title', 'h4', 'text-center', 'mb-4');
  parrafoNombre.innerText = evento.nombre;


  // Lista de datos en caja

  const listaDatos = document.createElement('ul');
  listaDatos.classList.add('list-group', 'mb-4');


  const itemFecha = document.createElement('li');
  itemFecha.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'list-group-item-primary');

  const contenedorFecha = document.createElement('div');
  contenedorFecha.classList.add('ms-2', 'me-auto');

  const spanFecha = document.createElement('span');
  spanFecha.classList.add('fw-bold');
  spanFecha.innerText = 'Fecha: ';

  contenedorFecha.append(spanFecha);
  contenedorFecha.append(evento.fechaIni.toLocaleDateString());

  itemFecha.append(contenedorFecha);

  
  const itemHora = document.createElement('li');
  itemHora.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'list-group-item-primary');

  const contenedorHora = document.createElement('div');
  contenedorHora.classList.add('ms-2', 'me-auto');

  const spanHora = document.createElement('span');
  spanHora.classList.add('fw-bold');
  spanHora.innerText = 'Hora: ';

  contenedorHora.append(spanHora);
  contenedorHora.append(evento.horarioApertura);

  itemHora.append(contenedorHora);


  const itemLugar = document.createElement('li');
  itemLugar.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'list-group-item-primary');

  const contenedorLugar = document.createElement('div');
  contenedorLugar.classList.add('ms-2', 'me-auto');

  const spanLugar = document.createElement('span');
  spanLugar.classList.add('fw-bold');
  spanLugar.innerText = 'Lugar: ';

  contenedorLugar.append(spanLugar);
  contenedorLugar.append(evento.local + ' (' + evento.localidad + ')');

  itemLugar.append(contenedorLugar);


  const itemPrecio = document.createElement('li');
  itemPrecio.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'list-group-item-primary');

  const contenedorPrecio = document.createElement('div');
  contenedorPrecio.classList.add('ms-2', 'me-auto');

  const spanPrecio = document.createElement('span');
  spanPrecio.classList.add('fw-bold');
  spanPrecio.innerText = 'Precio: ';

  contenedorPrecio.append(spanPrecio);
  contenedorPrecio.append(evento.precio);

  itemPrecio.append(contenedorPrecio);

  listaDatos.append(itemFecha, itemHora, itemLugar, itemPrecio);



  const parrafoTituloDescripcion = document.createElement('p');
  parrafoTituloDescripcion.classList.add('text-center', 'h5', 'mb-3');
  parrafoTituloDescripcion.innerText = 'Descripción';


  const parrafoDescripcion = document.createElement('p');
  parrafoDescripcion.innerHTML= evento.descripcion;




  cuerpoTarjeta.append(parrafoNombre, listaDatos, parrafoTituloDescripcion, parrafoDescripcion);
  
  if(evento.fuenteUrl != null) {
    const enlaceMasInfo = document.createElement('a');
    enlaceMasInfo.classList.add('btn', 'btn-outline-info', 'boton-info', 'w-100');
    enlaceMasInfo.setAttribute('href', evento.fuenteUrl);
    enlaceMasInfo.setAttribute('target', '_blank');
    enlaceMasInfo.innerText = 'Visitar fuente original';

    cuerpoTarjeta.append(enlaceMasInfo);
  }

  tarjeta.append(cuerpoTarjeta);

  contenedorTarjeta.append(tarjeta);

  $('#info').append(contenedorTarjeta);

  /* $('#info').append(
    '<div class="col-sm-12 col-md-6 py-3">'
      + '<div class="card py-3">'
          + '<div class="card-body">'
              + '<p class="card-title h4 text-center mb-4">' + evento.nombre + '</p>'
              + '<ul class="list-group mb-4">'
                  + '<li class="list-group-item d-flex justify-content-between align-items-start list-group-item-primary"><div class="ms-2 me-auto"><span class="fw-bold">Fecha:</span> ' + evento.fechaIni.toLocaleDateString() + '</div></li>'
                  + '<li class="list-group-item d-flex justify-content-between align-items-start list-group-item-primary"><div class="ms-2 me-auto"><span class="fw-bold">Hora:</span> ' + evento.horarioApertura + '</div></li>'
                  + '<li class="list-group-item d-flex justify-content-between align-items-start list-group-item-primary"><div class="ms-2 me-auto"><span class="fw-bold">Lugar:</span> ' + evento.local + ' (' + evento.localidad + ')</div></li>'
                  + '<li class="list-group-item d-flex justify-content-between align-items-start list-group-item-primary"><div class="ms-2 me-auto"><span class="fw-bold">Precio:</span> ' + evento.precio + '</div></li>'
              + '</ul>'
              + '<h5 class="text-center">Descripción</h5>'
              + '<p>' + evento.descripcion + '</p><a class="btn btn-outline-info w-100 boton-info" href="' + evento.fuenteUrl + '" target="_blank">Visitar fuente original</a>'
          + '</div>'
        + '</div>'
    + '</div>'
  ); */

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


// Devuelve una promesa con eventos recuperados de la API y modelados

function recuperarMeteo(endpoint, latitud, longitud, datosHourly, timeStampMeteo) {

  return new Promise(function(resolve, reject) {

    // Ataca a la API y le pide los datos
    $.ajax({
      url: endpoint, 
      data: {
        latitude: latitud, longitude: longitud, 
        hourly: datosHourly,
        start_hour: timeStampMeteo,
        end_hour: timeStampMeteo
      },

      cache: true,
      success: function(data) {


        // Si hay mas de un evento llega en un array llamado "items", se itera para modelarlo
        if (data.hasOwnProperty('hourly')) {

          // Resuelve la promesa con los datos que interesa
          resolve(data);
        
        // 
        } else {
          
          resolve(eventoModelado);
        }
      },
      error: function(error) {
        reject(error);
      }
    });
  })
}