### Verkefni 2 - (20%)

Einstaklingsverkefni <br>
Tími: 3 vikur

---

#### 2.1 Grunnatriðin í 3D tölvugrafík 

**a)** Útskýrðu stuttlega rasterization og ray tracing **(0.5%)** <br>

**b)** Útskýrðu eftirfarandi hugtök **(1%)**: 

1.	WebGL
1.	GPU
1.	GLSL 
1.	Vertex
1.	Primative 
1.	Fragment 
1.	Pixel
1.	Clip space
1.	View frustum
1.	Z-buffering
1.	Right-hand coordinate system (RHS)
1.	Frame buffer
1.	Shaders
1.	FPS. Afhverju er það mismunandi eftir t.d. bíómyndi og tölvuleikir
1.	Refresh rate t.d. 60 Hertz
    
**c)** Útskýrðu rendering pipeline í WebGL útfrá JavaScript, GLSL, buffer, triangle, rasterizer, fragment shaders. **(0.5%)**

---

#### 2.2. 3D hlutur með Three.js (18%)

1. (1%) Gerðu viðeigandi stillingar fyrir vafra; aspect ratio og auto resize.
1. (1%) Búðu til senu, stilltu myndavél og sjónarhorn.
1. (4%) Búðu til einfaldan samsettan hlut (Group) úr mismunandi grunnformum (built-in geometric) að eigin vali (lágmark 3).
1. (2%) Material og Texture. Notaðu material sem tekur ljós (_ekki nota MeshBasicMaterial_). Notaðu einnig TextureLoader (material.map). 
1. (2%) Bættu við ljósi í senuna; DirectionalLight, AmbientLight, HemisphereLight.
1. (2%) bættu við tilbúnum hlut (glTF) sem inniheldur animation clips í senuna að eigin vali.
1. (2%) Camera Control. Notaðu Orbit control til að geta skoðað hlut í 3D umhverfi með mús eða touch.
1. (4%) Gagnvirkni. Þegar smellt er á hlut (eða skjá) þá á hlutur að hreyfa sig (animation) eða lögun og útlit að breytast (transform).

**Sýnidæmi;** [Kind](https://codepen.io/elliezen/pen/GWbBrx), [Kamelljón](https://codepen.io/elliezen/pen/evXgdE), [Fuglar](https://codepen.io/Yakudoo/pen/LVyJXw), [Ljón](https://codepen.io/Yakudoo/full/YXxmYR/), [Dreki](https://codepen.io/Yakudoo/pen/yNjRRL)
<br>

**Athugið:**<br>
- Nemendur mega ekki hafa sama eða sambærilegan 3D hlut og animation. <br>
- Þetta á að vera 100% ykkar sköpun, ekki tutorial með breytingum.
- Kóði á að vera vel skipulagður með íslenskum athugasemdum. 
- Það er í boði að nota JS safn með Three.JS fyrir animation vinnslu t.d Anime.JS eða [GreenSock](https://greensock.com/). Sjá [tutorial](https://www.youtube.com/watch?v=6oFvqLfRnsU)

---

### Námsmat og skil
Gefið er fullt fyrir rétt og fullnægjandi útfærslu á lið, hálft fyrir lið sem er ábótavant.<br>

Skila þarf á Innu vefslóð á sér Github repository sem inniheldur:

1. svör og kóðalausn.
1. Vefsíðu [Github page (docs)](https://pages.github.com/) sem hýsir 3D three.js hlut (V2.2). 
