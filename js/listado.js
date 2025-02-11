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

  // Muestra el loading

  listadoDiv.append($('<div class="contenedor-loading">CARGANDO...</div>'));


  // Se recogen los eventos y se pinta el listado

  recuperarEventos(endpointTodosEventos, precioTope, numEventosGenerales, pag)
    .then(function(eventosModel) {
      
      let eventosAMostrar = new Array();

      for (const eventoModel of eventosModel) eventosAMostrar.push(eventoModel);
      
      // Oculta el loading
      $('.contenedor-loading').css("display", "none");

      const listadoAMostrar = generarListadoEventos(eventosAMostrar);
      listadoDiv.append(listadoAMostrar);

      registrarOyentes();
    })
    .catch(function(error) {
      console.log(error);
    })
})


//---------------------------- FUNCIONES -----------------------------------

function registrarOyentes() {
  $('button').click(function() {
    console.log(this.id);
    window.location.assign('html/detalle.html?id=' + this.id);
  })
}