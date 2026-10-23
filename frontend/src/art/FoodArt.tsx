import type { ReactNode } from 'react';
import type { FoodCategory } from '../lib/types';
import * as Dish from './dishes';
import { Bread, Cup, CurryBowl, Dessert, Fruit, Glass, Kuih, Main, NoodleBowl, NoodlePlate, RicePlate } from './generic';
import './FoodArt.css';

const ART: Record<string, () => ReactNode> = {
  nasi_lemak: () => <Dish.NasiLemak />,
  roti_canai: () => <Dish.RotiCanai />,
  chicken_rice: () => <Dish.ChickenRice />,
  char_kuey_teow: () => <Dish.CharKueyTeow />,
  mee_goreng_mamak: () => <Dish.MeeGorengMamak />,
  nasi_goreng: () => <Dish.NasiGoreng />,
  laksa: () => <Dish.Laksa />,
  satay: () => <Dish.Satay />,
  rendang: () => <Dish.Rendang />,
  thosai: () => <Dish.Thosai />,

  nasi_kandar: () => <RicePlate rice="#fffdf6" grain="#efe8d8" sides={['#b5602d', '#d27a2c', '#4f9a39']} egg="fried" />,
  nasi_campur: () => <RicePlate rice="#fffdf6" grain="#efe8d8" sides={['#c0552a', '#4f9a39', '#e0b13f']} />,
  nasi_kerabu: () => <RicePlate rice="#6f8fd6" grain="#9fb5e6" sides={['#d9a25a', '#4f9a39', '#f2e6c8']} egg="half" />,
  nasi_dagang: () => <RicePlate rice="#f6eed8" grain="#e6d9b8" sides={['#c4712d', '#e3a93a']} egg="half" />,
  nasi_briyani: () => <RicePlate rice="#f2c25a" grain="#fbe3a6" sides={['#b5502a', '#e1a53a']} cucumber={false} />,
  nasi_putih: () => <RicePlate rice="#fffdf6" grain="#efe8d8" sides={[]} cucumber={false} />,
  nasi_ayam_penyet: () => <RicePlate rice="#fffdf6" grain="#efe8d8" sides={['#b8642a', '#c62f1c', '#e8c27a']} leaf />,
  nasi_goreng_pattaya: () => <RicePlate rice="#d6a25a" sides={[]} wrap />,
  bubur_ayam: () => <CurryBowl gravy="#f4eedc" chunk="#f6dfb8" clear />,

  asam_laksa: () => <NoodleBowl broth="#b8562f" noodle="#f3e2b5" toppings={['#f6d35c', '#9c4f96']} />,
  mee_rebus: () => <NoodleBowl broth="#c9822f" noodle="#f2c94c" toppings={['#d9a441', '#4f9a39']} egg />,
  mee_kari: () => <NoodleBowl broth="#e0782a" noodle="#f2c94c" toppings={['#d9a441', '#f6f0d4']} prawn />,
  wantan_mee: () => <NoodlePlate noodle="#f2d27a" sauce="#8a5129" accents={['#c94c3a', '#f4ead6']} thin />,
  pan_mee: () => <NoodleBowl broth="#e8dcc0" noodle="#f3e2b5" toppings={['#7a4a22', '#4f9a39', '#3b2a1c']} />,
  hokkien_mee: () => <NoodlePlate noodle="#5a3420" sauce="#3b2414" accents={['#ef7d43', '#4f9a39']} />,
  kuey_teow_sup: () => <NoodleBowl broth="#f1e8d2" noodle="#fbf8ee" toppings={['#f4f1e6', '#f4f1e6', '#4f9a39']} />,
  maggi_goreng: () => <NoodlePlate noodle="#e8a13a" sauce="#c4611f" accents={['#f7d660', '#4f9a39']} egg />,
  bihun_goreng: () => <NoodlePlate noodle="#f3e2b5" sauce="#d9a25a" accents={['#d9472c', '#4f9a39', '#f7d660']} thin />,

  roti_telur: () => <Bread variant="round" color="#e6b465" filling="#f4d26a" />,
  roti_tisu: () => <Bread variant="cone" color="#f0c879" />,
  murtabak: () => <Bread variant="squares" color="#e2ad5e" />,
  capati: () => <Bread variant="round" color="#e8cf9d" />,
  roti_bakar: () => <Bread variant="toast" filling="#7f9a3a" />,
  roti_jala: () => <Bread variant="net" color="#e9b93f" />,
  idli: () => <Bread variant="discs" />,

  ayam_goreng: () => <Main variant="chicken" />,
  ikan_bakar: () => <Main variant="fish" />,
  kari_ayam: () => <CurryBowl gravy="#d8862f" chunk="#c97a3b" potato />,
  ayam_masak_merah: () => <CurryBowl gravy="#c8341f" chunk="#a8432a" />,
  sayur_campur: () => <Main variant="veg" />,
  telur_dadar: () => <Main variant="omelette" />,
  bak_kut_teh: () => <CurryBowl gravy="#5a3a22" chunk="#8a5a3a" />,
  yong_tau_foo: () => <CurryBowl gravy="#efe6cf" chunk="#e2c084" clear />,
  sup_ayam: () => <CurryBowl gravy="#e9cf91" chunk="#f2dcb3" potato clear />,
  tauhu_bakar: () => <Main variant="tofu" />,

  karipap: () => <Kuih variant="puff" colors={['#e3a54d', '#fff', '#c98a3c']} />,
  kuih_lapis: () => <Kuih variant="layer" colors={['#f07aa5', '#fbf3e4', '#7cc35a']} />,
  onde_onde: () => <Kuih variant="balls" colors={['#4fae4f']} />,
  pisang_goreng: () => <Kuih variant="fritter" colors={['#d99a3a', '#f4d27a', '#b9772f']} />,
  keropok_lekor: () => <Kuih variant="sticks" colors={['#a9784a']} />,
  apam_balik: () => <Kuih variant="pancake" colors={['#d9a04a', '#f5dc8f', '#9a5a2a']} />,
  popiah: () => <Kuih variant="roll" colors={['#e9d39b', '#4f9a39']} />,
  cucur_udang: () => <Kuih variant="fritter" colors={['#d9a04a', '#f1c87a', '#ef7d43']} />,
  kuih_seri_muka: () => <Kuih variant="twoLayer" colors={['#6fbe4a', '#fbf9f0']} />,
  char_siu_pau: () => <Kuih variant="bun" colors={['#d23b2a']} />,
  pau_kacang: () => <Kuih variant="bun" colors={['#7a2c26']} />,

  cendol: () => <Dessert variant="cendol" />,
  ais_kacang: () => <Dessert variant="abc" />,
  bubur_cha_cha: () => <Dessert variant="chacha" />,

  teh_tarik: () => <Glass liquid="#c08a55" foam="#e6c9a2" ice={false} />,
  kopi_o: () => <Cup liquid="#3b2416" />,
  kopi: () => <Cup liquid="#8a5a35" crema="#c49a6c" />,
  teh_o: () => <Cup liquid="#9a4a1a" />,
  milo_ais: () => <Glass liquid="#6e4128" foam="#8a5a3c" />,
  sirap_bandung: () => <Glass liquid="#f2a1b5" />,
  teh_o_ais_limau: () => <Glass liquid="#c46a24" lime />,
  limau_ais: () => <Glass liquid="#e8e27a" lime />,
  air_kelapa: () => <Glass liquid="#eef1e6" />,
  susu_soya: () => <Glass liquid="#f2e6c8" ice={false} />,

  pisang: () => <Fruit variant="banana" />,
  betik: () => <Fruit variant="wedge" flesh="#f5873a" rind="#7fae35" seeds="#2b2b2b" />,
  tembikai: () => <Fruit variant="wedge" flesh="#ef4b4b" rind="#2f8a45" seeds="#2b2b2b" />,
  durian: () => <Fruit variant="durian" />,
  mangga: () => <Fruit variant="cubes" flesh="#f7b733" rind="#e8a21b" />,
  jambu_batu: () => <Fruit variant="round" flesh="#f7c4c9" rind="#9cc44b" seeds="#f2e6c8" />,
  rambutan: () => <Fruit variant="rambutan" />,
};

