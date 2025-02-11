'use strict'

import {recuperarEventos, generarListadoEventos, estilarBotonesPrecio} from "./modules/helper.js";

//----------------------------- GLOBAL ------------------------------------

const listadoDiv = $('#eventos');
const numEventosGenerales = 100;
let pag = 1
const endpointTodosEventos = 'https://api.euskadi.eus/culture/events/v1.0/events/upcoming';


// Se determina el precio tope

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const topeUrl = urlParams.get('top');

if(topeUrl != null) sessionStorage.setItem('precioTope', topeUrl);
const topeStorage = sessionStorage.getItem('precioTope');
const precioTope = topeStorage != null ? topeStorage : 5;



//----------------------- PUNTO DE ENTRADA -------------------------------

$(document).ready(function() {

  // Se estilan los filtros de precio según el precio elegido
  estilarBotonesPrecio(precioTope);

  // Se recogen los eventos y se pinta el listado
  cargarEventos();
})


//---------------------------- FUNCIONES -----------------------------------

function cargarEventos() {

  // Si existe, oculta la fila del botón "MAS EVENTOS"
  $('#fila-mas').remove();

  // Muestra el loading
  listadoDiv.append($('<div class="contenedor-loading">CARGANDO...</div>'));

  recuperarEventos(endpointTodosEventos, precioTope, numEventosGenerales, pag)
    .then(function(eventosModel) {
      
      let eventosAMostrar = new Array();

      for (const eventoModel of eventosModel) eventosAMostrar.push(eventoModel);
      
      // Oculta el loading
      $('.contenedor-loading').remove();

      const listadoAMostrar = generarListadoEventos(eventosAMostrar);
      listadoDiv.append(listadoAMostrar);

      $('#footer').removeAttr('hidden')

      listadoDiv.append($('<div id="fila-mas" class="row my-5"><div class="col text-center"><button id="mas" class="btn btn-outline-info boton-info">MÁS EVENTOS</button></div></div>'))

      pag++;
      registrarOyentes();
    })
    .catch(function(error) {
      console.log('Se ha encontrado un error al cargar los datos<br>[' + error + ']');
    })
}


function registrarOyentes() {
  $("button[id!='mas']").click(function() {
    console.log(this.id);
    window.location.assign('html/detalle.html?id=' + this.id);
  })

  $("#mas").click(cargarEventos);
}