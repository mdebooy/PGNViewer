/**
 * Copyright 2013 Marco de Booij
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
 * @version 1.0.0
 */

// Vaste waardes.
var LIJNEN = 'ABCDEFGH',
    FEN = 'rnbqkbnrpppppppp32PPPPPPPPRNBQKBNR',
    RAND_BOVEN = 32,
    RAND_LINKS = 14,
    RIJEN = '87654321',
    STUKKEN = 'kqrbnp.PNBRQK',
    VELD_GROOTTE = 38,
    VELD_WIT = '#fff',
    VELD_ZWART = '#739ec1';

// Partij variabelen.
var fen = '',
    halvezet = 0,
    pgn = '',
    stelling = new Array(),
    witonder = 1,
    witspeler = '',
    zetten = '',
    zwartspeler = '',
    uitslag = '',
    speeldatum = '',
    eco = '',
    veldVan = -1,
    veldNaar = -1;

// Script variabelen.
var canvas = null,
    ctx = null,
    document = null,
    knophoogte = 22,
    teksthoogte = 20,
    stukken = null;

// Bord variabelen.
var rijen = RIJEN,
    lijnen = LIJNEN,
    bordbreedte = 8 * VELD_GROOTTE;

var plyTab,
    json;

function bepaalGebied(ev) {
  var rect = canvas.getBoundingClientRect();
  var x = ev.clientX - rect.left, 
      y = ev.clientY - rect.top;
  if (y >= RAND_BOVEN + 8 * VELD_GROOTTE + knophoogte
    && y <= RAND_BOVEN + 8 * VELD_GROOTTE + knophoogte + knophoogte) {
    // Draai bord?
    if (x >= RAND_LINKS + 7 * VELD_GROOTTE + 4
      && x <= RAND_LINKS + 7 * VELD_GROOTTE + 4 + knophoogte) {
      return 'draaibord';
    }
      // Naar eerste zet?
    else if (x >= RAND_LINKS + 4 * VELD_GROOTTE - 2 * knophoogte - 4
      && x <= RAND_LINKS + 4 * VELD_GROOTTE - 2 * knophoogte - 4 + knophoogte
      && halvezet >= 1) {
      return 'eerste';
    }
      // Vorige zet?
    else if (x >= RAND_LINKS + 4 * VELD_GROOTTE - knophoogte - 2
      && x <= RAND_LINKS + 4 * VELD_GROOTTE - knophoogte - 2 + knophoogte
      && halvezet >= 1) {
      return 'vorige';
    }
      // Volgende zet?
    else if (x >= RAND_LINKS + 4 * VELD_GROOTTE + 2
      && x <= RAND_LINKS + 4 * VELD_GROOTTE + 2 + knophoogte
      && halvezet < (zetten.length - 1)) {
      return 'volgende';
    }
      // Naar laatste zet?
    else if (x >= RAND_LINKS + 4 * VELD_GROOTTE + knophoogte + 4
      && x <= RAND_LINKS + 4 * VELD_GROOTTE + knophoogte + 4 + knophoogte
      && halvezet < (zetten.length - 1)) {
      return 'laatste';
    }
  }
}

/**
 * Verander de positie op het bord naar de aangeklikte zet
 */
function bepaalPly() {
  var partijZetten = document.getElementsByClassName("sleeping");
  for (i = 0; i < partijZetten.length; i++) {
    partijZetten[i].onclick = function () {
      for (i = 0; i < zetten.length; i++) { 
        kleurZet(i, false);
      }
      halvezet = this.id;
      kleurZet(halvezet, true);
      naarHalvezet(halvezet); 
    }
  }
}

function buttons(ev) {
  var gebied = bepaalGebied(ev);
  switch (gebied) {
    case 'draaibord':
    case 'eerste':
    case 'vorige':
    case 'volgende':
    case 'laatste':
      canvas.style.cursor = "pointer";
      break;   
    default: canvas.style.cursor = "default";
  }
}

/**
 * Doe de zet.
 */
