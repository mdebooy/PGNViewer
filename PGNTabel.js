/**
 * Copyright 2017 Marco de Booij
 *
 * Licensed under the EUPL, Version 1.1 or - as soon they will be approved by
 * the European Commission - subsequent versions of the EUPL (the "Licence");
 * you may not use this work except in compliance with the Licence. You may
 * obtain a copy of the Licence at:
 *
 * http://www.osor.eu/eupl
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the Licence is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the Licence for the specific language governing permissions and
 * limitations under the Licence.
 *
 * @author Marco de Booij
 * @author Nico Vanwonterghem
 * 
 * @version 1.0.2
 */

$(document).ready(function () {
  var myJson;
  $.getJSON('partijen.json', function(data) {
      myJson=data;
  }).always(function() {
      $('#partijenTab').dataTable( {
        "order": [[1, "desc"], [2, "desc"], [3, "asc"]],
          "language": {
              "paginate": {
                  "first": "&lt;&lt;",
                  "last": "&gt;&gt;",
                  "next": "&gt;",
                  "previous": "&lt;"
              },
              "search": "Zoeken:",
              "zeroRecords": "Niets gevonden.",
              "info": "",
              "infoEmpty": "Geen rijen beschikbaar.",
              "infoFiltered": ""
          },
          "pagingType": "simple_numbers",
          "pageLength": 6,
          "lengthChange": false,
          "bScrollCollapse": true,
          "aaData":  myJson,
          "aoColumns": [
            { "sTitle": "Nr.", "sClass": "text-center", "sWidth": "5px", "orderable": true, "mData": "_gamekey" },
            { "sTitle": "Ronde", "sClass": "text-center", "sWidth": "5px", "mData": "Round" },
            { "sTitle": "Datum", "sClass": "text-center", "sWidth": "60px", "mData": "Date" },
            { "sTitle": "Wit", "sClass": "text", "sWidth": "140px", "mData": "White" },
            { "sTitle": "Zwart", "sClass": "text", "sWidth": "140px", "mData": "Black" },
            { "sTitle": "Uitslag", "sClass": "text-center", "mData": "Result", "mRender": function ( data, type, full ) {return data.replace(/1\/2/g, "½");}},
            { "sTitle": "ECO", "sClass": "text-center", "mData": "ECO" }
          ]
      });
      $('#partijenTab tbody').on('click', 'td', function() {
          var data = $(this).siblings('td').andSelf();
          partij($(data[0]).html());
      });
     
      addEvent();
      $('#partijenTab_paginate, table th').on('click', function () {
          resetAll();
      });     
  });
});

$(window).keydown(function(e) {
  switch (e.keyCode) {
    case 35:
    case 36:
    case 37:
    case 39:
      e.preventDefault();
      break;     
  }
  
  navigeer(e.keyCode);
});

/*variable s keeps track of last selected row*/
var s = 0;

/*ads event when a row is clicked
  event: add 'selected' class to clicked row, and remove 
  'selected' class from previously selected row, if any
*/
function addEvent() {
  $('#partijenTab tbody tr').on('click', function () {
    $('.selected').removeClass('selected');
    $(this).addClass('selected');
    s = this;
  });
}

/*makes sure event 'addEvent' is added to new rows, e.g. after clicking a 
  pagination number or when changing the order of the table rows.
  also removes class 'selected', except from the last selected row (s)
*/
function resetAll() {
  $('#partijenTab tbody tr.selected').each(function () {
    if (this != s) {
      $(this).removeClass('selected');
    }
  });
  addEvent();
}
