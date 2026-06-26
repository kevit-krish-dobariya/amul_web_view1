export interface Product {
  id: string;
  name: string;
  unitSize: string;
  piecesPerBox: number;
  image: string;
  price: {
    loose: number;
  };
  qty: {
    loose: number;
  };
}
