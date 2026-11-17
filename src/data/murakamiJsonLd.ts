// MURAKAMI MAMBO !!（/murakami/ 配下）の JSON-LD に足す項目。Layout の jsonLdExtra に渡す。
// sameAs は、典拠の側で確かめた ID だけを入れる（2026-11-17、Eddie）。
// 確かめ方：Wikidata の各項目（P214 VIAF・P213 ISNI・P244 LCNAF・P434 MusicBrainz、作品は P50/P57 が村上龍）、
// LCNAF はその記録の見出し名、MusicBrainz は名前と国。
// 入れなかったもの：Wikidata で José Luis Cortés López（LCNAF n86028353）は 1943年生まれの歴史家で、Tosco とは別人。
// JTE（Japanese Traditional Events）は Wikidata に項目がない。

const SITE = 'https://japoneson.com';

export const ryu = {
  '@type': 'Person',
  '@id': `${SITE}/#ryu-murakami`,
  name: 'Ryu Murakami',
  alternateName: ['村上龍', 'Ryū Murakami', 'Murakami, Ryū, 1952-'],
  sameAs: [
    'http://id.loc.gov/authorities/names/n79144997',
    'http://viaf.org/viaf/84508169',
    'https://isni.org/isni/0000000121417954',
    'http://www.wikidata.org/entity/Q380265',
    'https://musicbrainz.org/artist/92c2ea61-c347-4f6b-b644-d65f5741415a',
  ],
};
const byRyu = { '@id': ryu['@id'] };

const book = (name: string, alt: string, sameAs: string[]) => ({
  '@type': 'Book',
  name,
  alternateName: alt,
  author: byRyu,
  sameAs,
});

const works = {
  almostTransparentBlue: book('Almost Transparent Blue', '限りなく透明に近いブルー', ['http://www.wikidata.org/entity/Q597217']),
  coinLockerBabies: book('Coin Locker Babies', 'コインロッカー・ベイビーズ', [
    'http://www.wikidata.org/entity/Q928977',
    'http://viaf.org/viaf/312529944',
  ]),
  inTheMisoSoup: book('In the Miso Soup', 'イン ザ・ミソスープ', ['http://www.wikidata.org/entity/Q763404']),
  sixtyNine: book('69', '69 sixty nine', ['http://www.wikidata.org/entity/Q2617634', 'http://viaf.org/viaf/310260575']),
  audition: book('Audition', 'オーディション', ['http://www.wikidata.org/entity/Q4819963']),
  piercing: book('Piercing', 'ピアッシング', ['http://www.wikidata.org/entity/Q7191860', 'http://viaf.org/viaf/308118442']),
  kyokoNovel: book('KYOKO', 'KYOKO', ['http://www.wikidata.org/entity/Q4220993']),
  kyokoFilm: {
    '@type': 'Movie',
    name: 'KYOKO',
    director: byRyu,
    sameAs: ['http://www.wikidata.org/entity/Q6451967'],
  },
};

const tosco = {
  '@type': 'Person',
  '@id': `${SITE}/#jose-luis-cortes`,
  name: 'José Luis Cortés',
  alternateName: 'El Tosco',
  sameAs: [
    'http://www.wikidata.org/entity/Q99695775',
    'https://musicbrainz.org/artist/64606371-3103-4e20-952f-c13473302839',
  ],
};
export const ngLaBanda = {
  '@type': 'MusicGroup',
  '@id': `${SITE}/#ng-la-banda`,
  name: 'NG La Banda',
  sameAs: [
    'http://id.loc.gov/authorities/names/no98023910',
    'http://viaf.org/viaf/140883656',
    'https://isni.org/isni/0000000119405743',
    'http://www.wikidata.org/entity/Q467532',
    'https://musicbrainz.org/artist/a88cb452-0af4-4171-bd07-d54bd8b14349',
  ],
};
const losVanVan = {
  '@type': 'MusicGroup',
  '@id': `${SITE}/#los-van-van`,
  name: 'Los Van Van',
  sameAs: [
    'http://id.loc.gov/authorities/names/n91128969',
    'http://viaf.org/viaf/140478822',
    'https://isni.org/isni/000000011957028X',
    'http://www.wikidata.org/entity/Q1870602',
  ],
};
// Issac Delgado：NG La Banda の初期のボーカル。レコードのページ（md）で使う
export const issacDelgado = {
  '@type': 'Person',
  '@id': `${SITE}/#issac-delgado`,
  name: 'Issac Delgado',
  sameAs: [
    'http://id.loc.gov/authorities/names/no95058450',
    'http://viaf.org/viaf/170313430',
    'https://isni.org/isni/0000000119142584',
    'http://www.wikidata.org/entity/Q983920',
    'https://musicbrainz.org/artist/b33887db-f72a-4a3e-927f-89352006b6ab',
  ],
};

const sakamoto = {
  '@type': 'Person',
  '@id': `${SITE}/#ryuichi-sakamoto`,
  name: 'Ryuichi Sakamoto',
  alternateName: '坂本龍一',
  sameAs: [
    'http://id.loc.gov/authorities/names/n80022754',
    'http://viaf.org/viaf/108580815',
    'https://isni.org/isni/0000000121470392',
    'http://www.wikidata.org/entity/Q345494',
    'https://musicbrainz.org/artist/a7f7df4a-77d8-4f12-8acd-5c60c93f4de8',
  ],
};

// JTE の一次資料は、公式サイト
const jteBook = {
  '@type': 'Book',
  name: 'Japanese Traditional Events',
  author: byRyu,
  datePublished: '2016',
  url: 'http://jte.ryumurakami.com/',
};

type Page = 'top' | 'books' | 'kyoko' | 'music' | 'tosco' | 'jte';

export function murakamiJsonLd(page: Page) {
  const w = works;
  switch (page) {
    case 'top':
      return { about: [ryu], mentions: [w.almostTransparentBlue, w.inTheMisoSoup, w.kyokoNovel, w.kyokoFilm, losVanVan] };
    case 'books':
      return {
        about: [ryu],
        mentions: [w.almostTransparentBlue, w.coinLockerBabies, w.inTheMisoSoup, w.sixtyNine, w.audition, w.piercing, w.kyokoNovel],
      };
    case 'kyoko':
      return { about: [w.kyokoNovel, w.kyokoFilm], mentions: [ryu] };
    case 'music':
      return { about: [ryu], mentions: [ngLaBanda, losVanVan, tosco] };
    case 'tosco':
      return { about: [ryu, tosco], mentions: [ngLaBanda, w.almostTransparentBlue] };
    case 'jte':
      return { about: [jteBook, ryu], mentions: [sakamoto], citation: [jteBook] };
  }
}
