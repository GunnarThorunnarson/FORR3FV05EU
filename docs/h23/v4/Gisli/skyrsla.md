# **Verkefni 4**

> **Nemandi** : Gísli Hrafn Halldórsson.
> Ég náði því miður ekki að seta þetta allt í eina vefsíðu, svo kóðinn er dreifður yfir 3 möppur : `/RotateSVG`, `/HandGestureCube` og `/AR`.
> Þetta er líka allt augljóslega mjög barebones, en flest allt virkar.

---

### [1. Touch👆og notendaupplifun (50%)](https://github.com/GunnarThorunnarson/FORR3FV05EU/blob/master/Verkefni/Verkefni4.md#1-touch-og-notendaupplifun-50) (Vika 1)

Búðu til [touch](https://github.com/GunnarThorunnarson/FORR3FV05EU/wiki/Touch) notandastýringu til að stýra 2D viðmótshlut (SVG) á skjá.
Hugaðu vel að notendaupplifun (UX) fyrir touch virkni, sjá t.d. [types of gestures](https://m2.material.io/design/interaction/gestures.html#types-of-gestures) og [Fitts law](https://lawsofux.com/fittss-law/).
Sýndu fram á touch virkni með:

* [X] 1.**Annaðhvort** :
  * [X] einni fingra 👆hreyfingu td; `pan`↕️↔️
  * [ ] `swipe` til að hreyfa 2D hlut.
* [X] 1.**Annaðhvort** :
  * [X] multi-touch ( *tveir fingur✌️* ); t.d. `rotate`↪️ til að snúa
  * [X] `pinch`🤏 fyrir zoom🔍.

> 1. *(Kóðinn og myndir eru er í `/RotateSVG`)*
>    First endaði ég í því að eyða alltof miklum tíma til að finna “fullkomnu” SVG myndina. Var lengi að vesenast með að edit-a hana.
>    Svo var ég líka alltof lengi að ná að tengja Firefox browserinn minn við símann minn með developer tools, en ég náði því á endanum.
>    Með touch virknina reyndi ég fyrst að nota “`@use-gesture react`”, en ég lenti í svo ótrúlega miklum vandamálum með það, þurfti að endurskrifa kóðann aftur og aftur, að ég gafst para upp. Fattaði ekki beint hvernig það virkaði.
>    Þó að það sjé eld gamalt, þá ákvað ég að skipti yfir í `hammer.js` og það virkaði fínt.
>    Ég náði að útfæra touch virknina `pan`, `rotate` og `pinch`  með SVG myndina.

---

### [2. Hand👋 gesture (50%)](https://github.com/GunnarThorunnarson/FORR3FV05EU/blob/master/Verkefni/Verkefni4.md#2-hand-gesture-50) (Vika 2)

* [X] 1.Notaðu hand gesture til að stýra (hand tracking) 3D hlut á skjá með pose skipunum til að annaðhvort :
  * [X] `rotate` ↪️(x,y,z ás)
  * [ ] `zoom`🔍 inn og út.
* [ ] 2.Stýrðu 3D🧊hlut í AR með rotate (x, y ás).

> 1. *(Kóðinn og myndir eru í `/HandGestureCube`)*
>    Í viku 2 kom C++ kennarinn til baka eftir að hafa verið veikur í tvær vikur, svo við allir í C++ þurftum að drífa okkur helling að klára verkefni og læra fyrir 35% próf allt í einni viku, svo ég gleymdi aðeins að vinna í Hand Gestures almennilega.
>    Eftir að rifja upp hvernig three.js virkaði náði ég að úthluta :
>
> * X-ás stýring með `Thumb_Up` ↑👍 & `Thumb_Down` ↓👎
> * Y-ás stýringu með `Open_Palm`←✋ & `Closed_Fist` →✊
> * Z-ás stýringu með `Victory`↶✌️ & `ILoveYou`↷🤟
>
> 2. *(Kóðinn er í `/AR`)*
>    Ég náði því miður ekki að klára kóðann fyrir AR object rotate. Ég var ekki alveg viss hvort að það átti að nota hand gestures eða touch í það (kannski var það sagt í tíma, veit ekki alveg. Ég er alltaf í árekstrum á Föstudögum.), en ég reyndi allavega að útfæra touch. Lendi samt í veseni, og mér sýnist það virka ekki.
>    Kóðinn átti að nota event listener til að stilla `cube.rotate` svo að það væri það sama og touch hreyfingin, en það virkaði ekki.
