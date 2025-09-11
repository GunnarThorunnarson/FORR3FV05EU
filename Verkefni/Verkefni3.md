## Verkefni 3
- [3D tölvugrafík](https://github.com/GunnarThorunnarson/FORR3FV05EU/wiki/3D-t%C3%B6lvugraf%C3%ADk)
- 15% af heildareinkunn
- Einstaklingsverkefni
  
---

### Verkefnalýsing
Búðu til einfalda vefsíðu með Three.js. Vefsíðan inniheldur 3D hlut ásamt textalýsingu um hlut (eða vöru). Notandi á að geta skoðað hlut frá öllum hliðum, [sýnidæmi](https://www.onirix.com/learn-about-ar/e-commerce-3d-viewer/). 

<!-- Notaðu Github Pages til að hýsa vefsíðuna og 3D hlut (link á raw skrá). -->

#### Verkþættir:

1. [ ] Vefsíðan er vel framsett með textaýsingu, takka og div sem geymir 3D hlut og takka í símaútgáfu og desktop. **(15%)**
1. [ ] Vefsíðan er [sveigjanleg](https://threejs.org/manual/#en/responsive) þar sem sena heldur réttum hlutföllum á vefsíðu. (**10%**)
1. [ ] Veldu grunnform til að vinna með (t.d. terrain) í senu. Notaðu material t.d. `MeshStandardMaterial` sem tekur ljós (_ekki nota MeshBasicMaterial_). Notaðu TextureLoader og texture að eigin vali. (**10%**) 
1. [ ] Bættu við tilbúnum hlut (glTF) að eigin vali (með eða án animation clip) í senuna. (**20%**) 
1. [ ] Bættu við ljósi (Directional Lighting og Ambient Lighting) og skugga í senuna. (**10%**)
1. [ ] Notaðu anime.js með Three.js. Láttu 3D hlut birtast með transition og svo snúast sjálfkrafa, [sýnidæmi](https://henryegloff.com/how-to-use-anime-js-with-three-js/). Láttu 3D hlut einnig breyta t.d um lit eða lögun eða vinna með innbyggða kvikun (þ.e. ef glTF inniheldur animation clip). (**20%**) 
1. [ ] Camera Control. Notaðu Orbit control og valdar stillingar til að geta skoðað 3D hluti í þrívídd (snúið í allar áttir). (**15%**)

<br>

> **Ath:** Senan sem inniheldur 3D hluti þarf að vera með heildrænt útlit og þeir þurfa að tengjast með skynsamlegum hætti.


---

### Námsmat og skil
- Fyrir hvern lið er gefið fullt fyrir fullnægjandi útfærslu, hálft ef ábótavant. 
- Skila þarf á Innu kóðaskrár. 

> **Ath:** Nemandi þarf að geta gert grein fyrir öllum kóða og lausn til að fá einkunn fyrir verkefni (ef kennari óskar eftir því).


<!--
:exclamation: Hýsing á Github <br>
Það þarf að breyta slóð á **glb** ef við viljum láta Github hýsa 3D hlut. Nota þarf _raw_ slóðina á mynd og _master_ í staðinn fyrir _docs_ _https://raw.githubusercontent.com/GunnarThorunnarson/FORR3FV05EU/master/assets/models/Parrot.glb_ sjá [notkun](https://github.com/GunnarThorunnarson/FORR3FV05EU/blob/master/docs/src/World/components/birds/birds.js).
-->
