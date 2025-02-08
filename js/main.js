'use strict'

// Global

const listadoDiv = $('#eventos');
const numEventos = 200;
let pag = 1
const precioTope = 5;
let eventosGuardados = JSON.parse(localStorage.getItem('eventosSesion'));

const fechaActual = new Date();
const caducidad = 1000 * 60 * 30;


// Punto de entrada

$(document).ready(function() {

    recuperarEventos()
      .then(function(evs) {
        mostrarEventos(evs);
        registrarOyentes();
      })
      .catch(function(error) {
        console.log(error);
      })
})


// Funciones

function recuperarEventos() {

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

      console.log("NO he tenido que atacar a la API")
      eventosGuardados = JSON.parse(localStorage.getItem('eventosSesion'));
      resolve(eventosGuardados);
    }
  })
}


function mostrarEventos(evs) {

  // console.log(eventosGuardados);
  evs.eventos.forEach(evento => {
    const precio = evento.priceEs;
    const imagenUrl = evento.images.length > 0 ? evento.images[0].imageUrl : '#';

    if(parseInt(precio) <= precioTope || precio == 'Gratis') {
      listadoDiv.append(
        '<div class="col-sm-12 col-md-6 col-lg-4 py-3" loading="lazy">'
          + '<div class="card">'
              + '<span class="badge bg-success badge-precio">' + evento.priceEs + '</span>'
              + '<img src="' + imagenUrl + '" class="card-img-top">'
              + '<div class="card-body">'
                  + '<h5 class="card-title">' + evento.nameEs + '</h5>'
                  + '<p><ul><li>Fecha: ' + (new Date(evento.startDate)).toLocaleDateString() + '</li>'
                      + ''
                      + '<li>Hora: ' + evento.openingHoursEs + '</li>'
                      + '<li>Lugar: ' + evento.establishmentEs + ' (' + evento.municipalityEs + ')</li>'
                  + '</ul></p><button id="' + evento.id +'" type="button" class="btn btn-outline-info w-100">Ver info</button>'
              + '</div>'
            + '</div>'
        + '</div>'
      );
    }
  });
}

function registrarOyentes() {
  $('button').click(function() {
    console.log(this.id);
    window.location.assign('html/detalle.html?id=' + this.id);
  })
}