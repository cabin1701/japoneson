// The 24th Infantry Division（/mystery/macarthur/korea-24th/）の JSON-LD に足す項目。Layout の jsonLdExtra に渡す。
// 確かめた ID だけ（2026-11-17、Eddie）。William F. Dean：LCNAF no2007038002（見出し「Dean, William F. (William Frishe), 1899-1981」）、Wikidata Q488483。
// 本：国立国会図書館で「General Dean's story / as told to William L. Worden by William F. Dean」、Viking Press、1954（初版）。
//   ほかに Tuttle 1954、Greenwood Press 1973 の版がある。Seina が持っていた本がどの版かは、わからないので書かない。

const dean = {
  '@type': 'Person',
  name: 'William F. Dean',
  sameAs: [
    'http://id.loc.gov/authorities/names/no2007038002',
    'http://viaf.org/viaf/107495048',
    'https://isni.org/isni/0000000082875820',
    'http://www.wikidata.org/entity/Q488483',
  ],
};

const book = {
  '@type': 'Book',
  name: "General Dean's Story",
  author: dean,
  contributor: { '@type': 'Person', name: 'William L. Worden' },
  datePublished: '1954',
  publisher: { '@type': 'Organization', name: 'Viking Press' },
  sameAs: ['https://ndlsearch.ndl.go.jp/books/R100000136-I1970023484867723802'],
  image: 'https://media.cabin1701.com/japoneson/mystery/macarthur/korea-24th/general-deans-story-cover.jpg',
};

export const korea24JsonLd = { about: [dean], citation: [book] };
