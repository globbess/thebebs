/* Languages: English (as written in index.html), Swedish and Spanish.

   Every bit of text on the page carries a key (data-i18n, data-i18n-html for
   text with a little markup, data-i18n-attr="attribute:key" for labels and
   placeholders). The English is read from the page itself, so editing
   index.html keeps working; the Swedish and Spanish live below. The other
   scripts ask window.t(key, english) for the text they write themselves, and
   redraw when the language changes ('langchange').

   The site opens in the visitor's own language if their phone or computer is
   set to Swedish or Spanish, otherwise English, and remembers what they pick
   with the EN · SV · ES switch in the top corner.

   Spanish is Latin American with a few Honduran touches (colocho, catracha,
   carro, grama); Swedish uses OSA for RSVP. Worth a read-through by Lonis and
   Andrea, especially the jokes. */

(() => {
  'use strict';

  const SV = {
    'title': 'Lonis & Andrea — 12 juni 2027',
    'lang.label': 'Språk',

    'hero.kicker': 'Låt oss fira kärleken',
    'hero.date': '12 juni 2027',
    'hero.place': 'Rösås, Bäckaby, Sverige',
    'rsvp.button': 'OSA',
    'cd.label': 'Nedräkning till 12 juni 2027',
    'cd.day': 'dag', 'cd.days': 'dagar',
    'cd.hour': 'timme', 'cd.hours': 'timmar',
    'cd.minute': 'minut', 'cd.minutes': 'minuter',
    'cd.today': 'Det är idag!',
    'cd.married': 'Nygifta',

    'story.title': 'Vår historia',
    'story.next.0': 'Kortversion',
    'story.next.1': 'Fortfarande för långt?',
    'story.next.2': 'Okej, en mening',
    'story.next.3': 'Hela historien',
    'story.nudgeClick': 'klicka här',
    'story.nudgeTap': 'tryck här',
    'story.long.1': 'Hur träffar en tech-nörd från Sverige en baddie från Honduras? På Roatán, en liten ö i Karibien, såklart, där de båda var med och byggde en helt ny, fri stad från grunden.',
    'story.long.2': 'Andrea hade bett om sin framtida man varenda dag, med en lista så lång och så specifik att hon ibland undrade om hon var lite väl verklighetsfrånvänd. Lonis hade samtidigt precis flyttat till en ö full av libertarianer, inte direkt känd för sitt dejtingliv, och hade i tysthet accepterat att hans släktlinje skulle ta slut just där. Sedan träffades de. Hon hade tjatat på Gud varje dag, och han hade bara tur. För ordningens skull: hon var inte alls verklighetsfrånvänd. Varenda punkt på listan bockades av, lockigt hår inräknat.',
    'story.long.3': 'De gick från att bygga en fri stad till att bygga ett liv och en familj. Sedan dess har de jagat äventyr över hela världen, men det bästa är fortfarande vardagen, tillsammans. I dag bor de i San Francisco, där Lonis driver en AI-investeringsfond och har väldigt roligt med det. Båda har alltid varit helt uppslukade av AI och teknik, så staden passar dem bra, i alla fall för nu. Fråga dem om det på bröllopet. Eller låt bli, om du vill hinna ut på dansgolvet.',
    'story.long.4': 'De längtar efter att fira med dig!',
    'story.tldr.1': 'En svensk tech-nörd, en honduransk baddie och en libertariansk ö med tveksamma dejtingutsikter.',
    'story.tldr.2': 'Andrea hade bett Gud om sin drömman; Lonis hade accepterat att hans släktlinje skulle ta slut. Sedan träffades de. Hennes böner besvarades, han hade tur, och hans lockiga hår avgjorde saken.',
    'story.tldr.3': 'De gick från att bygga en fri stad till att bygga ett liv och en familj, och deras favoritäventyr är fortfarande vardagen, tillsammans. Nu bor de i San Francisco, lyckligt AI-frälsta och drömmer om vad som kommer härnäst.',
    'story.tldr.4': 'De längtar efter att fira med dig! <span class="emoji">❤️</span>',
    'story.short': 'Libertariansk ö. Noll kvinnor. En baddie. Släktlinjen räddad. <span class="emoji">❤️</span>',
    'story.emojiLabel': 'Sverige, en tech-nörd och en laptop, plus Honduras och en manikyr, plus en ö, blir en ring',

    'day.maps': 'Öppna i kartor',
    'day.intro': 'Lonis favoritplats från barndomen, mitt i den soliga årstid de tycker allra bäst om. I juni går den svenska solen knappt ner, så räkna med en lång, gyllene kväll på landet med de människor de älskar mest.',
    'day.when': 'När',
    'day.whenValue': 'Lördag 12 juni 2027',
    'day.whenTime': 'Tid meddelas senare',
    'day.where': 'Var',
    'day.whereValue': 'Rösås, Bäckaby, Sverige',
    'day.dress': 'Klädsel',
    'day.dressValue': 'Sommarfint',
    'day.dressNote': 'Klackar är välkomna, men firandet blir troligen utomhus (om vädret tillåter), så ta med skor som klarar gräs och dans.',
    'day.hondurasValue': 'Det blir också ett firande i Honduras. Mer information kommer.',

    'schedule.title': 'Helgen',
    'schedule.calendar': 'Lägg till i kalendern',
    'cal.google': 'Google Kalender',
    'cal.apple': 'Apple Kalender',
    'schedule.1.day': 'Fre 11',
    'schedule.1': '<em>Välkomstmiddag</em><br>En grillkväll för att dra igång helgen.',
    'schedule.2.day': 'Lör 12',
    'schedule.2': '<em>Bröllopet</em><br>Vigsel, middag och dans tills ljuset försvinner (eller inte).',
    'schedule.3.day': 'Sön 13',
    'schedule.3': '<em>Brunch, bad &amp; fotboll</em><br>Brunch, ett dopp i sjön vid Ramkvilla och fotboll på kvällen, en tradition för Lonis och Andrea.',

    'travel.title': 'Hitta hit',
    'travel.intro': 'Rösås ligger nära Bäckaby, djupt ute på landet, ungefär en halvtimme söder om Vetlanda. Det är härligt mitt ute i ingenstans, så på bröllopsdagen ordnar vi transport från Vetlanda. Mer information kommer.',
    'travel.america': 'Utrikes',
    'travel.americaAir': 'Med flyg',
    'travel.americaAirValue': 'Flyg till Köpenhamn, oftast enklast, eller till Stockholm.',
    'travel.americaTrain': 'Med tåg',
    'travel.americaTrainCph': '<span class="lead">Från Köpenhamn:</span> Ett direkttåg från flygplatsen tar dig till Växjö på ungefär 2½ timme, och därifrån är det cirka 50 minuter med bil. Du kan också åka tåg hela vägen till Vetlanda med byte i Nässjö, men sista sträckan går bara några gånger om dagen.',
    'travel.americaTrainSthlm': '<span class="lead">Från Stockholm:</span> Direkttåg från Stockholm Central till Nässjö går ungefär en gång i timmen och tar runt 3 timmar. Därifrån tar du Krösatåget till Vetlanda (cirka 30 minuter), och sedan är det ungefär en halvtimme med bil. Landar du på Arlanda? Ta Arlanda Express in till Stockholm Central först.',
    'travel.americaTrainNote': 'Ladda ner <a href="https://www.sj.se" target="_blank" rel="noopener">SJ-appen</a> för att se tider och köpa biljetter för varje del av resan, även de lokala tågen.',
    'travel.americaCar': 'Med bil',
    'travel.americaCarValue': 'Cirka 3½ timme från Köpenhamns flygplats, eller 4½ från Stockholm.',
    'travel.sweden': 'Inrikes',
    'travel.swedenAir': 'Med flyg',
    'travel.swedenAirValue': 'Närmaste flygplatser är Växjö, cirka 50 minuter bort, och Jönköping, cirka 1 timme och 20 minuter.',
    'travel.swedenTrain': 'Med tåg',
    'travel.swedenTrainValue': 'Från Stockholm tar du tåget till Nässjö och sedan Krösatåget till Vetlanda, cirka 30 minuter.',
    'travel.swedenCar': 'Med bil',
    'travel.swedenCarValue': 'Cirka 3 timmar från Göteborg eller Malmö, och 4½ från Stockholm.',

    'travel.stay': 'Boende',
    'stay.intro': 'De flesta boenden ligger 30–45 minuter bort med bil, och det finns inte så många rum i närheten, så boka gärna tidigt. Priserna är ungefärliga startpriser per natt för två; i juni kan de vara lite högre.',
    'stay.close': 'Nära &amp; enkelt · Vetlanda (cirka 30 min)',
    'stay.close1': 'Ett mysigt pensionat nära centrum, älskat för sin frukost.',
    'stay.close1Price': 'Från cirka $75 · 9,1/10',
    'stay.close2': 'Mitt emot tågstationen, med frukost och bastu.',
    'stay.close2Price': 'Från cirka $165 · 7,7/10',
    'stay.close3': 'Ett klassiskt hotell vid torget, frukost ingår.',
    'stay.close3Price': 'Från cirka $170 · 7,7/10',
    'stay.special': 'Speciella boenden · Värda resan',
    'stay.about45': '(cirka 45 min)',
    'stay.about35': '(cirka 35 min)',
    'stay.near': 'Nära',
    'stay.special1': 'Arkitektritade skogssviter på pålar med takfönster över sängen, ett skogsspa och en restaurang med råvaror från gården.',
    'stay.special1Price': 'Rum från cirka $200 · Skogssviter cirka $760, frukost ingår · 4,9/5',
    'stay.special2': 'En herrgård vid en sjö med röda stugor, vedeldad bastu, båtar och hemlagade middagar.',
    'stay.special2Price': 'Rum cirka $240–270 · Stugor cirka $340–380, frukost ingår · 4,7/5',
    'stay.special3': 'En herrgård från 1700-talet vid en sjö, i ett officiellt tyst område, med bastu och badtunna.',
    'stay.special3Price': 'Från cirka $165 per person, med frukost, bastu och badtunna · 4,5/5',
    'stay.value': 'Prisvärt · Perfekt för grupper',
    'stay.value1': 'Ett lugnt, enkelt hotell i skogen med 55 rum och restaurang. Smidigt för grupper.',
    'stay.value1Price': 'Från cirka $110',
    'stay.cabins': 'Stugor &amp; fritidshus',
    'stay.cabins1': 'En stuga för fyra eller ett glampingtipi för två, båda med bastu.',
    'stay.cabins1Price': 'Glamping från cirka $80 · Stuga från cirka $105 · 4,9/5',
    'stay.cabins2Name': 'Stuga vid sjön i Ramkvilla',
    'stay.cabins2': 'En stuga för fyra vid sjön Klockesjön, nära söndagens dopp.',
    'stay.cabins2Price': '4,78/5 · Superhost',
    'stay.more': 'Fler stugor i närheten',

    'rsvp.title': 'Är du med?',
    'rsvp.by': 'Meddela oss senast <em>30 april 2027</em> om du kan komma.',
    'rsvp.gifts': '<em>förresten,</em> att du kommer är den finaste presenten vi kan få. Vi är otroligt tacksamma att du tar dig hela vägen till Rösås för att fira med oss, så inga presenter behövs.',
    'rsvp.countMany': '{n} är med på festen!',
    'rsvp.countOne': '{n} är med på festen!',
    'rsvp.countZero': 'Bli först att tacka ja!',
    'form.kicker': 'OSA',
    'form.close': 'Stäng',
    'lb.open': 'Visa större',
    'lb.title': 'Bild',
    'form.name': 'Namn',
    'form.email': 'E-post',
    'form.attending': 'Kan du komma?',
    'form.choose': 'Välj…',
    'form.yes': 'Ja, det missar jag inte',
    'form.no': 'Tyvärr inte',
    'form.guests': 'Hur många är ni?',
    'form.dietary': 'Något du inte kan äta?',
    'form.dietaryHint': 'Allergier, vegetariskt, allt sånt',
    'form.song': 'En låt som får dig att dansa',
    'form.else': 'Något mer?',
    'form.send': 'Skicka',
    'form.sending': 'Skickar…',
    'form.thanks': 'Tack! Vi längtar efter att ses.',
    'form.failed': 'Det gick inte att skicka. Försök igen, eller skriv till oss direkt.',
    'form.soon': 'OSA öppnar snart. Försök igen om en liten stund.',
    'form.again': 'Har du redan svarat? Skicka igen med samma e-post, så gäller ditt senaste svar.',
    'mine.yesTitle': 'Du kommer ✓', 'mine.noTitle': 'Du har sagt att du inte kan komma',
    'mine.as': 'Svarat som {name}', 'mine.change': 'Ändra mina uppgifter', 'mine.cancel': 'Jag kan inte komma längre',
    'mine.come': 'Jag kan komma ändå!', 'mine.sure': 'Säker? Vi kommer att sakna dig.',
    'mine.yesCancel': 'Ja, avboka', 'mine.keep': 'Nej, jag kommer',
    'done.yesTitle': 'Woohoo!',
    'done.yesText': 'Vi ses den 12 juni ❤️',
    'done.yesNote': 'Håll utkik efter uppdateringar på mejl eller sms',
    'done.noTitle': 'Det är lugnt. Helt lugnt.',
    'done.noText': 'Vi dansar en låt för dig ❤️',

    'theme.toLight': 'Byt till ljust läge', 'theme.toDark': 'Byt till mörkt läge',
    'story.turnOver': 'Vänd på kortet', 'story.turnBack': 'Vänd tillbaka',
    'story.turnHint': 'psst, vänd blad',
    "gallery.title": "Galleri",
    "gallery.lede": "Ifall du inte hittade dem på sidan…",
    "gallery.found": "{n} av 15 hittade",
    "gallery.back": "Tillbaka till sidan",
    "gallery.first": "psst… {n} till gömmer sig någonstans",
    "gallery.last": "bara en kvar…",
    "gallery.done": "🪩 Du hittade alla 15. Dags för disco.",
    "arcade.label": "Bebs spelhall",
    "arcade.open": "psst… spelhallen tände just lamporna ↖",
    "g.grp.adventures": "Äventyr",
    "g.grp.little": "Små vi",
    "g.grp.upside": "Upp över öronen",
    "g.grp.rosas": "Rösås",
    "g.grp.weekend": "Helgen",
    "g.cap.roatan": "Roatán, Honduras",
    "g.note.roatan": "Där allt började.",
    "g.cap.prague": "Prag",
    "g.note.prague": "Vid floden, ett av många äventyr.",
    "g.cap.atitlan": "Atitlánsjön, Guatemala",
    "g.note.atitlan": "En kram högt ovanför sjön.",
    "g.cap.telaviv": "Tel Aviv",
    "g.note.telaviv": "Gyllene timmen i en stad som ligger Andrea varmt om hjärtat.",
    "g.cap.tallinn": "Tallinn, Estland",
    "g.note.tallinn": "Ännu en plats som ligger Andrea varmt om hjärtat.",
    "g.cap.gondola": "Uppe i en gondol",
    "g.note.gondola": "Högt över skogen och havet.",
    "g.cap.lonisKid": "Lille Lonis",
    "g.note.lonisKid": "Har levererat sedan dagen han föddes.",
    "g.cap.andreaKid": "Lilla Andrea",
    "g.note.andreaKid": "Croptoppar och lågmidjat innan hon kunde gå.",
    "g.cap.bloodline": "Upp över öronen",
    "g.note.bloodline": "Upp och ner i ett rum fullt av lysande prickar.",
    "g.cap.film:rosas": "Rösås på sommaren",
    "g.note.film:rosas": "Det röda huset ovanför klövern, där vi ska fira.",
    "g.cap.film:rosas-winter": "Rösås i snön",
    "g.note.film:rosas-winter": "Samma hus, på vintern.",
    "g.cap.rosasBridge": "Den lilla bron",
    "g.note.rosasBridge": "Över dammen på Rösås.",
    "g.cap.rosasDog": "En lånad hund",
    "g.note.rosasDog": "Inte vår, tyvärr.",
    "g.cap.film:football": "Söndagsfotboll",
    "g.note.film:football": "En tradition för Lonis och Andrea.",
    "g.cap.ramkvilla": "Sjön vid Ramkvilla",
    "g.note.ramkvilla": "Där vi badar på söndag.",
    'story.emojiCaption': 'En bild säger mer än tusen ord, antar jag.',
    'story.upsideDown': 'Upp över öronen, i alla bemärkelser.',
    'day.filmAlt': 'Ett rött svenskt hus på en kulle ovanför en äng full av klöver på sommaren',
    'day.winterAlt': 'Två personer som går uppför en snöig väg mot det röda huset och en stor kal ek på vintern',
    'day.bridgeAlt': 'En liten träbro över en damm med näckrosor, bland gröna träd',
    'day.dogAlt': 'Andrea och Lonis i solen med en stor fluffig hund',
    'schedule.footballAlt': 'Lonis, Andrea och vänner som spelar fotboll på en plan i solnedgången',
    'schedule.swimAlt': 'Lonis på en träbrygga vid en skogssjö, med en liten hund',
    'story.gondolaAlt': 'Lonis och Andrea högt upp i en gondol ovanför skogen och havet',
    'story.bloodlineAlt': 'Lonis och Andrea upp och ner i ett spegelrum fullt av lysande färgade prickar',
    'story.adventures': 'Äventyr överallt. Det bästa är fortfarande det vardagliga, tillsammans.',
    'story.tagPrague': 'Prag', 'story.tagAtitlan': 'Atitlánsjön', 'story.tagTelaviv': 'Tel Aviv', 'story.tagTallinn': 'Tallinn',
    'story.pragueAlt': 'Lonis och Andrea vid floden i Prag', 'story.telavivAlt': 'Lonis och Andrea i Tel Aviv i kvällssolen', 'story.tallinnAlt': 'Lonis och Andrea framför en katedral i Tallinn', 'story.atitlanAlt': 'Lonis och Andrea kramas ovanför Atitlánsjön',
    'story.roatanAlt': 'Lonis och Andrea blickar ut över havet på Roatán',
    'story.lonisKidAlt': 'Lonis som liten i Sverige', 'story.andreaKidAlt': 'Andrea som liten i Honduras',
    'story.babies': 'Lonis har levererat sedan dagen han föddes. Andrea har burit croptoppar och lågmidjat sedan innan hon kunde gå. På något sätt hittade de två varandra, och nu bygger de ett liv tillsammans.',
    'music.choose': 'Välj en låt',
    'music.songs': 'Låtar',
    'music.hide': 'Dölj spelaren',
    'music.play': 'Spela', 'music.pause': 'Pausa', 'music.by': 'av', 'music.on': 'på',
    'music.newTab': '(öppnas i en ny flik)',
    'music.tapStart': 'Tryck på ▶ för att starta',
    'music.tapFull': 'Tryck på ▶ för hela låten',

    'preview.cal': 'Att spara i kalendern fungerar när sajten är live.',
    'preview.rsvp': 'Det här är en förhandsvisning, så svaren skickas inte än. Det gör de när sajten är live.'
  };

  const ES = {
    'title': 'Lonis & Andrea — 12 de junio de 2027',
    'lang.label': 'Idioma',

    'hero.kicker': 'Celebremos el amor',
    'hero.date': '12 de junio de 2027',
    'hero.place': 'Rösås, Bäckaby, Suecia',
    'rsvp.button': 'Confirmar',
    'cd.label': 'Cuenta regresiva para el 12 de junio de 2027',
    'cd.day': 'día', 'cd.days': 'días',
    'cd.hour': 'hora', 'cd.hours': 'horas',
    'cd.minute': 'minuto', 'cd.minutes': 'minutos',
    'cd.today': '¡Es hoy!',
    'cd.married': 'Recién casados',

    'story.title': 'Nuestra historia',
    'story.next.0': 'Resumen',
    'story.next.1': '¿Todavía muy largo?',
    'story.next.2': 'Ok, en una línea',
    'story.next.3': 'Historia completa',
    'story.nudgeClick': 'haz clic aquí',
    'story.nudgeTap': 'toca aquí',
    'story.long.1': '¿Cómo se conocen un nerd tecnológico de Suecia y una baddie catracha? En Roatán, una islita en el Caribe, obvio, donde los dos estaban construyendo desde cero una ciudad libre totalmente nueva.',
    'story.long.2': 'Andrea le pedía a Dios por su persona todos los días, con una lista tan larga y tan específica que a veces se preguntaba si estaba un poquito delulu. Lonis, mientras tanto, se acababa de mudar a una isla llena de libertarios, no precisamente famosa por su vida amorosa, y ya se había resignado a que su linaje terminara ahí mismo. Y entonces se conocieron. Ella le había estado insistiendo a Dios todos los días, y él simplemente tuvo suerte. Para que conste, ella no estaba nada delulu: se cumplió todo lo de la lista, pelo colocho incluido.',
    'story.long.3': 'Pasaron de construir una ciudad libre a construir una vida y una familia. Desde entonces han vivido aventuras por todo el mundo, pero la mejor sigue siendo la de todos los días, juntos. Hoy viven en San Francisco, donde Lonis dirige un fondo de inversión en inteligencia artificial y se la está pasando de lo lindo. Los dos siempre han sido fanáticos de la IA y la tecnología, así que la ciudad les queda perfecta, por ahora. Pregúntales en la boda. O mejor no, si quieres llegar a la pista de baile.',
    'story.long.4': '¡Qué ganas de celebrar contigo!',
    'story.tldr.1': 'Un nerd tecnológico sueco, una baddie catracha y una isla libertaria con pocas opciones para el amor.',
    'story.tldr.2': 'Andrea le pedía a Dios el hombre de sus sueños; Lonis ya había aceptado que su linaje se acababa. Y entonces se conocieron. A ella le respondieron sus oraciones, él tuvo suerte, y su pelo colocho terminó de sellar el trato.',
    'story.tldr.3': 'Pasaron de construir una ciudad libre a construir una vida y una familia, y su aventura favorita sigue siendo la de todos los días, juntos. Ahora viven en San Francisco, felizmente obsesionados con la IA y soñando con lo que viene.',
    'story.tldr.4': '¡Qué ganas de celebrar contigo! <span class="emoji">❤️</span>',
    'story.short': 'Isla libertaria. Cero mujeres. Una baddie. Linaje salvado. <span class="emoji">❤️</span>',
    'story.emojiLabel': 'Suecia, un nerd y una laptop, más Honduras y una manicura, más una isla, es igual a un anillo',

    'day.maps': 'Abrir en mapas',
    'day.intro': 'El lugar favorito de Lonis desde su infancia, en la temporada soleada que más les gusta. En junio el sol sueco casi no se oculta, así que prepárate para una noche larga y dorada en el campo con las personas que más quieren.',
    'day.when': 'Cuándo',
    'day.whenValue': 'Sábado 12 de junio de 2027',
    'day.whenTime': 'Hora por confirmar',
    'day.where': 'Dónde',
    'day.whereValue': 'Rösås, Bäckaby, Suecia',
    'day.dress': 'Vestimenta',
    'day.dressValue': 'Formal de verano',
    'day.dressNote': 'Los tacones son bienvenidos, pero lo más probable es que la celebración sea al aire libre (si el clima lo permite), así que trae zapatos que aguanten grama y baile.',
    'day.hondurasValue': 'También habrá una celebración en Honduras. Detalles por confirmar.',

    'schedule.title': 'El fin de semana',
    'schedule.calendar': 'Agregar al calendario',
    'cal.google': 'Calendario de Google',
    'cal.apple': 'Calendario de Apple',
    'schedule.1.day': 'Vie 11',
    'schedule.1': '<em>Cena de bienvenida</em><br>Una carnita asada para arrancar.',
    'schedule.2.day': 'Sáb 12',
    'schedule.2': '<em>La boda</em><br>Ceremonia, cena y baile hasta que se vaya la luz (o no).',
    'schedule.3.day': 'Dom 13',
    'schedule.3': '<em>Brunch, chapuzón y fútbol</em><br>Brunch, un chapuzón en el lago de Ramkvilla y un partidito de fútbol en la tarde, una tradición de Lonis y Andrea.',

    'travel.title': 'Cómo llegar',
    'travel.intro': 'Rösås queda cerca de Bäckaby, en pleno campo, a una media hora al sur de Vetlanda. Está maravillosamente en medio de la nada, así que el día de la boda organizaremos transporte desde Vetlanda. Más detalles pronto.',
    'travel.america': 'Internacional',
    'travel.americaAir': 'En avión',
    'travel.americaAirValue': 'Vuela a Copenhague, que suele ser lo más fácil, o a Estocolmo.',
    'travel.americaTrain': 'En tren',
    'travel.americaTrainCph': '<span class="lead">Desde Copenhague:</span> Un tren directo desde el aeropuerto llega a Växjö en unas 2½ horas, y de ahí son unos 50 minutos en carro. También puedes ir en tren hasta Vetlanda con cambio en Nässjö, pero el último tramo solo sale unas pocas veces al día.',
    'travel.americaTrainSthlm': '<span class="lead">Desde Estocolmo:</span> Hay trenes directos de Stockholm Central a Nässjö más o menos cada hora, y tardan unas 3 horas. De ahí te subes al tren local Krösatåg hasta Vetlanda (unos 30 minutos) y luego es como media hora en carro. ¿Llegas a Arlanda? Primero toma el Arlanda Express hasta Stockholm Central.',
    'travel.americaTrainNote': 'Descarga la <a href="https://www.sj.se/en" target="_blank" rel="noopener">app de SJ</a> para ver horarios y comprar boletos para cada tramo, incluidos los trenes locales.',
    'travel.americaCar': 'En carro',
    'travel.americaCarValue': 'Unas 3½ horas desde el aeropuerto de Copenhague, o 4½ desde Estocolmo.',
    'travel.sweden': 'Desde Suecia',
    'travel.swedenAir': 'En avión',
    'travel.swedenAirValue': 'Los aeropuertos más cercanos son Växjö, a unos 50 minutos, y Jönköping, a una hora y veinte.',
    'travel.swedenTrain': 'En tren',
    'travel.swedenTrainValue': 'Desde Estocolmo, toma el tren a Nässjö y luego el Krösatåg local hasta Vetlanda, unos 30 minutos.',
    'travel.swedenCar': 'En carro',
    'travel.swedenCarValue': 'Unas 3 horas desde Gotemburgo o Malmö, y 4½ desde Estocolmo.',

    'travel.stay': 'Dónde quedarse',
    'stay.intro': 'La mayoría de los hospedajes quedan a 30–45 minutos en carro y hay pocos cuartos cerca, así que te recomendamos reservar con tiempo. Los precios son tarifas aproximadas por noche para dos personas; en junio pueden subir un poco.',
    'stay.close': 'Cerca y fácil · Vetlanda (unos 30 min)',
    'stay.close1': 'Una casa de huéspedes acogedora cerca del centro, famosa por su desayuno.',
    'stay.close1Price': 'Desde unos $75 · 9.1/10',
    'stay.close2': 'Justo frente a la estación de tren, con desayuno y sauna.',
    'stay.close2Price': 'Desde unos $165 · 7.7/10',
    'stay.close3': 'Un hotel clásico en la plaza del pueblo, con desayuno incluido.',
    'stay.close3Price': 'Desde unos $170 · 7.7/10',
    'stay.special': 'Lugares especiales · Valen el viaje',
    'stay.about45': '(unos 45 min)',
    'stay.about35': '(unos 35 min)',
    'stay.near': 'Cerca de',
    'stay.special1': 'Suites en el bosque diseñadas por un arquitecto, sobre pilotes y con un tragaluz sobre la cama, un spa en el bosque y un restaurante con productos de la granja.',
    'stay.special1Price': 'Habitaciones desde unos $200 · Suites del bosque unos $760, con desayuno · 4.9/5',
    'stay.special2': 'Una hacienda junto a un lago, con cabañas rojas, sauna de leña, botes y cenas caseras.',
    'stay.special2Price': 'Habitaciones unos $240–270 · Cabañas unos $340–380, con desayuno · 4.7/5',
    'stay.special3': 'Una casona del siglo XVIII junto a un lago, en una zona oficial de silencio, con sauna y jacuzzi.',
    'stay.special3Price': 'Desde unos $165 por persona, con desayuno, sauna y jacuzzi · 4.5/5',
    'stay.value': 'Buen precio · Ideal para grupos',
    'stay.value1': 'Un hotel tranquilo y sencillo en el bosque, con 55 habitaciones y restaurante. Práctico para grupos.',
    'stay.value1Price': 'Desde unos $110',
    'stay.cabins': 'Cabañas y casas de vacaciones',
    'stay.cabins1': 'Una cabaña para cuatro o un tipi de glamping para dos, ambos con sauna.',
    'stay.cabins1Price': 'Glamping desde unos $80 · Cabaña desde unos $105 · 4.9/5',
    'stay.cabins2Name': 'Casita junto al lago en Ramkvilla',
    'stay.cabins2': 'Una casita para cuatro junto al lago Klockesjön, cerca del chapuzón del domingo.',
    'stay.cabins2Price': '4.78/5 · Superanfitrión',
    'stay.more': 'Más cabañas cerca',

    'rsvp.title': '¿Contamos contigo?',
    'rsvp.by': 'Confírmanos antes del <em>30 de abril de 2027</em> si puedes venir.',
    'rsvp.gifts': '<em>por cierto,</em> nada de regalos, por favor. Estamos muy agradecidos de que hagan el viaje hasta Suecia para celebrar con nosotros y no podríamos pedir nada más que tener ahí a nuestras personas favoritas.',
    'rsvp.countMany': '¡{n} ya se unieron a la fiesta!',
    'rsvp.countOne': '¡{n} ya se unió a la fiesta!',
    'rsvp.countZero': '¡Sé de los primeros en unirte a la fiesta!',
    'form.kicker': 'Confirmación',
    'form.close': 'Cerrar',
    'lb.open': 'Ver en grande',
    'lb.title': 'Foto',
    'form.name': 'Nombre',
    'form.email': 'Correo',
    'form.attending': '¿Puedes venir?',
    'form.choose': 'Elige…',
    'form.yes': '¡Sí, no me lo pierdo!',
    'form.no': 'Lamentablemente no',
    'form.guests': '¿Cuántas personas vienen?',
    'form.dietary': '¿Algo que no puedas comer?',
    'form.dietaryHint': 'Alergias, vegetariano, lo que sea',
    'form.song': 'Una canción que te haga bailar',
    'form.else': '¿Algo más?',
    'form.send': 'Enviar',
    'form.sending': 'Enviando…',
    'form.thanks': '¡Gracias! Nos morimos de ganas de verte.',
    'form.failed': 'No se pudo enviar. Intenta otra vez o escríbenos directamente.',
    'form.soon': 'Las confirmaciones abren muy pronto. Intenta de nuevo en un ratito.',
    'form.again': '¿Ya respondiste? Envíalo de nuevo con el mismo correo y usaremos tu última respuesta.',
    'mine.yesTitle': '¡Vienes! ✓', 'mine.noTitle': 'Nos dijiste que no puedes venir',
    'mine.as': 'Respondiste como {name}', 'mine.change': 'Cambiar mis datos', 'mine.cancel': 'Ya no puedo ir',
    'mine.come': '¡Al final sí puedo ir!', 'mine.sure': '¿Seguro? Te vamos a extrañar.',
    'mine.yesCancel': 'Sí, cancelar', 'mine.keep': 'No, sí voy',
    'done.yesTitle': '¡Yujuu!',
    'done.yesText': 'Nos vemos el 12 de junio ❤️',
    'done.yesNote': 'Pendiente de tu correo o tus mensajes para más novedades',
    'done.noTitle': 'Todo bien, ya lloré.',
    'done.noText': 'Vamos a bailar una por ti ❤️',

    'theme.toLight': 'Cambiar a modo claro', 'theme.toDark': 'Cambiar a modo oscuro',
    'story.turnOver': 'Dale la vuelta', 'story.turnBack': 'Volver',
    'story.turnHint': 'psst, pasa la página',
    "gallery.title": "Galería",
    "gallery.lede": "Por si no las encontraste en la página…",
    "gallery.found": "{n} de 15 encontradas",
    "gallery.back": "Volver a la página",
    "gallery.first": "psst… quedan {n} escondidas por ahí",
    "gallery.last": "solo falta una…",
    "gallery.done": "🪩 Encontraste las 15. Hora de disco.",
    "arcade.label": "El arcade de los Bebs",
    "arcade.open": "psst… el arcade se acaba de encender ↖",
    "g.grp.adventures": "Aventuras",
    "g.grp.little": "De chiquitos",
    "g.grp.upside": "De cabeza por amor",
    "g.grp.rosas": "Rösås",
    "g.grp.weekend": "El fin de semana",
    "g.cap.roatan": "Roatán, Honduras",
    "g.note.roatan": "Donde todo empezó.",
    "g.cap.prague": "Praga",
    "g.note.prague": "Junto al río, una de tantas aventuras.",
    "g.cap.atitlan": "Lago de Atitlán, Guatemala",
    "g.note.atitlan": "Un abrazo en lo alto del lago.",
    "g.cap.telaviv": "Tel Aviv",
    "g.note.telaviv": "La hora dorada en una ciudad muy querida para Andrea.",
    "g.cap.tallinn": "Tallin, Estonia",
    "g.note.tallinn": "Otro lugar muy querido para Andrea.",
    "g.cap.gondola": "En una góndola",
    "g.note.gondola": "Muy por encima del bosque y el mar.",
    "g.cap.lonisKid": "Lonis de chiquito",
    "g.note.lonisKid": "Sirviendo looks desde el día que nació.",
    "g.cap.andreaKid": "Andrea de chiquita",
    "g.note.andreaKid": "Crop tops y shorts a la cadera antes de aprender a caminar.",
    "g.cap.bloodline": "De cabeza por amor",
    "g.note.bloodline": "Al revés en un cuarto lleno de puntos que brillan.",
    "g.cap.film:rosas": "Rösås en verano",
    "g.note.film:rosas": "La casa roja sobre el trébol, donde lo vamos a celebrar.",
    "g.cap.film:rosas-winter": "Rösås en la nieve",
    "g.note.film:rosas-winter": "La misma casa, en invierno.",
    "g.cap.rosasBridge": "El puentecito",
    "g.note.rosasBridge": "Sobre el estanque de Rösås.",
    "g.cap.rosasDog": "Un perro prestado",
    "g.note.rosasDog": "No es nuestro, por desgracia.",
    "g.cap.film:football": "Fútbol del domingo",
    "g.note.film:football": "Una tradición de Lonis y Andrea.",
    "g.cap.ramkvilla": "El lago de Ramkvilla",
    "g.note.ramkvilla": "Donde vamos a nadar el domingo.",
    'story.emojiCaption': 'Una imagen vale más que mil palabras, supongo.',
    'story.upsideDown': 'De cabeza por amor, en todos los sentidos.',
    'day.filmAlt': 'Una casa roja sueca en una colina sobre un prado de tréboles en verano',
    'day.winterAlt': 'Dos personas caminando por un camino nevado hacia la casa roja y un gran roble sin hojas en invierno',
    'day.bridgeAlt': 'Un puentecito de madera sobre un estanque con nenúfares, entre árboles verdes',
    'day.dogAlt': 'Andrea y Lonis al sol con un perro grande y peludo',
    'schedule.footballAlt': 'Lonis, Andrea y amigos jugando fútbol en una cancha al atardecer',
    'schedule.swimAlt': 'Lonis en un muelle de madera en un lago del bosque, con un perrito',
    'story.gondolaAlt': 'Lonis y Andrea en lo alto de una góndola sobre el bosque y el mar',
    'story.bloodlineAlt': 'Lonis y Andrea de cabeza en un cuarto de espejos lleno de puntos de colores que brillan',
    'story.adventures': 'Aventuras por todos lados. La mejor sigue siendo la de todos los días, juntos.',
    'story.tagPrague': 'Praga', 'story.tagAtitlan': 'Lago de Atitlán', 'story.tagTelaviv': 'Tel Aviv', 'story.tagTallinn': 'Tallin',
    'story.pragueAlt': 'Lonis y Andrea junto al río en Praga', 'story.telavivAlt': 'Lonis y Andrea en Tel Aviv con el sol de la tarde', 'story.tallinnAlt': 'Lonis y Andrea frente a una catedral en Tallin', 'story.atitlanAlt': 'Lonis y Andrea abrazados sobre el lago de Atitlán',
    'story.roatanAlt': 'Lonis y Andrea mirando el mar en Roatán',
    'story.lonisKidAlt': 'Lonis de chiquito en Suecia', 'story.andreaKidAlt': 'Andrea de chiquita en Honduras',
    'story.babies': 'Lonis ha estado sirviendo looks desde el día que nació. Andrea ha estado luciendo crop tops y shorts a la cadera desde antes de aprender a caminar. De alguna forma, estos dos se encontraron, y ahora están construyendo una vida juntos.',
    'music.choose': 'Elige una canción',
    'music.songs': 'Canciones',
    'music.hide': 'Ocultar reproductor',
    'music.play': 'Reproducir', 'music.pause': 'Pausar', 'music.by': 'de', 'music.on': 'en',
    'music.newTab': '(se abre en una pestaña nueva)',
    'music.tapStart': 'Toca ▶ para empezar',
    'music.tapFull': 'Toca ▶ para la canción completa',

    'preview.cal': 'Guardar en el calendario funcionará cuando el sitio esté en línea.',
    'preview.rsvp': 'Esta es una vista previa, así que las confirmaciones todavía no se envían. Se enviarán cuando el sitio esté en línea.'
  };

  const DICT = { sv: SV, es: ES };
  const LANGS = ['en', 'sv', 'es'];
  const KEY = 'la-lang';

  // the English, read from the page before anything is translated
  const EN = { title: document.title };
  const textEls = document.querySelectorAll('[data-i18n]');
  const htmlEls = document.querySelectorAll('[data-i18n-html]');
  const attrEls = document.querySelectorAll('[data-i18n-attr]');
  textEls.forEach(el => { EN[el.getAttribute('data-i18n')] = el.textContent; });
  htmlEls.forEach(el => { EN[el.getAttribute('data-i18n-html')] = el.innerHTML; });
  attrEls.forEach(el => el.getAttribute('data-i18n-attr').split(';').forEach(pair => {
    const [attr, key] = pair.split(':');
    EN[key.trim()] = el.getAttribute(attr.trim()) || '';
  }));

  let lang = 'en';

  // window.t(key, english): the text in the current language
  window.t = (key, fallback) => {
    const d = DICT[lang];
    if (d && d[key] != null) return d[key];
    if (EN[key] != null) return EN[key];
    return fallback != null ? fallback : key;
  };
  window.siteLang = () => lang;

  function apply(next) {
    lang = LANGS.indexOf(next) >= 0 ? next : 'en';
    document.documentElement.lang = lang;
    document.title = window.t('title', EN.title);
    textEls.forEach(el => { el.textContent = window.t(el.getAttribute('data-i18n')); });
    htmlEls.forEach(el => { el.innerHTML = window.t(el.getAttribute('data-i18n-html')); });
    attrEls.forEach(el => el.getAttribute('data-i18n-attr').split(';').forEach(pair => {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr.trim(), window.t(key.trim()));
    }));
    buttons.forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === lang ? 'true' : 'false'));
    if (nav) nav.setAttribute('aria-label', window.t('lang.label', 'Language'));
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
    document.dispatchEvent(new Event('layoutchange'));            // headings change length
  }

  // the EN · SV · ES switch in the top corner
  const nav = document.querySelector('.lang');
  const buttons = nav ? Array.prototype.slice.call(nav.querySelectorAll('button[data-lang]')) : [];
  buttons.forEach(b => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    try { localStorage.setItem(KEY, b.dataset.lang); } catch (e) {}
    apply(b.dataset.lang);
  }));

  // first visit: their own language if it's Swedish or Spanish, otherwise English
  let start = null;
  try { start = localStorage.getItem(KEY); } catch (e) {}
  if (LANGS.indexOf(start) < 0) {
    start = 'en';
    const prefs = navigator.languages || [navigator.language || 'en'];
    for (let i = 0; i < prefs.length; i++) {
      const p = String(prefs[i]).toLowerCase().slice(0, 2);
      if (p === 'sv' || p === 'es' || p === 'en') { start = p; break; }
    }
  }
  apply(start);
})();