function doeZet(zet) {
  var veld = 0,
      veld1 = -1,
      veld2 = -1;

  for (var i = 0; i < zet.length; i++) {
    if (STUKKEN.indexOf(zet.substring(i, i+1)) >= 0) {
      stelling[veld] = STUKKEN.indexOf(zet.substring(i, i+1)) - 6;
      if (veld1 == -1) {
        veld1 = veld;
      } else {
        veld2 = veld;
      }
      veld++;
    } else {
      leeg = parseInt(zet.substring(i));
      if (leeg > 9) {
        i++;
      }
      veld += leeg;
    }
  }

  // e.p. aanpassing van veld.
  if (zet.indexOf("P6..") > 0 ) {
    veld2--;
  }
  if (zet.indexOf("..6p") > 0 ) {
    veld1++;
  }
  // Korte zwarte rochade
  if (zet.indexOf("rk.") > 0) {
    veld1 = 4;
    veld2 = 6;
  }
  // Lange zwarte rochade
  if (zet.indexOf("kr.") > 0) {
    veld1 = 4;
    veld2 = 2;
  }
  // Korte witte rochade
  if (zet.indexOf("RK.") > 0) {
    veld1 = 60;
    veld2 = 62;
  }
  // Lange witte rochade
  if (zet.indexOf("KR.") > 0) {
    veld1 = 60;
    veld2 = 58;
  }

  return ""+veld1+","+veld2;
}

/**
 * Draai het bord om.
 */
function draaiBord() {
  witonder *= -1;
  tekenKader("#fff");
  reverseRijenLijnen();
  tekenKader("#000");
  tekenStelling();
  signaalVeld(veldVan);
  signaalVeld(veldNaar);
}

/**
 * Bepaal de kleur van het veld.
 */
function getVeldKleur(iRij, iLijn) {
  var cVeldKleur;

  if (iRij % 2) {
    cVeldKleur = (iLijn % 2 ? VELD_WIT : VELD_ZWART);
  } else {
    cVeldKleur = (iLijn % 2 ? VELD_ZWART : VELD_WIT);
  }

  return cVeldKleur;
}

/**
 * Kleur de zet.
 */
function kleurZet(zet, aktief) {
  var elem = document.getElementById(zet);
  if (aktief) { 
    elem.className = elem.className.replace("sleeping", "active");  
  } else {
    elem.className = elem.className.replace("active", "sleeping");  
  }
}

/**
 * Teken een leeg veld.
 */
function leegVeld(veld) {
  tekenVeld(veld % 8, (veld - veld % 8) / 8);
}

/**
 * Vang de muis klikken.
 */
function muisklik(ev) {
  var gebied = bepaalGebied(ev);
  switch (gebied) {
    case 'draaibord':
      draaiBord();
      break;
    case 'eerste':
      navigeer(36);
      break;
    case 'vorige':
      navigeer(37);
      break;
    case 'volgende':
      navigeer(39);
      break;
    case 'laatste':
      navigeer(35);
      break;     
  }
}

/**
 * Vang de muiswiel bewegingen.
 */
function muisWiel(ev) {
    ev.preventDefault();
    if (ev.deltaY < 0) {
        navigeer(37);
    } else {
        navigeer(39);
    }
}

/**
 * Geef de stelling na de gevraagde halve zet.
 */
function naarHalvezet(ply) {
  startPositie();
  if (ply == -1 ) {
    veldVan = -1;
    veldNaar = -1;
  } else {
    for (var i = 0; i < ply; i++) {
      doeZet(zetten[i]);
    }

    var resultaat = doeZet(zetten[ply]).split(",");
    veldVan = resultaat[0];
    veldNaar = resultaat[1];
  }

  tekenStelling();
  signaalVeld(veldVan);
  signaalVeld(veldNaar);
  ctx.fillStyle = "#fff";
  ctx.fillRect(5 + RAND_LINKS, RAND_BOVEN + 8 * VELD_GROOTTE + teksthoogte, 95, teksthoogte - 2);
  ctx.fillStyle = "#000";
  if (ply >= 0) {
    var laatsteZet = "";
    if (i%2 == 1) {
      laatsteZet += Math.round(i/2) + "...";
    }
    laatsteZet += plyTab[i].ply;
    printTekst(laatsteZet, 10 + RAND_LINKS, RAND_BOVEN + 8 * VELD_GROOTTE + 2 * knophoogte - 10);
    kleurZet(halvezet, true);
  }
  zetInZicht(halvezet);
}

