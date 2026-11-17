// md から作るページ（[...slug].astro）の JSON-LD に足す項目。キーはページのパス。Layout の jsonLdExtra に渡す。
// sameAs は、典拠の側で確かめた ID だけを入れる（2026-11-17、Eddie）。
// 確かめ方：LCNAF の記録の見出し名と closeMatch、Wikidata の P214 VIAF・P213 ISNI・P244 LCNAF・P434 MusicBrainz。
// Jerome Jennings：Wikidata にある LCNAF（no2007075783）の出典が「Jones, S. Roots, 2006」で、
//   このドラマーと同じ人か確かめられなかったので、LCNAF と VIAF は入れていない。
// Todd Bryant Weeks：典拠の ID が見つからなかったので、名前だけ。

import { ngLaBanda, issacDelgado } from './murakamiJsonLd';
import { paul, mpl } from './dreamJsonLd';

const gaskin = {
  '@type': 'Person',
  '@id': 'https://japoneson.com/#leonard-gaskin',
  name: 'Leonard Gaskin',
  sameAs: [
    'http://id.loc.gov/authorities/names/n92027275',
    'http://viaf.org/viaf/44485109',
    'https://isni.org/isni/0000000055142648',
    'http://www.wikidata.org/entity/Q1818977',
    'https://musicbrainz.org/artist/d928e461-7c80-41d8-9987-d8ef643f3956',
  ],
};

const cranshaw = {
  '@type': 'Person',
  name: 'Bob Cranshaw',
  sameAs: [
    'http://id.loc.gov/authorities/names/n79017434',
    'http://viaf.org/viaf/64191362',
    'https://isni.org/isni/0000000081438047',
    'http://www.wikidata.org/entity/Q887868',
    'https://musicbrainz.org/artist/6bf4f019-5ac1-4b48-80fe-e48823377419',
  ],
};
const hope = {
  '@type': 'Person',
  name: 'Bertha Hope',
  sameAs: [
    'http://id.loc.gov/authorities/names/no98014352',
    'http://viaf.org/viaf/39566022',
    'https://isni.org/isni/0000000041012703',
    'http://www.wikidata.org/entity/Q827715',
    'https://musicbrainz.org/artist/3e5c3c85-f95b-4285-b8df-bba88befdba1',
  ],
};
const jennings = {
  '@type': 'Person',
  name: 'Jerome Jennings',
  sameAs: [
    'http://www.wikidata.org/entity/Q44167267',
    'https://musicbrainz.org/artist/be906bed-a144-486a-ad40-73f908509500',
  ],
};
const weeks = { '@type': 'Person', name: 'Todd Bryant Weeks' };
const seina = { '@type': 'Person', '@id': 'https://cabin1701.com/#person', name: 'Shoko "Seina" Shiraishi' };

// 一次資料
const sources = [
  {
    '@type': 'Article',
    name: "I'll Be Seeing You",
    author: weeks,
    url: 'https://www.local802afm.org/allegro/articles/ill-be-seeing-you/',
    isPartOf: {
      '@type': 'Periodical',
      name: 'Allegro',
      publisher: { '@type': 'Organization', name: 'Local 802, American Federation of Musicians' },
    },
  },
  {
    '@type': 'Article',
    isPartOf: {
      '@type': 'PublicationIssue',
      issueNumber: '144',
      datePublished: '2008-07',
      isPartOf: { '@type': 'Periodical', name: 'Jazz Hihyo', alternateName: 'ジャズ批評' },
    },
  },
  {
    '@type': 'Article',
    datePublished: '2008',
    isPartOf: { '@type': 'Periodical', name: 'Shukan New York Seikatsu', alternateName: '週刊NY生活' },
  },
];

const concert2008 = {
  '@type': 'MusicEvent',
  name: "I'll Be Seeing You, Mr. Leonard Gaskin",
  startDate: '2008-03-27',
  location: { '@type': 'Place', name: 'Ozanam Hall', address: 'Bayside, Queens, New York' },
  performer: [seina, cranshaw, hope, jennings],
  organizer: seina,
};

// For The Boys（Monica Lewis）
const monica = {
  '@type': 'Person',
  '@id': 'https://japoneson.com/#monica-lewis',
  name: 'Monica Lewis',
  sameAs: [
    'http://id.loc.gov/authorities/names/n80146362',
    'http://id.loc.gov/rwo/agents/n80146362',
    'http://viaf.org/viaf/72702733',
    'https://isni.org/isni/0000000021904464',
    'http://www.wikidata.org/entity/Q4961917',
    'https://musicbrainz.org/artist/06780d05-0b54-44a4-9fde-1307d5f9ced6',
  ],
};
const dannyKaye = {
  '@type': 'Person',
  name: 'Danny Kaye',
  sameAs: [
    'http://id.loc.gov/authorities/names/n85230433',
    'http://viaf.org/viaf/59274438',
    'http://www.wikidata.org/entity/Q213425',
    'https://musicbrainz.org/artist/7f97c63c-419b-475f-8df7-87e1d2ec3ba2',
  ],
};
// 一次資料：Monica Lewis から Seina へのメッセージと写真（ページ内の記載どおり。写真は Dean Lamanna）、小倉の十字架のページ
const forTheBoysSources = (lang: 'en' | 'es') => [
  {
    '@type': 'Message',
    sender: { '@id': monica['@id'] },
    recipient: seina,
    associatedMedia: { '@type': 'Photograph', creator: { '@type': 'Person', name: 'Dean Lamanna' } },
  },
  { '@type': 'WebPage', name: 'The Memorial Cross', url: `https://japoneson.com/${lang}/swing/remember/memorial_cross/` },
];

