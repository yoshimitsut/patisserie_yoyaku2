import type { ReactNode } from "react";
// types.ts (ou no topo do seu App.tsx)

export type SizeOption = {
  size: string;
  price: number;
};

export type Cake = {
  id_cake: number;
  name: string;
  sizes: SizeOption[];
  quantity: number;
  image: string;
  price: number;
  message_cake: string;
};

export type Order = {
  id_order: number;
  id_client: string;
  first_name: string;
  last_name: string;
  email: string;
  tel: string;
  date: string;
  date_order?: string;
  pickupHour: string;
  message: string;
  status: string;
  cakes: OrderCake[];
};

export type OrderCake = {
  id_cake: number;
  name: string;
  amount: number;
  price: number;
  size: string;
  message_cake?: string;
};
//verificar (duplicado)
export type CakeOrder = {
  cake: string;
  quantity: string;
  size: string;
  price: number;
}

export type OptionType = {
  value: string;
  label: string;
};

export type MyContainerProps = {
  className?: string;
  children?: ReactNode;
};