/**
 * 'Wandel' door de partij.
 */
function navigeer(aktie) {
  var accept = false;
  switch(aktie) {
    case 36:
      kleurZet(halvezet, false);
      halvezet = -1;
      naarHalvezet(halvezet);
      accept = true;
      break;
    case 37:
      kleurZet(halvezet, false);
      halvezet--;
      naarHalvezet(halvezet);
      accept = true;
      break;
    case 39:
      if (halvezet < (zetten.length - 1)) {
      if (halvezet >= 0) {
        kleurZet(halvezet, false);
      }
      halvezet++;
      naarHalvezet(halvezet);
      accept = true;
      }
      break;
    case 35:
      if (halvezet >= 0) {
        kleurZet(halvezet, false);
      }
      halvezet = zetten.length - 1;
      naarHalvezet(halvezet);
      accept = true;
      break;
  }

  return accept;
}

/**
 * Activeer partij
 */
function partij(gamekey) {
  // Alle vorige informatie verwijderen.
  pgnviewer();

  for (var i = 0; i < json.length; i++) {
    if (json[i]['_gamekey'] === gamekey) {
      witspeler = json[i]['White'];
      zwartspeler = json[i]['Black'];
      pgn = json[i]['_moves'].replace(/B/g, '♗').replace(/K/g, '♔').replace(/N/g, '♘').replace(/Q/g, '♕').replace(/R/g, '♖');
      zetten = json[i]['_pgnviewer'].split(' ');
      uitslag = json[i]['Result'].replace(/1\/2/g, "½");
      datum = json[i]['Date'];
      eco = json[i]['ECO'];
    }
  }

  startPositie();
  tekenStelling();
  schrijfPartijInfo();
  halvezet = -1;
}

/**
 * Hoofdfunctie
 */
function pgnviewer() {
  canvas = document.getElementById('schaken');

  // Wordt canvas ondersteund?
  if (canvas.getContext) {
    ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    $.getJSON('partijen.json', function (data) {
      json = data;
    })
    startPositie();
    stukken = new Image();
    stukken.src = '../common/images/stukken.png';
    stukken.onload = function () {
      tekenStelling();
    }
    tekenKnoppen();

    canvas.addEventListener('click', muisklik, false);
    canvas.addEventListener('mousemove', buttons, false);
  } else {
    alert("Canvas wordt niet ondersteund!");
  }
}

/**
 * Plaats de stukken op het bord.
 */
function plaatsStukken() {
  for (var i = 0; i < 64; i++) {
    if (stelling[i] != 0) {
      tekenStuk(stelling[i], ((witonder == 1) ? i : 63 - i));
    }
  }
}

/**
 * Print de tekst 2x
 */
function printTekst(tekst, x, y) {
  ctx.fillText(tekst, x, y);
  ctx.fillText(tekst, x, y);
}

/**
 * Draait de volgorde van de rijen en lijnen om
 */
function reverseRijenLijnen() {
  rijen = rijen.split('').reverse().join('');
  lijnen = lijnen.split('').reverse().join('');
}

/**
 * Schrijf de speler informatie en de PGN op het scherm.
 */
function schrijfPartijInfo() {
  ctx.font = "12px 'Helvetica'";
  ctx.linewidth = 1;

  ctx.beginPath();
  ctx.arc(RAND_LINKS / 2, 9, 4, Math.PI * 2, 0, true);
  ctx.fillStyle = 'white';
  ctx.fill();
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = 'black';
  printTekst(witspeler, RAND_LINKS, 14);
  ctx.beginPath();
  ctx.arc(RAND_LINKS / 2, 22, 4, Math.PI * 2, 0, true);
  ctx.fill();
  ctx.closePath();
  ctx.stroke();
  printTekst(zwartspeler, RAND_LINKS, 27);
  wrapTekst(pgn);
}

