# Tafeltrainer

Oefen- en toetsapp voor de tafels van 1 tot en met 10. Eén HTML-bestand,
geen internet nodig, scores blijven lokaal in de browser.

## Onderdelen

- **Examen**: 100 sommen van één tafel in 8 minuten. Elke som komt tien keer
  voorbij, geschud, nooit twee keer achter elkaar dezelfde.
- **Sprint**: 20 sommen tegen de klok. Elke fout kost 3 seconden straftijd.
  Het beste totaal per tafel blijft bewaard als record.
- **Mix**: tik op de tegel "Mix van meerdere tafels" en het cijferraster
  verandert in aanvinkknoppen. De vragen worden gelijk over de aangevinkte
  tafels verdeeld, minimaal twee tafels. De mix houdt eigen scores bij, los
  van de losse tafels.
- **Statistieken**: beste score per tafel en voor de mix, de laatste tien
  examens, de vijf lastigste sommen en de behaalde medailles.

## Op de iPad zetten

De app staat online op <https://buildinginthecloud.github.io/tafeltrainer/>.

1. Open die link in Safari op de iPad.
2. Tik op het deelicoon en kies "Zet op beginscherm".
3. De app staat nu als icoon tussen de andere apps en opent schermvullend.

Elk apparaat houdt zijn eigen scores bij in de browseropslag. Internet is
alleen nodig bij het openen.

Safari op iOS en iPadOS opent geen `file://`-adressen, dus een lokaal
gekopieerd bestand komt daar niet verder dan een voorvertoning zonder
adresbalk en zonder blijvende opslag. Gebruik de link.

## Publiceren

Een wijziging staat na een push naar `main` binnen een minuut of twee online:

```bash
git push
```

## Controleren na een wijziging

```bash
node test/test.mjs
```

De testharnas leest het script rechtstreeks uit `index.html` en speelt
examens en sprints na met een minimale DOM-vervanger. Er is geen TypeScript
en geen eslint in dit project, dus `tsc` en `eslint` zijn niet van toepassing.
