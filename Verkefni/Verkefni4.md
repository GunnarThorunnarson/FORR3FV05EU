# Verkefni 4 
- 10% af heildareinkunn
- Einstaklingsverkefni 
- [Handapatsstjórnun](https://github.com/GunnarThorunnarson/FORR3FV05EU/wiki/Handapatsstj%C3%B3rnun)

---

## Verkefnalýsing

Í þessu verkefni ætlum við að vinna með handapat stjórnun (e. hand gestures). Við munum notast við  [MediaPipe](https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer#get_started) safnið frá Google og JavaScript (Web) lausnir.


### 1. Tilbúið handapat. (**50%**)
Notaðu eitthvað af [gesture recognition](https://developers.google.com/mediapipe/solutions/vision/gesture_recognizer) modelum; _"Closed_Fist", "Open_Palm", "Pointing_Up", "Thumb_Down", "Thumb_Up", "Victory", "ILoveYou"_: 
   1. [ ] Til að snúa (e.rotate) 3D hlut sem þú scannaðir í verkefni 3 (x, z, y ás) á skjá.
   1. [ ] Notaðu `drawingUtils.drawConnectos` og `drawingUtils.drawLandmarks` til að sjá gestur detection á hönd (frjáls útfærsla).

Sjá nánar [myndband](https://www.youtube.com/watch?v=cJgDuywJv8Y) og [kóðadæmi](https://gunnarthorunnarson.github.io/FORR3FV05EU/handapat/gesture_recognition.html).

<!--   1. [ ] _valkvæmt:_ stækka og minnka 3D hlutinn á skjá. -->

### 2. Eigið handapat. (**50%**)
Hannaðu þitt eigið handapatsstjórnun með [Hand landmarks detection](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker). Notaðu hnit (x, y og z) af einhverjum af 21 liðamótunum í höndinni (eða höndum) til að eiga við (e. transform) eða færa 3D hlut á skjá með Three.js. Hér er [skýringarmyndband](https://www.youtube.com/watch?v=hV5S4iQhNkI).

<!--
dæmi um [lausn](https://gunnarthorunnarson.github.io/FORR3FV05EU/h23/v4/Kristofer/Part2-Krist%C3%B3fer/index.html) til að skoða.
-->

<!-- [Github](https://github.com/GunnarThorunnarson/FORR3FV05EU/tree/master/docs/h23/v4/Kristofer/Part2-Krist%C3%B3fer) -->

<br>

> **Ath:** Það má ekki skila inn sömu lausn/útfærslu og annar nemandi hefur gert.

---

## Námsmat og skil

Einkunn fyrir hvorn lið:  
- 10 lausn er vel útfærð.
-  8 lausn er smávægilega ábótavant.
-  6 meirihluti er vel útfært.
-  4 lausn er ábótavant, ekki vel útfærð eða helming vantar.
-  2 lausn er stórlega ábótavant.
-  0 lausn vantar eða er óunnin.

Skilaðu á Innu kóðaskrá ásamt leiðbeiningum um notkun með handapatsstjórnun.

> **Ath:** Nemandi þarf að geta gert grein fyrir öllum kóða og lausn munnlega til að fá einkunn fyrir verkefni (ef kennari óskar eftir því).

<!-- vefslóð á Github með vefrót (notaðu docs möppu sem rót) sem hýsir og sýnir 3D hlut og notkun þess með handapatsstjórnun.
