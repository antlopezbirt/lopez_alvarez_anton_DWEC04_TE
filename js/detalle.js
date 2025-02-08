'use strict'

// Global

const eventoDiv = $('#evento');
const numEventos = 200;
let pag = 1
const precioTope = 5;

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
        mostrarEvento(ev, idEvento);
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

    if (eventosGuardados === null || Date.parse(eventosGuardados.fechaCaducidad) < Date.parse(fechaActual)) {

      console.log("SÍ he tenido que atacar a la API")
      $.ajax({
        url: 'https://api.euskadi.eus/culture/events/v1.0/events/upcoming',
        data: {_elements: numEventos, _page: pag},
        cache: true,
        success: function(data) {
          
          const segundosActuales = fechaActual.getTime();
          const fechaCaducidad = new Date(segundosActuales + caducidad);
          const eventosObj = {
            fechaCaducidad: fechaCaducidad,
            eventos: data.items
          }
          
          localStorage.setItem('eventosSesion', JSON.stringify(eventosObj));

          eventosGuardados = JSON.parse(localStorage.getItem('eventosSesion'));

          resolve(eventosGuardados);
        },
        error: function(error) {
          reject(error);
        }
      });

    // Tenemos datos guardados y no han caducado
    } else {

      //console.log("NO he tenido que atacar a la API")
      eventosGuardados = JSON.parse(localStorage.getItem('eventosSesion'));
      resolve(eventosGuardados);
    }
  })
}


function mostrarEvento(evs, idEvento) {

  const evento = evs.eventos.find(evento => evento.id === idEvento);
  console.log(evento);

  eventoDiv.append('<div id="info" class="row"></div>');

  $('#info').append('<div id="imagenes" class="col-sm-12 col-md-6 py-3"></div>');

  for (const imagen of evento.images) {
    $('#imagenes').append('<img src="' + imagen.imageUrl + '" class="img-fluid rounded mx-auto mb-3 d-block">');
  }

  $('#info').append(
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

  
  eventoDiv.append('<div id="mapa" class="row"></div>');

  $('#mapa').append('<div id="map" class="rounded py-3 my-3"></div></div>');

  var map = L.map('map').setView([evento.municipalityLatitude, evento.municipalityLongitude], 15);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  var marker = L.marker([evento.municipalityLatitude, evento.municipalityLongitude]).addTo(map);

  eventoDiv.append('<div id="relacionados" class="row"><h2>Otros eventos relacionados:</h2</div>');

  mostrarRelacionados(evs.eventos, evento.id, evento.type);

}

function registrarOyentes() {
  $('button').click(function() {

    window.location.assign('./detalle.html?id=' + this.id);
  })
}

function mostrarRelacionados(evs, idEvento, tipo) {

  // TODO: Randomizar
  let contador = 0;
  evs.forEach(evento => {
    if (contador === 3) return;
    const precio = evento.priceEs;
    console.log(evento);
    console.log((parseInt(precio) <= 5 || precio == 'Gratis') && evento.type === tipo)
    if((parseInt(precio) <= 5 || precio == 'Gratis') && evento.type === tipo && evento.id != idEvento) {
      $('#relacionados').append(
        '<div class="col-sm-12 col-md-6 col-lg-4 py-3" loading="lazy">'
          + '<div class="card">'
              + '<span class="badge bg-success badge-precio">' + evento.priceEs + '</span>'
              + '<img src="' + evento.images[0].imageUrl + '" class="card-img-top">'
              + '<div class="card-body">'
                  + '<h5 class="card-title">' + evento.nameEs + '</h5>'
                  + '<p><ul><li>Fecha: ' + (new Date(evento.startDate)).toLocaleDateString() + '</li>'
                      + '<li>' + evento.openingHoursEs + '</li>'
                      + '<li>' + evento.municipalityEs + '</li>'
                  + '</ul></p><button id="' + evento.id +'" type="button" class="btn btn-outline-info w-100">Ver info</button>'
              + '</div>'
            + '</div>'
        + '</div>'
      );
      contador++;
    }
  });
}