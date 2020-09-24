## Verkefni 1 – SVG og kvikun (20%)  
* Tími: 3 vikur.
* Einstaklingsverkefni
* Viðfangsefni: SVG, kvikun og 2D viðmótsforritun.

### 1.1 SVG (10%) 
Búðu til SVG logo sem þú býrð til frá grunni e. inline með kóða í ritli. Logo þarf að innihalda m.a. samsetningu af SVG teikningum og e. Bezier curve notkun (`path`). [Dæmi um tvö SVG logo - tré og tækniskólinn](https://kodun.is/) <br>

**Ath**. Fyrir þá sem vilja þá er í boði að nota teikniforrit (t.d. Inkscaoe) til að teikna path og curves. Muna þá að nota tól til að hreinsa teikningu (fækka punktum og óþarfa kóða) og færa yfir í kóðaritil.

### 1.2 Kvikun (10%) 
Bættu við kvikun. Logo verður að breytast á einhvern hátt t.d. útlit, lögun eða hreyfing (e. transition og e. transform) við atburð (t.d. við snertingu/mús eða tíma). Notaðu CSS (transitions, transforms, animation) til að ná þessu fram. 

Dæmi um SVG logo með kvikun [SVG Logo á CodePen](https://codepen.io/search/pens?q=svg+logo&page=1&order=popularity&depth=everything&cursor=ZD0xJm89MCZwPTI=)

### Námsmat og skil.
Einkunn er byggð á notkun SVG og kvikun sem og vinnuframlagi (m.t.t. vægis verkefnis og tíma).

* Einkunnarskali; 10, 7.5, 5, 2.5, 0 fyrir hvern lið. 
* CSS í `<style>` á að vera innan um `<SVG>` 
* Vistaðu svo skránna með .svg endingu 
* Skilaðu á Innu vefslóð á repository (t.d. fyrir áfangann) sem inniheldur SVG skrá.
 
 Dæmi: 
 ```
 <svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
  <style>
    circle {
      fill: gold;
      stroke: maroon;
      stroke-width: 2px;
    }
  </style>
  <circle cx="5" cy="5" r="4" />
</svg>
 ```

 
