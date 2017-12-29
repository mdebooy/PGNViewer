$(document).ready(function() {
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
      "pagingType": "full_numbers",
      "pageLength": 6,
      "lengthChange": false,
      "bScrollCollapse": true,
      "aaData":  myJson,
      "aoColumns": [
        { "sTitle": "Nr.", "sClass": "text-center", "sWidth": "0px", "orderable": false, "mData": "_gamekey" },
        { "sTitle": "Ronde", "sClass": "text-center", "mData": "Round" },
        { "sTitle": "Datum", "sClass": "text-center", "mData": "Date" },
        { "sTitle": "Wit", "sClass": "text", "sWidth": "100px", "mData": "White" },
        { "sTitle": "Zwart", "sClass": "text", "sWidth": "100px", "mData": "Black" },
        { "sTitle": "Uitslag", "sClass": "text-center", "mData": "Result", "mRender": function ( data, type, full ) {return data.replace(/1\/2/g, "½");}},
        { "sTitle": "ECO", "sClass": "text-center", "mData": "ECO" }
      ]
    });
    $('#partijenTab tbody').on('click', 'td', function() {
      var data = $(this).siblings('td').andSelf();
      partij($(data[0]).html());
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

