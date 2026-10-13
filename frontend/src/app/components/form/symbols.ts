import {
  Amphora, Anchor, Axe, Baby, Backpack, Bandage, Bed, Beer, Bell, Biohazard, Bird, Bomb, BookOpen, BowArrow, Bridge, Bug, Castle,
  Cat, Church, CircleQuestionMark, CloudLightning, Coins, Cross, Crown, Dices, Dog, DoorOpen, Drama, Droplet, Drumstick, Eye,
  Fish, Flag, Flame, FlameKindling, FlaskConical, FlaskRound, Footprints, Gem, Ghost, Gift, Hammer, HandCoins, Handshake, Heart,
  HeartCrack, Hourglass, House, Key, Lamp, Landmark, Leaf, Lighthouse, Lock, Map as MapSheet, MessageCircle, MoonStar, Mountain,
  MountainSnow, Package, PawPrint, Pickaxe, Rat, Scale, Scroll, Shield, Ship, Shirt, Signpost, Skull, Snowflake, Sparkles, Star,
  Store, Sun, Sword, Swords, Target, Tent, Trees, TriangleAlert, Trophy, User, Users, VenetianMask, WandSparkles, Warehouse,
  Waves, Wheat, Zap,
} from 'lucide';

/** One drawn part of a symbol: the name of an SVG element and its attributes. */
export type Shape = [string, Record<string, string | number | undefined>];

/** A symbol an entry or a character can carry: its key in the database, its name and its drawing. */
export interface SymbolChoice {
  id: string;
  label: string;
  shapes: Shape[];
}

const symbol = (id: string, label: string, shapes: Shape[]): SymbolChoice => ({ id, label, shapes });

/** The symbols to pick from, grouped by what they usually stand for. They come from the free icon set Lucide. */
export const SYMBOL_GROUPS: { label: string; symbols: SymbolChoice[] }[] = [
  {
    label: 'Figuren',
    symbols: [
      symbol('user', 'Person', User), symbol('users', 'Gruppe', Users), symbol('crown', 'Herrscher', Crown),
      symbol('swords', 'Kämpfer', Swords), symbol('shield', 'Wache', Shield), symbol('wand', 'Magier', WandSparkles),
      symbol('leaf', 'Druide', Leaf), symbol('cross', 'Priester', Cross), symbol('hand-coins', 'Händler', HandCoins),
      symbol('hammer', 'Handwerker', Hammer), symbol('drama', 'Gaukler', Drama), symbol('mask', 'Verhüllter', VenetianMask),
      symbol('baby', 'Kind', Baby), symbol('skull', 'Untoter', Skull), symbol('ghost', 'Geist', Ghost),
      symbol('paw', 'Tier', PawPrint), symbol('bird', 'Vogel', Bird), symbol('dog', 'Hund', Dog), symbol('cat', 'Katze', Cat),
      symbol('rat', 'Ratte', Rat), symbol('fish', 'Fisch', Fish), symbol('bug', 'Ungeziefer', Bug),
    ],
  },
  {
    label: 'Orte',
    symbols: [
      symbol('castle', 'Burg', Castle), symbol('house', 'Haus', House), symbol('tent', 'Lager', Tent),
      symbol('church', 'Tempel', Church), symbol('landmark', 'Halle', Landmark), symbol('store', 'Laden', Store),
      symbol('beer', 'Taverne', Beer), symbol('bed', 'Herberge', Bed), symbol('warehouse', 'Speicher', Warehouse),
      symbol('anchor', 'Hafen', Anchor), symbol('ship', 'Schiff', Ship), symbol('lighthouse', 'Leuchtturm', Lighthouse),
      symbol('mountain', 'Berg', Mountain), symbol('mountain-snow', 'Pass', MountainSnow), symbol('trees', 'Wald', Trees),
      symbol('waves', 'Wasser', Waves), symbol('bridge', 'Brücke', Bridge), symbol('door', 'Tor', DoorOpen),
      symbol('signpost', 'Wegweiser', Signpost), symbol('map', 'Karte', MapSheet), symbol('wheat', 'Feld', Wheat),
      symbol('campfire', 'Feuerstelle', FlameKindling),
    ],
  },
  {
    label: 'Gegenstände',
    symbols: [
      symbol('gem', 'Edelstein', Gem), symbol('key', 'Schlüssel', Key), symbol('scroll', 'Schriftrolle', Scroll),
      symbol('book', 'Buch', BookOpen), symbol('flask', 'Trank', FlaskRound), symbol('vial', 'Alchemie', FlaskConical),
      symbol('sword', 'Schwert', Sword), symbol('axe', 'Axt', Axe), symbol('bow', 'Bogen', BowArrow),
      symbol('pickaxe', 'Werkzeug', Pickaxe), symbol('bomb', 'Bombe', Bomb), symbol('coins', 'Münzen', Coins),
      symbol('backpack', 'Rucksack', Backpack), symbol('lamp', 'Lampe', Lamp), symbol('amphora', 'Krug', Amphora),
      symbol('food', 'Proviant', Drumstick), symbol('bandage', 'Verband', Bandage), symbol('shirt', 'Kleidung', Shirt),
      symbol('gift', 'Geschenk', Gift), symbol('package', 'Kiste', Package), symbol('lock', 'Schloss', Lock),
      symbol('bell', 'Glocke', Bell), symbol('dices', 'Würfel', Dices), symbol('trophy', 'Trophäe', Trophy),
    ],
  },
  {
    label: 'Zeichen',
    symbols: [
      symbol('flag', 'Fahne', Flag), symbol('target', 'Ziel', Target), symbol('star', 'Stern', Star),
      symbol('sparkles', 'Magie', Sparkles), symbol('zap', 'Blitz', Zap), symbol('fire', 'Feuer', Flame),
      symbol('drop', 'Gift', Droplet), symbol('frost', 'Frost', Snowflake), symbol('storm', 'Unwetter', CloudLightning),
      symbol('alert', 'Gefahr', TriangleAlert), symbol('question', 'Rätsel', CircleQuestionMark),
      symbol('speech', 'Gespräch', MessageCircle), symbol('secret', 'Geheimnis', Eye), symbol('tracks', 'Spur', Footprints),
      symbol('handshake', 'Bündnis', Handshake), symbol('heart', 'Herz', Heart), symbol('loss', 'Verlust', HeartCrack),
      symbol('time', 'Zeit', Hourglass), symbol('scale', 'Recht', Scale), symbol('plague', 'Seuche', Biohazard),
      symbol('night', 'Nacht', MoonStar), symbol('day', 'Tag', Sun),
    ],
  },
];

/** The drawing of every symbol by its key. */
export const SYMBOLS: Record<string, Shape[]> = Object.fromEntries(
  SYMBOL_GROUPS.flatMap((group) => group.symbols.map((choice) => [choice.id, choice.shapes])),
);
