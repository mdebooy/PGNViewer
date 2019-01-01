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
 * @version 2.1.0
 */

//array van de velden
var velden = [
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'];

// Vaste waardes.
var FEN = 'rnbqkbnrpppppppp32PPPPPPPPRNBQKBNR',   
    STUKKEN = 'kqrbnp.PNBRQK';

// Partij variabelen.
var fen = '',
    halvezet = -1,
    pgn = '',
    stelling = new Array(),
    witonder = 1,
    witspeler = '',
    zetten = '',
    zwartspeler = '',
    uitslag = '',
    datum = '',
    eco = '',
    veldVan = -1,
    veldNaar = -1;

// Script variabelen.
var document = null,
    coordinatenFontsize = 8;

var plies,
    json;

//breekpunten, twee extra breekpunten meegeven als grootste en kleinste
var breekpunten = [1000, 768, 600, 400, 0],
    vorigeGrootte = 0;

/* Bereken de positie van de coordinaten, naargelang de grootte van het bord */
function berekenCoordinaten () {
  var breedte = $('#rooster').innerHeight();   
  $('.nummers span').css("line-height", breedte / (coordinatenFontsize * 8));
  $('.letters span').css("width", breedte / 8);
}

/* bepaalt welke cursor er getoond wordt,
 * naargelang het veld aanklikbaar is of niet
*/
function buttons(id) {  
  if (klikbaar(id)) { 
    knoppen.style.cursor = "pointer";
  } else {
    knoppen.style.cursor = "default";
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
    if (STUKKEN.indexOf(zet.substring(i, i + 1)) >= 0) {
      stelling[veld] = STUKKEN.indexOf(zet.substring(i, i + 1)) - 6;
      if (veld1 == -1) {
        veld1 = veld;
      } else {
        veld2 = veld;
      }
      veld++;
    } else {
      var leeg = parseInt(zet.substring(i));
      if (leeg > 9) {
        i++;
      }
      veld += leeg;
    }      
  }

  // e.p. aanpassing van veld.
  if (zet.indexOf("P6..") > 0) {
    veld2--;
  }
  if (zet.indexOf("..6p") > 0) {
    veld1++;
  }
  // Korte zwarte rochade.
  if (zet.indexOf("rk.") > 0) {
    veld1 = 4;
    veld2 = 6;
  }
  // Lange zwarte rochade.
  if (zet.indexOf("kr.") > 0) {
    veld1 = 4;
    veld2 = 2;
  }
  // Korte witte rochade.
  if (zet.indexOf("RK.") > 0) {
    veld1 = 60;
    veld2 = 62;
  }
  // Lange witte rochade.
  if (zet.indexOf("KR.") > 0) {
    veld1 = 60;
    veld2 = 58;
  }
     
  return "" + veld1 + "," + veld2;
}

/**
 * Draai het bord om.
 */
function draaiBord() {
  witonder *= -1;
  reverseCoordinaten();
  velden.reverse();
  tekenStelling();
  signaalVeld();
}

/**
 * Kleur de zet.
 */
function kleurZet(zet, aktief) {
  if (zet > -1) {
    var elem = document.getElementById(zet);
    if (aktief) {
      elem.className = elem.className.replace("sleeping", "active");
    } else {
      elem.className = elem.className.replace("active", "sleeping");
    }
  }
}

/**
 * controleert of een button aanklikbaar is naargelang de positie op het bord.
 */
function klikbaar(id) {
  var klikbaar = false;
  switch (id) {
    case 'draaibord':
      klikbaar = true;
      break;
    case 'eerste':
    case 'vorige':
      if (halvezet >= 0) {
        klikbaar = true;
      }
      break;
    case 'volgende':
    case 'laatste':
      if (halvezet < (zetten.length - 1)) {
        klikbaar = true;
      }
      break;     
  }
  return klikbaar;
}

/**
 * Vang de muis klikken.
 */
function muisKlik(id) {  
  switch (id) {
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

/* 
 * Ga naar de beginstelling.
 */
function naarBeginstelling() {
  for (var i = 0; i < velden.length; i++) {
    document.getElementById(velden[i]).classList.remove("actiefVeld");
  }
  laatsteHalveZet.style.visibility = "hidden";
  veldVan = -1;
  veldNaar = -1;
  halvezet = -1;
  zetInZicht(halvezet);
}

/* 
 * Ga naar de eindstelling.
 */
function naarEindstelling() {
  halvezet = zetten.length - 1;
  naarHalvezet(halvezet);  
}

/**
 * Geef de stelling na de gevraagde halve zet.
 */
function naarHalvezet(ply) {
  startPositie();
  if (ply <= -1) {
    laatsteHalveZet.style.visibility = "hidden";
    veldVan = -1;
    veldNaar = -1;
    halvezet = -1;
  } else {
    for (var i = 0; i < ply; i++) {
      doeZet(zetten[i]);
    }

    var resultaat = doeZet(zetten[ply]).split(",");
    veldVan = resultaat[0];
    veldNaar = resultaat[1];
  }
  zetInZicht(ply);
  tekenStelling();
  signaalVeld();
  if (ply >= 0) {
    var laatsteZet = "";
    if (i % 2 == 1) {
      laatsteZet += Math.round(i / 2) + "...";
    }
    laatsteZet += plies[i];
    laatsteHalveZet.style.visibility = "visible";
    laatsteHalveZet.removeChild(laatsteHalveZet.firstChild);
    laatsteHalveZet.appendChild(document.createTextNode(laatsteZet));

    kleurZet(halvezet, true);
  }
}

/**
 * 'Wandel' door de partij.
 */
function navigeer(aktie) {
  switch (aktie) {
    case 36:
      kleurZet(halvezet, false);
      halvezet = -1;
      naarHalvezet(halvezet);
      break;
    case 37:
      if (halvezet >= -1) {
        kleurZet(halvezet, false);
        halvezet--;
        naarHalvezet(halvezet);
      }
      break;
    case 39:
      if (halvezet < (zetten.length - 1)) {
        kleurZet(halvezet, false);
        halvezet++;
        naarHalvezet(halvezet);
      }
      break;
    case 35:
      kleurZet(halvezet, false);
      halvezet = zetten.length - 1;
      naarHalvezet(halvezet);
      break;
  }
}

/**
 * Activeer partij.
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
  if (!start) {     
    naarBeginstelling();

    schrijfPartijInfo();
    witonder === -1 ? draaiBord() : tekenStelling();
      
    document.getElementById("board").addEventListener('wheel', muisWiel, false);
  }   
}

/**
 * Hoofdfunctie
 */
var start = true;
function pgnviewer() {
  $.getJSON('partijen.json', function (data) {
    json = data;
  })
  startPositie();     
  if (start) {                        
    $('#buitenrand').toggle();
    $('#witOnder').toggle();
    tekenStelling();
    start = false;
    $('#eerste, #vorige, #volgende, #laatste, #draaibord').on('mouseover', function () {
      buttons(this.id);
    });
    $('#eerste, #vorige, #volgende, #laatste, #draaibord').on('mouseleave', function () {
      knoppen.style.cursor = "default";
    });
    $('#eerste, #vorige, #volgende, #laatste, #draaibord').on('click', function () {
      muisKlik(this.id);
    });
    berekenCoordinaten();
  }
}

/**
 * Plaats de stukken op het bord.
 */
function plaatsStukken() {
  for (var i = 0; i < 64; i++) {
    if (stelling[i] != 0) {
      tekenStuk(stelling[i], i);      
    }
  }
}

/**
 * Draait de volgorde van de coordinaten om.
 */
function reverseCoordinaten() {
  $('#witOnder').toggle();
  $('#zwartOnder').toggle();  
}

/**
 * Schrijft de hoofding van de partijinfo.
 */
function schrijfHoofding() {
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
}

/**
 * Maak de partijinfo leeg.
 */
function schrijfLeegPartijinfo() {
  var div = document.getElementById("partijinfo");
  while (div.firstChild) {
    div.removeChild(div.firstChild);
  }
  return div;
}

/**
 * Schrijf de speler informatie en de PGN op het scherm. De 'spelers', 'wit' en
 * 'zwart' zijn de id's van elementen in de html pagina.
 */
function schrijfPartijInfo() {
  if (witspeler !== '') {
    spelers.style.visibility = "visible";
  }  
  wit.removeChild(wit.firstChild);
  wit.appendChild(document.createTextNode(witspeler));
  zwart.removeChild(zwart.firstChild);
  zwart.appendChild(document.createTextNode(zwartspeler));

  schrijfPgnNaarPartijinfo(pgn);
}

/**
 * Splits de tekst in stukken en maakt kolommen voor het nummer, de zwarte zet,
 * en de witte zet.
 */
function schrijfPgnNaarPartijinfo(pgn) {
  plies = pgn.trim().split(" ");
  schrijfHoofding();
  var div = schrijfLeegPartijinfo();

  var margin = document.createElement('div');
  margin.id = "partijinfo_top";
  div.appendChild(margin);

  var alleZetten = document.createElement('div');
  div.appendChild(alleZetten);

  for (var i = 0; i < plies.length; i++) {
    var ply = document.createElement("span");
    ply.id = i;
    ply.className = "sleeping moves";
    if (i % 2 == 1 || i == 1) {
      ply.appendChild(document.createTextNode(plies[i]));
    } else {
      var zetnummer = document.createElement("span");
      zetnummer.className = "zetNummers";
      zetnummer.appendChild(document.createTextNode(plies[i].substr(0, plies[i].indexOf(".") + 1)));
      alleZetten.appendChild(zetnummer);
      ply.appendChild(document.createTextNode(plies[i].substr(plies[i].indexOf(".") + 1)));
    }
    ply.onclick = zetKlik(ply.id);
    alleZetten.appendChild(ply);
  }

  alleZetten.appendChild(document.createElement("br"));
  var res = document.createElement("span");
  res.id = "resultaat";
  res.appendChild(document.createTextNode(uitslag));
  alleZetten.appendChild(res);

  div.appendChild(alleZetten);
}

/**
 * Teken een vierkant om het 'van' veld en het 'naar' veld aan te duiden.
 */
function signaalVeld() {
  for (var i = 0; i < velden.length; i++) {    
    document.getElementById(velden[i]).classList.remove("actiefVeld");
  }
  document.getElementById(velden[veldVan]).classList.add("actiefVeld");
  document.getElementById(velden[veldNaar]).classList.add("actiefVeld");
}

/**
 * Maak de startopstelling.
 */
function startPositie() {
  var fen = FEN;
  for (var i = 0; i < 64; i++) {
    stelling[i] = 0;
  }

  var veld = 0;
  for (i = 0; i < fen.length; i++) {
    var teken = fen.substring(i, i + 1),
        stuk = STUKKEN.indexOf(teken);
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
 * Teken de stelling.
 */
function tekenStelling() {
  for (var i = 0; i < velden.length; i++) {
    document.getElementById(velden[i]).style.backgroundImage = "none";     
  }
    
  plaatsStukken();
}

/**
 * Teken het stuk op het juiste veld.
 */
function tekenStuk(stuk, veld) {
  var x = $('#rooster').innerHeight() / 8,
      y = ((stuk > 0) ? 0 : $('#rooster').innerHeight() / 8);

  switch (stuk) {
    case 4: case -4:
      x *= 2;
      break;
    case 2: case -2:
      x *= 3;
      break;
    case 3: case -3:
      x *= 4;
      break;
    case 5: case -5:
      x *= 5;
      break;
    case 6: case -6:
      x *= 6;
      break;
    default: x *= 1;
  }
  document.getElementById(velden[veld]).style.background = "url('../common/images/stukken.png')" + x + "px " + y + "px";
  document.getElementById(velden[veld]).style.backgroundSize = "600% 200%";
}

/** 
 * Vergelijk huidige venstergrootte met de vorige venstergrootte, zodat bij een
 * window resize de 'zet in zicht' kan gehouden worden. Gebruikt een array van
 * breekpunten, van groot naar klein. Twee 'extra' breekpunten als grootste en
 * kleinste, anders werkt het in bepaalde gevallen niet bij de 'echte' grootste
 * en kleinste punten.
 */
function vergelijkSchermgrootte() {
  var grootte = window.innerWidth;
  for (var i = 0; i < breekpunten.length; i++) {
    if (grootte < breekpunten[i] && grootte >= breekpunten[i+1]) {
      if (vorigeGrootte >= breekpunten[i] || vorigeGrootte < breekpunten[i+1]) {
        zetInZicht(halvezet);
        break;
      }
    }
  }
  
  vorigeGrootte = grootte;
}

/**
 * Controleer of de zet nog 'in' de viewport valt, en indien niet, pas dit aan.
 */
function zetInZicht(zet) {
  var container = document.getElementById("partijinfo");
  if (zet === -1) {
    container.scrollTop = 0;
    return;
  }

  var element = document.getElementById(zet);

  // Container top, bottom
  var cTop = container.scrollTop,
      cBottom = cTop + container.clientHeight;
  
  // Element top, bottom
  var eTop = element.offsetTop - 46,
      eBottom = eTop + element.clientHeight + 69;
  
  // Controle of in zicht
  if (eTop < cTop) {
    container.scrollTop -= (cTop - eTop + element.clientHeight);
  } else if (eBottom > cBottom) {
    container.scrollTop += (eBottom - cBottom + element.clientHeight);
  }
}

/**
 * Vang de klikken op een zet op.
 */
function zetKlik(id) {
  return function () {
    for (var i = 0; i < zetten.length; i++) {
      kleurZet(i, false);
    }
    halvezet = id;
    kleurZet(halvezet, true);
    naarHalvezet(halvezet);
  }
}