/**
 * Teken een vierkant om het 'van' veld aan te duiden.
 */
function signaalVeld(veld) {
  if (veld == -1) {
    return;
  }

  var kleur = ctx.strokeStyle;
  var x = veld%8;
  var y = (veld-x)/8;
  if (witonder == -1) {
    x = 7 - x;
    y = 7 - y;
  }
  ctx.strokeStyle = "red";
  ctx.strokeRect(RAND_LINKS + x * VELD_GROOTTE + 1,
                 RAND_BOVEN + y * VELD_GROOTTE + 1,
                 VELD_GROOTTE-2, VELD_GROOTTE-2);
  ctx.strokeStyle = kleur;
}

/**
 * Maak de startopstelling.
 */
function startPositie() {
  fen = FEN;
  for (var i = 0; i < 64; i++) {
    stelling[i] = 0;
  }

  var veld = 0;
  for (var i = 0; i < fen.length; i++) {
    var teken = fen.substring(i, i + 1);
    var stuk = STUKKEN.indexOf(teken);
    if (stuk < 0) {
      if (teken != '/') {
        var legevelden = parseInt(fen.substring(i));
        veld += legevelden;
        if (legevelden > 9) {
          i++;
        }
      }
    } else {
      stelling[veld] = stuk - 6;
      veld++;
    }
  }
}

/**
 * Teken het bord in het canvas.
 */
function tekenBord() {
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      tekenVeld(i, j);
    }
  }
  tekenKader("#000");
}

/**
 * Teken het kader rond het bord
 */
function tekenKader(kleur) {
  ctx.strokeRect(RAND_LINKS, RAND_BOVEN,
           8 * VELD_GROOTTE,
           8 * VELD_GROOTTE);

  // Schrijf de coordinaten.
  var font = ctx.font;
  var textAlign = ctx.textAlign;
  ctx.fillStyle = kleur;
  ctx.font = "" + (RAND_LINKS / 2) + "px 'Helvetica'";
  ctx.textAlign = 'center';
  for (var i = 0; i < 8; i++) {
    printTekst(rijen.substring(i, i + 1), RAND_LINKS / 2, RAND_BOVEN + VELD_GROOTTE / 1.9 + (VELD_GROOTTE * i));
    printTekst(lijnen.substring(i, i + 1), RAND_LINKS + VELD_GROOTTE / 1.9 + (VELD_GROOTTE * i), RAND_BOVEN + (VELD_GROOTTE * 8.25));
  }

  ctx.font = font;
  ctx.textAlign = textAlign;
}

/**
 * Teken de knoppen.
 */
function tekenKnoppen() {
  var knopBegin = new Image(),
    knopEind = new Image(),
    knopVolgend = new Image(),
    knopVorig = new Image(),
    knopDraai = new Image();
  knopBegin.onload = function () {
    ctx.drawImage(knopBegin, RAND_LINKS + 4 * VELD_GROOTTE - 2 * knophoogte - 4,
            RAND_BOVEN + 8 * VELD_GROOTTE + knophoogte);
  };
  knopEind.onload = function () {
    ctx.drawImage(knopEind, RAND_LINKS + 4 * VELD_GROOTTE + knophoogte + 4,
            RAND_BOVEN + 8 * VELD_GROOTTE + knophoogte);
  };
  knopVolgend.onload = function () {
    ctx.drawImage(knopVolgend, RAND_LINKS + 4 * VELD_GROOTTE + 2,
            RAND_BOVEN + 8 * VELD_GROOTTE + knophoogte);
  };
  knopVorig.onload = function () {
    ctx.drawImage(knopVorig, RAND_LINKS + 4 * VELD_GROOTTE - knophoogte - 2,
            RAND_BOVEN + 8 * VELD_GROOTTE + knophoogte);
  };
  knopDraai.onload = function () {
    ctx.drawImage(knopDraai, RAND_LINKS + 7 * VELD_GROOTTE + 4,
            RAND_BOVEN + 8 * VELD_GROOTTE + knophoogte);
  };
  knopBegin.src = '../common/images/go-first.png';
  knopEind.src = '../common/images/go-last.png';
  knopVolgend.src = '../common/images/go-next.png';
  knopVorig.src = '../common/images/go-previous.png';
  knopDraai.src = '../common/images/view-refresh.png';
}

