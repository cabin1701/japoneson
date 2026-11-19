// Mentai Rock（/rock/ 配下）の JSON-LD。
// sameAs は、典拠の側で確かめた ID だけを入れる（2026-11-17、Eddie）。
// 確かめ方：LoC の n91074498 の closeMatch（VIAF・ISNI・Wikidata）、
// Wikidata の各項目の P214(VIAF)・P213(ISNI)・P244(LCNAF)・P434/P436(MusicBrainz)、MusicBrainz の名前と国。
// 見つからなかったもの（Sheena 本人、大江慎也、ルースターズの LCNAF など）は入れていない。

const SITE = 'https://japoneson.com';

const sheenaRokkets = {
  '@type': 'MusicGroup',
  '@id': `${SITE}/#sheena-and-the-rokkets`,
  name: 'Sheena & The Rokkets',
  sameAs: [
    'http://id.loc.gov/authorities/names/n91074498',
    'http://viaf.org/viaf/124472470',
    'https://isni.org/isni/0000000086030497',
    'http://www.wikidata.org/entity/Q7492369',
  ],
};

const ayukawa = {
  '@type': 'Person',
  '@id': `${SITE}/#makoto-ayukawa`,
  name: 'Makoto Ayukawa',
  alternateName: '鮎川誠',
  memberOf: [{ '@id': sheenaRokkets['@id'] }, { '@id': `${SITE}/#sonhouse` }],
  sameAs: [
    'http://www.wikidata.org/entity/Q11674141',
    'http://viaf.org/viaf/255418590',
    'https://isni.org/isni/0000000378132938',
    'https://musicbrainz.org/artist/0ecf86c0-2891-437a-8378-e83835061b78',
  ],
};

const roosters = {
  '@type': 'MusicGroup',
  '@id': `${SITE}/#the-roosters`,
  name: 'The Roosters',
  sameAs: [
    'http://www.wikidata.org/entity/Q7761498',
    'https://musicbrainz.org/artist/94a50fbd-10a5-4b4c-8df4-97a2e7b4fee2',
  ],
};

const sonhouse = {
  '@type': 'MusicGroup',
  '@id': `${SITE}/#sonhouse`,
  name: 'Sonhouse',
  alternateName: 'サンハウス',
  sameAs: [
    'http://www.wikidata.org/entity/Q11305884',
    'https://musicbrainz.org/artist/becbc267-f0c8-458a-9463-c7bbf10a901d',
  ],
};

const yawata = {
  '@type': 'Place',
  '@id': `${SITE}/#yawata-steel-works`,
  name: 'Yawata Steel Works',
  alternateName: ['Yahata Steel Works', '官営八幡製鐵所'],
  sameAs: [
    'http://id.loc.gov/authorities/names/n83072456',
    'http://viaf.org/viaf/132561044',
    'http://www.wikidata.org/entity/Q2943310',
  ],
};

const mentaiRock = {
  '@type': 'Thing',
  '@id': `${SITE}/#mentai-rock`,
  name: 'Mentai Rock',
  sameAs: ['http://www.wikidata.org/entity/Q6817378'],
};

// 一次資料。1981年の米国盤 LP（LoC の典拠 n91074498 の出典「Its Sheena & the Rokkets [SR] p1981」）
const lp1981 = {
  '@type': 'MusicAlbum',
  name: 'Sheena & the Rokkets',
  datePublished: '1981',
  byArtist: { '@id': sheenaRokkets['@id'] },
  recordLabel: { '@type': 'Organization', name: 'A&M Records' },
  catalogNumber: 'SP-4875',
};

// 当事者の証言（オーラル・ヒストリー）。ページ内の場所を指す
function oralHistories(lang: 'en' | 'es' | 'ja') {
  const kind = lang === 'en' ? 'Oral history' : lang === 'es' ? 'Historia oral' : 'オーラル・ヒストリー';
  const v = `${SITE}/${lang}/rock/voices/`;
  const item = (name: string, url: string) => ({
    '@type': 'CreativeWork',
    genre: kind,
    inLanguage: lang,
    url,
    author: { '@type': 'Person', name },
  });
  return [
    {
      ...item('Shoko "Seina" Shiraishi', `${v}#seina`),
      author: { '@type': 'Person', '@id': 'https://cabin1701.com/#person', name: 'Shoko "Seina" Shiraishi' },
    },
    item('Dobb', `${v}#dobb`),
    item('Juntaro Fukuda', `${v}#juntaro`),
    item('Keiichi Takano', `${SITE}/${lang}/rock/takano/`),
  ];
}

export function rockJsonLd(opts: { lang: 'en' | 'es' | 'ja'; path: string; title: string; description: string }) {
  const { lang, path, title, description } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: `${SITE}${path}`,
    inLanguage: lang,
    author: { '@type': 'Person', '@id': 'https://cabin1701.com/#person', name: 'Shoko "Seina" Shiraishi' },
    isPartOf: { '@type': 'WebSite', name: 'Japonéson', url: `${SITE}/` },
    about: [mentaiRock, sheenaRokkets, roosters],
    mentions: [ayukawa, sonhouse, yawata],
    citation: [lp1981, ...oralHistories(lang)],
  };
}

// You May Dream（/rock/you-may-dream/）。2026-11-19、Eddie
// 柴山俊之：Wikidata Q11534660 と VIAF 257940042（VIAF の側で「柴山, 俊之, 1947-」を確かめた）。
// ISNI は VIAF からは確かめられなかったので入れていない。細野晴臣は Wikidata の番号だけ。
// 福田純太郎・浜田卓・バイキングは、典拠の記録が見つからないので、名前だけ。
// 曲「You May Dream」の Wikidata（Q17215470）はテレビ番組の項目だったので入れていない。
const shibayama = {
  '@type': 'Person',
  '@id': `${SITE}/#toshiyuki-shibayama`,
  name: 'Toshiyuki Shibayama',
  alternateName: '柴山俊之',
  memberOf: [{ '@id': sonhouse['@id'] }],
  sameAs: ['http://www.wikidata.org/entity/Q11534660', 'http://viaf.org/viaf/257940042'],
};

const juntaro = {
  '@type': 'Person',
  name: 'Juntaro Fukuda',
  alternateName: '福田純太郎',
  memberOf: [{ '@type': 'MusicGroup', name: 'Viking' }],
};

const youMayDreamSong = {
  '@type': 'MusicComposition',
  name: 'You May Dream',
  lyricist: [{ '@id': shibayama['@id'] }, { '@type': 'Person', name: 'Chris Mosdell' }],
  composer: [
    { '@id': ayukawa['@id'] },
    { '@type': 'Person', name: 'Haruomi Hosono', alternateName: '細野晴臣', sameAs: ['http://www.wikidata.org/entity/Q705221'] },
  ],
};

export function youMayDreamJsonLd(opts: { lang: 'en' | 'es' | 'ja'; path: string; title: string; description: string }) {
  const { lang, path, title, description } = opts;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: `${SITE}${path}`,
    inLanguage: lang,
    author: { '@type': 'Person', '@id': 'https://cabin1701.com/#person', name: 'Shoko "Seina" Shiraishi' },
    isPartOf: { '@type': 'WebSite', name: 'Japonéson', url: `${SITE}/` },
    about: [sonhouse, sheenaRokkets, youMayDreamSong],
    mentions: [ayukawa, shibayama, juntaro, mentaiRock],
  };
}
