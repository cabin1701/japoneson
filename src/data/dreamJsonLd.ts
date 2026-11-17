// I Have a Dream… Seina（/swing/dream/）と Archive & Evidence の JSON-LD に足す項目。Layout の jsonLdExtra に渡す。
// sameAs は、典拠の側で確かめた ID だけを入れる（2026-11-17、Eddie）。
// Paul McCartney：LCNAF n50012135（見出し「McCartney, Paul」）、Wikidata Q2599 の VIAF・ISNI・MusicBrainz。
// MPL Communications：LoC の entities（providers・agents）の見出し「MPL Communications」、
//   Wikidata Q32294 の LCNAF（no99083087「M.P.L. Communication, Inc.」）と VIAF。
// 一次資料は、Evidence のページに画像で載せている3つ（日付と数はページの記載どおり）。

const SITE = 'https://japoneson.com';

export const paul = {
  '@type': 'Person',
  '@id': `${SITE}/#paul-mccartney`,
  name: 'Paul McCartney',
  sameAs: [
    'http://id.loc.gov/authorities/names/n50012135',
    'http://viaf.org/viaf/100252012',
    'https://isni.org/isni/0000000121452530',
    'http://www.wikidata.org/entity/Q2599',
    'https://musicbrainz.org/artist/ba550d0e-adac-4864-b88b-407cab5e76af',
  ],
};

export const mpl = {
  '@type': 'Organization',
  '@id': `${SITE}/#mpl-communications`,
  name: 'MPL Communications',
  founder: { '@id': paul['@id'] },
  sameAs: [
    'http://id.loc.gov/entities/providers/033d821bf54993873334faec7b216770',
    'http://id.loc.gov/entities/agents/033d821bf54993873334faec7b216770',
    'http://id.loc.gov/authorities/names/no99083087',
    'http://viaf.org/viaf/151594944',
    'http://www.wikidata.org/entity/Q32294',
  ],
};

const seina = { '@type': 'Person', '@id': 'https://cabin1701.com/#person', name: 'Shoko "Seina" Shiraishi' };
const MEDIA = 'https://media.cabin1701.com/japoneson/swing/dream/evidence';

const evidence = [
  {
    '@type': 'DigitalDocument',
    name: 'One-time gratis mechanical license (up to 5,000 copies)',
    dateCreated: '1999-06-10',
    author: { '@type': 'Person', name: 'Daniel Sokol', affiliation: { '@id': mpl['@id'] } },
    publisher: { '@id': mpl['@id'] },
    recipient: seina,
    image: `${MEDIA}/mpl-license-1999-06-10.jpg`,
  },
  {
    '@type': 'DigitalDocument',
    name: 'USPS Postage Statement (Permit Imprint): 669 pieces',
    dateCreated: '1999-12-06',
    publisher: { '@type': 'Organization', name: 'United States Postal Service' },
    image: `${MEDIA}/usps-statement-1999-12-06.jpg`,
  },
  {
    '@type': 'DigitalDocument',
    name: 'USPS Postage Statement (Permit Imprint): 2,840 pieces',
    dateCreated: '1999-12-10',
    publisher: { '@type': 'Organization', name: 'United States Postal Service' },
    image: `${MEDIA}/usps-statement-1999-12-10.jpg`,
  },
  {
    '@type': 'DigitalDocument',
    name: 'Letter from the White House',
    dateCreated: '1999-07-01',
    publisher: { '@type': 'Organization', name: 'The White House' },
    recipient: seina,
    image: `${MEDIA}/white-house-reply-1999-07-01.jpg`,
  },
];

export function dreamJsonLd(page: 'dream' | 'evidence') {
  if (page === 'evidence') return { mentions: [paul, mpl], citation: evidence };
  return { mentions: [paul, mpl] };
}
