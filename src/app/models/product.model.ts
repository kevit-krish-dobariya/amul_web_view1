export interface Product {
  id: string;
  name: string;
  unitSize: string;
  piecesPerBox: number;
  image: string;
  price: {
    loose: number;
    box: number;
  };
  qty: {
    loose: number;
    box: number;
  };
}