// Brooklyn Bop（BBB）。ID は LCNAF の見出し名と Wikidata で確かめた
const P = (name: string, ids: string[]) => ({ '@type': 'Person', name, sameAs: ids });
const LC = (n: string) => `http://id.loc.gov/authorities/names/${n}`;
const VIAF = (n: string) => `http://viaf.org/viaf/${n}`;
const ISNI = (n: string) => `https://isni.org/isni/${n}`;
const WD = (q: string) => `http://www.wikidata.org/entity/${q}`;
const MB = (id: string) => `https://musicbrainz.org/artist/${id}`;

const dukeJordan = P('Duke Jordan', [LC('n83231137'), VIAF('84969788'), ISNI('0000000078397141'), WD('Q1264406'), MB('18288a13-0259-4a44-a9dc-558229fbfdd2')]);
const cecilPayne = P('Cecil Payne', [LC('n91066947'), VIAF('32184283'), ISNI('0000000117568549'), WD('Q485927'), MB('783132e6-fed7-40b6-9173-aa7e82e7d953')]);
const maxRoach = P('Max Roach', [LC('n81072981'), VIAF('7575133'), ISNI('0000000115916378'), WD('Q175899'), MB('0b6aea55-d855-4a33-ae08-b0280dd28684')]);
const randyWeston = P('Randy Weston', [LC('n84162381'), VIAF('24788821'), ISNI('0000000081037964'), WD('Q1371187'), MB('7e198258-7093-46ac-a71e-91075fd0f5af')]);
const wadeBarnes = P('Wade Barnes', [LC('n2006091433'), VIAF('31433122'), WD('Q15441507'), MB('3bc0b125-7c65-4d4b-9791-d942f6537268')]);
const dizzy = P('Dizzy Gillespie', [LC('n50033872'), VIAF('77110276'), ISNI('0000000109181520'), WD('Q49575'), MB('e9ba8ccb-505f-4e5c-b909-65998d0d35b5')]);
const bird = P('Charlie Parker', [LC('n50050327'), VIAF('10034216'), WD('Q103767')]);
const jacquet = P('Illinois Jacquet', [LC('n83021444'), VIAF('37102134'), ISNI('0000000059487571'), WD('Q1658835'), MB('15ab8bb8-7348-4377-ab73-b7acdad1459c')]);
const pettiford = P('Oscar Pettiford', [LC('n85098446'), VIAF('24788159'), ISNI('0000000081037921'), WD('Q497183'), MB('28f6d494-d44b-4bd3-aed9-1d4909875ca1')]);
const bauza = P('Mario Bauzá', [LC('nr94021545'), VIAF('34648293'), ISNI('0000000059363528'), WD('Q722618'), MB('da951c78-737f-4e7a-b7fd-17297bdae3c0')]);

const bbbSources = [
  {
    '@type': 'ArchiveComponent',
    name: 'Leonard Gaskin and Max Roach, Concord Baptist Church, Brooklyn, May 1990',
    identifier: 'NMAH.AC.0900_ref3240',
    holdingArchive: { '@type': 'ArchiveOrganization', name: 'Archives Center, National Museum of American History, Smithsonian Institution' },
  },
  {
    '@type': 'ArchiveComponent',
    name: 'The Brooklyn Four rehearsing for recording, Carroll Studios, New York, February 7, 1999',
    identifier: 'NMAH-AC0900-B090-F005',
    url: 'https://mads.si.edu/mads/id/NMAH-AC0900-B090-F005',
    holdingArchive: { '@type': 'ArchiveOrganization', name: 'Archives Center, National Museum of American History, Smithsonian Institution' },
  },
  {
    '@type': 'Article',
    name: 'A Man with a Plan: Listening to Wade Barnes',
    author: weeks,
    datePublished: '2009-07',
    url: 'https://www.local802afm.org/allegro/articles/a-man-with-a-plan-listening-to-wade-barnes/',
    isPartOf: { '@type': 'Periodical', name: 'Allegro' },
  },
  {
    '@type': 'Article',
    name: 'From the Heart',
    author: weeks,
    datePublished: '2012-09',
    url: 'https://www.local802afm.org/allegro/articles/from-the-heart/',
    isPartOf: { '@type': 'Periodical', name: 'Allegro' },
  },
  {
    '@type': 'MusicAlbum',
    name: 'The Brooklyn Four Plus One',
    datePublished: '1999',
    byArtist: [wadeBarnes, { '@id': gaskin['@id'] }, cecilPayne],
  },
  concert2008,
  {
    '@type': 'Event',
    name: "Seina's recording session with Leonard Gaskin",
    startDate: '1998',
    location: { '@type': 'Place', name: 'Manhattan, New York' },
    performer: [seina, { '@id': gaskin['@id'] }],
  },
];

