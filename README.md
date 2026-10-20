# Legegrupper

Et lille webværktøj, der laver en plan for legegrupper i en klasse. Planen består af et antal runder, fx én per måned. I hver runde bliver alle børn fordelt i grupper på cirka K børn, og hver gruppe har en vært.

Værktøjet prøver at opnå tre ting:

- Alle børn har været i gruppe med alle andre.
- Hvert barn er vært lige mange gange, og værtskaberne er spredt ud over året.
- Grupperne er så forskellige som muligt, så de samme børn sjældent mødes igen.

Alt bliver beregnet i browseren, så navnene bliver ikke sendt til en server.

Prøv det på <https://johanrosenkilde.github.io/legegruppe/>.

## Sådan bruger du det

1. Skriv børnenes navne, ét per linje.
2. Vælg, hvor mange børn der cirka skal være i hver gruppe. Når antallet ikke går op, får nogle grupper ét barn mere.
3. Vælg antal runder, eller lad feltet stå tomt. Så finder værktøjet det mindste antal runder, hvor alle har mødt alle.
4. Klik **Lav plan**. Klik **Nyt forslag** for at få en anden plan med de samme indstillinger.

Hver runde har et felt, hvor du kan skrive en dato eller en måned. Planen kan hentes som CSV eller udskrives.

Adressen i browseren indeholder navne, indstillinger, plan og etiketter, så du kan gemme planen som et bogmærke. Klik **Del planen** for at få et link, der kun viser planen, uden redigering. Den, der får linket, kan klikke på sit barn og se barnets grupper og værtskaber.

Indholdet står komprimeret og base64-kodet i adressen, så navnene ikke kan læses direkte. Det er ikke kryptering: alle med linket kan se planen. Indholdet står efter `#` i adressen, så browseren sender det ikke til serveren.

### Mærker

Du kan give børn et fælles mærke ved at skrive det efter navnet med et komma, fx `Ida, A`. Slår du **Intet barn er alene med sit mærke i en gruppe** til, er et barn med et mærke aldrig det eneste med mærket i sin gruppe. En gruppe har altså enten ingen eller mindst to børn med samme mærke. Børn uden mærke tæller ikke med.

Reglen kan kræve flere runder, før alle har mødt alle. Tag fx en klasse med 24 børn i grupper af 4, hvor 5 af børnene har mærket A. I hver runde skal de 5 fordeles med mindst to i hver gruppe, de er i, fx 2 i én gruppe og 3 i en anden:

- I gruppen med 2 møder de hver 2 børn uden mærket. Det giver 2 · 2 = 4 møder.
- I gruppen med 3 møder de hver 1 barn uden mærket. Det giver 3 · 1 = 3 møder.

De 5 børn møder altså tilsammen højst 7 af de andre børn per runde. De skal møde hver af de 19 andre, i alt 5 · 19 = 95 møder, så planen kræver mindst 95 / 7 ≈ 14 runder. Uden reglen er 8 runder nok i princippet. Værktøjet viser den nedre grænse i overblikket.

## Matematikken bag

Hver runde er en opdeling af alle børn i grupper. En plan, hvor alle par mødes mindst én gang, hedder et *resolvable covering design*. Problemet er beslægtet med *Social Golfer Problem* og Kirkmans skolepigeproblem. I Kirkmans problem går 15 piger i grupper af 3 over 7 dage, og hvert par mødes præcis én gang.

Med G grupper per runde og grupper på s børn gælder:

- Et barn møder s − 1 andre per runde, så alle par kræver mindst ⌈(N − 1)/(s − 1)⌉ runder.
- Hver runde har G værter. Hvis hvert barn skal være vært præcis én gang, skal planen have N/G runder.

Begge krav kan kun opfyldes samtidig, når s(s − 1) ≥ N − 1, altså når grupperne har mindst cirka √N + 1 børn. Ellers bliver nogle børn vært flere gange end andre, men aldrig mere end én gang flere.

### Algoritmen

Grupperne bliver fundet med *simulated annealing*. Et træk bytter to børn i forskellige grupper i samme runde. Halvdelen af trækkene er målrettede: de flytter et barn ind i gruppen hos et barn, det endnu ikke har mødt. Omkostningen er summen over alle par:

- 10 for et par, der aldrig mødes,
- (c − 1)³ for et par, der mødes c gange,
- 1000 hver gang et barn er alene med sit mærke i en gruppe.

Planens samlede strafpoint er summen af de to første led. Siden viser strafpoint sammen med en nedre grænse, så du kan sammenligne forslag. Grænsen bygger på, at to runder altid har et vist antal par til fælles: deres G² gruppe-fællesmængder summerer til N, så nogle af dem indeholder mindst to børn. Det giver en ulighed for, hvor mange par der mødes flere gange. Grænsen er optimum af det lineære program, der følger af den ulighed og af det samlede antal møder.

For 24 børn i 4 grupper af 6 over 6 runder giver det: antallet af par, der aldrig mødes, plus antallet af par, der mødes 3 gange, er mindst 36. Planen kan altså ikke både nå rundt til alle og undgå, at nogle par mødes 3 gange. Ingen plan kan komme under 300 strafpoint.

Knappen **Søg grundigere** starter én længere søgning per processorkerne, højst 8, som kører samtidig. Planen med færrest strafpoint bliver beholdt.

Værterne bliver fordelt bagefter med en tilsvarende søgning. Søgningen udjævner først antallet af værtskaber og spreder dem derefter i tid.

Når antallet af runder ligger tæt på den nedre grænse, finder søgningen ikke altid en plan, hvor alle mødes. Det gælder fx for 24 børn i grupper af 4 med 8 runder, selvom litteraturen tyder på, at en sådan plan findes. Typisk er én eller to ekstra runder nok. Kendte eksakte konstruktioner som affine planer og Kirkman-systemer er ikke indbygget, men søgningen finder dem selv i små tilfælde (15/3/7 og 25/5/6).

## Udvikling

Værktøjet er en statisk side uden afhængigheder og uden build-trin:

- `index.html` indeholder sidens tekst og CSS.
- `app.js` indeholder brugerfladen.
- `solver.js` indeholder algoritmen.
- `worker.js` kører algoritmen i baggrunden, så siden ikke fryser.
- `fonts/` indeholder skrifterne Shantell Sans og Atkinson Hyperlegible, som begge er udgivet under SIL Open Font License.

Du kan åbne `index.html` direkte i browseren.

Kør testene med Node.js 18 eller nyere:

```sh
node test.js
```

## Licens

MIT. Se [LICENSE](LICENSE).
