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
        text: 'Jede Figur hat Fähigkeiten mit Grund- und Bonuspunkten, die Werte rechnet die App nach den Regeln aus. Im Inventar wird ein Gegenstand zur Waffe, sobald er Schadenswürfel hat.',
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
