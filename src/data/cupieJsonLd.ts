// Cupie Danny の入口（Japoneson の /cupie/）の JSON-LD に足す項目。Layout の jsonLdExtra に渡す。
// 本体は cupiedanny.com に引っ越した（2026-10-16）。このページは、その入口として残っている。
// sameAs は、典拠の側で確かめた ID だけを入れる（2026-11-17、Eddie）。
// Juan-Carlos Formell：LCNAF nr2001014631（見出し「Formell, Juan-Carlos」）と Wikidata Q118779562。
// Martin Cohen：Wikidata Q109984876（Latin Percussion の項目 Q3827474 の創設者 P112 がこの人）。
// Danny Rojo：典拠の ID が見つからなかったので、名前だけ。
// Giovanni Hidalgo：このページには出てこないので、入れていない。

const latinPercussion = {
  '@type': 'Organization',
  name: 'Latin Percussion',
  sameAs: ['http://www.wikidata.org/entity/Q3827474'],
};
const martinCohen = {
  '@type': 'Person',
  name: 'Martin Cohen',
  sameAs: ['http://www.wikidata.org/entity/Q109984876'],
  affiliation: latinPercussion,
};
const juanCarlosFormell = {
  '@type': 'Person',
  name: 'Juan-Carlos Formell',
  sameAs: [
    'http://id.loc.gov/authorities/names/nr2001014631',
    'http://viaf.org/viaf/26989746',
    'https://isni.org/isni/0000000055512071',
    'http://www.wikidata.org/entity/Q118779562',
  ],
};
const dannyRojo = { '@type': 'Person', name: 'Danny Rojo' };

const cupieSite = {
  '@type': 'WebSite',
  name: 'Cupie Danny',
  url: 'https://cupiedanny.com/',
};

export function cupieJsonLd(lang: 'en' | 'es') {
  return {
    about: [{ '@type': 'CreativeWork', name: 'Cupie Danny', url: `https://cupiedanny.com/${lang}/` }],
    mentions: [dannyRojo, martinCohen, juanCarlosFormell],
    relatedLink: [
      `https://cupiedanny.com/${lang}/`,
      `https://cupiedanny.com/${lang}/gallery-01/`,
      `https://cupiedanny.com/${lang}/gallery-02/`,
      `https://cupiedanny.com/${lang}/gallery-03/`,
      `https://cupiedanny.com/${lang}/theater/`,
    ],
    // このページの記録：2013年11月、ニューヨークのイースト・ハーレムで Danny Rojo に会った話と、Congahead のスタジオの写真。
    // 2023年5月の Juan-Carlos Formell への追悼のうちわ。どちらも、このページの本文と写真
    citation: [
      { '@type': 'Event', name: 'Meeting Danny Rojo in East Harlem', startDate: '2013-11', location: { '@type': 'Place', name: 'East Harlem, New York' }, performer: dannyRojo },
      { '@type': 'VisualArtwork', name: 'Tribute fan (uchiwa) for Juan-Carlos Formell', dateCreated: '2023-05', about: juanCarlosFormell },
    ],
    significantLink: `https://cupiedanny.com/${lang}/`,
    mainEntity: cupieSite,
  };
}
