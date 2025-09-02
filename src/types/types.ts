// types.ts (ou no topo do seu App.tsx)
export type Cake = {
  id_cake: number;
  name: string;
  quantity: number;
  price: number;
  image: string;
};

export type Order = {
  id_order: number;
  id_client: string;
  first_name: string;
  last_name: string;
  email: string;
  tel: string;
  date: string;
  pickupHour: string;
  message: string;
  status: 'Pendente' | 'Entregue';
  payment: 'Pago' | 'Pendente';
  cakes: {
    id_cake: number;
    amount: number;
  }[];
};
