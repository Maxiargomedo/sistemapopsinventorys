export type ProductDTO = {
  id: string;
  name: string;
  description?: string | null;
};

export type CreateProductDTO = {
  name: string;
  price: number;
};
