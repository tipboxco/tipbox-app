export type InventoryStackParamList = {
  InventoryHome: undefined;
  AddProduct: undefined;
  PriceExperience: {
    productId: string;
    productName: string;
  };
  ShoppingExperience: {
    productId: string;
    productName: string;
    priceExperience: string;
  };
  ProductExperience: {
    productId: string;
    productName: string;
    priceExperience: string;
    shoppingExperience: string;
  };
};

export default InventoryStackParamList;
