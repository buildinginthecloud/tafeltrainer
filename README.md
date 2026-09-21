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

1. Stuur `index.html` via AirDrop naar de iPad, of mail het bestand
   naar jezelf.
2. Bewaar het in de Bestanden-app, bijvoorbeeld in iCloud Drive.
3. Open het bestand. Kiest iPadOS een voorvertoning in plaats van Safari,
   tik dan op het deelicoon en kies Safari.

Safari wist bij lokale bestanden soms de opgeslagen scores. De app merkt dat
en toont een waarschuwing op het startscherm; spelen blijft werken. Publiceer
het bestand op een webadres als de scores echt moeten blijven staan.

## Controleren na een wijziging

```bash
node test/test.mjs
```

De testharnas leest het script rechtstreeks uit `index.html` en speelt
examens en sprints na met een minimale DOM-vervanger. Er is geen TypeScript
en geen eslint in dit project, dus `tsc` en `eslint` zijn niet van toepassing.
