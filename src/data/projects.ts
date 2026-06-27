// Home page projects grid data — mirrors en.japoneson.com Projects section.
// Future: add Mentai Rock as 4th item in row 2 after migration.
// Image URLs point to en.japoneson.com for now; will migrate to local public/images/ later.

export type Project = {
  title: string;
  subtitle?: string;
  flag?: string;
  image: string;
  imageAlt: string;
  taglineBold?: string;
  description: string;
  href: string;
  external?: boolean;
};

const IMG = (path: string) => `/images/wp/${path}`;

export const projects: Project[] = [
  {
    title: 'Angels Swing',
    flag: '🇺🇸',
    image: IMG('2026/05/CDjacket-1024x1024.jpg'),
    imageAlt: 'I Have a Dream — Seina album cover',
    taglineBold: 'Jazz and War History: A Destiny Guided by Music.',
    description: 'Through the shadow of defeat and the melodies of a bygone era, encounters with legendary musicians opened a path to the truth.',
    href: '/en/swing/',
  },
  {
    title: 'JAPONÉSON',
    subtitle: '*Por La Chocolate*',
    flag: '🇨🇺',
    image: IMG('2026/05/jk-400.jpg'),
    imageAlt: 'Por La Chocolate — JAPONÉSON album cover',
    taglineBold: 'The miracle session of 18 musicians in Havana.',
    description: 'Discover the raw, unscripted bond forged through music beyond language, born from heartfelt tears.',
    href: '/en/japoneson/',
  },
  {
    title: 'MURAKAMI MAMBO!!',
    flag: '🇨🇺',
    image: IMG('2026/05/murakami02-1024x1020.jpg'),
    imageAlt: 'Murakami Mambo',
    taglineBold: 'Ryu Murakami (Almost Transparent Blue) — The novelist who supported José Luis Cortés of NG La Banda, and sustained Cuban music through the "Special Period".',
    description: 'Discover how a wounded Japanese writer broke free from the post-war chains through the explosive power of a "New Other"—Cuba.',
    href: '/en/murakami/',
  },
  {
    title: 'Cupie Danny',
    flag: '🇨🇺',
    image: IMG('2026/02/raibowd03-1-scaled-e1771762858743-1-600x567.jpg'),
    imageAlt: 'Cupie Danny',
    description: 'A wild, unscripted trail of smiles and raw encounters across the Americas and Cuba—all sparked by a single, cheap plastic doll that refused to let the music die.',
    href: '/en/cupie/',
  },
  {
    title: 'We Live with Cats',
    image: IMG('2026/02/img_6194-1-e1724569568281-1-600x569.jpg'),
    imageAlt: 'Black cat',
    description: 'A record of our life with over 40 local cats. Our efforts, our heartbreaks, and the tiny lives we shared.',
    href: 'https://cats.japoneson.com/',
    external: true,
  },
  {
    title: 'CRYSTALLIZE',
    image: IMG('2026/04/logobluebg-YOUTUBE.jpg'),
    imageAlt: 'Crystallize logo',
    description: 'A journey of 17 years. The business and blogs of spiritual, emotional release with essential oils.',
    href: 'https://crystallize.jp/',
    external: true,
  },
];
