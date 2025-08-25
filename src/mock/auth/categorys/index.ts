export interface SubCategory {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  subCategories: SubCategory[];
}

const categories: Category[] = [
  {
    id: '1',
    name: 'Teknoloji',
    subCategories: [
      { id: '1-1', name: 'Akıllı Telefonlar' },
      { id: '1-2', name: 'Bilgisayar & Donanım' },
      { id: '1-3', name: 'Yazılım & Uygulamalar' },
    ],
  },
  {
    id: '2',
    name: 'Moda & Giyim',
    subCategories: [
      { id: '2-1', name: 'Kadın Giyim' },
      { id: '2-2', name: 'Erkek Giyim' },
      { id: '2-3', name: 'Aksesuarlar' },
    ],
  },
  {
    id: '3',
    name: 'Güzellik & Kişisel Bakım',
    subCategories: [
      { id: '3-1', name: 'Makyaj' },
      { id: '3-2', name: 'Cilt Bakımı' },
      { id: '3-3', name: 'Saç Ürünleri' },
    ],
  },
  {
    id: '4',
    name: 'Yemek & İçecek',
    subCategories: [
      { id: '4-1', name: 'Restoran Deneyimleri' },
      { id: '4-2', name: 'Atıştırmalıklar' },
      { id: '4-3', name: 'Kahve & İçecekler' },
    ],
  },
  {
    id: '5',
    name: 'Oyun & Eğlence',
    subCategories: [
      { id: '5-1', name: 'Konsol Oyunları' },
      { id: '5-2', name: 'PC Oyunları' },
      { id: '5-3', name: 'Mobil Oyunlar' },
    ],
  },
  {
    id: '6',
    name: 'Spor & Outdoor',
    subCategories: [
      { id: '6-1', name: 'Spor Ekipmanları' },
      { id: '6-2', name: 'Fitness & Sağlık' },
      { id: '6-3', name: 'Outdoor Giyim' },
    ],
  },
  {
    id: '7',
    name: 'Ev & Yaşam',
    subCategories: [
      { id: '7-1', name: 'Dekorasyon' },
      { id: '7-2', name: 'Ev Aletleri' },
      { id: '7-3', name: 'Mobilya' },
    ],
  },
  {
    id: '8',
    name: 'Ulaşım & Seyahat',
    subCategories: [
      { id: '8-1', name: 'Otomobil Deneyimleri' },
      { id: '8-2', name: 'Seyahat Ekipmanları' },
      { id: '8-3', name: 'Konaklama' },
    ],
  },
];

export default categories;
