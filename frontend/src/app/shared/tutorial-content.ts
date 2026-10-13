/** One step of a tutorial: a short text, optionally with a jump to the tutorial that goes deeper. */
export interface TutorialStep {
  title: string;
  text: string;
  /** Id of another tutorial this step leads to, or "id#step" for a named step of it. */
  more?: string;
  /** Points that are shown as a list under the text. */
  list?: string[];
  /** A worked example, set apart from the text. */
  example?: string;
  /** A tip, set apart from the text. */
  tip?: string;
  /** A heading for a chapter of the tutorial; it stands before this step. */
  chapter?: string;
  /** Name to jump to this step from elsewhere. */
  id?: string;
  /** The step explains a house rule, which the official rules do not know. */
  house?: boolean;
}

/** The three points of the menu. */
export type TutorialGroup = 'rules' | 'player' | 'gm';

export interface Tutorial {
  id: string;
  group: TutorialGroup;
  title: string;
  steps: TutorialStep[];
}

/** All tutorials of the app. They are plain texts, read step by step in the tutorial window. */
export const TUTORIALS: Tutorial[] = [
  {
    id: 'start',
    group: 'gm',
    title: 'Erste Schritte',
    steps: [
      {
        title: 'Worum es geht',
        text: 'Mit dieser App schreibst du Abenteuer für „How to be a Hero“ und spielst sie später mit deiner Gruppe.\n\nDieses Tutorial führt dich einmal durch alles. Mit „Weiter“ und „Zurück“ blätterst du, über die Zahlen oben springst du direkt zu einem Schritt, und über das Menü links oben erreichst du jedes andere Tutorial.',
      },
      {
        title: 'Spieler und Spielleiter',
        text: 'Jedes Konto ist zuerst ein Spieler-Konto. Hat dich der Admin als Spielleiter freigeschaltet, wechselst du im Hauptmenü zwischen „Spieler“ und „Spielleiter“.\n\nAlles, was hier erklärt wird, liegt im Bereich „Spielleiter“.',
      },
      {
        title: 'Welten',
        text: 'Eine Welt ist ein Abenteuer. Unter „Welten“ legst du eine neue an oder öffnest eine vorhandene.\n\nJede Welt hat zwei Teile: die Kapitel, in denen du die Geschichte schreibst, und das Glossar, in dem alles steht, was es in der Welt gibt.',
      },
      {
        title: 'Kapitel und roter Faden',
        text: 'Die Geschichte schreibst du Kapitel für Kapitel. Jedes Kapitel hat einen roten Faden: die Szenen, die passieren sollen, in deiner Reihenfolge.',
        more: 'chapters',
      },
      {
        title: 'Szenen',
        text: 'Eine Szene ist ein Stück Geschichte: wo sie spielt, wer auftritt, was du vorliest und was passiert. Neben dem Faden gibt es optionale Szenen, die du einsetzt, wo sie passen.',
        more: 'scenes',
      },
      {
        title: 'Das Glossar',
        text: 'Orte, Figuren, Quests, Ereignisse und Wissen legst du einmal im Glossar an. In Kapiteln und Szenen verknüpfst du sie nur noch.',
        more: 'glossary',
      },
      {
        title: 'Lesen und Bearbeiten',
        text: 'Jeder Eintrag öffnet sich zum Lesen. Mit „Bearbeiten“ kommst du ins Formular, „Speichern“ bringt dich zurück.\n\nKlickst du auf einen verknüpften Namen, öffnet sich der Eintrag rechts in einer Seitenleiste. So verlierst du deinen Platz nicht.',
      },
      {
        title: 'Spielen',
        text: 'Als Spieler baust du unter „Meine Charaktere“ deine Figuren und spielst unter „Meine Runden“ mit. Als Spielleiter startest du unter „Runden“ eine Runde mit einer Welt und den Charakteren der Spieler.',
        more: 'sessions',
      },
      {
        title: 'Hilfe auf jeder Seite',
        text: 'Auf jeder Seite gibt es einen Knopf „? Hilfe“. Er öffnet das Tutorial für genau den Bereich, in dem du gerade bist.\n\nDieses Tutorial findest du jederzeit im Hauptmenü unter „Hilfe“.',
      },
    ],
  },
  {
    id: 'chapters',
    group: 'gm',
    title: 'Kapitel',
    steps: [
      {
        title: 'Was ein Kapitel ist',
        text: 'Ein Kapitel ist ein Abschnitt deiner Geschichte. Kapitel sind nummeriert, es gibt keine Tage und kein Datum.\n\nGespeichert wird ein Kapitel in der Welt. Löschst du die Welt, sind auch ihre Kapitel weg.',
      },
      {
        title: 'Die Reiter',
        text: 'Ein geöffnetes Kapitel hat vier Reiter:\n\n„Szenen“ zeigt den roten Faden und die optionalen Szenen.\n„Quests“ und „Ereignisse“ zeigen, was in diesem Kapitel eine Rolle spielt.\n„Überblick“ enthält den Text zum Kapitel und sammelt, welche Orte und Figuren vorkommen.',
      },
      {
        title: 'Quests und Ereignisse im Kapitel',
        text: 'Quests und Ereignisse gehören zur Welt und stehen im Glossar. Im Kapitel verknüpfst du sie nur. Über „Hinzufügen“ wählst du eine vorhandene aus oder legst gleich eine neue an.\n\nNimmst du eine Quest aus dem Kapitel, bleibt sie im Glossar erhalten.',
      },
      {
        title: 'Weiter zu den Szenen',
        text: 'Der wichtigste Reiter ist „Szenen“. Dort schreibst du die eigentliche Geschichte.',
        more: 'scenes',
      },
    ],
  },
  {
    id: 'scenes',
    group: 'gm',
    title: 'Szenen und roter Faden',
    steps: [
      {
        title: 'Der rote Faden',
        text: 'Links steht der rote Faden: die Szenen, die passieren sollen, nummeriert in deiner Reihenfolge. Mit den Pfeilen an der gewählten Szene schiebst du sie nach oben oder unten.\n\nDie Nummer ist nur die Reihenfolge im Kapitel. Sie hängt an keinem Tag.',
      },
      {
        title: 'Optionale Szenen',
        text: 'Unter dem Faden stehen die optionalen Szenen. Sie müssen nicht passieren. Du ziehst sie beim Spielen hinzu, wo sie passen.\n\nOb eine Szene am Faden hängt oder optional ist, stellst du beim Schreiben der Szene mit einem Haken um.',
      },
      {
        title: 'Was in einer Szene steht',
        text: 'Eine Szene hat einen Namen, einen Text für dich und einen Text zum Vorlesen. Der Vorlesetext wird abgesetzt dargestellt, damit du ihn am Tisch sofort findest.\n\nGespeichert wird die Szene in ihrem Kapitel.',
      },
      {
        title: 'Schreiben wie auf einer Seite',
        text: '„Schreiben“ öffnet die Szene wie eine Seite Text: Name, Ort, Figuren, Vorlesen, Was passiert, dann Ereignisse, Quests, Wissen und „Führt zu“.\n\nMit Tab springst du von Feld zu Feld. Einen Speichern-Knopf gibt es nicht: Kurz nach dem Tippen wird von selbst gespeichert, oben steht „Gespeichert“. „Fertig“ bringt dich zurück zum Lesen.',
      },
      {
        title: 'Verknüpfen durch Tippen',
        text: 'In einem Verknüpfungsfeld tippst du einfach los. Darunter erscheint, was passt. Mit den Pfeiltasten wählst du, Enter verknüpft, die Rücktaste im leeren Feld nimmt den letzten Eintrag wieder weg.\n\nGibt es den Eintrag noch nicht, steht unten „neu anlegen“. Das geht in jedem Formular: Der neue Eintrag wird sofort mit seinem Namen angelegt, und mit dem Speichern sind beide verknüpft. Ein Klick auf einen verknüpften Eintrag öffnet ihn rechts im Seitenfenster.',
      },
      {
        title: 'Verknüpfungen',
        text: 'Eine Szene nennt einen Ort und Figuren aus dem Glossar. Sie kann außerdem auf Quests, Ereignisse und Wissen verweisen.\n\nBeispiel: In der Szene mit dem Bettler erfahren die Spieler vom Schmuggel. Die Szene verweist auf die Quest „Der Schwarzmarkt“ und auf das Wissen „Der Pilz“.',
      },
      {
        title: 'Führt zu',
        text: 'Mit „Führt zu“ sagst du, welche Szenen aus dieser folgen können. Wählst du eine Szene, leuchten links alle auf, zu denen sie führt. In der Szene selbst siehst du auch, von welchen Szenen man zu ihr kommt.',
      },
    ],
  },
  {
    id: 'glossary',
    group: 'gm',
    title: 'Glossar',
    steps: [
      {
        title: 'Alles, was es gibt',
        text: 'Im Glossar steht alles, was es in deiner Welt gibt: Lore, Orte, Figuren, Quests, Ereignisse und Wissen.\n\nJeder Eintrag wird einmal angelegt und gehört zur Welt, nicht zu einem Kapitel.',
      },
      {
        title: 'Kacheln und Seitenfenster',
        text: 'Jeder Bereich zeigt seine Einträge als Kacheln. Ein Klick öffnet den Eintrag rechts im Seitenfenster, ohne dass du die Seite verlässt.\n\nIm Seitenfenster liest du, mit „Bearbeiten“ änderst du den Eintrag gleich dort, mit „Zurück“ gehst du den Weg durch verlinkte Einträge zurück, und „Ganze Seite“ öffnet den Eintrag groß.',
      },
      {
        title: 'Zuletzt',
        text: '„Zuletzt“ oben in der Leiste zeigt, was in dieser Welt zuletzt hinzugefügt und zuletzt bearbeitet wurde, über alle Bereiche, Kapitel und Szenen hinweg. Dieselben Listen stehen unter den Kapiteln.\n\nEin Klick öffnet den Eintrag im Seitenfenster oder führt zur Szene.',
      },
      {
        title: 'Farben',
        text: 'Jede Art von Eintrag hat ihre Farbe, überall in der App: Orte sind türkis, Figuren violett, Quests gelb, Ereignisse orange, Gegenstände hellgrün, Wissen blau und Szenen rosa.\n\nDie Farbe steht an Kacheln, Symbolen, Marken und Verknüpfungen. So siehst du schon vor dem Klick, wohin ein Link führt.',
      },
      {
        title: 'Suchen',
        text: 'Das Suchfeld oben in der Leiste sucht in der ganzen Welt, in Namen und in Texten, egal auf welcher Seite du gerade bist. Tippen, mit den Pfeiltasten wählen, Enter: Der Eintrag öffnet sich im Seitenfenster.',
      },
      {
        title: 'Gegenstände',
        text: 'Unter „Gegenstände“ steht alles, was man in die Hand nehmen kann: die Gegenstände der Welt und was deine Figuren im Inventar tragen, mit „Getragen von“.\n\nEin Gegenstand der Welt ist ein Wissens-Eintrag der Kategorie „Gegenstand“. Du kannst ihn an Orte, Figuren und Quests hängen.',
      },
      {
        title: 'Kommt vor in',
        text: 'Unter jedem Eintrag siehst du, womit er verknüpft ist: in welchen Szenen eine Figur auftritt, welche Quests an einem Ort hängen, zu welchem Kapitel ein Ereignis gehört.\n\nDiese Listen entstehen von selbst aus deinen Verknüpfungen.',
      },
      {
        title: 'Lore',
        text: 'Unter „Lore“ stehen der Name der Welt und der große Text über sie. Einzelne Themen wie ein Tier oder ein Gegenstand sind unter „Wissen“ besser aufgehoben.\n\nHier löschst du auch die ganze Welt.',
        more: 'trivia',
      },
    ],
  },
  {
    id: 'locations',
    group: 'gm',
    title: 'Orte',
    steps: [
      {
        title: 'Orte anlegen',
        text: 'Ein Ort hat einen Namen und eine Beschreibung. Gespeichert wird er in der Welt.',
      },
      {
        title: 'Orte in Orten',
        text: 'Mit „Liegt in“ steckst du einen Ort in einen anderen: die Kneipe in die Stadt, die Stadt auf die Insel. In der Liste sind Orte entsprechend eingerückt.',
      },
      {
        title: 'Womit ein Ort verknüpft ist',
        text: 'Am Ort siehst du, welche Figuren dort anzutreffen sind, welche Quests und Ereignisse dort spielen, welche Szenen dort stattfinden und welches Wissen dazugehört.\n\nDie Verknüpfung setzt du jeweils am anderen Eintrag, also an der Figur, der Quest oder der Szene.',
      },
    ],
  },
  {
    id: 'npcs',
    group: 'gm',
    title: 'Figuren',
    steps: [
      {
        title: 'Figuren der Welt',
        text: 'Hier stehen die Figuren, die du als Spielleiter spielst. Eine Figur gehört zu genau einer Welt und kann einen Ort haben, an dem man sie antrifft.',
      },
      {
        title: 'Werte und Waffen',
        text: 'Jede Figur hat Fähigkeiten mit Grund- und Bonuspunkten, die Werte rechnet die App nach den Regeln aus. Im Inventar wird ein Gegenstand zur Waffe, sobald er Schadenswürfel hat.\n\nBesondere Fähigkeiten sind alles, was über die normalen Fähigkeiten hinausgeht: ein Name, eine Beschreibung und die Bedingung, wann darauf gewürfelt wird.',
      },
      {
        title: 'Was Spieler sehen',
        text: 'Jeder Eintrag der Welt hat drei Arten Text. Die Beschreibung sehen die Spieler, sobald du den Eintrag in einer Runde freigibst. „Wissen für Spieler“ gibst du in der Runde Stück für Stück frei. „Wissen nur für dich“ sehen sie nie.\n\nDas gilt genauso für Orte, Quests, Ereignisse und Wissen.',
      },
      {
        title: 'Beispielsätze',
        text: 'Beispielsätze sind Sätze, die die Figur sagen könnte. Jeder Satz kann einen Auslöser haben, zum Beispiel „Spieler fragen nach dem Weg“. So findest du am Tisch schnell den passenden Satz.',
      },
      {
        title: 'Wo eine Figur vorkommt',
        text: 'An der Figur siehst du ihre Quests, die Szenen, in denen sie auftritt, und das Wissen, das zu ihr gehört.',
      },
    ],
  },
  {
    id: 'my-characters',
    group: 'player',
    title: 'Meine Charaktere',
    steps: [
      {
        title: 'Charakter anlegen',
        text: 'Unter „Meine Charaktere“ baust du die Figuren, die du spielst. Gib einen Namen ein und leg den Charakter an, danach füllst du ihn im Editor.\n\nOben im Editor stehen immer dein Name und der Speicherknopf. Darunter wechselst du zwischen Steckbrief, Skillung, Inventar und Besonderem.',
        tip: 'Der Speicherknopf zeigt, wie es steht: „Speichern“, wenn du etwas geändert hast, „Gespeichert“, wenn alles gesichert ist, und „2 Fehler“, wenn die Regeln noch etwas verlangen.',
      },
      {
        title: 'Skillung Schritt für Schritt',
        text: 'Du hast 400 Grundpunkte. Verteile sie in der Skillung auf Fähigkeiten. Jede Fähigkeit gehört zu Handeln, Wissen oder Soziales.\n\nJede Fähigkeit hat zwei Zähler mit Minus und Plus: „Grund“ für die Punkte aus der Erstellung und „Dazu“ für Punkte, die du später beim Leveln gewinnst. Die große Zahl rechts ist der Wert, mit dem gewürfelt wird.',
        list: ['Mindestens 1 Punkt je Fähigkeit.', 'Höchstwert 100 mit dem Begabungswert.', 'Alle 400 Grundpunkte sollten verteilt werden.'],
        example: 'Holzfällen mit 50 Grundpunkten und Handeln 13 ergibt den Wert 63.',
      },
      {
        title: 'Die Übersicht oben',
        text: 'Unter dem Speicherknopf siehst du zwei Balken: wie viele Grund- und Bonuspunkte schon vergeben sind und wie viele übrig bleiben. Daneben stehen die Begabungswerte von Handeln, Wissen und Soziales.\n\nRot heißt: zu viel vergeben.',
      },
      {
        title: 'Meldungen der Regeln',
        text: 'Wenn etwas gegen die Regeln geht, steht die Meldung direkt unter der Fähigkeit, zum Beispiel „Schwert hat Wert 104. Höchstwert ist 100: Verteile 4 Punkte in Handeln um.“\n\nSolange eine Meldung da ist, lässt sich nicht speichern. Ein Tipp auf „Fehler“ führt dich zur Skillung.',
        tip: 'Hinweise ohne Rot sperren nichts. Sie sagen dir zum Beispiel, dass eine Fähigkeit bei 100 gedeckelt ist.',
      },
      {
        title: 'Inventar und Besonderes',
        text: 'Im Inventar trägst du Gegenstände und Waffen ein. Eine Waffe hat Schadenswürfel (xW10) und einen Bonus. Mit dem Haken „verstecken“ sehen nur du und der Spielleiter den Gegenstand, die Gruppe nicht.\n\nUnter „Besonderes“ schreibst du Fähigkeiten, die in keine Skillung passen, mit ihrer Würfelbedingung.',
      },
      {
        title: 'Bild und Symbol',
        text: 'Im Steckbrief wählst du ein Symbol und lädst ein Bild hoch. „Bild statt Symbol zeigen“ schaltet um. Bilder werden bei dir, in der Gruppe und im Kampf gezeigt.',
      },
      {
        title: 'Im Abenteuer ist vieles fest',
        house: true,
        text: 'Sobald dich der Spielleiter in eine Runde aufnimmt, sind deine Grundpunkte und die Begabung jeder Fähigkeit fest. Du kannst keine Grundpunkte senken und keine Fähigkeit löschen, die Grundpunkte hat. Offene Grundpunkte darfst du noch vergeben.\n\nWeiterkommen kannst du nur über Bonuspunkte beim Leveln. Dein Charakter ist erst wieder frei, wenn die Runde beendet ist.',
        more: 'rules#leveling',
      },
      {
        title: 'Der Bogen',
        text: 'Ein Charakter öffnet sich als Bogen zum Lesen: Lebensbalken, Punkteübersicht, Begabungen mit Fähigkeiten und Inventar. Mit dem Stift an jedem Abschnitt springst du direkt an die passende Stelle im Editor.\n\nBei vielen Fähigkeiten hilft die Suche, und „Nach Wert“ und „A–Z“ ordnen sie.',
      },
    ],
  },
  {
    id: 'gm-characters',
    group: 'gm',
    title: 'Figuren der Spieler',
    steps: [
      {
        title: 'Alle Charaktere',
        text: 'Hier siehst du die Charaktere aller Spieler mit dem Namen des Kontos. Die Figuren deiner Welt (NSC) stehen nicht hier, sondern im Glossar der Welt.',
      },
      {
        title: 'Lesen und leveln',
        text: 'Du liest den ganzen Bogen, schreibst aber nicht im Charakter der Spieler. Unter „Leveln“ änderst du, was nur dir gehört: das Budget der Grundpunkte, das Budget der Bonuspunkte und die Lebenspunkte.',
      },
    ],
  },
  {
    id: 'sessions',
    group: 'gm',
    title: 'Runden',
    steps: [
      {
        title: 'Was eine Runde ist',
        text: 'Eine Runde ist eine Gruppe, die eine deiner Welten spielt, über mehrere Abende. Du gibst ihr einen Namen und ein Datum, wählst die Welt und die Charaktere der Spieler.\n\nDie Welt selbst bleibt beim Spielen unverändert. Was die Runde erlebt, wird bei der Runde gespeichert. So können mehrere Gruppen dieselbe Welt spielen.',
      },
      {
        title: 'Ein Charakter, ein Abenteuer',
        house: true,
        text: 'Ein Charakter spielt immer nur in einem laufenden Abenteuer. Beendest du die Runde, ist er wieder frei und kann in ein neues Abenteuer. Fähigkeiten, Inventar und Punkte behält er so, wie die Runde sie hinterlassen hat. Notizen, Chat und Würfe bleiben als Archiv bei der beendeten Runde.\n\nIm Cockpit nimmst du mit „Gruppe bearbeiten“ freie Charaktere auch in eine laufende Runde auf oder nimmst Mitglieder heraus. Herausgenommene Charaktere sind wieder frei. Unter „Figuren der Spieler“ siehst du, wer frei ist und wer in welchem Abenteuer spielt.',
      },
      {
        title: 'Spieler mit dem Handy',
        text: '„QR-Code für Spieler“ oben in der Rundenübersicht zeigt einen Code, der ein Handy direkt zur Anmeldung bringt. Derselbe Code steht auf der Anmeldeseite, wenn sie an einem großen Bildschirm offen ist.\n\nDamit das klappt, starte das Frontend mit „npm run start:lan“ statt „npm start“. Die Handys müssen im selben WLAN sein wie dein Rechner. Der Code wird bei jedem Start neu erzeugt, mit der Adresse, die dein Rechner gerade hat.\n\nKlappt das WLAN nicht, zum Beispiel weil ein Repeater das Netz trennt, starte stattdessen „npm run start:tunnel“. Dann bekommt die App eine öffentliche Adresse, die auch über Mobilfunk geht, und der Code zeigt diese. Gib sie nur deinen Spielern und beende den Tunnel nach dem Abend.',
      },
      {
        title: 'Chat und neuer Abend',
        text: 'Unten in der Leiste öffnet „Chat“ den Chat der ganzen Gruppe, die Zahl darauf zeigt neue Nachrichten. Die geheimen Nachrichten an einen Charakter schreibst du weiter in dessen Fenster.\n\n„Neuer Abend“ im Popup der Gruppe füllt die Geistesblitzpunkte aller Charaktere wieder auf. Einsetzen darf sie nur der Spieler selbst, direkt nach einer misslungenen Probe.',
      },
      {
        title: 'Das Cockpit',
        text: 'Das Cockpit hat zwei Leisten. Oben stehen nur die Ansichten: Story, Master, Quests, Glossar, Notizen und Spieleransicht, dazu Kapitel, Suche und Hilfe. Auf dem Schirm steht nur, was du gerade liest.\n\nUnten liegt die Symbolleiste, jedes Symbol mit Wort und Zahl. Links stehen die Symbole, die immer da sind: Gruppe, Würfeln, Chat, Kampf, Archiv und Kapitel abschließen. In der Mitte stehen die Symbole der Ansicht, sie wechseln mit ihr. Rechts liegen die Stecknadeln und der letzte Wurf.\n\nEin Symbol tut entweder sofort etwas oder öffnet über sich ein Popup. Es ist immer nur eines offen. Esc, ein Klick daneben oder ein zweiter Klick auf das Symbol schließen es.\n\nIn der Story steht nur die gewählte Szene. Ort, Figuren, Quests, Ereignisse, Gegenstände und Wissen der Szene, wohin sie führt, die Hauptquests und die freien Ereignisse sind Symbole mit Zahl. Gespielt, Stecknadel und „Kampf hier“ schalten direkt.',
      },
      {
        title: 'Master-Modus: der Tisch',
        text: 'Die Ansicht „Master“ ist dein Tisch. Oben steht schmal die offene Szene, „Vorlesen“ klappt den Text auf. Darunter liegt „Hier am Ort“: kleine Kacheln für alles, was zur Szene und ihrem Ort gehört, also Figuren, offene Quests und Ereignisse, Gegenstände und Wissen.\n\nUnter „Meine Gruppen“ liegt, was du selbst auf den Tisch gelegt hast, nach dem Namen der Gruppe sortiert. In der Leiste legt „Auf den Tisch“ einen Eintrag der Welt in eine Gruppe, „Gruppe anlegen“ macht eine neue, „Szene wechseln“ wählt eine andere Szene. Im Seitenfenster eines Eintrags gibt es dasselbe als Knopf „Auf den Tisch“. An jeder Kachel wählst du eine andere Gruppe oder nimmst sie „Vom Tisch“.\n\nGanz unten stehen die Charaktere der Gruppe. Was auf dem Tisch liegt, bleibt bei der Runde gespeichert und ist auch nach dem Neuladen noch da. Die Welt ändert sich dadurch nicht.',
      },
      {
        title: 'Das Seitenfenster',
        text: 'Fast alles öffnet sich rechts in einem Fenster, ohne dass du die Seite verlässt: ein Eintrag der Welt, der Bogen eines Charakters, die geheimen Nachrichten, ein Gegenstand zum Übergeben, eine Notiz, das Archiv und die Liste der Würfe.\n\nEs ist immer nur ein Fenster offen. Mit „Schließen“ oder der Esc-Taste ist es wieder weg.',
      },
      {
        title: 'Abhaken und Stecknadeln',
        text: 'Szenen markierst du als gespielt, sie bleiben im Faden stehen. Erledigte Ereignisse verschwinden aus den Popups und stehen im Archiv. Von dort holst du sie mit „Zurückholen“ wieder. Die Karten in den Popups haben dafür einen Haken.\n\nEine Quest hat einen Status: Offen (noch nicht angenommen), Laufend (angenommen) und Beendet. Ob sie mit den Spielern geteilt (Auge) oder angepinnt ist, sind eigene Schalter und hat mit dem Status nichts zu tun.\n\nMit der Stecknadel heftest du an, was du schnell wiederfinden willst. Die Nadeln liegen rechts in der Symbolleiste, ein Symbol je Art mit Zahl.',
      },
      {
        title: 'Was die Spieler sehen',
        text: 'Jede Information hat ein kleines Auge. Ist es offen und farbig, sehen die Spieler sie. Ist es durchgestrichen und blass, bleibt sie bei dir. Das Auge ist zugleich dein Nachweis: Was du siehst, sehen sie.\n\nÖffne einen Eintrag. Das Auge vor dem Namen zeigt ihn den Spielern, zuerst nur mit dem Namen. Die kleinen Augen davor wirken erst, wenn der Name offen ist, bis dahin sind sie blass. Danach schaltest du einzeln: die Beschreibung, bei Quests Ziel, Questgeber, Startgebiet und jeden Punkt der Checkliste (der Haken daneben heißt „erledigt“), bei Ereignissen Auslöser und „Was passiert“.\n\nBei „Wissen für Spieler“ gehört das Auge zu jedem Stück: offen heißt, sie haben es herausgefunden. „Wissen nur für dich“ trägt ein Schloss, das sehen die Spieler nie. Steckbrief, Fähigkeiten und Inventar haben kein Auge, die sehen sie ohnehin nicht.\n\nAuch die Kacheln haben ein Auge oben rechts. Damit teilst du einen Eintrag, ohne ihn zu öffnen. „Alles zeigen“ und „Alles verbergen“ im Seitenfenster schalten alle Augen auf einmal.',
      },
      {
        title: 'Quests im Überblick',
        text: 'Die Ansicht „Quests“ zeigt alle Quests der Welt in zwei Blöcken, Hauptquests und Nebenquests. Jeder Block zeigt einen Status: Laufend, Offen oder Beendet, mit der Zahl dahinter.\n\nIn der Symbolleiste legt „Neue Quest“ eine Quest nur mit ihrem Titel an. „Nur geteilte“ und „Nur angepinnte“ grenzen beide Blöcke ein. An jeder Kachel nimmst du die Quest an, beendest sie, heftest sie an oder teilst sie mit dem Auge oben rechts.\n\nIm Seitenfenster einer Quest steht das Questlog der Gruppe: die gezeigten Punkte in der Reihenfolge der Spieler, ihre eigenen Punkte, Tags und Notizen. Du kannst mitschreiben.',
      },
      {
        title: 'Glossar und Suche',
        text: 'Die Ansicht „Glossar“ zeigt dir die ganze Welt als Kacheln. In der Symbolleiste wechselst du zwischen den sechs Bereichen: Orte, Figuren, Quests, Ereignisse, Gegenstände und Wissen. Unter „Gegenstände“ steht auch, was die Charaktere der Gruppe und die Figuren tragen. „Zuletzt“ zeigt, was zuletzt angelegt oder geändert wurde.\n\nMit der Suche oben findest du jeden Eintrag, ohne die Ansicht zu wechseln.',
      },
      {
        title: 'Ändern: in der Runde oder in der Welt',
        text: 'Im Seitenfenster einer Quest gibt es zwei Wege. „In dieser Runde ändern“ gilt nur für diese Gruppe: Name, Ziel, Questgeber, Startgebiet und die Szene, in der sie entsteht. Die Welt bleibt, wie sie ist.\n\n„In der Welt bearbeiten“ oben im Fenster ändert den Eintrag selbst, für alle Runden dieser Welt.\n\nUnter „Nebenquests“ legst du mitten im Spiel eine Quest nur mit ihrem Titel an. Sie hängt am Kapitel der Runde und ist sofort mit den Spielern geteilt.',
      },
      {
        title: 'Würfeln',
        text: '„Würfeln“ öffnet das Würfelfenster. Wähle einen Charakter der Gruppe oder eine Figur der Welt und klick auf einen ihrer Werte: Der Server würfelt einen W100 dagegen. Mit dem Haken „Heimlich“ sehen die Spieler den Wurf nicht.\n\nOhne Wert würfelst du frei: einen W100 oder 1 bis 10 W10.',
      },
      {
        title: 'Spieleransicht',
        text: 'Mit „Spieleransicht“ schaust du dir an, was die Spieler gerade sehen: ihre Quests, ihr Glossar und die Gruppe. So prüfst du, ob du nichts zu viel freigegeben hast.\n\nIn der Symbolleiste lädt „Neu laden“ die Ansicht neu, und „Zuletzt geteilt“ zeigt, was die Spieler zuletzt neu zu sehen bekamen.',
      },
      {
        title: 'Die Gruppe',
        text: 'Das Symbol „Gruppe“ in der Symbolleiste öffnet die Charaktere als Kacheln zum Auf- und Zuklappen. Die Zahl darauf zählt ungelesene geheime Nachrichten. Zugeklappt siehst du Name und Lebenspunkte als Balken, gemessen am Maximum des Charakters. Aufgeklappt änderst du die Lebenspunkte, siehst Begabungen, Fähigkeiten und Waffen und öffnest Bogen, geheime Nachrichten oder die Übergabe eines Gegenstands.\n\nVorbereitete Gegenstände sind die Gegenstände der Welt; die der offenen Szene stehen in der Auswahl oben. Mit „Versteckt“ sehen nur dieser Spieler und du den Gegenstand im Glossar. „Neuer Abend“ und „Gruppe bearbeiten“ stehen im selben Popup.',
      },
      {
        title: 'Notizen und Würfe',
        text: 'Die Ansicht „Notizen“ zeigt eine Tafel: links deine eigenen Notizen, rechts der Gruppenblock der Spieler. Ein Klick öffnet eine Notiz im Seitenfenster, dort schreibst und kommentierst du. In der Symbolleiste legt „Neue Notiz“ eine an, und „Gruppenblock“ zeigt mit einer Zahl, wenn dort etwas Neues steht.\n\nWürfelt ein Spieler in der App, steht der Wurf rechts in der Symbolleiste als „Letzter Wurf“. Dort gibt es auch „Alle Würfe“, die letzten 30. Nach einem Neustart des Servers ist die Liste leer.',
      },
      {
        title: 'Kampf',
        text: 'Nur du startest einen Kampf. „Kampf“ unten in der Symbolleiste nimmt alle Charaktere der Runde. „Kampf hier“ in der Story nimmt zusätzlich alle Figuren der Szene mit. Läuft schon ein Kampf, kommen sie dazu.\n\nIm Kampf wechselt die Mitte der Symbolleiste: Teilnehmer, Verlauf, Nächster ist dran, Zug abschließen, Wurf verwerfen, Teilnehmer dazu und Kampf beenden. Was gerade nicht geht, ist ausgegraut. Der Schirm zeigt die Zeitleiste, den offenen Wurf und den Angriff.\n\nErst würfelst du die Initiative (1W10 plus Handeln), dann ist jeder der Reihe nach dran. Spieler würfeln ihren Angriff auf ihrer eigenen Seite, du kannst es auch für sie tun.',
      },
      {
        title: 'Zeitleiste und Zustände',
        text: 'Oben im Kampf steht die Zeitleiste: alle Teilnehmer als Portraits in der Reihenfolge ihrer Initiative. Wer dran ist, ist markiert; wer kampfunfähig ist, ist ausgegraut.\n\nEin Klick auf ein Portrait gibt oder nimmt Zustände, zum Beispiel „gefroren“ für zwei Züge. Ein Zustand mit „setzt aus“ lässt den Teilnehmer überspringen. Die Dauer zählt bei jedem eigenen Zug herunter, das Portrait färbt sich passend, und alles steht im Verlauf.',
      },
      {
        title: 'Andere Aktion statt Angriff',
        text: 'Wer dran ist, muss nicht angreifen. Mit „Andere Aktion“ hältst du fest, was jemand tut, zum Beispiel „mischt eine Bombe“. Braucht es einen Wurf, setz den Haken und wähle den Wert.\n\nAuch eine Aktion bleibt offen, bis du den Zug abschließt.',
      },
      {
        title: 'Wurf, Parade, Zug abschließen',
        text: 'Ein gewürfelter Angriff bleibt zuerst offen. Trifft er normal, entscheidet das Ziel, ob es pariert: ein Spieler auf seiner Seite, für alle anderen du. Kritische Treffer lassen sich nicht parieren.\n\nDanach entscheidest du in der Symbolleiste: „Zug abschließen“ zieht den Schaden ab, überträgt ihn sofort auf den Charakter, schreibt alles in den Verlauf und gibt an den Nächsten weiter. „Wurf verwerfen“ lässt alles, wie es war. Seinen eigenen Zug kann ein Spieler auch selbst abschließen.',
      },
      {
        title: 'Kapitel abschließen',
        house: true,
        text: 'Am Ende eines Kapitels gibst du den Charakteren Bonuspunkte. Im Seitenfenster steht jeder Charakter mit den üblichen 10 Punkten, du kannst jedem eine eigene Zahl geben.\n\nDie Spieler verteilen die Punkte selbst auf ihre Fähigkeiten, und die Runde rückt ins nächste Kapitel.',
      },
    ],
  },
  {
    id: 'my-sessions',
    group: 'player',
    title: 'Meine Runden',
    steps: [
      {
        title: 'In einer Runde spielen',
        house: true,
        text: 'Der Spielleiter nimmt einen deiner Charaktere in eine Runde auf, auch mitten im Spiel. Sie erscheint dann unter „Meine Runden“. Ein Charakter spielt immer nur in einer laufenden Runde. Ist sie beendet, ist er wieder frei, mit allem, was er in der Runde gewonnen hat.\n\nUnten steht eine Leiste mit fünf Symbolen: Runde, Charakter, Quests, Chat und Mehr.',
      },
      {
        title: 'Die Runde: was ist neu?',
        text: 'Der Reiter „Runde“ zeigt dein Leben, deine Geistesblitzpunkte und „Neu seit deinem letzten Blick“: neue Quests, neue Einträge im Glossar, Gegenstände, die du bekommen hast, geänderte Lebenspunkte, Notizen und Nachrichten.\n\nEin Tipp auf eine Meldung führt dich dorthin. „Alles gesehen“ räumt die Liste auf. Kurze Meldungen am unteren Rand sagen dir auch gleich, wenn etwas dazukommt.',
        tip: 'Reißt die Verbindung ab, zeigt ein Hinweis oben den letzten Stand, und die App versucht es weiter.',
      },
      {
        title: 'Charakter und Würfeln',
        text: 'Im Reiter „Charakter“ siehst du deinen Bogen. Tippe auf eine Begabung oder Fähigkeit, um eine Probe zu würfeln: ein W100 gegen deinen Wert. Der Spielleiter sieht den Wurf, die Gruppe auch.\n\nMit „Würfeln“ oben wechselst du zu deinen Werten als Knöpfen und zu freien Würfeln ohne Wert (W100 oder 1 bis 10 W10). Mit „Bearbeiten“ änderst du deinen Charakter, auch in der Runde.',
        more: 'rules#check',
      },
      {
        title: 'Geistesblitz',
        text: 'Misslingt eine Probe, aber kein Patzer, erscheint „Geistesblitz einsetzen“. Ein Tipp würfelt dieselbe Probe noch einmal. Der Punkt gehört zur Begabung der Probe und ist dann verbraucht. Der Spielleiter füllt die Punkte für einen neuen Abend wieder auf.',
        more: 'rules#inspiration',
      },
      {
        title: 'Quests und Questlog',
        text: 'Hier steht, was der Spielleiter mit euch geteilt hat. Oben filterst du nach Status (laufend, offen, beendet), suchst, sortierst und filterst nach Tags.\n\nIn einer Quest führt ihr gemeinsam ein Questlog: Punkte vom Spielleiter hakt ihr ab und verschiebt ihr, eigene Punkte legt ihr an, ändert und löscht ihr. Dazu kommen Tags und Notizen. Das Log gehört der ganzen Gruppe, und der Spielleiter sieht es auch.',
      },
      {
        title: 'Glossar',
        text: 'Unter „Mehr“ findest du das Glossar. Es wächst, während ihr spielt: Orte, Figuren, Wissen und Gegenstände erscheinen, sobald der Spielleiter sie zeigt. Filter und Suche halten es kurz.\n\nUnter „Gegenstände“ steht auch die Ausrüstung der Gruppe mit „Getragen von“. Einen Gegenstand, den du in deinem Charakter als versteckt markierst, sehen nur du und der Spielleiter.',
      },
      {
        title: 'Notizen',
        text: 'Unter „Mehr“ liegen die Notizen als Karten: deine eigenen und der Gruppenblock. Oben legst du mit einem Titel eine schnelle Notiz an. Ein Tipp auf eine Karte öffnet sie, und was du änderst, speichert sich von selbst.\n\nEigene Notizen siehst nur du. Legst du eine in den Gruppenblock, sehen alle sie und können Kommentare schreiben.',
      },
      {
        title: 'Chat',
        text: 'Im Reiter „Chat“ gibt es zwei Kanäle. „Gruppe“: alle in der Runde, auch der Spielleiter, lesen mit. „Spielleiter“: geheim, nur du und der Spielleiter. Neue Nachrichten zeigt eine Zahl an.',
      },
      {
        title: 'Kampf',
        text: 'Startet der Spielleiter einen Kampf, erscheint oben ein Band „Kampf läuft“, bei deinem Zug mit dem Hinweis „du bist dran“. Die Zeitleiste zeigt, wer in welcher Reihenfolge dran ist, wer aussetzt und wer kampfunfähig ist. Von deiner Gruppe siehst du die Lebenspunkte, von Gegnern nicht.\n\nBist du dran, greifst du an oder machst eine andere Aktion. Wirst du getroffen, entscheidest du, ob du parierst. Nichts zählt, bevor der Zug abgeschlossen ist: Deinen eigenen Zug schließt du mit „Zug abschließen“ selbst ab, alle anderen der Spielleiter.',
        more: 'rules#initiative',
      },
    ],
  },
  {
    id: 'quests',
    group: 'gm',
    title: 'Quests',
    steps: [
      {
        title: 'Was eine Quest ist',
        text: 'Eine Quest ist eine Aufgabe für die Spieler: Hauptquest oder Nebenquest. Sie hat einen Text, ein Ziel und eine Checkliste mit Schritten.',
      },
      {
        title: 'Verknüpfungen',
        text: 'Pflicht ist nur der Name. Alles andere ist freiwillig: Questgeber, Startgebiet, die Szene, in der die Quest entsteht, beteiligte Figuren und Gegenstände.\n\nIn welchem Kapitel sie vorkommt, legst du im Kapitel fest. Szenen können ebenfalls auf sie verweisen. Eine Quest, die in einer Szene entsteht, gehört von selbst zum Kapitel dieser Szene.',
      },
      {
        title: 'Die Quest-Kachel',
        text: 'Eine Quest-Kachel zeigt Art und Nummer, das Ziel, die Zahl der Schritte und als Marken alles Verknüpfte: Questgeber, Startgebiet, Szene, Figuren, Gegenstände. Ein Klick auf eine Marke öffnet den Eintrag im Seitenfenster.',
      },
    ],
  },
  {
    id: 'events',
    group: 'gm',
    title: 'Ereignisse',
    steps: [
      {
        title: 'Was ein Ereignis ist',
        text: 'Ein Ereignis ist etwas, das passieren kann: eine Begegnung, eine Gefahr, ein Wendepunkt. Es hat einen Namen, einen Text und auf Wunsch einen Ort.',
      },
      {
        title: 'Ereignisse einsetzen',
        text: 'Ereignisse gehören zur Welt. Du verknüpfst sie mit Kapiteln. Wann ein Ereignis eintritt, schreibst du in seinen Text.',
      },
      {
        title: 'An Szenen hängen',
        text: 'Ein Ereignis kann an Szenen hängen, muss es aber nicht. Hängt es an einer Szene, liest du es dort gleich mit, mitsamt seinem Text.\n\nDu hängst es im Kapitel unter „Ereignisse“ an eine Szene, im Formular des Ereignisses oder im Formular der Szene. Ein Ereignis ohne Szene bleibt frei und du setzt es ein, wann es passt.',
      },
    ],
  },
  {
    id: 'trivia',
    group: 'gm',
    title: 'Wissen',
    steps: [
      {
        title: 'Wofür Wissen da ist',
        text: 'Unter „Wissen“ steht alles, was man über die Welt wissen muss und was kein Ort, keine Figur und keine Quest ist: ein Pilz, ein Tier, ein Gegenstand, ein Volk.',
      },
      {
        title: 'Kategorie',
        text: 'Die Kategorie ist freier Text. Schreib „Tier“, „Volk“ oder was dir hilft. Einträge mit derselben Kategorie stehen zusammen.\n\nÜber den Kacheln im Bereich „Wissen“ filterst du nach der Kategorie. Jede Kategorie hat ihre eigene Farbe, am Filter, an der Kachel und im Eintrag.\n\nDie Kategorie „Gegenstand“ ist besonders: Solche Einträge stehen im Glossar unter „Gegenstände“ und lassen sich in einer Runde an Charaktere übergeben.',
      },
      {
        title: 'Allein oder angehängt',
        text: 'Ein Wissens-Eintrag kann für sich stehen. Du kannst ihn aber auch an Orte, Figuren, Quests und Ereignisse hängen, dann erscheint er dort unter „Wissen“, ein Gegenstand unter „Gegenstände“.\n\nSzenen können ebenfalls auf Wissen verweisen.',
      },
    ],
  },
  {
    id: 'start-player',
    group: 'player',
    title: 'Willkommen, Spieler',
    steps: [
      {
        title: 'Worum es geht',
        text: 'Mit dieser App spielst du „How to be a Hero“ mit deiner Gruppe: Du baust deinen Charakter, trittst einer Runde bei, würfelst, führst das Questlog und schreibst mit den anderen.\n\nDieses Tutorial zeigt dir das Wichtigste. Unter dem Menü links oben findest du alle anderen Tutorials, auch das Regelwerk.',
      },
      {
        title: 'Dein erster Charakter',
        text: 'Unter „Meine Charaktere“ legst du einen Charakter an. Verteile 400 Punkte auf Fähigkeiten, gib ihm Inventar und speichere mit dem Knopf oben rechts. Die App sagt dir sofort, wenn etwas gegen die Regeln geht.',
        more: 'my-characters',
      },
      {
        title: 'In eine Runde kommen',
        text: 'Der Spielleiter nimmt deinen Charakter in eine Runde auf. Dann erscheint sie unter „Meine Runden“. Der Spielleiter kann dir einen QR-Code zeigen, der dein Handy direkt zur Anmeldung bringt.',
        more: 'my-sessions',
      },
      {
        title: 'Die Leiste unten',
        text: 'In einer Runde führt dich die Leiste unten: „Runde“ zeigt, was neu ist, „Charakter“ deinen Bogen und das Würfeln, „Quests“ euer Questlog, „Chat“ die Gespräche, „Mehr“ Glossar, Notizen, Gruppe und Kampf.',
      },
      {
        title: 'Das Regelwerk',
        text: 'Du musst das Regelwerk nicht auswendig kennen. Die App rechnet für dich. Wenn du es verstehen willst, erklären die Tutorials unter „Das Regelwerk“ alles in kurzen Schritten, mit Beispielen.',
        more: 'rules',
      },
    ],
  },
  {
    id: 'rules',
    group: 'rules',
    title: 'Regelwerk How to be a Hero',
    steps: [
      // Kapitel 1
      {
        chapter: 'Was ist How to be a Hero?',
        title: 'Erzählen und Würfeln',
        text: 'How to be a Hero ist ein freies Pen-and-Paper-Regelwerk. Man kann es sich vorstellen als halb Gesellschaftsspiel, halb Improvisationstheater: Ihr sitzt zusammen und erzählt gemeinsam eine Geschichte, und wo der Ausgang offen ist, entscheiden Würfel.\n\nEs gibt kein Brett, keinen Gewinner und keine feste Welt. Eure Geschichte kann im Mittelalter spielen, im Weltraum oder in der Schule nebenan.\n\nQuelle: das offizielle Wiki howtobeahero.de (CC BY-NC-SA 4.0), hier in eigenen Worten.',
      },
      {
        title: 'Wer am Tisch sitzt',
        text: 'Einer von euch ist der Spielleiter. Er beschreibt die Welt, spielt alle Figuren, die kein Spieler spielt, und sagt, was aus euren Taten folgt.\n\nJeder andere Spieler hat genau einen Charakter. Ihr sagt, was euer Charakter tut, und der Spielleiter erzählt, was daraufhin passiert.',
      },
      {
        title: 'So läuft ein Abend',
        text: 'Ein Abend ist ein Kreislauf: Der Spielleiter beschreibt die Lage, ihr antwortet mit dem, was eure Charaktere tun, der Spielleiter erzählt die Folgen, und daraus entsteht die nächste Lage.',
        example: 'Spielleiter: „Die Brücke über die Schlucht ist eingestürzt. Auf der anderen Seite seht ihr Rauch.“\nSpielerin: „Mara mustert die Bäume. Kann sie einen fällen, sodass er als Steg über die Schlucht liegt?“\nSpielleiter: „Möglich, aber nicht sicher. Würfle auf Holzfällen.“',
      },
      {
        title: 'Wann gewürfelt wird',
        text: 'Gewürfelt wird nur, wenn der Ausgang offen ist und etwas davon abhängt. Eine offene Tür zu öffnen braucht keinen Wurf. Eine verschlossene Tür einzutreten schon: Es kann klappen oder nicht, und beides ändert die Geschichte.\n\nFast immer gibt es mehrere Wege zum Ziel. Wer klug erzählt, braucht manchmal gar keinen Wurf.',
      },
      {
        title: 'Was auf deinem Bogen steht',
        text: 'Dein Charakterbogen hat vier Teile:',
        list: [
          'Drei Begabungen: Handeln, Wissen und Soziales.',
          'Fähigkeiten, die du selbst erfindest. Es gibt keine feste Liste.',
          '100 Lebenspunkte.',
          'Ein Inventar mit allem, was dein Charakter bei sich trägt.',
        ],
      },
      {
        title: 'Was die App übernimmt',
        text: 'Die App würfelt für dich und rechnet alle Werte aus. Sie zeigt Quests, Glossar, Notizen und den Chat der Runde.\n\nAm Tisch ohne App würfelst du einen W100 mit zwei zehnseitigen Würfeln: einer für die Zehner, einer für die Einer.',
      },
      {
        title: 'Für den ersten Abend',
        text: 'Fehler sind normal, auch für den Spielleiter. Eine vergessene Regel schlägst du unter „Alle Themen“ nach. Was unklar bleibt, klärt ihr gemeinsam, und der Spielleiter hat das letzte Wort.\n\nDas Wichtigste: Habt Spaß an der Geschichte.',
      },
      // Kapitel 2
      {
        chapter: 'Dein Charakter',
        title: 'Erst die Figur, dann die Zahlen',
        text: 'Bevor du Punkte verteilst, überlege dir, wer dein Charakter ist: Was kann er richtig gut, was gar nicht, was treibt ihn an? Die Zahlen folgen danach von selbst.\n\nQuelle: das offizielle Wiki howtobeahero.de (CC BY-NC-SA 4.0), hier in eigenen Worten.',
        example: 'Mara ist Holzfällerin. Sie ist stark und geschickt, aber im Lesen und Schreiben unsicher. Sie feilscht gern auf dem Markt und traut keinem Fremden sofort.',
      },
      {
        title: 'Drei Begabungen',
        text: 'Jeder Charakter hat drei Begabungen, in die alle Fähigkeiten einsortiert sind:',
        list: [
          'Handeln: alles Körperliche, zum Beispiel Klettern, Kämpfen, Schleichen.',
          'Wissen: alles, was man lernen kann, zum Beispiel Pflanzenkunde, Heilkunst, Geschichte.',
          'Soziales: alles im Umgang mit anderen, zum Beispiel Feilschen, Überreden, Menschenkenntnis.',
        ],
      },
      {
        title: 'Fähigkeiten erfindest du selbst',
        text: 'Eine Fähigkeit nennst du, wie du willst. Sie sollte nicht zu breit sein („Kämpfen“ deckt zu viel ab) und nicht zu eng („Eichen fällen bei Regen“ kommt kaum vor). Im Zweifel entscheidet der Spielleiter, was zu einer Fähigkeit passt.',
        example: 'Maras neun Fähigkeiten: Holzfällen, Axtkampf, Klettern, Schleichen (Handeln), Pflanzenkunde, Spurenlesen (Wissen), Feilschen, Menschenkenntnis, Einschüchtern (Soziales).',
      },
      {
        id: 'points',
        title: '400 Punkte verteilen',
        text: 'Zur Erstellung bekommst du 400 Punkte. Die verteilst du frei auf deine Fähigkeiten. Maras Verteilung:',
        list: [
          'Handeln: Holzfällen 60, Axtkampf 50, Klettern 38, Schleichen 28 (zusammen 176)',
          'Wissen: Pflanzenkunde 45, Spurenlesen 38 (zusammen 83)',
          'Soziales: Feilschen 50, Menschenkenntnis 46, Einschüchtern 45 (zusammen 141)',
        ],
        tip: 'In der App siehst du oben, wie viele Grundpunkte noch frei sind. Die Punkte müssen nicht ganz aufgebraucht werden, aber es wäre schade um jeden, der übrig bleibt.',
      },
      {
        title: 'Der Begabungswert',
        text: 'Die Punkte aller Fähigkeiten einer Begabung zählst du zusammen, teilst sie durch 10 und rundest kaufmännisch. Das ist der Begabungswert. Er kommt jeder Fähigkeit dieser Begabung zugute.',
        example: 'Handeln: 176 Punkte, geteilt durch 10 sind 17,6, gerundet 18.\nWissen: 83 Punkte ergeben 8.\nSoziales: 141 Punkte ergeben 14.',
      },
      {
        title: 'Der Wert, auf den du würfelst',
        text: 'Der Wert einer Fähigkeit ist ihre Punktzahl plus der Begabungswert. Auf diesen Wert wird gewürfelt.',
        example: 'Holzfällen: 60 Punkte plus Begabungswert 18 ergibt 78.\nFeilschen: 50 plus 14 ergibt 64.',
      },
      {
        title: 'Grenzen und Tipps',
        text: 'Jede Fähigkeit braucht mindestens 1 Punkt, und kein Wert darf über 100 liegen. Sehr kleine Werte bringen im Spiel wenig, weil sie fast nie gelingen.\n\nHast du keine passende Fähigkeit, würfelst du auf die Begabung selbst.',
        example: 'Mara kann nicht schwimmen. Verlangt der Spielleiter eine Probe, würfelt sie auf ihren Begabungswert Handeln, also 18.',
      },
      {
        title: 'Leben und Inventar',
        text: 'Jeder Charakter startet mit 100 Lebenspunkten. Das Inventar listet alles, was dein Charakter trägt. Ein Gegenstand mit Schadenswürfeln ist eine Waffe, zum Beispiel Maras Axt mit 4W10.\n\nIm Feld „Besonderes“ hältst du alles fest, was in keine Fähigkeit passt.',
      },
      // Kapitel 3
      {
        chapter: 'Die Probe',
        id: 'check',
        title: 'Ein W100 gegen deinen Wert',
        text: 'Willst du etwas tun, dessen Ausgang offen ist, würfelst du eine Probe: einen W100 (ein Wurf von 1 bis 100) gegen den Wert deiner Fähigkeit. Wirfst du den Wert oder weniger, gelingt es. Der Wert ist also deine Chance in Prozent.\n\nQuelle: das offizielle Wiki howtobeahero.de (CC BY-NC-SA 4.0), hier in eigenen Worten.',
      },
      {
        title: 'Eine Probe am Tisch',
        text: 'Mara klettert über die Palisade. Ihr Wert in Klettern ist 56.',
        example: 'Mara wirft eine 41. Das ist weniger als 56, die Probe gelingt. Der Spielleiter erzählt, wie sie oben ankommt.',
      },
      {
        title: 'Kritischer Erfolg',
        text: 'Das erste Zehntel deines Werts ist ein kritischer Erfolg, eine 1 immer. Der Spielleiter macht daraus etwas Besonderes, das über das bloße Gelingen hinausgeht.',
        example: 'Bei Wert 56 sind die Würfe 1 bis 5 kritisch.',
      },
      {
        title: 'Patzer',
        text: 'Du patzt, wenn du im letzten Zehntel dessen würfelst, was dir bis 100 fehlt. Eine 100 ist immer ein Patzer. Auch der Patzer verändert die Geschichte, aber zu deinem Nachteil.',
        example: 'Bei Wert 56 fehlen 44 bis 100. Ein Zehntel davon gerundet ergibt 4, also sind die Würfe 96 bis 100 ein Patzer.',
      },
      {
        title: 'Die ganze Skala',
        text: 'Für Wert 56 sieht die Skala so aus:',
        list: ['1 bis 5: kritischer Erfolg', '6 bis 56: gelungen', '57 bis 95: misslungen', '96 bis 100: Patzer'],
        tip: 'Über 100 geht kein Wert. Was darüber läge, verfällt.',
      },
      {
        id: 'inspiration',
        title: 'Geistesblitz',
        text: 'Mit einem Geistesblitzpunkt würfelst du eine misslungene Probe neu. Du hast je Begabung so viele Punkte, wie ein Zehntel ihres Begabungswerts ergibt.\n\nDie Regeln: nicht nach einem Patzer, nur mit Punkten der Begabung, zu der die Fähigkeit gehört, und am nächsten Abend sind alle Punkte wieder da.',
        example: 'Handeln 18 ergibt 2 Geistesblitzpunkte, Wissen 8 und Soziales 14 je 1.\nMara feilscht auf 64 und würfelt eine 81: misslungen. Sie setzt einen Punkt aus Soziales ein und würfelt neu: eine 22, gelungen.',
      },
      {
        title: 'In der App',
        text: 'Tippe auf die Fähigkeit, die du würfeln willst. Alle in der Runde sehen den Wurf. Nach einem Fehlschlag erscheint der Knopf „Geistesblitz einsetzen“ von selbst, solange du Punkte der passenden Begabung hast.',
      },
      // Kapitel 4
      {
        chapter: 'Der Kampf',
        id: 'initiative',
        title: 'Initiative',
        text: 'Vor jedem Kampf wird neu ausgewürfelt, wer wann dran ist. Jeder wirft einen W10 und addiert seinen Begabungswert in Handeln. Wer die höchste Summe hat, beginnt, dann geht es absteigend weiter.\n\nQuelle: das offizielle Wiki howtobeahero.de (CC BY-NC-SA 4.0), hier in eigenen Worten.',
        example: 'Mara: 6 plus 18 ergibt 24. Ein Räuber: 9 plus 11 ergibt 20. Ben: 3 plus 9 ergibt 12. Reihenfolge: Mara, Räuber, Ben.',
      },
      {
        title: 'Überraschung',
        text: 'Wer den Gegner nicht bemerkt hat, ist überrascht und setzt die erste Runde aus.',
      },
      {
        title: 'Dein Zug',
        text: 'In deinem Zug machst du einen Angriff oder eine andere Aktion, zum Beispiel eine Bombe mischen oder jemanden verbinden. Je nachdem, ob der Ausgang offen ist, mit oder ohne Wurf.',
      },
      {
        title: 'Angriff und Schaden',
        text: 'Ein Angriff ist eine Probe auf die passende Fähigkeit. Gelingt sie, würfelst du den Schaden deiner Waffe: so viele W10, wie die Waffe hat, dazu ein möglicher Bonus. Bei einem kritischen Treffer zählen die Würfel doppelt.',
        list: ['Faust: 1W10', 'Messer: 2W10', 'Axt: 4W10', 'Schwert: 5W10', 'Bogen: 6W10'],
        tip: 'Das sind Richtwerte. Die genauen Werte deiner Waffen stehen im Inventar.',
      },
      {
        title: 'Parade',
        text: 'Wer getroffen wird, kann einmal pro Runde parieren, mit einer Probe auf Handeln oder eine passende Fähigkeit. Gelingt sie, nimmt er keinen Schaden. Gegen kritische Treffer und gegen Schusswaffen kann man nicht parieren.\n\nWer ohne Waffe eine Waffe pariert, erleidet trotzdem den halben Schaden. Das rechnet die App nicht: Der Spielleiter zieht es von Hand ab.',
      },
      {
        title: 'Eine Runde durchgespielt',
        text: 'Mara greift einen Räuber mit der Axt an. Ihr Wert im Axtkampf ist 68.',
        list: [
          'Mara würfelt 35 gegen 68: Treffer.',
          'Der Räuber pariert nicht (77 gegen seine 45).',
          'Schaden: 4W10 ergeben 7 + 3 + 9 + 5 = 24.',
          'Der Räuber schlägt zurück und würfelt 12 gegen 60: Treffer. Mara pariert mit 50 gegen 68: gelungen, kein Schaden.',
        ],
        example: 'Hätte Mara statt der 35 eine 4 gewürfelt, wäre das ein kritischer Treffer gewesen: nicht parierbar, und der Schaden zählt doppelt, also 48.',
      },
      {
        title: 'Lebenspunkte im Kampf',
        text: 'Wer mit einem einzigen Schlag mehr als 60 Schaden nimmt oder insgesamt unter 10 Lebenspunkte fällt, wird bewusstlos. Das sagt der Spielleiter an, die App setzt erst bei 0 Lebenspunkten auf „kampfunfähig“. Bei 0 ist der Charakter tot.',
      },
      {
        title: 'In der App',
        text: 'Läuft ein Kampf, steht oben ein Band „Kampf läuft“. Du siehst die Zeitleiste mit der Reihenfolge, und wenn du dran bist, würfelst du selbst. Den eigenen Zug schließt du auch selbst ab.',
      },
      // Kapitel 5
      {
        chapter: 'Vor- und Nachteile',
        title: 'Ein freies Zusatzmodul',
        text: 'Vor- und Nachteile sind ein optionales Modul für erfahrene Gruppen. Die App rechnet sie nicht aus, ihr haltet sie am Tisch fest, zum Beispiel unter „Besonderes“ oder in der Beschreibung.\n\nQuelle: das offizielle Wiki howtobeahero.de (CC BY-NC-SA 4.0), hier in eigenen Worten.',
      },
      {
        title: 'Nachteile',
        text: 'Ein Nachteil steht als Minuswert in einer Begabung, zum Beispiel „jähzornig“ −20 in Soziales. Er ändert den Begabungswert nicht. Verlangt der Spielleiter eine Probe darauf und du würfelst unter dem Wert, tritt das Ereignis ein.',
      },
      {
        title: 'Ausgleich',
        text: 'Für einen Nachteil handelst du mit dem Spielleiter einen Ausgleich aus, zum Beispiel mehr Fähigkeitspunkte, bessere Ausrüstung oder mehr Lebenspunkte. Je größer der Ausgleich, desto mehr muss der Nachteil im Spiel spürbar sein.',
      },
      {
        title: 'Charakteristika',
        text: 'Ein Charakteristikum ist eine breite Eigenart mit Vor- und Nachteilen zugleich. Es kostet keine Punkte. Ein Charakter hat höchstens zwei, am besten eines, das du spielen magst.',
      },
      // Kapitel 6
      {
        chapter: 'Unsere Hausregeln',
        house: true,
        title: 'Was eine Hausregel ist',
        text: 'Eine Hausregel gilt in unserer Runde und steht nicht im offiziellen Regelwerk. Die App kennzeichnet jede mit der Marke „Hausregel“, damit du immer weißt, was offiziell ist und was wir uns ausgedacht haben.',
      },
      {
        id: 'leveling',
        house: true,
        title: 'Leveln mit Bonuspunkten',
        text: 'Das offizielle Regelwerk kennt kein Leveln. Bei uns bekommst du am Ende eines Kapitels meist 10 Bonuspunkte. Damit kaufst du neue Punkte für deine Fähigkeiten, auch in einer, die du noch nicht hast.',
      },
      {
        house: true,
        title: 'Je besser, desto teurer',
        text: 'Ein Punkt, den du beim Leveln gewinnst, kostet Bonuspunkte nach den Punkten, die die Fähigkeit danach hat:',
        list: ['Bis 30 Punkte: 1 Bonuspunkt je Punkt.', '31 bis 50: 2 Bonuspunkte.', '51 bis 70: 3 Bonuspunkte.', 'Ab 71: 4 Bonuspunkte.'],
        example: 'Klettern von 38 auf 43 kostet 5 mal 2, also 10 Bonuspunkte. Holzfällen von 60 auf 61 kostet 3.',
      },
      {
        house: true,
        title: 'Grundpunkte sind im Abenteuer fest',
        text: 'Die 400 Punkte aus der Erstellung sind fest, sobald dein Charakter in einer laufenden Runde spielt. Du kannst sie nicht mehr umschichten. Neues kommt nur noch über Bonuspunkte. Die App zeigt an jeder Fähigkeit, was der nächste Punkt kostet.',
      },
      {
        house: true,
        title: 'Über 100: Guthaben',
        text: 'Du kannst keine Fähigkeit über Wert 100 kaufen. Schiebt dein Begabungswert eine Fähigkeit später über 100, bleibt sie bei 100. Je 2 Punkte darüber ergeben 1 Punkt Guthaben, den du in einer Fähigkeit derselben Begabung einsetzen kannst.\n\nDas Guthaben siehst du als roten Tag an der Begabung. Tippst du eine Fähigkeit an, sagt dir die App, ob du das Guthaben dort einsetzen kannst.',
        example: 'Schwert 87 plus Handeln 15 ergibt 102. Die 2 Punkte darüber geben 1 Punkt Guthaben in Handeln.',
      },
      {
        house: true,
        title: 'Ein Charakter, ein Abenteuer',
        text: 'Ein Charakter spielt immer nur in einer laufenden Runde. Ist sie zu Ende, ist er wieder frei, mit allem, was er gewonnen hat, und kann in ein neues Abenteuer ziehen.',
      },
    ],
  },
];

/** The points of the menu with their names. */
export const TUTORIAL_GROUPS: { id: TutorialGroup; label: string }[] = [
  { id: 'rules', label: 'Regelwerk How to be a Hero' },
  { id: 'player', label: 'Spieler' },
  { id: 'gm', label: 'Spielleiter' },
];
