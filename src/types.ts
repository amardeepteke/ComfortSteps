export interface SizeStock {
  size: string;
  stock: number;
}

export interface ProductVariant {
  colourName: string;
  colourThumbnail?: string;
  images: string[];
  sellingPrice: number;
  mrp: number;
  description: string;
  sizes: string[];
  stockQuantity?: number;
  sizeStocks?: SizeStock[];
  status?: string;
  sku?: string;
  // Backwards compatibility fields
  color?: string;
  price?: number;
  originalPrice?: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewsCount: number;
  description: string;
  category: string;
  images: string[];
  sizes: string[];
  colors: string[];
  isFeatured?: boolean;
  createdAt: string;
  variants?: ProductVariant[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  isAdmin?: boolean;
}

export interface Order {
  id: string;
  items: {
    product: {
      id: string;
      name: string;
      brand: string;
      price: number;
      images: string[];
    };
    quantity: number;
    selectedSize: string;
    selectedColor: string;
  }[];
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  status: "Pending" | "Processing" | "Shipped" | "Delivered";
  createdAt: string;
  paymentMethod: "COD" | "UPI" | "Card" | "GooglePay" | string;
}

export interface FirebaseConfigData {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  databaseURL?: string;
}
