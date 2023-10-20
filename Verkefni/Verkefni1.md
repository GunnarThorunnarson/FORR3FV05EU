## Verkefni 1 

- 2D tölvugrafík, [SVG](https://github.com/GunnarThorunnarson/FORR3FV05EU/wiki/SVG) og [kvikun](https://github.com/GunnarThorunnarson/FORR3FV05EU/wiki/Kvikun)
- 10% af heildareinkunn
- Einstaklingsverkefni

---

### Verkefnalýsing

#### 1. SVG (50%)
Búðu til SVG logo fyrir [félag eða klúbb innan Tækniskólans](https://tskoli.is/felagslif/skola-og-nemendafelog/) með notkun Inkscape (path) og VS Code kóðaritli saman. Sjá t.d. [Logo Design tutorial með Inkscape](https://inkscape.org/~logosbynick/%E2%98%85logo-design-tutorial).

SVG Logo þarf að innihalda eftirfarandi:

- [ ] Bezier curve `<path>` notkun með Inkscape.
- [ ] Grunnform `<rect> <circle> <ellipse> <line> <polyline> <polygon> `
- [ ] Logo er samsett af nokkrum SVG formum `<g> <defs>`
- [ ] Fills and Stroke 
- [ ] Text
- [ ] Transformations (translation, rotation, scaling, skewing)
- [ ] Stilltu af svæðið `viewBox viewport`
- [ ] Bónus (má sleppa); _gradients, pattern, clipping and masking, embedding raster images, filter effects_ 

Notaðu _Pen tool_ í [Inkscape](https://github.com/GunnarThorunnarson/FORR3FV05EU/wiki/Inkscape) til að teikna eingöngu útlínur (Bezier curve). <br>
Notaðu því næst [tól](https://github.com/GunnarThorunnarson/FORR3FV05EU/wiki/SVG#t%C3%B3l-til-a%C3%B0-hreinsa-svg-teikningu) til að hreinsa SVG teikningu (fækka punktum og óþarfa kóða) sem þú gerðir með Inkscape og færðu yfir í VSCode kóðaritil. Káraðu svo SVG logo með kóða í VSCode, notaðu _**Inline SVG**_. 

---

#### 2. bættu við kvikun með CSS (50%)

- [ ] Notaðu [transitions](https://material.io/design/iconography/animated-icons.html#transitions) til að gera mjúka breytingu á milli [state](https://material.io/design/interaction/states.html#usage).
- [ ] Notaðu transforms (rotate, scale, skew, translate) til að breyta frá einni stöðu í aðra stöðu. sjá t.d. [shape and motion](https://material.io/design/shape/shape-motion.html#morphing-shape)
- [ ] Notaðu animation. Skoðaðu [Understanding motion](https://material.io/design/motion/understanding-motion.html#principles) og [CSS Animation for Beginners](https://thoughtbot.com/blog/css-animation-for-beginners)
- [ ] Bónus (má sleppa): Sequencing, tengdu 2 animation saman (samsett animation).

 CSS í `<style>` á að vera innan um `<SVG>`, dæmi: 
 
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
---

### Námsmat og skil.
Vistaðu skránna með .svg endingu og skilaðu á Innu. <br>
Einkunn fyrir hvorn lið: 
- 4/4 lausn er vel útfærð.
- 3/4 lausn er smávægilega ábótavant (eitthvað vantar, virkni ábótavant).
- 2/4 lausn er ábótavant, helmingur er vel útfærður.
- 1/4 lausn er stórlega ábótavant, tíma og kóðavinna lögð í lausn.
- 0/4 lausn vantar eða óunnin.
