'use strict'

import {recuperarEventos, generarListadoEventos, estilarBotonesPrecio, seleccionarTerritorio} from "./modules/helper.js";

import DatoMeteoModel from "../models/DatoMeteoModel.js";

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

// Se determina el precio tope y el territorio
const topeUrl = urlParams.get('top');
if(topeUrl != null) sessionStorage.setItem('precioTope', topeUrl);
const topeStorage = sessionStorage.getItem('precioTope');
const precioTope = topeStorage != null ? topeStorage : 5;

const territorioUrl = urlParams.get('territorio');
if(territorioUrl != null) sessionStorage.setItem('territorio', territorioUrl);
const territorioStorage = sessionStorage.getItem('territorio');
const territorio = territorioStorage != null ? territorioStorage : 0;

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

  // Se estilan los filtros de precio según el precio elegido y se selecciona el select de territorio

  estilarBotonesPrecio(precioTope);

  seleccionarTerritorio(territorio);



  // Muestra el loading

  eventoDiv.append($('<div class="contenedor-loading">CARGANDO...</div>'));

  recuperarEventos(endpointUnEvento, precioTope, 0, 1, pag, eventoId)
    .then(function(eventoModel) {
      mostrarEvento(eventoModel);
      recuperarEventos(endpointTodosEventos, precioTope, territorio, numEventosRelacionados, pag)
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
  $('#info').append('<div id="grafismos" class="col-sm-12 col-md-6 py-3"></div>');
  $('#grafismos').append('<div id="fotos" class="row"></div>');
  $('#fotos').append('<div id="imagenes" class="col-12 mb-3"></div>');

  // Si el evento viene sin imagen se coloca una imagen generica
  const imagenUrl = evento.imagenes.length > 0 ? evento.imagenes[0].imageUrl : '../img/imagen-placeholder.jpg';

  $('#imagenes').append('<img src="' + imagenUrl + '" class="img-fluid rounded mx-auto mb-3 d-block">');

  // Si no hay hora se asume que es a las 20:00 a efectos de meteorologia

  const regexHora = new RegExp("^\d{2}:\d{2}$");

  const hora = (evento.horarioApertura == null || !regexHora.test(evento.horarioApertura)) ? '20:00' : evento.horarioApertura;
  let timeStampMeteo = new Date(evento.fechaIni);
  const arrayHora = hora.split(":");

  timeStampMeteo.setHours(arrayHora[0]);
  timeStampMeteo.setMinutes(arrayHora[1]);
  timeStampMeteo = timeStampMeteo.toISOString(); // Sale una hora GMT
  timeStampMeteo = timeStampMeteo.substring(0, 16);

  recuperarMeteo(endpointMeteo, evento.latitud, evento.longitud, datosHourlyMeteo, timeStampMeteo)
    .then(function(datoMeteoModelado) {
      $('#grafismos').append('<div id="meteo" class="row px-2"></div>');
      $('#meteo').append('<div id="contenedor-meteo" class="col-12 p-3 border rounded"></div>');
      $('#contenedor-meteo').append('<p class="h5 text-center mb-4">Previsión meteorológica del evento</p>');
      $('#contenedor-meteo').append('<div id="prevision-meteo"></div>');

      $('#prevision-meteo').append('<div id="card-meteo" class="row px-3 mb-2"></div>');
      $('#card-meteo').append('<div class="col-3"><img class="rounded icono-meteo" src="' + codigosMeteo[datoMeteoModelado.weatherCode].day.image + '"></div>');
      $('#card-meteo').append('<div id="body-card-meteo" class="col-9 d-flex flex-column justify-content-center ps-5"></div>');
      $('#body-card-meteo').append('<p><span class="fw-bold">Probabilidad de lluvia: </span>' + datoMeteoModelado.precipitationProbability + '%<br><span class="fw-bold">Temperatura: </span>' + datoMeteoModelado.temperature + '°C</p>');
    })
    .catch(function(error) {
      $('#grafismos').append('<div id="meteo" class="row px-2"></div>');
      $('#contenedor-meteo').html('<p class="h6 m-0 text-center">Datos meteorológicos no disponibles</p>');
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

  // Si el evento dura más de un día se añade la fecha de fin
  if (evento.fechaFin != null && evento.fechaFin.toISOString() != evento.fechaIni.toISOString()) {
    contenedorFecha.append(' - ' + evento.fechaFin.toLocaleDateString());
  }

  itemFecha.append(contenedorFecha);

  listaDatos.append(itemFecha);



  if (evento.horarioApertura != null) {

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
  
    listaDatos.append(itemHora);
  }



  const itemLugar = document.createElement('li');
  itemLugar.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'list-group-item-primary');

  const contenedorLugar = document.createElement('div');
  contenedorLugar.classList.add('ms-2', 'me-auto');

  const spanLugar = document.createElement('span');
  spanLugar.classList.add('fw-bold');
  spanLugar.innerText = 'Lugar: ';

  contenedorLugar.append(spanLugar);

  if(evento.local != null) contenedorLugar.append(evento.local + ' (' + evento.localidad + ')');
  else contenedorLugar.append(evento.localidad);

  itemLugar.append(contenedorLugar);

  listaDatos.append(itemLugar);


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

  listaDatos.append(itemPrecio);


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

  $('#footer').removeAttr('hidden');

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

  $("#selTerritorio").change(function() {
    window.location.assign('../index.html?territorio=' + this.value);
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

        // Si existen los datos se modelan
        if (data.hasOwnProperty('hourly')) {

          const datoMeteoModelado = new DatoMeteoModel(
            data.hourly.weather_code, 
            data.hourly.precipitation_probability, 
            data.hourly.temperature_2m 
          )

          // Resuelve la promesa con los datos modelados
          resolve(datoMeteoModelado);
        
        // Si no se encuentran los datos, se rechaza la promesa
        } else {
          reject();
        }
      },
      error: function(error) {
        reject(error);
      }
    });
  });
}