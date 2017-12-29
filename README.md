PGNViewer
=========

Met deze Javascript kan je een schaakpartij naspelen in een browser.

Extra bestanden
---------------
De PGNViewer maakt gebruik van:
 - datatables.js (https://www.datatables.net/)
 - bootstrap.js  (http://getbootstrap.com/)
 - enkele images

Deze bestanden zijn niet meegeleverd om eventuele copyright conflicten te vermijden.

PGN naar JSON
-------------
Ik heb een tool geschreven om een PGN bestand om te zetten naar een JSON bestand. De source is te vinden op GitHub (https://github.com/mdebooy/CaissaTools) en het jar-bestand op http://debooy.eu/Java/downloads.html (Caissa Tools). Het omzetten gebeurd met het volgende commando:

    java -jar ~/common/java/caissatools-X.Y.Z-jar-with-dependencies.jar pgntojson --bestand partijen.pgn --pgnviewer=J