/**
 * Teken de stelling.
 */
function tekenStelling() {
  tekenBord();
  plaatsStukken();
}

/**
 * Teken het stuk op het juiste veld.
 */
function tekenStuk(stuk, veld) {
  var x = (Math.abs(stuk) - 1) * VELD_GROOTTE,
    y = ((stuk < 0) ? 0 : VELD_GROOTTE);
  var lijn = veld % 8,
    rij = (veld - lijn) / 8;

  ctx.drawImage(stukken, x, y,
          VELD_GROOTTE, VELD_GROOTTE,
          RAND_LINKS + lijn * VELD_GROOTTE,
          RAND_BOVEN + rij * VELD_GROOTTE,
          VELD_GROOTTE, VELD_GROOTTE);
}

/**
 * Teken een veld.
 */
function tekenVeld(iRij, iLijn) {
  ctx.fillStyle = getVeldKleur(iRij, iLijn);
  ctx.fillRect(RAND_LINKS + iRij * VELD_GROOTTE,
         RAND_BOVEN + iLijn * VELD_GROOTTE,
         VELD_GROOTTE, VELD_GROOTTE);
  ctx.stroke();
}

/**
 * Splits de tekst in stukken die binnen de breedte van de tekstruimte vallen.
 */
function wrapTekst(tekst) {
  var ply = tekst.trim().split(" ");
  plyTab = new Array(ply.length);

  var hoofding = document.getElementById("hoofding");
  while (hoofding.firstChild) {
    hoofding.removeChild(hoofding.firstChild);
  }
  var resultaat = document.createElement("span");
  resultaat.id = "uitslag";
  resultaat.appendChild(document.createTextNode(uitslag));
  var date = document.createElement("span");
  date.id = "datum";
  date.appendChild(document.createTextNode(datum));
  var ecoCode = document.createElement("span");
  ecoCode.id = "eco";
  ecoCode.appendChild(document.createTextNode(eco));
  hoofding.appendChild(resultaat);
  hoofding.appendChild(date);
  hoofding.appendChild(ecoCode);

  var div = document.getElementById("partijinfo");
  div.addEventListener('wheel', muisWiel, false);
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }
  for (var i = 0; i < ply.length; i++) {    
    var span = document.createElement("span");
    span.id = i;
    span.className = "sleeping moves";
    span.appendChild(document.createTextNode(ply[i]));
    div.appendChild(span);
    div.appendChild(document.createTextNode(" "));
 
    //dit is voor het schrijven van de zet onderaan links van het bord
    //wordt dan gedaan in naarhalveZet() functie
    plyTab[i] = {
      ply: ply[i]
    }      
  }
  div.appendChild(document.createElement("br"));
  var res = document.createElement("span");
  res.appendChild(document.createTextNode(uitslag));
  div.appendChild(res);

  bepaalPly();
}

/**
 * Controleer of de zet nog 'in' de viewport valt, en indien niet, pas dit aan.
 *
 */
function zetInZicht(zet) {
  var container = document.getElementById("partijinfo");
  if (zet === -1) {
      container.scrollTop = 0;
    return;
  }
  if (container.clientHeight < 355) {
    return;
  }
  var element = document.getElementById(zet);
    
  //container top, bottom
  var cTop = container.scrollTop;
  var cBottom = cTop + container.clientHeight;

  //element top, bottom
  var eTop = element.offsetTop - 46;
  var eBottom = eTop + element.clientHeight + 46;

  //controle of in zicht
  if (eTop < cTop) {
    container.scrollTop -= (cTop - eTop + element.clientHeight);
  }
  else if (eBottom > cBottom) {
    container.scrollTop += (eBottom - cBottom + element.clientHeight);
  }
}

