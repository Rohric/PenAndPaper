/** One step of a tutorial: a short text, optionally with a jump to the tutorial that goes deeper. */
export interface TutorialStep {
  title: string;
  text: string;
  /** Id of another tutorial this step leads to. */
  more?: string;
  /** Points that are shown as a list under the text. */
  list?: string[];
  /** A worked example, set apart from the text. */
  example?: string;
  /** A tip, set apart from the text. */
  tip?: string;
}

export interface Tutorial {
  id: string;
  title: string;
  steps: TutorialStep[];
}

/** All tutorials of the app. They are plain texts, read step by step in the tutorial window. */
export const TUTORIALS: Tutorial[] = [
  {
    id: 'start',
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
        text: 'Sobald dich der Spielleiter in eine Runde aufnimmt, sind deine Grundpunkte und die Begabung jeder Fähigkeit fest. Du kannst keine Grundpunkte senken und keine Fähigkeit löschen, die Grundpunkte hat. Offene Grundpunkte darfst du noch vergeben.\n\nWeiterkommen kannst du nur über Bonuspunkte beim Leveln. Dein Charakter ist erst wieder frei, wenn die Runde beendet ist.',
        more: 'rules-leveling',
      },
      {
        title: 'Der Bogen',
        text: 'Ein Charakter öffnet sich als Bogen zum Lesen: Lebensbalken, Punkteübersicht, Begabungen mit Fähigkeiten und Inventar. Mit dem Stift an jedem Abschnitt springst du direkt an die passende Stelle im Editor.\n\nBei vielen Fähigkeiten hilft die Suche, und „Nach Wert“ und „A–Z“ ordnen sie.',
      },
    ],
  },
  {
    id: 'gm-characters',
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
    title: 'Runden',
    steps: [
      {
        title: 'Was eine Runde ist',
        text: 'Eine Runde ist eine Gruppe, die eine deiner Welten spielt, über mehrere Abende. Du gibst ihr einen Namen und ein Datum, wählst die Welt und die Charaktere der Spieler.\n\nDie Welt selbst bleibt beim Spielen unverändert. Was die Runde erlebt, wird bei der Runde gespeichert. So können mehrere Gruppen dieselbe Welt spielen.',
      },
      {
        title: 'Ein Charakter, ein Abenteuer',
        text: 'Ein Charakter spielt immer nur in einem laufenden Abenteuer. Beendest du die Runde, ist er wieder frei und kann in ein neues Abenteuer. Fähigkeiten, Inventar und Punkte behält er so, wie die Runde sie hinterlassen hat. Notizen, Chat und Würfe bleiben als Archiv bei der beendeten Runde.\n\nIm Cockpit nimmst du mit „Gruppe bearbeiten“ freie Charaktere auch in eine laufende Runde auf oder nimmst Mitglieder heraus. Herausgenommene Charaktere sind wieder frei. Unter „Figuren der Spieler“ siehst du, wer frei ist und wer in welchem Abenteuer spielt.',
      },
      {
        title: 'Spieler mit dem Handy',
        text: '„QR-Code für Spieler“ oben in der Rundenübersicht zeigt einen Code, der ein Handy direkt zur Anmeldung bringt. Derselbe Code steht auf der Anmeldeseite, wenn sie an einem großen Bildschirm offen ist.\n\nDamit das klappt, starte das Frontend mit „npm run start:lan“ statt „npm start“. Die Handys müssen im selben WLAN sein wie dein Rechner. Der Code wird bei jedem Start neu erzeugt, mit der Adresse, die dein Rechner gerade hat.',
      },
      {
        title: 'Chat und neuer Abend',
        text: 'Im Cockpit öffnet „Chat“ den Chat der ganzen Gruppe. Die geheimen Nachrichten an einen Charakter schreibst du weiter in dessen Fenster.\n\n„Neuer Abend“ bei der Gruppe füllt die Geistesblitzpunkte aller Charaktere wieder auf. Einsetzen darf sie nur der Spieler selbst, direkt nach einer misslungenen Probe.',
      },
      {
        title: 'Das Cockpit',
        text: 'Oben liegt die Leiste mit den Werkzeugen: Kapitel wählen, Spieleransicht, Glossar, Würfeln, Kampf, Notizen, Archiv, Kapitel abschließen und die Suche über die ganze Welt.\n\nDarunter steht die Gruppe als Reihe von Kacheln, dann links der rote Faden und rechts die gewählte Szene mit ihren Ereignissen und Dialogen, darunter die Hauptquests. „Nebenquests“ und „Freie Ereignisse“ stehen immer darunter, sind aber zugeklappt: Ein Klick auf die Überschrift öffnet sie. Unten bleiben die Stecknadeln und der letzte Wurf stehen.',
      },
      {
        title: 'Das Seitenfenster',
        text: 'Fast alles öffnet sich rechts in einem Fenster, ohne dass du die Seite verlässt: ein Eintrag der Welt, der Bogen eines Charakters, die geheimen Nachrichten, ein Gegenstand zum Übergeben, eine Notiz, das Archiv und die Liste der Würfe.\n\nEs ist immer nur ein Fenster offen. Mit „Schließen“ oder der Esc-Taste ist es wieder weg.',
      },
      {
        title: 'Abhaken und Stecknadeln',
        text: 'Szenen markierst du als gespielt, sie bleiben im Faden stehen. Erledigte Ereignisse verschwinden aus dem Cockpit und stehen im Archiv. Von dort holst du sie mit „Zurückholen“ wieder.\n\nEine Quest hat einen Status: Offen (noch nicht angenommen), Laufend (angenommen) und Beendet. Ob sie mit den Spielern geteilt oder angepinnt ist, sind eigene Haken und hat mit dem Status nichts zu tun.\n\nMit der Stecknadel heftest du an, was du schnell wiederfinden willst. Die Stecknadeln stehen in der Leiste unten.',
      },
      {
        title: 'Was die Spieler sehen',
        text: 'Öffne einen Eintrag: Im Seitenfenster steht der Block „Das sehen die Spieler“. Mit dem Haken dort erscheint der Eintrag bei den Spielern, zuerst nur mit seinem Namen.\n\nDarunter hat jede Information ihr eigenes Auge: Beschreibung, bei Quests Ziel, Questgeber, Startgebiet und jeder Punkt der Checkliste für sich, bei Ereignissen Auslöser und „Was passiert“. Die Spieler sehen genau das, was auf „sichtbar“ steht. Neben jedem Auge liest du, was sie dort lesen würden.\n\n„Wissen für Spieler“ hakst du Stück für Stück an, sobald sie es herausfinden. „Wissen nur für dich“ sehen sie nie. „Alles zeigen“ und „Alles verbergen“ schalten alle Augen auf einmal.',
      },
      {
        title: 'Quests im Überblick',
        text: '„Quests“ in der Leiste zeigt alle Quests der Welt in zwei Blöcken, Hauptquests und Nebenquests. Jeder Block zeigt einen Status: Laufend, Offen oder Beendet, mit der Zahl dahinter. „nur geteilte“ und „nur angepinnte“ grenzen beide Blöcke ein.\n\nAn jeder Kachel nimmst du die Quest an, beendest sie, teilst sie oder heftest sie an. Oben legst du eine Quest nur mit ihrem Titel an.\n\nIm Seitenfenster einer Quest steht das Questlog der Gruppe: die gezeigten Punkte in der Reihenfolge der Spieler, ihre eigenen Punkte, Tags und Notizen. Du kannst mitschreiben.',
      },
      {
        title: 'Glossar und Suche',
        text: '„Glossar“ zeigt dir die ganze Welt als Kacheln: Orte, Figuren, Quests, Ereignisse, Gegenstände und Wissen. Unter „Gegenstände“ steht auch, was die Charaktere der Gruppe und die Figuren tragen.\n\nMit der Suche in der Leiste findest du jeden Eintrag, ohne die Ansicht zu wechseln.',
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
        text: 'Mit „Spieleransicht“ schaust du dir an, was die Spieler gerade sehen: ihre Quests, ihr Glossar und die Gruppe. So prüfst du, ob du nichts zu viel freigegeben hast.',
      },
      {
        title: 'Die Gruppe',
        text: 'Jeder Charakter ist eine Kachel zum Auf- und Zuklappen. Zugeklappt siehst du Name und Lebenspunkte als Balken, gemessen am Maximum des Charakters. Aufgeklappt änderst du die Lebenspunkte, siehst Begabungen, Fähigkeiten und Waffen und öffnest Bogen, geheime Nachrichten oder die Übergabe eines Gegenstands.\n\nVorbereitete Gegenstände sind die Gegenstände der Welt; die der offenen Szene stehen in der Auswahl oben. Mit „Versteckt“ sehen nur dieser Spieler und du den Gegenstand im Glossar.',
      },
      {
        title: 'Notizen und Würfe',
        text: 'Der Knopf „Notizen“ zeigt eine Tafel: links deine eigenen Notizen, rechts der Gruppenblock der Spieler. Ein Klick öffnet eine Notiz im Seitenfenster, dort schreibst und kommentierst du. Der Knopf zeigt an, wenn im Gruppenblock etwas Neues steht.\n\nWürfelt ein Spieler in der App, erscheint der Wurf unten in der Leiste. „Alle Würfe“ zeigt die letzten 30, nach einem Neustart des Servers ist die Liste leer.',
      },
      {
        title: 'Kampf',
        text: 'Nur du startest einen Kampf. „Kampf“ oben in der Leiste nimmt alle Charaktere der Runde. „Kampf in dieser Szene“ an der Szene nimmt zusätzlich alle Figuren der Szene mit. Läuft schon ein Kampf, kommen sie dazu.\n\nErst würfelst du die Initiative (1W10 plus Handeln), dann ist jeder der Reihe nach dran. Spieler würfeln ihren Angriff auf ihrer eigenen Seite, du kannst es auch für sie tun. Ihre Lebenspunkte sehen sie, die der Gegner nicht.',
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
        text: 'Ein gewürfelter Angriff bleibt zuerst offen. Trifft er normal, entscheidet das Ziel, ob es pariert: ein Spieler auf seiner Seite, für alle anderen du. Kritische Treffer lassen sich nicht parieren.\n\nDanach entscheidest du: „Zug abschließen“ zieht den Schaden ab, überträgt ihn sofort auf den Charakter, schreibt alles in den Verlauf und gibt an den Nächsten weiter. „Wurf verwerfen“ lässt alles, wie es war, zum Beispiel wenn neu gewürfelt wird.\n\nLebenspunkte kannst du jederzeit von Hand setzen. Die letzte Auswahl jedes Teilnehmers (Ziel, Fähigkeit, Waffe) merkt sich der Browser.',
      },
      {
        title: 'Kapitel abschließen',
        text: 'Am Ende eines Kapitels gibst du den Charakteren Bonuspunkte. Im Seitenfenster steht jeder Charakter mit den üblichen 10 Punkten, du kannst jedem eine eigene Zahl geben.\n\nDie Spieler verteilen die Punkte selbst auf ihre Fähigkeiten, und die Runde rückt ins nächste Kapitel.',
      },
    ],
  },
  {
    id: 'my-sessions',
    title: 'Meine Runden',
    steps: [
      {
        title: 'In einer Runde spielen',
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
        more: 'rules-checks',
      },
      {
        title: 'Geistesblitz',
        text: 'Misslingt eine Probe, aber kein Patzer, erscheint „Geistesblitz einsetzen“. Ein Tipp würfelt dieselbe Probe noch einmal. Der Punkt gehört zur Begabung der Probe und ist dann verbraucht. Der Spielleiter füllt die Punkte für einen neuen Abend wieder auf.',
        more: 'rules-inspiration',
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
        text: 'Startet der Spielleiter einen Kampf, erscheint oben ein Band „Kampf läuft“, bei deinem Zug mit dem Hinweis „du bist dran“. Die Zeitleiste zeigt, wer in welcher Reihenfolge dran ist, wer aussetzt und wer kampfunfähig ist. Von deiner Gruppe siehst du die Lebenspunkte, von Gegnern nicht.\n\nBist du dran, greifst du an oder machst eine andere Aktion. Wirst du getroffen, entscheidest du, ob du parierst. Nichts zählt, bevor der Spielleiter den Zug abschließt.',
        more: 'rules-combat',
      },
    ],
  },
  {
    id: 'quests',
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
        more: 'rules-basics',
      },
    ],
  },
  {
    id: 'rules-basics',
    title: 'Das Spiel in Kürze',
    steps: [
      {
        title: 'Pen and Paper',
        text: 'Ein Spielleiter erzählt eine Geschichte, ihr spielt Helden darin. Was euer Charakter kann, steht auf seinem Bogen. Ob etwas gelingt, entscheiden Würfel.\n\nNach dem offiziellen Regelwerk von How to be a Hero (howtobeahero.de, CC BY-NC-SA 4.0), in eigenen Worten.',
      },
      {
        title: 'Der Bogen',
        text: 'Dein Charakter besteht aus:',
        list: ['Drei Begabungen: Handeln, Wissen, Soziales.', 'Fähigkeiten, jede einer Begabung zugeordnet, mit Punkten.', 'Lebenspunkten, am Anfang 100.', 'Inventar, Waffen und Besonderem.'],
      },
      {
        title: 'Eine Probe',
        text: 'Will dein Charakter etwas, das unsicher ist, würfelst du einen W100 (Prozentwürfel). Liegt der Wurf beim Wert der Fähigkeit oder darunter, gelingt es. Der Wert ist also deine Erfolgschance in Prozent.',
        more: 'rules-checks',
      },
      {
        title: 'Wer was macht',
        text: 'Der Spielleiter beschreibt die Welt und verlangt Proben. Du sagst, was dein Charakter tut. Die App würfelt für dich, der Spielleiter sieht jeden Wurf.',
      },
    ],
  },
  {
    id: 'rules-talents',
    title: 'Begabungen und Fähigkeiten',
    steps: [
      {
        title: 'Drei Begabungen',
        text: 'Jede Fähigkeit gehört zu einer von drei Begabungen:',
        list: ['Handeln: körperliche Tätigkeiten, zum Beispiel Bäume fällen oder reiten.', 'Wissen: Kenntnisse, zum Beispiel Sprachen, Pflanzen, Politik.', 'Soziales: Umgang mit anderen, zum Beispiel feilschen, überzeugen, Lügen erkennen.'],
      },
      {
        title: 'Der Begabungswert',
        text: 'Zähle alle Punkte der Fähigkeiten einer Begabung zusammen und teile durch 10, kaufmännisch gerundet.',
        example: '129 Punkte in Handeln ergeben Handeln 13. 123 Punkte ergeben 12.',
      },
      {
        title: 'Der Wert einer Fähigkeit',
        text: 'Der Begabungswert wird auf jede Fähigkeit seiner Begabung addiert. Mit diesem Wert würfelst du.',
        example: 'Holzfällen 50 + Handeln 13 = 63.',
      },
      {
        title: 'Etwas Ungelerntes',
        text: 'Willst du etwas, das keine deiner Fähigkeiten abdeckt, würfelst du auf den Wert der passenden Begabung. Auch die Begabungswerte stehen als Knöpfe im Würfeln-Reiter.',
      },
    ],
  },
  {
    id: 'rules-creation',
    title: 'Charakter erstellen',
    steps: [
      {
        title: '400 Punkte',
        text: 'Du hast 400 Punkte und verteilst alle auf Fähigkeiten. Nur so ist dein Charakter fertig.\n\nNach dem offiziellen Regelwerk von How to be a Hero (howtobeahero.de, CC BY-NC-SA 4.0), in eigenen Worten.',
      },
      {
        title: 'Erst verteilen, dann rechnen',
        text: 'Verteile die Punkte auf Fähigkeiten in den drei Begabungen. Die App rechnet den Begabungswert und den Wert jeder Fähigkeit sofort aus.',
        example: 'Handeln 70 Punkte → 7. Wissen 170 → 17. Soziales 160 → 16.\nSchauspielern 68 + Soziales 16 = 84.',
      },
      {
        title: 'Die Grenzen',
        text: 'Keine Fähigkeit darf 0 Punkte haben, und kein Wert darf über 100 liegen, mit dem Begabungswert zusammen. Wäre es mehr, setzt du die Punkte anders ein, in einer anderen Fähigkeit derselben Begabung.',
        tip: 'Einen Punkt auf jede Fähigkeit zu streuen ist wenig sinnvoll. Gib deinen Stärken mehr.',
      },
      {
        title: 'Geistesblitzpunkte',
        text: 'Aus dem Begabungswert ergeben sich die Geistesblitzpunkte: Begabungswert geteilt durch 10, kaufmännisch gerundet.',
        more: 'rules-inspiration',
      },
    ],
  },
  {
    id: 'rules-checks',
    title: 'Proben und Würfe',
    steps: [
      {
        title: 'Der Wurf',
        text: 'Alle Proben sind ein W100. Würfelst du den Wert der Fähigkeit oder weniger, gelingt die Probe. Der Wert in Prozent ist deine Erfolgschance.\n\nNach dem offiziellen Regelwerk von How to be a Hero (howtobeahero.de, CC BY-NC-SA 4.0), in eigenen Worten.',
      },
      {
        title: 'Kritischer Erfolg',
        text: 'Liegt der Wurf im ersten Zehntel deines Werts, ist der Erfolg kritisch. Eine 1 ist immer ein kritischer Erfolg.',
        example: 'Wert 70: Die Würfe 1 bis 7 sind kritisch.',
      },
      {
        title: 'Patzer',
        text: 'Misslingt die Probe und liegt der Wurf im letzten Zehntel dessen, was dir zu 100 fehlt, ist es ein kritischer Fehlschlag, ein Patzer. Eine 100 ist immer ein Patzer.',
        example: 'Wert 70: 1–7 kritisch, 8–70 gelungen, 71–96 misslungen, 97–100 Patzer.',
      },
      {
        title: 'Über 100 geht nicht',
        text: 'Der Wert einer Fähigkeit wird zum Würfeln bei 100 gedeckelt. Eine 100 würfeln bleibt auch bei Wert 100 ein Patzer.',
      },
      {
        title: 'In der App',
        text: 'Tippe auf eine Fähigkeit oder auf „Würfeln“ unten. Die Würfel rollen kurz, dann steht das Ergebnis da, mit einer Skala, wo dein Wurf lag.',
      },
    ],
  },
  {
    id: 'rules-inspiration',
    title: 'Geistesblitzpunkte',
    steps: [
      {
        title: 'Was sie sind',
        text: 'Geistesblitzpunkte hat jede Begabung: ihr Wert geteilt durch 10, kaufmännisch gerundet.',
        example: 'Handeln 13 ergibt 1 Punkt, Handeln 18 ergibt 2.',
      },
      {
        title: 'Einsetzen',
        text: 'Misslingt eine Probe, darfst du sie mit einem Punkt derselben Begabung noch einmal würfeln. Das geht nicht nach einem Patzer und nicht für Proben anderer Begabungen. Der Punkt ist danach verbraucht.',
      },
      {
        title: 'Wieder aufladen',
        text: 'Die Punkte gelten für ein Abenteuer oder einen Abend. Beginnt ein neuer Abend, füllt der Spielleiter sie mit „Neuer Abend“ wieder auf.',
        tip: 'In der App erscheint „Geistesblitz einsetzen“ direkt unter einer misslungenen Probe, mit der Zahl der übrigen Punkte.',
      },
    ],
  },
  {
    id: 'rules-life',
    title: 'Lebenspunkte',
    steps: [
      {
        title: '100 am Anfang',
        text: 'Jeder Charakter beginnt mit 100 Lebenspunkten.',
      },
      {
        title: 'Schwere Treffer',
        text: 'Verlierst du mit einem einzigen Angriff mehr als 60 Lebenspunkte, wirst du bewusstlos und kannst weder parieren noch angreifen. Sinken die Lebenspunkte unter 10, wirst du auch bewusstlos und brauchst Hilfe.',
      },
      {
        title: 'Tod',
        text: 'Bei 0 Lebenspunkten stirbt der Charakter. Der Spielleiter kann dir Lebenspunkte geben oder nehmen, das siehst du im Lebensbalken.',
      },
    ],
  },
  {
    id: 'rules-combat',
    title: 'Kampf',
    steps: [
      {
        title: 'Initiative',
        text: 'Vor jedem Kampf würfelt jeder einen W10 und addiert seinen Handeln-Wert. Wer am meisten hat, ist zuerst dran. Wer überrascht wird, setzt die erste Runde aus.',
      },
      {
        title: 'Angriff',
        text: 'Du würfelst eine Probe auf die passende Fähigkeit. Ein Erfolg trifft. Dann wird der Schaden gewürfelt: die Waffe hat xW10 Schaden, dazu kommt ein Bonus.',
        example: 'Ein Schwert macht 5W10, ein Messer 2W10, ein Stock 1W10 + 5.',
      },
      {
        title: 'Parade',
        text: 'Einmal pro Runde kannst du einen Angriff parieren, mit einer Probe auf Handeln oder eine passende Fähigkeit. Gelingt sie, entsteht kein Schaden. Kritische Angriffe und Schusswaffen kannst du nicht parieren.',
      },
      {
        title: 'Kritischer Treffer',
        text: 'Ein kritischer Treffer verdoppelt die gewürfelten Schadenswürfel. Der Bonus der Waffe wird danach addiert.',
      },
      {
        title: 'In der App',
        text: 'Die Zeitleiste zeigt die Reihenfolge. Bist du dran, greifst du an oder machst eine andere Aktion. Nichts zählt, bevor der Spielleiter den Zug abschließt.',
        more: 'my-sessions',
      },
    ],
  },
  {
    id: 'rules-traits',
    title: 'Vor- und Nachteile',
    steps: [
      {
        title: 'Ein freies Zusatzmodul',
        text: 'Vor- und Nachteile sind ein optionales Modul für erfahrene Gruppen. Die App rechnet sie nicht aus, ihr haltet sie am Tisch fest, zum Beispiel unter „Besonderes“ oder in der Beschreibung.',
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
    ],
  },
  {
    id: 'rules-leveling',
    title: 'Leveln: unsere Hausregel',
    steps: [
      {
        title: 'Bonuspunkte',
        text: 'Das offizielle Regelwerk kennt kein Leveln. In unserer Runde gibt der Spielleiter am Ende eines Kapitels Bonuspunkte, meist 10 für jeden Charakter. Die verteilst du selbst auf Fähigkeiten.',
        tip: 'Hausregel, nicht aus dem offiziellen Regelwerk.',
      },
      {
        title: 'Je besser, desto teurer',
        text: 'Ein Punkt, den du beim Leveln gewinnst, kostet Bonuspunkte nach den Punkten, die die Fähigkeit danach hat.',
        list: ['Bis 30 Punkte: 1 Bonuspunkt je Punkt.', '31 bis 50: 2 Bonuspunkte.', '51 bis 70: 3 Bonuspunkte.', 'Ab 71: 4 Bonuspunkte.'],
        example: 'Schmieden 40 auf 45 kostet 5 mal 2, also 10 Bonuspunkte. Schwert 69 auf 71 kostet 3 + 4 = 7.',
      },
      {
        title: 'Die 400 Grundpunkte bleiben fest',
        text: 'Die Punkte aus der Erstellung zählen 1:1 und sind fest, sobald du in einer Runde spielst. Du kannst sie nicht mehr umschichten. Neues kommt nur über Bonuspunkte. Die App zeigt an jeder Fähigkeit, was der nächste Punkt kostet.',
      },
      {
        title: 'Über 100 und Guthaben',
        text: 'Du kannst keine Fähigkeit über Wert 100 kaufen. Schiebt dein Begabungswert eine Fähigkeit später über 100, bleibt sie bei 100. Je 2 Punkte darüber ergeben 1 Punkt Guthaben, den du in einer Fähigkeit derselben Begabung einsetzen kannst.',
        example: 'Schwert 87 + Handeln 15 = 102. Die 2 Punkte darüber geben 1 Punkt Guthaben in Handeln.',
      },
    ],
  },
];

/** The three groups of the tutorial menu. */
export type TutorialGroup = 'app' | 'rules' | 'gm';

export const TUTORIAL_GROUPS: { id: TutorialGroup; label: string }[] = [
  { id: 'app', label: 'Die App' },
  { id: 'rules', label: 'Das Regelwerk' },
  { id: 'gm', label: 'Für Spielleiter' },
];

const PLAYER_APP = ['start-player', 'my-characters', 'my-sessions'];

/** The group a tutorial belongs to in the menu. */
export function groupOf(id: string): TutorialGroup {
  if (id.startsWith('rules-')) {
    return 'rules';
  }
  return PLAYER_APP.includes(id) ? 'app' : 'gm';
}