// Thanks for the Memory（/swing/memory/）
const leroyWilliams = P('Leroy Williams', [LC('n80055693'), VIAF('46949437'), ISNI('0000000119494723'), WD('Q1820408'), MB('d7e2ec9d-bb8e-4cc8-87c5-2278bc0c8bd4')]);
const johnColianni = P('John Colianni', [LC('n88665591'), VIAF('38497830'), ISNI('0000000055473420'), WD('Q6226666'), MB('320d954a-59b2-4ea2-90dd-bb541c341485')]);
const gradyTate = P('Grady Tate', [LC('n81095918'), VIAF('85873629'), ISNI('0000000114767542'), WD('Q489386'), MB('16af2a0a-578e-44f4-b109-7e2fb4b83d6e')]);
const sonnyRollins = P('Sonny Rollins', [LC('n82144213'), VIAF('7368226'), ISNI('0000000110367920'), WD('Q299208'), MB('3b47247e-5b57-49b6-a0ed-bad80243802a')]);
const melTorme = P('Mel Tormé', [LC('n50014544'), VIAF('74039030'), WD('Q470848'), MB('4439c2fd-a754-4f6a-b3a6-791b47726156')]);
const kenPeplowski = P('Ken Peplowski', [LC('n91112621'), VIAF('84975307'), ISNI('0000000114501656'), WD('Q487154'), MB('da92da8b-7d99-4158-bd72-76a05ba3237f')]);

const memoryTracks = [
  "I've Heard That Song Before", "You Made Me Love You (I Didn't Want to Do It)", 'A Tree in the Meadow',
  'And the Angels Sing', "I've Got a Crush on You", "I Can't Give You Anything but Love",
  "I Don't Stand a Ghost of a Chance with You", "No Love, No Nothin'", 'I Had the Craziest Dream',
  'Stay As Sweet As You Are', 'All of Me', 'Two Sleepy People / Thanks for the Memory',
];
const role = (person: object, roleName: string) => ({ '@type': 'PerformanceRole', contributor: person, roleName });
const memoryAlbum = {
  '@type': 'MusicAlbum',
  name: 'Thanks for the Memory',
  byArtist: seina,
  contributor: [role(cranshaw, 'Bass'), role(leroyWilliams, 'Drums'), role(johnColianni, 'Piano'), role(seina, 'Vocals')],
  recordingOf: undefined,
  locationCreated: { '@type': 'Place', name: 'Nola Studios', address: '57th Street, New York' },
  numTracks: memoryTracks.length,
  track: { '@type': 'ItemList', itemListElement: memoryTracks.map((name, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'MusicRecording', name } })) },
  sameAs: ['https://www.youtube.com/playlist?list=PL8E68E379ABA5C077'],
};
const sensojiVideo = {
  '@type': 'VideoObject',
  name: 'Bob Cranshaw laughing, Tokyo 2010',
  description: 'October 2010, at Sensō-ji Temple in Tokyo.',
  embedUrl: 'https://www.youtube.com/embed/Lyhm5OyZDrA',
  contentLocation: { '@type': 'Place', name: 'Sensō-ji, Tokyo' },
};

const pages = (lang: 'en' | 'es'): Record<string, Record<string, unknown>> => ({
  'swing/leonard-gaskin': {
    about: [gaskin, concert2008],
    mentions: [cranshaw, hope, jennings, weeks],
    citation: [...sources, concert2008],
  },
  'swing/leonard-gaskin/brooklyn-bop': {
    about: [gaskin, dukeJordan, cecilPayne, maxRoach, randyWeston, wadeBarnes],
    mentions: [dizzy, bird, jacquet, pettiford, bauza],
    citation: bbbSources,
  },
  'swing/memory': {
    about: [memoryAlbum],
    mentions: [cranshaw, leroyWilliams, johnColianni, gradyTate, sonnyRollins, gaskin, melTorme, kenPeplowski],
    citation: [memoryAlbum, sensojiVideo],
  },
  'swing/paul-mccartney': { about: [paul], mentions: [mpl] },
  'swing/for-the-boys': { about: [monica], mentions: [dannyKaye], citation: forTheBoysSources(lang) },
  'murakami/music/nueva-generacion': { about: [ngLaBanda], mentions: [issacDelgado] },
  'murakami/music/1997-historia-de-un-amor': { mentions: [issacDelgado] },
});

export function mdPageJsonLd(path: string, lang: 'en' | 'es') {
  return pages(lang)[path];
}
