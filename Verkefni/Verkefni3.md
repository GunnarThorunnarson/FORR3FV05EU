## Verkefni 3
- [Three.js](https://github.com/GunnarThorunnarson/FORR3FV05EU/wiki/3D-t%C3%B6lvugraf%C3%ADk) og [WebAR](https://github.com/GunnarThorunnarson/FORR3FV05EU/wiki/Framlengdur-veruleiki-(XR))
- 25% af heildareinkunn
- Einstaklingsverkefni

---

### Verkefnalýsing
Búðu til vöruvefsíðu (e-commerce) þar sem hægt er að lesa sig til um og skoða vöru sem er í þrívídd. Eins á að vera hægt að smella á takka og skoða vöru í víðbættum veruleika (AR) með símanum, [sýnidæmi](https://www.onirix.com/learn-about-ar/e-commerce-3d-viewer/).

#### 1. Three.js (80%)
1. [ ] Vafri er [sveigjanlegur](https://threejs.org/manual/#en/responsive) þar sem 3D hlutur heldur réttum hlutföllum innan um texta á vefsíðu. (**10%**)
1. [ ] Veldu grunnform til að vinna með (t.d. terrain) í senu. Notaðu material t.d. `MeshStandardMaterial` sem tekur ljós (_ekki nota MeshBasicMaterial_). Notaðu TextureLoader og texture að eigin vali. (**10%**) 
1. [ ] Bættu við tilbúnum hlut (glTF) að eigin vali (með eða án animation clip) í senuna. (**10%**) 
1. [ ] Skannaðu 3D hlut (glTF/GLB) að eigin vali og bættu honum í senuna. (**20%**)
1. [ ] Bættu við ljósi (Directional Lighting og Ambient Lighting) og skugga í senuna. (**10%**)
1. [ ] Notaðu anime.js með Three.js. Láttu td. 3D hlut snúast og hreyfast sjálfkrafa eða með takka, [sýnidæmi](https://henryegloff.com/how-to-use-anime-js-with-three-js/). (**10%**)
1. [ ] Camera Control. Notaðu Orbit control og valdar stillingar til að geta skoðað 3D hluti í þrívídd með mús og touch. (**10%**)

#### 2. WebAR (20%)
1. [ ] Það er hægt að sjá 3D hlut í bland við raunverulegt umhverfi með símanum þegar smellt er á `AR` takka á vefsíðunni. (**10%**)
1. [ ] Notaðu `hit test` og [Anchors](https://developers.google.com/ar/develop/anchors) til að staðsetja 3D hlut í umhverfinu. (**10%**)

<br>

> **Ath:** Senan sem inniheldur 3D hluti þarf að vera með heildrænt útlit og þeir þurfa að tengjast með skynsamlegum hætti. Nemendur mega heldur ekki hafa sama eða sambærilegan 3D skannaðan hlut. 

---

### Námsmat og skil
- Fyrir hvern lið er gefið fullt fyrir fullnægjandi útfærslu, hálft ef hann er ábótavant.
- Skilaðu á Innu öllum skrám.
<!-- (líka ljósmynd af skönnuðum hlut) -->

> **Ath:** Nemandi þarf að geta gert grein fyrir öllum kóða og lausn munnlega til að fá einkunn fyrir verkefni (ef kennari óskar eftir því).

<!-- vefslóð sem sýnir 3D hlut. Notaðu Github Pages (notaðu docs möppu sem vefrót) sem hýsir og sýnir 3D hlut (link á raw skrá). -->

<!--
:exclamation: Hýsing á Github <br>
Það þarf að breyta slóð á **glb** ef við viljum láta Github hýsa 3D hlut. Nota þarf _raw_ slóðina á mynd og _master_ í staðinn fyrir _docs_ _https://raw.githubusercontent.com/GunnarThorunnarson/FORR3FV05EU/master/assets/models/Parrot.glb_ sjá [notkun](https://github.com/GunnarThorunnarson/FORR3FV05EU/blob/master/docs/src/World/components/birds/birds.js).
-->
