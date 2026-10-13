/** One step of a tutorial: a short text, optionally with a jump to the tutorial that goes deeper. */
export interface TutorialStep {
  title: string;
  text: string;
  /** Id of another tutorial this step leads to. */
  more?: string;
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
        text: 'Unter dem Faden stehen die optionalen Szenen. Sie müssen nicht passieren. Du ziehst sie beim Spielen hinzu, wo sie passen.\n\nOb eine Szene am Faden hängt oder optional ist, stellst du im Formular der Szene mit einem Haken um.',
      },
      {
        title: 'Was in einer Szene steht',
        text: 'Eine Szene hat einen Namen, einen Text für dich und einen Text zum Vorlesen. Der Vorlesetext wird abgesetzt dargestellt, damit du ihn am Tisch sofort findest.\n\nGespeichert wird die Szene in ihrem Kapitel.',
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
        title: 'Suchen',
        text: 'Das Suchfeld sucht über alle Bereiche zugleich, in Namen und in Texten. Ein Klick auf einen Treffer öffnet den Eintrag.',
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
        text: 'Unter „Meine Charaktere“ baust du die Figuren, die du spielst. Gib einen Namen ein und leg den Charakter an, danach füllst du ihn im Formular.',
      },
      {
        title: 'Punkte verteilen',
        text: 'Du hast 400 Grundpunkte für deine Fähigkeiten, höchstens 100 pro Fähigkeit. Jede Fähigkeit gehört zu Handeln, Wissen oder Soziales. Die Werte rechnet die App aus: Der Begabungswert ist ein Zehntel aller Punkte der Begabung und zählt bei jeder ihrer Fähigkeiten dazu.',
      },
      {
        title: 'Was nur der Spielleiter ändert',
        text: 'Die Budgets für Grund- und Bonuspunkte und deine Lebenspunkte setzt der Spielleiter. Bonuspunkte bekommst du beim Leveln, meist am Ende eines Kapitels, und verteilst sie dann selbst.',
      },
      {
        title: 'Der Bogen',
        text: 'Ein Charakter öffnet sich als Bogen zum Lesen: Begabungen, Fähigkeiten mit ihrem Wert, Inventar, Waffen und besondere Fähigkeiten. Mit „Bearbeiten“ kommst du ins Formular.',
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
        title: 'Das Cockpit',
        text: 'Oben liegt die Leiste mit den Werkzeugen: Kapitel wählen, Spieleransicht, Kampf, Notizen, Archiv und Kapitel abschließen.\n\nDarunter steht die Gruppe als Reihe von Kacheln, dann links der rote Faden und rechts die gewählte Szene mit ihren Ereignissen, darunter die Hauptquests, die offenen Nebenquests und die übrigen Ereignisse. Unten bleiben die Stecknadeln und der letzte Wurf stehen.',
      },
      {
        title: 'Das Seitenfenster',
        text: 'Fast alles öffnet sich rechts in einem Fenster, ohne dass du die Seite verlässt: ein Eintrag der Welt, der Bogen eines Charakters, die geheimen Nachrichten, ein Gegenstand zum Übergeben, eine Notiz, das Archiv und die Liste der Würfe.\n\nEs ist immer nur ein Fenster offen. Mit „Schließen“ oder der Esc-Taste ist es wieder weg.',
      },
      {
        title: 'Abhaken und Stecknadeln',
        text: 'Szenen markierst du als gespielt, sie bleiben im Faden stehen. Erledigte Nebenquests und Ereignisse verschwinden aus dem Cockpit und stehen im Archiv. Von dort holst du sie mit „Zurückholen“ wieder.\n\nHauptquests bleiben immer stehen, in der Reihenfolge ihrer Nummer, auch wenn sie erledigt sind oder zu einem anderen Kapitel gehören.\n\nMit der Stecknadel heftest du an, was du schnell wiederfinden willst. Die Stecknadeln stehen in der Leiste unten.',
      },
      {
        title: 'Was die Spieler sehen',
        text: 'Öffne einen Eintrag und gib ihn für die Spieler frei. Dann sehen sie seinen Namen und seine Beschreibung in ihrem Glossar. Jedes Stück „Wissen für Spieler“ hakst du einzeln an, sobald sie es herausfinden.\n\nEine Quest teilst du genauso. Die Spieler sehen dann Beschreibung, Ziel, Checkliste und Auftraggeber. „Wissen nur für dich“ sehen sie nie.',
      },
      {
        title: 'Spieleransicht',
        text: 'Mit „Spieleransicht“ schaust du dir an, was die Spieler gerade sehen: ihre Quests, ihr Glossar und die Gruppe. So prüfst du, ob du nichts zu viel freigegeben hast.',
      },
      {
        title: 'Die Gruppe',
        text: 'Jeder Charakter ist eine Kachel zum Auf- und Zuklappen. Zugeklappt siehst du Name und Lebenspunkte als Balken, gemessen am Maximum des Charakters. Aufgeklappt änderst du die Lebenspunkte, siehst Begabungen, Fähigkeiten und Waffen und öffnest Bogen, geheime Nachrichten oder die Übergabe eines Gegenstands.\n\nVorbereitete Gegenstände sind die Wissens-Einträge der Kategorie „Gegenstand“.',
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
        text: 'Der Spielleiter nimmt einen deiner Charaktere in eine Runde auf. Sie erscheint dann unter „Meine Runden“. Ein Charakter spielt immer nur in einer Runde.',
      },
      {
        title: 'Charakter und Würfeln',
        text: 'Im Reiter „Charakter“ siehst du deinen Bogen. Tippe auf eine Begabung oder Fähigkeit, um eine Probe zu würfeln: ein W100 gegen deinen Wert. Der Spielleiter sieht den Wurf.',
      },
      {
        title: 'Quests und Glossar',
        text: 'Hier steht nur, was der Spielleiter mit euch geteilt hat. Das Glossar wächst, während ihr spielt: Orte, Figuren und Wissen kommen dazu, sobald ihr sie entdeckt.',
      },
      {
        title: 'Notizen',
        text: 'Die Notizen sind eine Tafel mit Karten: deine eigenen und der Gruppenblock. Ein Klick öffnet eine Notiz zum Schreiben und Kommentieren.\n\nEigene Notizen siehst nur du. Legst du eine in den Gruppenblock, sehen sie alle in der Runde und können Kommentare dazuschreiben. Du kannst sie jederzeit zurückholen.',
      },
      {
        title: 'Nachrichten',
        text: 'Der Spielleiter kann dir geheime Nachrichten schicken, die sonst niemand sieht. Du kannst ihm antworten.',
      },
      {
        title: 'Kampf',
        text: 'Startet der Spielleiter einen Kampf, zeigt der Reiter „Kampf“ die Reihenfolge, wer dran ist und was passiert ist. Von deiner Gruppe siehst du die Lebenspunkte, von Gegnern nicht.\n\nBist du dran, wählst du Ziel, Fähigkeit und Waffe und würfelst den Angriff. Wirst du getroffen, entscheidest du, ob du parierst. Das geht einmal pro Runde. Deine letzte Auswahl bleibt gemerkt.\n\nEin Wurf zählt erst, wenn der Spielleiter den Zug abschließt.',
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
        text: 'Eine Quest kann einen Ort, einen Auftraggeber und beteiligte Figuren haben.\n\nIn welchem Kapitel sie vorkommt, legst du im Kapitel fest. Szenen können ebenfalls auf sie verweisen.',
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
        text: 'Die Kategorie ist freier Text. Schreib „Tier“, „Gegenstand“ oder was dir hilft. Einträge mit derselben Kategorie stehen in der Liste zusammen.',
      },
      {
        title: 'Allein oder angehängt',
        text: 'Ein Wissens-Eintrag kann für sich stehen. Du kannst ihn aber auch an Orte, Figuren, Quests und Ereignisse hängen, dann erscheint er dort unter „Wissen“.\n\nSzenen können ebenfalls auf Wissen verweisen.',
      },
    ],
  },
];