const CATEGORY_FALLBACK: Record<FoodCategory, () => ReactNode> = {
  rice: () => <RicePlate rice="#fffdf6" grain="#efe8d8" sides={['#c0552a', '#4f9a39']} />,
  noodles: () => <NoodlePlate noodle="#f2c94c" sauce="#d9a25a" />,
  bread: () => <Bread variant="round" />,
  mains: () => <CurryBowl gravy="#d8862f" chunk="#c97a3b" />,
  kuih: () => <Kuih variant="layer" colors={['#6fbe4a', '#fbf9f0']} />,
  dessert: () => <Dessert variant="abc" />,
  drinks: () => <Glass liquid="#c08a55" />,
  fruit: () => <Fruit variant="banana" />,
  custom: () => <CurryBowl gravy="#e9cf91" chunk="#d9a25a" />,
};

interface Props {
  foodId: string;
  category: FoodCategory;
  size?: number;
  /** Draw on a tinted rounded tile (thumbnails) or on its own (heroes). */
  tile?: boolean;
  /** A meal photo the user chose to keep, shown instead of the illustration. */
  photo?: string;
}

export function FoodArt({ foodId, category, size = 48, tile = true, photo }: Props) {
  if (photo) {
    return <img className="food-art food-art--photo" src={photo} alt="" width={size} height={size} style={{ width: size, height: size }} />;
  }
  const art = (ART[foodId] ?? CATEGORY_FALLBACK[category] ?? CATEGORY_FALLBACK.custom)();
  return (
    <span className={`food-art${tile ? ` food-art--tile food-art--${category}` : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 120 120" width={tile ? size * 0.86 : size} height={tile ? size * 0.86 : size}>
        {art}
      </svg>
    </span>
  );
}
