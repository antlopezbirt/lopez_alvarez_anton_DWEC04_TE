'use strict'

// Global

const eventoDiv = $('#evento');
let eventosGuardados = JSON.parse(localStorage.getItem('eventosSesion'));

const fechaActual = new Date();
const caducidad = 1000 * 60 * 30;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const idEvento = urlParams.get('id');

// Punto de entrada

$(document).ready(function() {

    recuperarEvento()
        .then(function(ev) {
        mostrarEvento(ev);
        registrarOyentes();
        })
        .catch(function(error) {
        console.log(error);
        })
})


// Funciones

function recuperarEvento() {

  return new Promise(function(resolve, reject) {

    /*
      Para no tener que llamar a la API con cada carga, los datos se guardan
      en localStorage y se hacen caducar cada media hora.
    */

    //if (eventosGuardados === null || Date.parse(eventosGuardados.fechaCaducidad) < Date.parse(fechaActual)) {

      //console.log("SÍ he tenido que atacar a la API")
      $.ajax({
        url: 'https://api.euskadi.eus/culture/events/v1.0/events/' + idEvento, 
        cache: true,
        success: function(data) {
          
          // const segundosActuales = fechaActual.getTime();
          // const fechaCaducidad = new Date(segundosActuales + caducidad);
          // const eventosObj = {
          //   fechaCaducidad: fechaCaducidad,
          //   eventos: data.items
          // }
          
          // localStorage.setItem('eventosSesion', JSON.stringify(eventosObj));

          // eventosGuardados = JSON.parse(localStorage.getItem('eventosSesion'));

          //resolve(eventosGuardados);

          resolve(data);
        },
        error: function(error) {
          reject(error);
        }
      });

    // Tenemos datos guardados y no han caducado
    /*} else {

      //console.log("NO he tenido que atacar a la API")
      eventosGuardados = JSON.parse(localStorage.getItem('eventosSesion'));
      resolve(eventosGuardados);
    }*/
  })
}


function mostrarEvento(evento) {

  console.log(evento);
      eventoDiv.append(
        '<div class="col-sm-12 col-md-6 py-3">'
          + '<div class="card py-3">'
              + '<span class="badge bg-success badge-precio">' + evento.priceEs + '</span>'
              + '<div class="card-body">'
                  + '<h5 class="card-title">' + evento.nameEs + '</h5>'
                  + '<p><ul><li>Fecha: ' + (new Date(evento.startDate)).toLocaleDateString() + '</li>'
                      + ''
                      + '<li>Hora: ' + evento.openingHoursEs + '</li>'
                      + '<li>Lugar: ' + evento.establishmentEs + ' (' + evento.municipalityEs + ')</li>'
                  + '</ul></p><p>' + evento.descriptionEs + '</p><button id="' + evento.id +'" type="button" class="btn btn-outline-info w-100">Ver info</button>'
              + '</div>'
            + '</div>'
        + '</div>'
      );

      eventoDiv.append('<div id="visuales" class="col-sm-12 col-md-6 py-3"></div>');
      
      for (const imagen of evento.images) $('#visuales').append('<img src="' + imagen.imageUrl + '" class="img-fluid rounded mx-auto mb-3 d-block">');

      $('#visuales').append('<div id="map" class="rounded"></div></div>');

      var map = L.map('map').setView([evento.municipalityLatitude, evento.municipalityLongitude], 15);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      var marker = L.marker([evento.municipalityLatitude, evento.municipalityLongitude]).addTo(map);
}

function registrarOyentes() {
  $('button').click(function() {

    window.location.assign('html/detalle.html?id=' + this.id);
  })
}