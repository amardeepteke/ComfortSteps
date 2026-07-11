import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  ShoppingBag, 
  Bell, 
  Heart, 
  ArrowRight, 
  ChevronLeft, 
  Plus, 
  Minus, 
  X, 
  Check, 
  Ruler, 
  CreditCard, 
  User, 
  MapPin, 
  Mail, 
  Phone,
  ShieldCheck, 
  Flame, 
  SlidersHorizontal,
  History,
  Package,
  CheckCircle,
  AlertCircle,
  Database,
  Sliders,
  Filter
} from "lucide-react";
import { Product, CartItem, Order, UserProfile } from "../types";
import { loginWithGoogle, logoutUser, auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, setDoc, updateDoc, onSnapshot } from "firebase/firestore";
import ComfortStepsLogo from "./ComfortStepsLogo";
import { 
  LogOut, 
  Settings, 
  QrCode, 
  Copy, 
  Edit, 
  Trash2, 
  Lock,
  Compass
} from "lucide-react";

interface StoreFrontProps {
  products: Product[];
  orders?: Order[];
  onAddOrder: (order: Order) => void;
}

interface FlyingItem {
  id: number;
  startX: number;
  startY: number;
  image: string;
}

const isStockPhoto = (url: string): boolean => {
  if (!url) return true;
  const lowercase = url.toLowerCase();

  return (
    url.trim() === "" ||
    lowercase.includes("unsplash.com") ||
    lowercase.includes("placeholder-image") ||
    lowercase.includes("test-image-url")
  );
};

export default function StoreFront({ products, orders = [], onAddOrder }: StoreFrontProps) {
  // Main view state: "onboarding" | "dashboard" | "detail" | "cart" | "register"
  const [screen, setScreen] = useState<"onboarding" | "dashboard" | "detail" | "cart" | "register">("onboarding");
  
  // Tab within dashboard: "home" | "store" | "wishlist" | "profile"
  const [activeTab, setActiveTab] = useState<"home" | "store" | "wishlist" | "profile">("home");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Filtering & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentViewedIds, setRecentViewedIds] = useState<string[]>([]);

  // Size filtering based on profile selection
  const [isSizeFilterActive, setIsSizeFilterActive] = useState(false);

  // Profile preferences (Default to empty values)
  const [preferredSize, setPreferredSize] = useState<string>("");
  const [profileName, setProfileName] = useState<string>(() => localStorage.getItem("comfort_pref_name") || "");
  const [profileEmail, setProfileEmail] = useState<string>(() => localStorage.getItem("comfort_pref_email") || "");
  const [profilePhone, setProfilePhone] = useState<string>(() => localStorage.getItem("comfort_pref_phone") || "");
  const [profileAddress, setProfileAddress] = useState<string>(() => localStorage.getItem("comfort_pref_addr") || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Detailed address state variables
  const [addrFirstName, setAddrFirstName] = useState<string>(() => localStorage.getItem("comfort_addr_first_name") || "");
  const [addrLastName, setAddrLastName] = useState<string>(() => localStorage.getItem("comfort_addr_last_name") || "");
  const [addrPhone, setAddrPhone] = useState<string>(() => localStorage.getItem("comfort_addr_phone") || "");
  const [addrFlatHouse, setAddrFlatHouse] = useState<string>(() => localStorage.getItem("comfort_addr_flat_house") || "");
  const [addrArea, setAddrArea] = useState<string>(() => localStorage.getItem("comfort_addr_area") || "");
  const [addrLandmark, setAddrLandmark] = useState<string>(() => localStorage.getItem("comfort_addr_landmark") || "");
  const [addrCity, setAddrCity] = useState<string>(() => localStorage.getItem("comfort_addr_city") || "");
  const [addrPinCode, setAddrPinCode] = useState<string>(() => localStorage.getItem("comfort_addr_pin_code") || "");
  const [activeProfileSection, setActiveProfileSection] = useState<"profile" | "address" | null>(null);

  // Add to Cart button animation state
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Dummy Profile Picture Selector (Women Avatars)
  const [profilePic, setProfilePic] = useState<string>(() => localStorage.getItem("comfort_profile_pic") || "");
  const [isSelectingPic, setIsSelectingPic] = useState(false);

  // Women Dummy Profile Photos list
  const DUMMY_AVATARS = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&q=80",
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80",
    "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&q=80"
  ];

  // Premium Curated Default Onboarding Images (Matching User's Footwear Collections)
  const DEFAULT_ONBOARDING_IMAGES: string[] = [
    "https://lh3.googleusercontent.com/d/1As3HJoUjLOTUJ3OffwCc-0_xTI9sCh4J", // Slot 1: dark thong sandals with gold buckle
    "https://lh3.googleusercontent.com/d/1pBh6vEJCwByC2_DD0c9rE42MDbwrd8u5", // Slot 2: turquoise footbed low-wedge sandals
    "https://lh3.googleusercontent.com/d/1u1HOv08PdDOZLRZyuWidOfYILCo2T_0h", // Slot 3: gray thong sandals with gold buckle
    "https://lh3.googleusercontent.com/d/1yhXKS2ODpODTdlfTmQhgjdmFnkyPIU9w", // Slot 4: beige wedge sandals with jeweled thong strap
    "https://lh3.googleusercontent.com/d/1sjEoiMmhLFgWQZZwNiKmWZbWkR-5I3aL", // Extra: light blue-grey sandals
    "https://lh3.googleusercontent.com/d/19LFlJoL4g2WQDYcaEribLF-b4mkTZrcM"  // Extra: grey wedge sandals
  ];

  const [onboardingImages, setOnboardingImages] = useState<string[]>(() => {
    const saved = localStorage.getItem("comfort_onboarding_images");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter(img => !isStockPhoto(img));
          if (filtered.length > 0) return filtered;
        }
      } catch (e) {
        return DEFAULT_ONBOARDING_IMAGES;
      }
    }
    return DEFAULT_ONBOARDING_IMAGES;
  });

  const saveOnboardingImages = async (newImages: string[]) => {
    const filtered = newImages.filter(img => !isStockPhoto(img));
    setOnboardingImages(filtered);
    localStorage.setItem("comfort_onboarding_images", JSON.stringify(filtered));
    if (db) {
      try {
        await setDoc(doc(db, "config", "onboarding"), { images: filtered });
      } catch (err) {
        console.error("Failed to save onboarding images to Firestore", err);
      }
    }
  };

  const [adminUpiId, setAdminUpiId] = useState<string>(() => {
    return localStorage.getItem("comfort_admin_upi") || "comfortsteps@okaxis";
  });

  const [bannerConfig, setBannerConfig] = useState({
    title: "Elegance that feels like Comfort",
    tagline: "Comfort Steps Premium",
    imageUrl: "https://images.unsplash.com/photo-1515347619252-60a4bd4effd8?auto=format&fit=crop&w=1600&q=80",
    bgGradient: "from-[#9B86EC] via-[#856EE3] to-[#6E54D7]"
  });

  const saveAdminUpiId = async (newUpi: string) => {
    setAdminUpiId(newUpi);
    localStorage.setItem("comfort_admin_upi", newUpi);
    if (db) {
      try {
        await setDoc(doc(db, "config", "merchant"), { upiId: newUpi });
      } catch (err) {
        console.error("Failed to save merchant UPI to Firestore", err);
      }
    }
  };

  // Sync Onboarding Images & Merchant UPI Config from Firestore in real-time
  useEffect(() => {
    if (!db) return;

    // 1. Subscribe to Onboarding Images Document
    const onboardingDocRef = doc(db, "config", "onboarding");
    const unsubOnboarding = onSnapshot(onboardingDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.images)) {
          const filtered = data.images.filter((img: string) => !isStockPhoto(img));
          const updatedImages = filtered.length > 0 ? filtered : DEFAULT_ONBOARDING_IMAGES;
          setOnboardingImages(updatedImages);
          localStorage.setItem("comfort_onboarding_images", JSON.stringify(updatedImages));
        }
      } else {
        setOnboardingImages(DEFAULT_ONBOARDING_IMAGES);
        localStorage.setItem("comfort_onboarding_images", JSON.stringify(DEFAULT_ONBOARDING_IMAGES));
        setDoc(onboardingDocRef, { images: [] })
          .catch(err => console.log("Failed to seed onboarding images:", err));
      }
    }, (error) => {
      console.error("Firestore onboarding images sync error:", error);
      handleFirestoreError(error, OperationType.GET, "config/onboarding");
    });

    // 2. Subscribe to Merchant UPI Config Document
    const merchantDocRef = doc(db, "config", "merchant");
    const unsubMerchant = onSnapshot(merchantDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && typeof data.upiId === "string") {
          setAdminUpiId(data.upiId);
          localStorage.setItem("comfort_admin_upi", data.upiId);
        }
      } else {
        // Seed default UPI ID if empty
        setDoc(merchantDocRef, { upiId: "comfortsteps@okaxis" })
          .catch(err => console.log("Failed to seed merchant UPI config:", err));
      }
    }, (error) => {
      console.error("Firestore merchant UPI sync error:", error);
      handleFirestoreError(error, OperationType.GET, "config/merchant");
    });

    // 3. Subscribe to Store Banner Config Document
    const bannerDocRef = doc(db, "config", "banner");
    const unsubBanner = onSnapshot(bannerDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBannerConfig({
          title: data.title || "Elegance that feels like Comfort",
          tagline: data.tagline || "Comfort Steps Premium",
          imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1515347619252-60a4bd4effd8?auto=format&fit=crop&w=1600&q=80",
          bgGradient: data.bgGradient || "from-[#9B86EC] via-[#856EE3] to-[#6E54D7]"
        });
      } else {
        // Seed default banner config
        setDoc(bannerDocRef, {
          title: "Elegance that feels like Comfort",
          tagline: "Comfort Steps Premium",
          imageUrl: "https://images.unsplash.com/photo-1515347619252-60a4bd4effd8?auto=format&fit=crop&w=1600&q=80",
          bgGradient: "from-[#9B86EC] via-[#856EE3] to-[#6E54D7]"
        }).catch(err => console.log("Failed to seed banner config:", err));
      }
    }, (error) => {
      console.error("Firestore banner sync error:", error);
    });

    return () => {
      unsubOnboarding();
      unsubMerchant();
      unsubBanner();
    };
  }, [db]);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState<Product | null>(null);
  
  // Product editor fields
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState(0);
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("Heels");
  const [editImage1, setEditImage1] = useState("");
  const [editImage2, setEditImage2] = useState("");

  // Redirect after registration/login flow helper
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<{screen: "onboarding" | "dashboard" | "detail" | "cart"; tab?: "home" | "store" | "wishlist" | "profile"} | null>(null);

  // Product Detail Selection State
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");

  // Interactive Foot Size Calculator Modal
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [footLengthCm, setFootLengthCm] = useState<string>("");
  const [recommendedSize, setRecommendedSize] = useState<string>("");

  // Cart, Wiggle and Flying Items states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartWiggle, setCartWiggle] = useState(false);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [nextFlyingId, setNextFlyingId] = useState(1);

  // Checkout Form State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI" | string>("COD");
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState("");
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Firebase / Auth Sync
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseActive, setFirebaseActive] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Load persistence states on mount
  useEffect(() => {
    // Favorites
    const savedFavs = localStorage.getItem("comfort_favorites");
    if (savedFavs) {
      try { setFavorites(JSON.parse(savedFavs)); } catch (e) {}
    }

    // Recent Viewed
    const savedRecents = localStorage.getItem("comfort_recents");
    if (savedRecents) {
      try { setRecentViewedIds(JSON.parse(savedRecents)); } catch (e) {}
    }

    // Cart
    const savedCart = localStorage.getItem("comfort_cart");
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) {}
    }

    // Profile Settings
    const savedSize = localStorage.getItem("comfort_pref_size");
    if (savedSize) setPreferredSize(savedSize);

    const savedName = localStorage.getItem("comfort_pref_name");
    if (savedName) setProfileName(savedName);

    const savedEmail = localStorage.getItem("comfort_pref_email");
    if (savedEmail) setProfileEmail(savedEmail);

    const savedPhone = localStorage.getItem("comfort_pref_phone");
    if (savedPhone) setProfilePhone(savedPhone);

    const savedAddr = localStorage.getItem("comfort_pref_addr");
    if (savedAddr) setProfileAddress(savedAddr);

    const savedPic = localStorage.getItem("comfort_profile_pic");
    if (savedPic) setProfilePic(savedPic);
  }, []);

  // Post-Login Redirection Hook
  useEffect(() => {
    if (currentUser && redirectAfterLogin) {
      setScreen(redirectAfterLogin.screen);
      if (redirectAfterLogin.tab) {
        setActiveTab(redirectAfterLogin.tab);
      }
      setRedirectAfterLogin(null);
    }
  }, [currentUser, redirectAfterLogin]);

  // Save favorites to storage
  useEffect(() => {
    localStorage.setItem("comfort_favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Save cart to storage
  useEffect(() => {
    localStorage.setItem("comfort_cart", JSON.stringify(cart));
  }, [cart]);

  // Sync auth
  useEffect(() => {
    if (auth) {
      setFirebaseActive(true);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser({
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80"
          });
          // Autofill profile states
          setProfileName(user.displayName || "");
          setProfileEmail(user.email || "");
        } else {
          setCurrentUser(null);
        }
      });
      return () => unsubscribe();
    } else {
      setFirebaseActive(false);
    }
  }, []);

  // Sync checkout fields when checkout modal opens
  useEffect(() => {
    if (isCheckoutOpen) {
      setCheckoutName(profileName || currentUser?.name || "");
      setCheckoutEmail(profileEmail || currentUser?.email || "");
      setCheckoutPhone(profilePhone || "");
      setCheckoutAddress(profileAddress || "");
    }
  }, [isCheckoutOpen, profileName, profileEmail, profilePhone, profileAddress, currentUser]);

  const handleLogout = async () => {
    if (firebaseActive && auth) {
      await logoutUser();
    } else {
      setCurrentUser(null);
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError(null);
    try {
      if (firebaseActive && auth) {
        const user = await loginWithGoogle();
        if (user) {
          const profile = {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email || "",
            photoURL: user.photoURL || ""
          };
          setCurrentUser(profile);
          setProfileName(profile.name);
          setProfileEmail(profile.email);
          localStorage.setItem("comfort_pref_name", profile.name);
          localStorage.setItem("comfort_pref_email", profile.email);
        }
      } else {
        const errorMsg = "Authentication is not active. Please ensure Firebase is initialized correctly.";
        setLoginError(errorMsg);
        console.error(errorMsg);
      }
    } catch (e: any) {
      console.error("Google Login failed", e);
      let errMsg = "Google Login failed. ";
      if (e?.code === "auth/unauthorized-domain" || (e?.message && e.message.includes("unauthorized-domain"))) {
        errMsg = "Google Login Error: This domain is not authorized. Please add 'comfort-steps.vercel.app' and your preview domains to your Firebase Console under Authentication -> Settings -> Authorized domains.";
      } else if (e?.message) {
        errMsg += e.message;
      } else {
        errMsg += "Please make sure popups are allowed in your browser, and this domain is authorized in your Firebase console.";
      }
      setLoginError(errMsg);
    }
  };

  // Save profile settings
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    
    // Compose combined address string
    const composedAddr = `${addrFlatHouse}, ${addrArea}, ${addrLandmark ? addrLandmark + ', ' : ''}${addrCity} - ${addrPinCode}`;
    const composedName = `${addrFirstName} ${addrLastName}`;
    
    setProfileName(composedName);
    setProfilePhone(addrPhone);
    setProfileAddress(composedAddr);

    localStorage.setItem("comfort_pref_name", composedName);
    localStorage.setItem("comfort_pref_email", profileEmail);
    localStorage.setItem("comfort_pref_phone", addrPhone);
    localStorage.setItem("comfort_pref_addr", composedAddr);
    localStorage.setItem("comfort_pref_size", preferredSize);

    // Save individual parts
    localStorage.setItem("comfort_addr_first_name", addrFirstName);
    localStorage.setItem("comfort_addr_last_name", addrLastName);
    localStorage.setItem("comfort_addr_phone", addrPhone);
    localStorage.setItem("comfort_addr_flat_house", addrFlatHouse);
    localStorage.setItem("comfort_addr_area", addrArea);
    localStorage.setItem("comfort_addr_landmark", addrLandmark);
    localStorage.setItem("comfort_addr_city", addrCity);
    localStorage.setItem("comfort_addr_pin_code", addrPinCode);

    setTimeout(() => {
      setIsSavingProfile(false);
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
      setActiveProfileSection(null); // Close active editing section
    }, 800);
  };

  // Check auth and redirect if unregistered
  const checkAuthBeforeAction = (
    targetScreen: "onboarding" | "dashboard" | "detail" | "cart" | "register",
    targetTab?: "home" | "store" | "wishlist" | "profile"
  ): boolean => {
    if (currentUser) return true;
    // @ts-ignore
    setRedirectAfterLogin({ screen: targetScreen, tab: targetTab });
    setScreen("register");
    return false;
  };

  // Toggle Favorite
  const toggleFavorite = (prodId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const exists = prev.includes(prodId);
      const updated = exists ? prev.filter(id => id !== prodId) : [...prev, prodId];
      return updated;
    });
  };

  // Add to Recent Viewed
  const addToRecentViewed = (prodId: string) => {
    setRecentViewedIds(prev => {
      const filtered = prev.filter(id => id !== prodId);
      const updated = [prodId, ...filtered].slice(0, 5); // Max 5 items
      localStorage.setItem("comfort_recents", JSON.stringify(updated));
      return updated;
    });
  };

  // View Product Detail
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveImageIdx(0);
    setSelectedSize(product.sizes[0] || "");
    setSelectedColor(product.colors[0] || "");
    addToRecentViewed(product.id);
    setScreen("detail");
  };

  // Foot length to Size recommender
  useEffect(() => {
    if (!footLengthCm) {
      setRecommendedSize("");
      return;
    }
    const len = parseFloat(footLengthCm);
    if (isNaN(len)) return;

    if (len < 22) {
      setRecommendedSize("US 5");
    } else if (len >= 22 && len < 23.5) {
      setRecommendedSize("US 6");
    } else if (len >= 23.5 && len < 25) {
      setRecommendedSize("US 7");
    } else if (len >= 25 && len < 26.5) {
      setRecommendedSize("US 8");
    } else if (len >= 26.5 && len < 28) {
      setRecommendedSize("US 9");
    } else if (len >= 28 && len < 29) {
      setRecommendedSize("US 10");
    } else {
      setRecommendedSize("US 11");
    }
  }, [footLengthCm]);

  // Cart operations
  const addToCart = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (!selectedProduct) return;
    if (!checkAuthBeforeAction("detail")) return;

    // Trigger flying shoe animation
    if (e) {
      const buttonRect = e.currentTarget.getBoundingClientRect();
      const newItem: FlyingItem = {
        id: nextFlyingId,
        startX: buttonRect.left + buttonRect.width / 2,
        startY: buttonRect.top + buttonRect.height / 2,
        image: selectedProduct.images[0]
      };
      setFlyingItems(prev => [...prev, newItem]);
      setNextFlyingId(prev => prev + 1);

      setTimeout(() => {
        setFlyingItems(prev => prev.filter(item => item.id !== newItem.id));
        setCartWiggle(true);
        setTimeout(() => setCartWiggle(false), 500);
      }, 900);
    }

    const sizeToUse = selectedSize || selectedProduct.sizes[0] || "Standard";
    const colorToUse = selectedColor || selectedProduct.colors[0] || "Standard";

    const existingIdx = cart.findIndex(
      item => item.product.id === selectedProduct.id && 
              item.selectedSize === sizeToUse && 
              item.selectedColor === colorToUse
    );

    if (existingIdx > -1) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      setCart(updated);
    } else {
      setCart(prev => [
        ...prev,
        {
          product: selectedProduct,
          quantity: 1,
          selectedSize: sizeToUse,
          selectedColor: colorToUse
        }
      ]);
    }
  };

  const updateCartQty = (idx: number, delta: number) => {
    const updated = [...cart];
    updated[idx].quantity += delta;
    if (updated[idx].quantity <= 0) {
      updated.splice(idx, 1);
    }
    setCart(updated);
  };

  const totalCartPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Place Order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const newOrder: Order = {
      id: `ORDER-${Math.floor(1000 + Math.random() * 9000)}`,
      items: cart.map(item => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          price: item.product.price,
          images: item.product.images
        },
        quantity: item.quantity,
        selectedSize: item.selectedSize,
        selectedColor: item.selectedColor
      })),
      totalAmount: totalCartPrice,
      customerName: checkoutName || profileName || "Vanish Teke",
      customerEmail: checkoutEmail || profileEmail || "vanish@ssense.com",
      customerPhone: checkoutPhone || profilePhone,
      shippingAddress: checkoutAddress || profileAddress,
      status: "Pending",
      createdAt: new Date().toISOString(),
      paymentMethod: paymentMethod
    };

    if (db) {
      try {
        await addDoc(collection(db, "orders"), newOrder);
      } catch (err) {
        console.error("Firestore order error", err);
      }
    }

    onAddOrder(newOrder);

    setPlacedOrderId(newOrder.id);
    setLastPlacedOrder(newOrder);
    setIsOrderSuccess(true);
    setCart([]);
    setIsCheckoutOpen(false);
  };

  // Filter Products Dynamically
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.brand.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategory !== "All") {
      matchesCategory = prod.category.toLowerCase() === selectedCategory.toLowerCase();
    }

    let matchesSize = true;
    if (isSizeFilterActive && preferredSize) {
      const formattedPref = `US ${preferredSize}`.toLowerCase();
      matchesSize = prod.sizes.some(s => s.trim().toLowerCase() === formattedPref || s.trim().toLowerCase() === preferredSize.trim().toLowerCase());
    }

    return matchesSearch && matchesCategory && matchesSize;
  });

  const featuredProducts = products.slice(0, 4);

  const myOrders = orders.filter(ord => {
    const userEmailToMatch = currentUser?.email || profileEmail;
    return userEmailToMatch && ord.customerEmail?.toLowerCase() === userEmailToMatch.toLowerCase();
  });

  return (
    <div id="storefront-root" className="min-h-screen bg-[#FBFBFA] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white pb-32">
      
      {/* Flying sneakers animation */}
      <AnimatePresence>
        {flyingItems.map(item => (
          <motion.div
            key={item.id}
            initial={{ 
              position: "fixed", 
              zIndex: 100, 
              left: item.startX - 30, 
              top: item.startY - 30, 
              scale: 1, 
              opacity: 1,
              rotate: 0 
            }}
            animate={{ 
              left: window.innerWidth > 768 ? window.innerWidth / 2 + 100 : window.innerWidth - 60,
              top: 30,
              scale: 0.15, 
              opacity: 0.6,
              rotate: 360 
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 1, 0.5, 1] }}
            className="w-16 h-16 bg-white rounded-full shadow-lg border border-neutral-100 p-2 pointer-events-none flex items-center justify-center"
          >
            <img src={item.image} alt="" className="max-w-full max-h-full object-contain" />
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: PREMIUM LUXURY ONBOARDING SCREEN */}
        {screen === "onboarding" && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col min-h-screen justify-between p-6 max-w-md mx-auto relative bg-[#FBFBFA]"
          >
            {/* Elegant Header with Serif and Luxury Pill */}
            <div id="onboarding-header" className="flex justify-between items-center pt-4">
              <h1 className="font-display font-bold text-2xl tracking-tight text-neutral-900">
                Comfort Steps
              </h1>
              <span className="bg-black text-white text-[9px] font-extrabold tracking-widest px-3 py-1.5 rounded-full uppercase">
                Luxury
              </span>
            </div>

            {/* Symmetrical 4 Floating Cards Collage with Logo in the Middle */}
            <div id="photo-collage" className="relative w-full h-[400px] my-6 flex items-center justify-center overflow-visible">
              
              {/* Central Logo */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-md rounded-3xl py-3 px-5 shadow-xl border border-neutral-100 flex items-center justify-center select-none scale-105">
                <ComfortStepsLogo size="sm" />
              </div>

              {/* 4 Floating Cards */}
              {(() => {
                const FLOATING_CARDS = [
                  {
                    className: "absolute left-[4%] top-[4%] w-[38%] h-[125px] bg-white rounded-[24px] shadow-lg border-4 border-white overflow-hidden z-10",
                    animateY: [0, -8, 0],
                    duration: 3.2,
                    delay: 0
                  },
                  {
                    className: "absolute right-[4%] top-[10%] w-[36%] h-[120px] bg-white rounded-[24px] shadow-lg border-4 border-white overflow-hidden z-10",
                    animateY: [0, -11, 0],
                    duration: 3.5,
                    delay: 0.5
                  },
                  {
                    className: "absolute left-[3%] bottom-[10%] w-[36%] h-[120px] bg-white rounded-[24px] shadow-lg border-4 border-white overflow-hidden z-10",
                    animateY: [0, -7, 0],
                    duration: 2.8,
                    delay: 0.3
                  },
                  {
                    className: "absolute right-[3%] bottom-[3%] w-[38%] h-[125px] bg-white rounded-[24px] shadow-lg border-4 border-white overflow-hidden z-10",
                    animateY: [0, -9, 0],
                    duration: 3.1,
                    delay: 0.8
                  }
                ];

                return FLOATING_CARDS.map((card, index) => {
                  const imgUrl = (onboardingImages && onboardingImages[index]) || DEFAULT_ONBOARDING_IMAGES[index];
                  return (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, scale: 0.8, y: 0 }}
                      animate={{ 
                        opacity: 1, 
                        scale: 1,
                        y: card.animateY 
                      }}
                      transition={{
                        opacity: { duration: 0.5 },
                        scale: { duration: 0.5 },
                        y: {
                          duration: card.duration,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: card.delay
                        }
                      }}
                      className={card.className}
                    >
                      {imgUrl && !isStockPhoto(imgUrl) ? (
                        <img 
                          src={imgUrl} 
                          alt={`Luxury Footwear ${index + 1}`} 
                          className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-50 to-neutral-100 flex flex-col items-center justify-center p-3 text-center border-2 border-dashed border-neutral-200 rounded-[20px] relative overflow-hidden group">
                          {/* Inner glowing layer */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="w-10 h-10 bg-white/80 rounded-full shadow-inner flex items-center justify-center text-[#E2583E] mb-1 z-10">
                            <ShoppingBag size={18} strokeWidth={1.5} className="animate-pulse" />
                          </div>
                          <span className="text-[9px] text-[#E2583E] font-black tracking-widest uppercase z-10">Slot {index + 1}</span>
                          <span className="text-[7px] text-neutral-400 font-bold tracking-wider uppercase mt-0.5 z-10">Awaiting Upload</span>
                        </div>
                      )}
                    </motion.div>
                  );
                });
              })()}

            </div>

            {/* Typography and Descriptive Call-to-action */}
            <div id="onboarding-text" className="text-center space-y-4 px-2">
              <div className="inline-block bg-white rounded-full px-5 py-2.5 shadow-xs border border-neutral-100">
                <span className="text-[10px] uppercase tracking-widest text-[#E2583E] font-bold">
                  The Art of Biomechanics & Fashion
                </span>
              </div>

              <h2 className="font-display font-black text-3xl md:text-4xl text-neutral-900 tracking-tight leading-tight pt-1">
                Discover Luxury Like Never Before
              </h2>

              <p className="text-[#8E8E8A] text-xs font-normal leading-relaxed max-w-sm mx-auto">
                Experience orthotic comfort fused with high-couture aesthetics. Discover luxury fashion, supportive footwear elements, and iconic designer brands crafted for the discerning modern shopper.
              </p>

              {/* Big Enter pill button with circle arrow */}
              <button
                onClick={() => setScreen("dashboard")}
                className="w-full mt-6 bg-black hover:bg-neutral-900 text-white font-medium py-3 px-5 rounded-full flex items-center justify-between transition-all group shadow-md cursor-pointer"
              >
                <span className="pl-4 text-xs tracking-wider uppercase font-bold">Enter the Collection</span>
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black transition-transform group-hover:translate-x-1">
                  <ArrowRight size={18} />
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: CORE DASHBOARD SYSTEM */}
        {screen === "dashboard" && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-md mx-auto px-4 py-6"
          >
            {/* Header: Avatar, Name, Bell and Cart */}
            <div id="dashboard-header" className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                {!currentUser ? (
                  <div 
                    onClick={() => setActiveTab("profile")}
                    className="w-11 h-11 rounded-full ring-4 ring-neutral-100 bg-neutral-50 border border-neutral-150 flex items-center justify-center text-neutral-400 cursor-pointer hover:bg-neutral-100 transition duration-200"
                  >
                    <User size={18} />
                  </div>
                ) : (
                  profilePic ? (
                    <img 
                      src={profilePic} 
                      alt="Avatar" 
                      className="w-11 h-11 rounded-full object-cover ring-4 ring-neutral-100 cursor-pointer"
                      onClick={() => setActiveTab("profile")}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div 
                      onClick={() => setActiveTab("profile")}
                      className="w-11 h-11 rounded-full ring-4 ring-neutral-100 bg-black text-white flex items-center justify-center text-xs font-black cursor-pointer uppercase"
                    >
                      {profileName ? profileName.trim().charAt(0) : "U"}
                    </div>
                  )
                )}
                <div>
                  <h3 className="font-black text-neutral-900 text-sm leading-tight">
                    Hello{currentUser && profileName && profileName.trim() !== "" ? ` ${profileName.trim().split(" ")[0]}` : ""}
                  </h3>
                  <span className="text-[11px] text-[#8E8E8A] font-medium block mt-0.5">Welcome to Comfort Steps</span>
                </div>
              </div>

              {/* Floating indicators */}
              <div className="flex items-center gap-2">
                <button className="relative w-10 h-10 bg-white rounded-full border border-neutral-100 shadow-xs flex items-center justify-center hover:bg-neutral-50 transition">
                  <Bell size={16} className="text-neutral-700" />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#E2583E] rounded-full" />
                </button>

                <button 
                  onClick={() => setScreen("cart")}
                  className={`relative w-10 h-10 bg-white rounded-full border border-neutral-100 shadow-xs flex items-center justify-center hover:bg-neutral-50 transition ${cartWiggle ? "animate-bounce" : ""}`}
                >
                  <ShoppingBag size={16} className="text-neutral-700" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
                      {cart.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Dynamic Content Tab Switcher */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "tween", ease: "easeInOut", duration: 0.22 }}
                className="space-y-6"
              >
                {/* TAB 1: HOME FEED */}
                {activeTab === "home" && (
                  <div className="space-y-6">
                    {/* Search bar matching Image 3 */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (e.target.value) setActiveTab("store");
                        }}
                        placeholder="Search"
                        className="w-full bg-white border border-neutral-100 rounded-2xl py-3 pl-11 pr-12 text-xs focus:outline-none focus:border-neutral-300 shadow-xs placeholder:text-neutral-400"
                      />
                      <SlidersHorizontal className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 cursor-pointer hover:text-black transition" size={16} onClick={() => { setActiveTab("store"); }} />
                    </div>

                    {/* Sale Promotion Banner (Dynamic from Firestore/State matching the screenshot) */}
                    <div 
                      className={`relative rounded-[28px] p-6 md:p-8 overflow-hidden text-white shadow-xs flex flex-col justify-center min-h-[180px] md:min-h-[200px] w-full ${
                        bannerConfig.imageUrl && !bannerConfig.imageUrl.includes("photo-1515347619252-60a4bd4effd8") && bannerConfig.imageUrl.trim() !== ""
                          ? "" 
                          : `bg-gradient-to-br ${bannerConfig.bgGradient || "from-[#9B86EC] via-[#856EE3] to-[#6E54D7]"}`
                      }`}
                      style={
                        bannerConfig.imageUrl && !bannerConfig.imageUrl.includes("photo-1515347619252-60a4bd4effd8") && bannerConfig.imageUrl.trim() !== ""
                          ? { backgroundImage: `url(${bannerConfig.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } 
                          : {}
                      }
                    >
                      {/* Dark overlay for readability when there is an image background */}
                      {bannerConfig.imageUrl && !bannerConfig.imageUrl.includes("photo-1515347619252-60a4bd4effd8") && bannerConfig.imageUrl.trim() !== "" && (
                        <div className="absolute inset-0 bg-black/40 z-0" />
                      )}
                      
                      {/* Abstract glowing background shapes when no custom image background is used */}
                      {!(bannerConfig.imageUrl && !bannerConfig.imageUrl.includes("photo-1515347619252-60a4bd4effd8") && bannerConfig.imageUrl.trim() !== "") && (
                        <>
                          <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
                          <div className="absolute right-12 top-2 w-28 h-28 bg-black/10 rounded-full blur-xl" />
                          <div className="absolute left-1/3 bottom-4 w-16 h-16 bg-white/10 rounded-full blur-lg" />
                        </>
                      )}
                      
                      <div className="relative z-10 max-w-full w-full space-y-4 flex flex-col items-start">
                        {/* Elegant pill badge */}
                        <span className="bg-white/20 border border-white/20 text-white text-[9.5px] md:text-[10px] font-extrabold py-1.5 px-3.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
                          {bannerConfig.tagline || "✨ OPULENT SAVINGS"}
                        </span>
                        
                        {/* Title text */}
                        <h2 className="font-display font-bold text-2xl md:text-3xl lg:text-4xl leading-tight text-white max-w-[85%] tracking-tight">
                          {bannerConfig.title || "Exclusive 50% Luxury Sale"}
                        </h2>
                        
                        {/* Shop Now Button */}
                        <button 
                          onClick={() => { setActiveTab("store"); setSelectedCategory("Heels"); }}
                          className="bg-black text-white hover:bg-neutral-900 font-bold text-xs px-6 py-3 rounded-full transition shadow-md cursor-pointer inline-flex items-center mt-2"
                        >
                          Shop Now
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Category Pill Tabs */}
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                      {["All", "Heels", "Flats", "Wedges", "Daily Wear"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setActiveTab("store");
                          }}
                          className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            cat === "All"
                              ? "bg-black text-white shadow-xs"
                              : "bg-white border border-neutral-100 text-neutral-500 hover:text-black"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Recent Viewed Section */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-display font-black text-sm text-neutral-900">Recently Viewed</h3>
                        <button 
                          onClick={() => { setActiveTab("store"); setSelectedCategory("All"); }}
                          className="text-[#8E8E8A] hover:text-neutral-950 text-xs font-semibold"
                        >
                          See All
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {featuredProducts.slice(0, 2).map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => handleViewProduct(prod)}
                            className="bg-white rounded-[24px] p-3 border border-neutral-100 shadow-xs cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between"
                          >
                            <div className="relative bg-[#F5F5F4] rounded-[18px] h-[130px] overflow-hidden flex items-center justify-center p-2">
                              <span className="absolute top-2 left-2 bg-[#E2583E] text-white text-[8px] font-extrabold px-2 py-0.5 rounded-md">
                                NEW
                              </span>
                              
                              <img 
                                src={prod.images[0]} 
                                alt={prod.name}
                                className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-300"
                                referrerPolicy="no-referrer"
                              />
                              
                              <button 
                                onClick={(e) => toggleFavorite(prod.id, e)}
                                className="absolute top-2 right-2 w-7 h-7 bg-white/95 rounded-full shadow-xs flex items-center justify-center text-neutral-300 hover:text-rose-500 transition"
                              >
                                <Heart size={13} fill={favorites.includes(prod.id) ? "#ef4444" : "none"} className={favorites.includes(prod.id) ? "text-rose-500" : ""} />
                              </button>
                            </div>
                            
                            <div className="pt-2 px-1 flex flex-col justify-between flex-1">
                              <div className="flex justify-between items-start gap-1">
                                <h4 className="font-bold text-xs text-neutral-800 truncate">{prod.name}</h4>
                                <div className="flex items-center gap-0.5 shrink-0 text-amber-500">
                                  <span className="text-[10px]">★</span>
                                  <span className="text-[10px] font-bold text-neutral-600">{prod.rating}</span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-neutral-50">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xs font-black text-neutral-900">₹{prod.price}</span>
                                  <span className="text-[9px] text-neutral-400 line-through">₹{prod.originalPrice}</span>
                                </div>
                                <div className="w-6.5 h-6.5 bg-black hover:bg-neutral-800 text-white rounded-full flex items-center justify-center transition">
                                  <ArrowRight size={11} className="-rotate-45" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Main curated catalog preview */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-display font-black text-sm text-neutral-900">Featured Footwear</h3>
                        <button 
                          onClick={() => { setActiveTab("store"); setSelectedCategory("All"); }}
                          className="text-[#8E8E8A] hover:text-neutral-950 text-xs font-semibold"
                        >
                          View Store
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        {featuredProducts.slice(2, 4).map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => handleViewProduct(prod)}
                            className="bg-white rounded-[24px] p-3 border border-neutral-100 shadow-xs cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between"
                          >
                            <div className="relative bg-[#F5F5F4] rounded-[18px] h-[130px] overflow-hidden flex items-center justify-center p-2">
                              <img 
                                src={prod.images[0]} 
                                alt={prod.name}
                                className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-300"
                                referrerPolicy="no-referrer"
                              />
                              <button 
                                onClick={(e) => toggleFavorite(prod.id, e)}
                                className="absolute top-2 right-2 w-7 h-7 bg-white/95 rounded-full shadow-xs flex items-center justify-center text-neutral-300 hover:text-rose-500 transition"
                              >
                                <Heart size={13} fill={favorites.includes(prod.id) ? "#ef4444" : "none"} className={favorites.includes(prod.id) ? "text-rose-500" : ""} />
                              </button>
                            </div>
                            
                            <div className="pt-2 px-1 flex flex-col justify-between flex-1">
                              <div className="flex justify-between items-start gap-1">
                                <h4 className="font-bold text-xs text-neutral-800 truncate">{prod.name}</h4>
                                <div className="flex items-center gap-0.5 shrink-0 text-amber-500">
                                  <span className="text-[10px]">★</span>
                                  <span className="text-[10px] font-bold text-neutral-600">{prod.rating}</span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-neutral-50">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xs font-black text-neutral-900">₹{prod.price}</span>
                                  <span className="text-[9px] text-neutral-400 line-through">₹{prod.originalPrice}</span>
                                </div>
                                <div className="w-6.5 h-6.5 bg-black hover:bg-neutral-800 text-white rounded-full flex items-center justify-center transition">
                                  <ArrowRight size={11} className="-rotate-45" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: STORE CATALOG */}
                {activeTab === "store" && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-display font-black text-xl text-neutral-900 tracking-tight">Comfort Store</h2>
                      <p className="text-xs text-[#8E8E8A] mt-1">Explore and filter luxury comfort footwears.</p>
                    </div>

                    {/* Filters & Search Row */}
                    <div className="space-y-3 bg-white p-4 rounded-3xl border border-neutral-100 shadow-xs">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search shoes, brands, heels..."
                          className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-neutral-300"
                        />
                      </div>

                      {/* Scrollable category filter */}
                      <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {["All", "Heels", "Flats", "Wedges", "Daily Wear"].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                              selectedCategory === cat 
                                ? "bg-black text-white"
                                : "bg-neutral-50 text-neutral-500 border border-neutral-100 hover:text-black"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Dynamic footwear size matching notification */}
                      {preferredSize ? (
                        <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] bg-neutral-900 text-white font-extrabold px-2 py-0.5 rounded-md">
                              Size US {preferredSize} Pref
                            </span>
                            <span className="text-[9px] text-[#8E8E8A] font-bold">Auto filter is ready</span>
                          </div>
                          
                          <button
                            onClick={() => setIsSizeFilterActive(!isSizeFilterActive)}
                            className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              isSizeFilterActive 
                                ? "bg-[#E2583E] text-white" 
                                : "bg-neutral-50 text-neutral-600 border border-neutral-150 hover:bg-neutral-100"
                            }`}
                          >
                            <Filter size={11} />
                            {isSizeFilterActive ? "Active Match" : "Match My Size"}
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-neutral-100 flex justify-between items-center text-[10px] text-neutral-400 font-medium">
                          <span>Setup footwear size in Profile for automatic matching!</span>
                          <button 
                            onClick={() => setActiveTab("profile")}
                            className="text-black font-extrabold underline hover:text-[#E2583E]"
                          >
                            Configure
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Products Grid */}
                    {filteredProducts.length === 0 ? (
                      <div className="bg-white rounded-3xl border border-neutral-100 p-8 text-center text-neutral-500">
                        <AlertCircle className="mx-auto text-neutral-300 mb-2" size={28} />
                        <h4 className="font-bold text-neutral-800 text-xs">No Footwear Matches</h4>
                        <p className="text-[11px] text-[#8E8E8A] mt-1 max-w-[220px] mx-auto leading-relaxed">
                          Try typing a different name, or toggle your footwear size filter.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {filteredProducts.map((prod) => (
                          <div
                            key={prod.id}
                            onClick={() => handleViewProduct(prod)}
                            className="bg-white rounded-[24px] p-3 border border-neutral-100 shadow-xs cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between"
                          >
                            <div className="relative bg-[#F5F5F4] rounded-[18px] h-[130px] overflow-hidden flex items-center justify-center p-2">
                              <img 
                                src={prod.images[0]} 
                                alt={prod.name}
                                className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition duration-300"
                                referrerPolicy="no-referrer"
                              />
                              <button 
                                onClick={(e) => toggleFavorite(prod.id, e)}
                                className="absolute top-2 right-2 w-7 h-7 bg-white/95 rounded-full shadow-xs flex items-center justify-center text-neutral-300 hover:text-rose-500 transition"
                              >
                                <Heart size={13} fill={favorites.includes(prod.id) ? "#ef4444" : "none"} className={favorites.includes(prod.id) ? "text-rose-500" : ""} />
                              </button>
                            </div>
                            
                            <div className="pt-2 px-1 flex flex-col justify-between flex-1">
                              <div className="flex justify-between items-start gap-1">
                                <h4 className="font-bold text-xs text-neutral-800 truncate">{prod.name}</h4>
                                <div className="flex items-center gap-0.5 shrink-0 text-amber-500">
                                  <span className="text-[10px]">★</span>
                                  <span className="text-[10px] font-bold text-neutral-600">{prod.rating}</span>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center mt-2.5 pt-1.5 border-t border-neutral-50">
                                <div className="flex items-baseline gap-1">
                                  <span className="text-xs font-black text-neutral-900">₹{prod.price}</span>
                                  <span className="text-[9px] text-neutral-400 line-through">₹{prod.originalPrice}</span>
                                </div>
                                <div className="w-6.5 h-6.5 bg-black hover:bg-neutral-800 text-white rounded-full flex items-center justify-center transition">
                                  <ArrowRight size={11} className="-rotate-45" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: SAVED COLLECTIONS / WISHLIST */}
                {activeTab === "wishlist" && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="font-display font-black text-xl text-neutral-900 tracking-tight">Saved Collections</h2>
                      <p className="text-xs text-[#8E8E8A] mt-1">Items you bookmarked on Comfort Steps</p>
                    </div>

                    {favorites.length === 0 ? (
                      <div className="bg-white rounded-3xl border border-neutral-100 p-10 text-center text-neutral-500 space-y-4">
                        <Heart className="mx-auto text-neutral-200" size={32} />
                        <h4 className="font-bold text-neutral-800 text-xs">Your Wishlist is Empty</h4>
                        <p className="text-[11px] text-[#8E8E8A] max-w-[200px] mx-auto leading-relaxed">
                          Save your favorite stiletto heels and wedge sneakers with the heart icon to see them here!
                        </p>
                        <button
                          onClick={() => setActiveTab("store")}
                          className="bg-black hover:bg-neutral-900 text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
                        >
                          Explore Footwear
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {favorites.map((favId) => {
                          const prod = products.find(p => p.id === favId);
                          if (!prod) return null;
                          return (
                            <div
                              key={prod.id}
                              onClick={() => handleViewProduct(prod)}
                              className="bg-white rounded-2xl p-3 border border-neutral-100 shadow-xs flex items-center justify-between cursor-pointer hover:shadow-md transition group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-neutral-50 rounded-xl flex items-center justify-center p-1 shrink-0 overflow-hidden">
                                  <img 
                                    src={prod.images[0]} 
                                    alt="" 
                                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <h3 className="font-bold text-xs text-neutral-800 group-hover:text-black">{prod.name}</h3>
                                  <p className="text-[9px] text-neutral-400 uppercase tracking-wider font-extrabold">{prod.category}</p>
                                  <p className="text-xs font-black text-neutral-900">₹{prod.price}</p>
                                </div>
                              </div>
                              
                              <button
                                onClick={(e) => toggleFavorite(prod.id, e)}
                                className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-red-50 text-[#E2583E] flex items-center justify-center transition"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: PROFILE & SETTINGS */}
                {activeTab === "profile" && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-display font-black text-xl text-neutral-900 tracking-tight">My Profile</h2>
                      <p className="text-xs text-[#8E8E8A] mt-1">Manage sizes, addresses, and order logs.</p>
                    </div>

                    {!currentUser ? (
                      <div className="bg-white rounded-[26px] p-6 border border-neutral-100 shadow-xs space-y-5 text-center">
                        <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-300">
                          <User size={32} />
                        </div>
                        <div className="space-y-1.5">
                          <h3 className="font-display font-black text-base text-neutral-900 tracking-tight">Google Login Required</h3>
                          <p className="text-xs text-[#8E8E8A] max-w-xs mx-auto leading-relaxed">
                            To view your profile details, manage delivery addresses, see order history, and configure preferences, please log in below.
                          </p>
                        </div>
                        
                        {loginError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs text-left leading-relaxed">
                            {loginError}
                          </div>
                        )}
                        
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          className="w-full py-3.5 px-4 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs font-extrabold rounded-2xl transition shadow-xs flex items-center justify-center gap-2.5 cursor-pointer"
                        >
                          <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>Continue with Google</span>
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Main visual header with interactive Avatar & Photo Selector */}
                        <div className="bg-white rounded-[26px] p-5 border border-neutral-100 shadow-xs space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={profilePic} 
                            alt="Profile" 
                            className="w-14 h-14 rounded-full object-cover border border-neutral-200"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setIsSelectingPic(!isSelectingPic)}
                            className="absolute -bottom-1 -right-1 bg-black text-white p-1 rounded-full text-[8px] hover:scale-115 transition shadow-sm cursor-pointer"
                            title="Edit Avatar"
                          >
                            ✏️
                          </button>
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-neutral-900 text-sm">{profileName}</h3>
                          <p className="text-xs text-neutral-400 font-medium">{profileEmail}</p>
                          
                          <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-[#059669] text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-1.5">
                            <span>✓</span>
                            <span>Verified Comfort Buyer</span>
                          </div>
                        </div>
                      </div>

                      {/* Expandable women avatars selector list */}
                      {isSelectingPic && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2"
                        >
                          <span className="text-[9px] font-extrabold uppercase text-neutral-400 tracking-wider block">
                            Choose Premium Female Avatar
                          </span>
                          <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                            {DUMMY_AVATARS.map((avatar, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setProfilePic(avatar);
                                  localStorage.setItem("comfort_profile_pic", avatar);
                                  setIsSelectingPic(false);
                                }}
                                className={`w-10 h-10 rounded-full overflow-hidden border-2 shrink-0 transition ${
                                  profilePic === avatar ? "border-black scale-110 shadow-sm" : "border-transparent opacity-70 hover:opacity-100"
                                }`}
                              >
                                <img src={avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* LIVE ORDER HISTORY LISTING */}
                    <div>
                      <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-neutral-400 mb-2">
                        Order History ({myOrders.length})
                      </h4>

                      {myOrders.length === 0 ? (
                        <div className="bg-white rounded-2xl p-6 border border-neutral-100 text-center space-y-2">
                          <div className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-300">
                            <History size={16} />
                          </div>
                          <h5 className="font-bold text-xs text-neutral-800">No past purchases</h5>
                          <p className="text-[11px] text-[#8E8E8A] leading-relaxed max-w-[240px] mx-auto">
                            Place a cash-on-delivery order to test the checkout history logs!
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {myOrders.map((ord) => (
                            <div key={ord.id} className="bg-white border border-neutral-100 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-extrabold text-neutral-800">{ord.id}</span>
                                <span className="bg-[#EBF5FF] text-[#1E3A8A] border border-[#BFDBFE] px-2 py-0.5 rounded-full font-bold">
                                  ● {ord.status}
                                </span>
                              </div>

                              <div className="space-y-1">
                                {ord.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-[11px] text-neutral-600">
                                    <span className="truncate max-w-[70%] font-medium">
                                      {item.product.name} ({item.selectedSize})
                                    </span>
                                    <span>Qty {item.quantity}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="border-t border-neutral-50 pt-2 flex justify-between items-center text-xs">
                                <span className="text-[10px] text-neutral-400">
                                  {new Date(ord.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="font-extrabold text-neutral-900">₹{ord.totalAmount}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Interactive Profile Setting/Editing Panel */}
                    <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-xs space-y-4">
                      <div className="border-b border-neutral-50 pb-2.5 flex justify-between items-center">
                        <h4 className="text-[10px] uppercase font-extrabold tracking-widest text-neutral-400 flex items-center gap-1.5">
                          <Sliders size={12} className="text-black" /> Settings & Preferences
                        </h4>
                        {activeProfileSection && (
                          <button
                            type="button"
                            onClick={() => setActiveProfileSection(null)}
                            className="text-[10px] text-neutral-400 hover:text-black font-extrabold"
                          >
                            Close
                          </button>
                        )}
                      </div>

                      {/* Display current settings in simplified format */}
                      {!activeProfileSection && (
                        <div className="space-y-3">
                          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100/60 flex justify-between items-center">
                            <div className="space-y-0.5">
                              <span className="text-[8px] uppercase font-extrabold tracking-wider text-neutral-400 block">Personal Info</span>
                              <p className="text-xs font-bold text-neutral-800">{profileName}</p>
                              <p className="text-[10px] text-neutral-400">{profileEmail} • Pref Size US {preferredSize || "None"}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveProfileSection("profile")}
                              className="text-[10px] bg-black text-white px-3 py-1.5 rounded-xl font-bold hover:scale-105 transition cursor-pointer"
                            >
                              Edit Info
                            </button>
                          </div>

                          <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100/60 flex justify-between items-center">
                            <div className="space-y-0.5 max-w-[70%]">
                              <span className="text-[8px] uppercase font-extrabold tracking-wider text-neutral-400 block">Delivery Address</span>
                              <p className="text-xs font-bold text-neutral-800 truncate">{profileAddress || "No address saved"}</p>
                              <p className="text-[10px] text-neutral-400 truncate">Phone: {profilePhone || "No phone saved"}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveProfileSection("address")}
                              className="text-[10px] bg-black text-white px-3 py-1.5 rounded-xl font-bold hover:scale-105 transition cursor-pointer shrink-0"
                            >
                              Edit Address
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Edit Basic Info Form */}
                      <AnimatePresence mode="wait">
                        {activeProfileSection === "profile" && (
                          <motion.form
                            key="basic-profile-form"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleSaveProfile}
                            className="space-y-3 pt-1"
                          >
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-2">Edit Basic Profile Details</span>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">My Size Preference</label>
                                <select 
                                  value={preferredSize} 
                                  onChange={(e) => {
                                    setPreferredSize(e.target.value);
                                    localStorage.setItem("comfort_pref_size", e.target.value);
                                  }}
                                  className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                >
                                  <option value="">Select Size</option>
                                  {["5", "6", "7", "8", "9", "10", "11", "12"].map(s => (
                                    <option key={s} value={s}>US {s}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">Full Name</label>
                                <input 
                                  type="text" 
                                  required
                                  value={profileName}
                                  onChange={(e) => setProfileName(e.target.value)}
                                  placeholder="Full name"
                                  className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">Email Address</label>
                              <input 
                                type="email" 
                                required
                                value={profileEmail}
                                onChange={(e) => setProfileEmail(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                              />
                            </div>

                            <div className="flex gap-2 pt-1.5">
                              <button 
                                type="submit"
                                disabled={isSavingProfile}
                                className="flex-1 py-2 bg-black hover:bg-neutral-900 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                              >
                                {isSavingProfile ? "Saving..." : "Save Basic Info"}
                              </button>
                              <button 
                                type="button"
                                onClick={() => setActiveProfileSection(null)}
                                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </motion.form>
                        )}

                        {/* Edit Delivery Address Form */}
                        {activeProfileSection === "address" && (
                          <motion.form
                            key="address-form"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            onSubmit={handleSaveProfile}
                            className="space-y-3.5 pt-1"
                          >
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-2">Edit Shipping Address Details</span>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">First Name</label>
                                <input 
                                  type="text" 
                                  required
                                  value={addrFirstName}
                                  onChange={(e) => setAddrFirstName(e.target.value)}
                                  placeholder="First Name"
                                  className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">Last Name</label>
                                <input 
                                  type="text" 
                                  required
                                  value={addrLastName}
                                  onChange={(e) => setAddrLastName(e.target.value)}
                                  placeholder="Last Name"
                                  className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">Phone Number</label>
                              <input 
                                type="tel" 
                                required
                                value={addrPhone}
                                onChange={(e) => setAddrPhone(e.target.value)}
                                placeholder="Contact Phone Number"
                                className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-3.5">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">Flat / House Number</label>
                                <input 
                                  type="text"
                                  required
                                  value={addrFlatHouse}
                                  onChange={(e) => setAddrFlatHouse(e.target.value)}
                                  placeholder="e.g. Flat 402, Sunshine Residency"
                                  className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">Area / Locality</label>
                                  <input 
                                    type="text"
                                    required
                                    value={addrArea}
                                    onChange={(e) => setAddrArea(e.target.value)}
                                    placeholder="e.g. Bandra West"
                                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">Landmark</label>
                                  <input 
                                    type="text"
                                    value={addrLandmark}
                                    onChange={(e) => setAddrLandmark(e.target.value)}
                                    placeholder="e.g. Near Lilavati Hospital"
                                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">City</label>
                                  <input 
                                    type="text"
                                    required
                                    value={addrCity}
                                    onChange={(e) => setAddrCity(e.target.value)}
                                    placeholder="e.g. Mumbai"
                                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">PIN Code</label>
                                  <input 
                                    type="text"
                                    required
                                    value={addrPinCode}
                                    onChange={(e) => setAddrPinCode(e.target.value)}
                                    placeholder="e.g. 400050"
                                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-1.5">
                              <button 
                                type="submit"
                                disabled={isSavingProfile}
                                className="flex-1 py-2 bg-black hover:bg-neutral-900 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                              >
                                {isSavingProfile ? "Saving..." : "Save Delivery Address"}
                              </button>
                              <button 
                                type="button"
                                onClick={() => setActiveProfileSection(null)}
                                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </motion.form>
                        )}
                      </AnimatePresence>

                      {profileSaveSuccess && (
                        <div className="text-center text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1 animate-pulse">
                          ✓ Saved successfully to Comfort Steps!
                        </div>
                      )}
                    </div>

                    {/* Account Security & Action (Logout) */}
                    <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-xs flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest block">Account Security</span>
                        <span className="text-xs font-bold text-neutral-700">Currently logged in</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (firebaseActive) {
                            logoutUser();
                          }
                          setCurrentUser(null);
                          // Reset state
                          setProfileName("");
                          setProfileEmail("");
                          setProfilePic("");
                          localStorage.removeItem("comfort_profile_pic");
                          alert("Successfully logged out from Comfort Steps!");
                        }}
                        className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-extrabold px-3 py-2 rounded-xl transition cursor-pointer"
                      >
                        Logout Account
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* VIEW 3: DETAILED FOOTWEAR PRODUCT PAGE */}
        {screen === "detail" && selectedProduct && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="max-w-md mx-auto px-4 py-6"
          >
            {/* Nav */}
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setScreen("dashboard")}
                className="w-10 h-10 bg-white border border-neutral-100 rounded-full flex items-center justify-center text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-display font-bold text-sm text-neutral-900 uppercase tracking-widest">Product Details</h2>
              <button 
                onClick={() => setScreen("cart")}
                className="relative w-10 h-10 bg-white border border-neutral-100 rounded-full flex items-center justify-center text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
              >
                <ShoppingBag size={18} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* Images stage */}
            <div className="bg-white rounded-[28px] p-6 border border-neutral-100 shadow-xs mb-5 relative">
              <div className="h-[220px] flex items-center justify-center rounded-2xl bg-[#F5F5F4] overflow-hidden p-4 relative">
                <motion.img 
                  key={activeImageIdx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  src={selectedProduct.images[activeImageIdx]} 
                  alt={selectedProduct.name}
                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                  referrerPolicy="no-referrer"
                />
                
                <button 
                  onClick={() => toggleFavorite(selectedProduct.id)}
                  className="absolute top-3 right-3 w-9 h-9 bg-white border border-neutral-150 rounded-full shadow-md flex items-center justify-center text-neutral-300 hover:text-rose-500 transition"
                >
                  <Heart size={16} fill={favorites.includes(selectedProduct.id) ? "#ef4444" : "none"} className={favorites.includes(selectedProduct.id) ? "text-rose-500" : ""} />
                </button>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 justify-center mt-4">
                {selectedProduct.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-12 h-12 bg-neutral-50 rounded-lg p-1 border flex items-center justify-center transition-all ${
                      activeImageIdx === idx 
                        ? "border-black ring-2 ring-neutral-900/5" 
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <img src={img} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>

            {/* Specs Header */}
            <div className="space-y-1.5 mb-5">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">{selectedProduct.brand}</span>
              <div className="flex justify-between items-start gap-3">
                <h1 className="font-display font-black text-xl text-neutral-900 leading-tight">{selectedProduct.name}</h1>
                <div className="text-right">
                  <span className="text-xl font-black text-neutral-900 block">₹{selectedProduct.price}</span>
                  {selectedProduct.originalPrice > selectedProduct.price && (
                    <span className="text-[11px] text-neutral-400 line-through">₹{selectedProduct.originalPrice}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="text-amber-500 text-sm">★</span>
                <span className="text-xs font-bold text-neutral-700">{selectedProduct.rating}</span>
                <span className="text-xs text-neutral-400">({selectedProduct.reviewsCount} verified ratings)</span>
              </div>
            </div>

            {/* Colors Swatches */}
            {selectedProduct.colors && selectedProduct.colors.length > 0 && (
              <div className="mb-5">
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block mb-2">Select Color</span>
                <div className="flex gap-2">
                  {selectedProduct.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform relative ${
                        selectedColor === color 
                          ? "border-neutral-900 scale-110" 
                          : "border-transparent hover:scale-105"
                      }`}
                    >
                      {selectedColor === color && (
                        <span className="absolute inset-0 flex items-center justify-center text-white">
                          <Check size={12} strokeWidth={3} className="mix-blend-difference" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes Selection */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider">Select Size</span>
                <button 
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-xs text-black font-extrabold flex items-center gap-1 hover:underline"
                >
                  <Ruler size={12} /> Sizing Calculator
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {selectedProduct.sizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2 text-center text-xs font-bold rounded-xl transition border ${
                      selectedSize === sz 
                        ? "bg-black text-white border-black" 
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6 border-t border-neutral-100 pt-4">
              <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block mb-1.5">Description</span>
              <p className="text-xs text-neutral-500 leading-relaxed font-normal">
                {selectedProduct.description}
              </p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3.5">
              <button 
                onClick={() => {
                  addToCart();
                  setScreen("cart");
                  setIsCheckoutOpen(true);
                }}
                className="py-3.5 border border-black rounded-2xl font-bold text-xs text-neutral-900 bg-white hover:bg-neutral-50 transition cursor-pointer text-center"
              >
                Buy Now
              </button>
              <button 
                onClick={(e) => {
                  addToCart(e);
                  setIsAddingToCart(true);
                  setTimeout(() => setIsAddingToCart(false), 1500);
                }}
                disabled={isAddingToCart}
                className="py-3.5 bg-black hover:bg-neutral-900 rounded-2xl font-bold text-xs text-white transition cursor-pointer text-center flex items-center justify-center gap-1.5 min-h-[46px]"
              >
                <AnimatePresence mode="wait">
                  {isAddingToCart ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5 text-emerald-400 font-extrabold"
                    >
                      <ShoppingBag size={14} className="animate-bounce" /> Added!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Add to Cart
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW 4: DELIVERY SHOPPING BAG & CHECKOUT */}
        {screen === "cart" && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="max-w-md mx-auto px-4 py-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <button 
                onClick={() => setScreen("dashboard")}
                className="w-10 h-10 bg-white border border-neutral-100 rounded-full flex items-center justify-center text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-display font-bold text-sm text-neutral-900 uppercase tracking-widest">My Cart</h2>
              <div className="w-10 h-10" />
            </div>

            {isOrderSuccess && lastPlacedOrder ? (
              <div className="bg-white rounded-[32px] p-6 border border-neutral-100 shadow-xl space-y-5 text-left max-w-md mx-auto">
                <div className="text-center space-y-1 pb-4 border-b border-neutral-100">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-1 animate-bounce">
                    <CheckCircle size={26} />
                  </div>
                  <h2 className="font-display font-black text-lg text-neutral-900">Order Confirmed!</h2>
                  <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                    Receipt ID: {lastPlacedOrder.id}
                  </p>
                </div>

                {/* Items Summarized */}
                <div className="space-y-3">
                  <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest block">Purchased Footwear</span>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {lastPlacedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 bg-neutral-50 p-2 rounded-xl border border-neutral-100">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1 border border-neutral-100 overflow-hidden shrink-0">
                          <img src={item.product.images[0]} alt="" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <h4 className="font-bold text-[11px] text-neutral-800 truncate">{item.product.name}</h4>
                          <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 font-bold">
                            <span>Size: {item.selectedSize}</span>
                            <span>•</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <span className="text-[10px] font-black text-neutral-900">₹{item.product.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address and Info Summary */}
                <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-100 text-[11px] space-y-2.5">
                  <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest block">Delivery Details</span>
                  
                  <div className="grid grid-cols-2 gap-3 pb-2.5 border-b border-neutral-100">
                    <div>
                      <span className="text-[8px] uppercase text-neutral-400 font-extrabold block">Customer Name</span>
                      <span className="font-bold text-neutral-800">{lastPlacedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-neutral-400 font-extrabold block">Phone Number</span>
                      <span className="font-bold text-neutral-800">{lastPlacedOrder.customerPhone}</span>
                    </div>
                  </div>

                  <div className="pb-2.5 border-b border-neutral-100">
                    <span className="text-[8px] uppercase text-neutral-400 font-extrabold block">Email Address</span>
                    <span className="font-bold text-neutral-800 break-all">{lastPlacedOrder.customerEmail}</span>
                  </div>

                  <div>
                    <span className="text-[8px] uppercase text-neutral-400 font-extrabold block">Shipping Address</span>
                    <p className="font-bold text-neutral-800 leading-normal text-[10.5px]">
                      {lastPlacedOrder.shippingAddress}
                    </p>
                  </div>
                </div>

                {/* Payment Breakdown & UPI Option */}
                <div className="bg-neutral-50 rounded-2xl p-3.5 border border-neutral-100 space-y-2">
                  <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest block">Payment Information</span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500">Method</span>
                    <span className="font-extrabold text-neutral-800">
                      {lastPlacedOrder.paymentMethod === "UPI" ? "⚡ UPI Transfer" : "💵 Cash on Delivery"}
                    </span>
                  </div>

                  {lastPlacedOrder.paymentMethod === "UPI" && (
                    <div className="pt-2 border-t border-neutral-100 space-y-2 text-center">
                      <p className="text-[9.5px] text-purple-700 leading-relaxed font-bold">
                        Please complete payment of <span className="text-black font-black">₹{lastPlacedOrder.totalAmount}</span> to our store UPI ID:
                      </p>
                      <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-purple-100 text-[10px] font-mono font-bold">
                        <span>{adminUpiId}</span>
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(adminUpiId);
                          }}
                          className="text-[9px] bg-neutral-100 hover:bg-neutral-200 px-1.5 py-0.5 rounded transition cursor-pointer font-bold"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="border border-dashed border-purple-200 rounded-xl p-2 bg-white inline-flex flex-col items-center justify-center mx-auto">
                        <QrCode size={40} className="text-purple-600 mb-1" />
                        <span className="text-[8px] font-extrabold text-neutral-400 uppercase mt-1">Comfort Steps QR</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs pt-2 border-t border-neutral-100">
                    <span className="text-neutral-500 font-bold">Grand Total Paid</span>
                    <span className="font-black text-sm text-neutral-900">₹{lastPlacedOrder.totalAmount}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button 
                    onClick={() => {
                      setIsOrderSuccess(false);
                      setScreen("dashboard");
                      setActiveTab("profile");
                    }}
                    className="w-full py-2.5 bg-black hover:bg-neutral-900 text-white font-bold text-xs rounded-xl transition cursor-pointer text-center block"
                  >
                    Track Shipment in Profile
                  </button>
                  <button 
                    onClick={() => {
                      setIsOrderSuccess(false);
                      setScreen("dashboard");
                      setActiveTab("store");
                    }}
                    className="w-full py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-bold text-xs rounded-xl border border-neutral-150 transition cursor-pointer text-center block"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : cart.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-neutral-100 text-center space-y-3">
                <ShoppingBag className="mx-auto text-neutral-200" size={32} />
                <h4 className="font-bold text-neutral-800 text-xs">Bag is empty</h4>
                <p className="text-xs text-[#8E8E8A]">Add premium shoes from the Store tab to begin checkout.</p>
                <button
                  onClick={() => { setScreen("dashboard"); setActiveTab("store"); }}
                  className="bg-black text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
                >
                  Go to Store
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Cart Items list */}
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div 
                      key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                      className="bg-white rounded-2xl p-3 border border-neutral-100 flex gap-4 shadow-xs"
                    >
                      <div className="w-16 h-16 bg-[#F5F5F4] rounded-xl overflow-hidden flex items-center justify-center p-1 shrink-0">
                        <img src={item.product.images[0]} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h3 className="font-bold text-xs text-neutral-800 truncate">{item.product.name}</h3>
                            <button 
                              onClick={() => updateCartQty(idx, -item.quantity)}
                              className="text-neutral-400 hover:text-black p-0.5"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wide block">{item.product.brand}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-md font-extrabold">
                              {item.selectedSize}
                            </span>
                            <div className="flex items-center gap-1 text-[9px] text-neutral-400 font-bold">
                              <span>Color:</span>
                              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.selectedColor }} />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs font-black text-neutral-900">₹{item.product.price}</span>
                          
                          <div className="flex items-center gap-1.5 bg-neutral-50 rounded-lg p-0.5 border border-neutral-100">
                            <button onClick={() => updateCartQty(idx, -1)} className="p-1 hover:bg-white rounded text-neutral-600">
                              <Minus size={9} />
                            </button>
                            <span className="text-xs font-bold px-1">{item.quantity}</span>
                            <button onClick={() => updateCartQty(idx, 1)} className="p-1 hover:bg-white rounded text-neutral-600">
                              <Plus size={9} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotals card */}
                <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-xs">
                  <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                    <span>Subtotal</span>
                    <span className="font-bold text-neutral-800">₹{totalCartPrice}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
                    <span>Shipping Fee</span>
                    <span className="text-[#059669] font-bold">FREE</span>
                  </div>
                  <div className="border-t border-neutral-50 my-2.5" />
                  <div className="flex justify-between text-xs font-black text-neutral-900">
                    <span>Grand Total</span>
                    <span>₹{totalCartPrice}</span>
                  </div>
                </div>

                {/* Checkout forms */}
                {!isCheckoutOpen ? (
                  <button 
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full py-3 bg-black hover:bg-neutral-900 text-white font-bold text-xs rounded-xl tracking-wider uppercase transition cursor-pointer"
                  >
                    Proceed to Delivery Checkout
                  </button>
                ) : (
                  <motion.form 
                    onSubmit={handlePlaceOrder}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-lg space-y-3.5"
                  >
                    <h3 className="font-display font-bold text-[10px] uppercase tracking-widest text-neutral-400 border-b border-neutral-50 pb-2 flex items-center gap-1.5">
                      <CreditCard size={14} className="text-black" /> Delivery & Billing Information
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">Receiver Name</label>
                        <input 
                          type="text" 
                          required
                          value={checkoutName}
                          onChange={(e) => setCheckoutName(e.target.value)}
                          placeholder="Receiver name"
                          className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">Email Address</label>
                          <input 
                            type="email" 
                            required
                            value={checkoutEmail}
                            onChange={(e) => setCheckoutEmail(e.target.value)}
                            className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">Contact Phone</label>
                          <input 
                            type="tel" 
                            required
                            value={checkoutPhone}
                            onChange={(e) => setCheckoutPhone(e.target.value)}
                            placeholder="+91 Phone No"
                            className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1">Street Address</label>
                        <input 
                          type="text" 
                          required
                          value={checkoutAddress}
                          onChange={(e) => setCheckoutAddress(e.target.value)}
                          placeholder="Flat No, Apartment, Landmark, Pincode"
                          className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                        />
                      </div>

                      <div>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block mb-1.5">Payment Method</span>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            { key: "COD", label: "Cash (COD)", emoji: "💵" },
                            { key: "UPI", label: "UPI Transfer", emoji: "⚡" }
                          ] as const).map((method) => (
                            <button
                              key={method.key}
                              type="button"
                              onClick={() => setPaymentMethod(method.key)}
                              className={`p-2.5 rounded-xl border text-[10px] font-bold text-center transition flex flex-col items-center justify-center gap-1 ${
                                paymentMethod === method.key 
                                  ? "bg-black text-white border-black animate-pulse" 
                                  : "bg-neutral-50 text-neutral-600 border-neutral-150 hover:bg-neutral-100"
                              }`}
                            >
                              <span className="text-sm">{method.emoji}</span>
                              <span>{method.label}</span>
                            </button>
                          ))}
                        </div>

                        {paymentMethod === "UPI" && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 p-3.5 bg-purple-50 rounded-2xl border border-purple-100 space-y-2 text-center"
                          >
                            <span className="text-[9px] font-extrabold text-[#9B86EC] uppercase tracking-wider block">
                              Active Merchant UPI Config
                            </span>
                            <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-neutral-100 text-[11px] font-bold text-neutral-800">
                              <span className="font-mono">{adminUpiId}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(adminUpiId);
                                }}
                                className="text-[10px] text-black bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-md transition font-black flex items-center gap-1 cursor-pointer"
                              >
                                <Copy size={10} /> Copy
                              </button>
                            </div>
                            <p className="text-[9px] text-purple-700 leading-relaxed font-medium">
                              Send the exact order amount to our verified UPI ID. Your order will lock instantly and update on verification!
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button 
                        type="button"
                        onClick={() => setIsCheckoutOpen(false)}
                        className="flex-1 py-2 border border-neutral-250 hover:border-neutral-350 font-bold text-xs rounded-xl text-neutral-600 transition"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-2 bg-black hover:bg-neutral-900 text-white font-bold text-xs rounded-xl transition flex items-center justify-center"
                      >
                        Place Order (₹{totalCartPrice})
                      </button>
                    </div>
                  </motion.form>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 5: REGISTER SCREEN */}
        {screen === "register" && (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="max-w-md mx-auto px-6 py-12 text-center space-y-6 min-h-[80vh] flex flex-col justify-center"
          >
            <ComfortStepsLogo size="lg" className="mx-auto mb-2" />
            <div className="space-y-2">
              <h2 className="font-display font-black text-2xl text-neutral-900 tracking-tight">Step into Luxury</h2>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                Unlock secure checkouts, save footwear size profile preferences, and track your order dispatch real-time.
              </p>
            </div>
            
            {/* Card with Register Button */}
            <div className="bg-white rounded-[32px] p-6 border border-neutral-100 shadow-md space-y-5">
              <div className="flex justify-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 animate-bounce" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-900 animate-bounce [animation-delay:0.4s]" />
              </div>
              
              <p className="text-xs text-neutral-500 leading-relaxed">
                Join our community of verified comfort footwear lovers. Sign up takes just 1 click with your Google account.
              </p>
              
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs text-left leading-relaxed">
                  {loginError}
                </div>
              )}
              
              <button
                onClick={() => handleGoogleLogin()}
                className="w-full py-3 px-4 bg-black hover:bg-neutral-900 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2.5 shadow-sm cursor-pointer"
              >
                {/* Google G icon */}
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </div>
            
            {/* Guest helper */}
            <button
              onClick={() => {
                setScreen("dashboard");
                setRedirectAfterLogin(null);
              }}
              className="text-xs text-neutral-400 font-bold hover:text-black transition"
            >
              Skip Registration & Browse Store
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOT SIZE CALCULATOR MODAL */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-xs w-full border border-neutral-100 shadow-2xl space-y-4 relative"
            >
              <button 
                onClick={() => setIsSizeGuideOpen(false)}
                className="absolute top-4 right-4 w-7 h-7 bg-neutral-50 hover:bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 hover:text-black transition"
              >
                <X size={14} />
              </button>

              <div className="flex items-center gap-1.5 text-neutral-900">
                <Ruler size={18} className="text-[#E2583E]" />
                <h3 className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400">Size Calculator</h3>
              </div>

              <p className="text-[11px] text-[#8E8E8A] leading-relaxed">
                Enter your foot size in centimeters. We will recommend your standard high-comfort US footwear size.
              </p>

              <div className="bg-[#F5F5F4] rounded-2xl p-3 flex items-center gap-3">
                <div className="relative w-12 h-20 border border-dashed border-neutral-300 rounded-lg flex flex-col justify-between items-center text-[7px] text-neutral-400 p-1 shrink-0">
                  <span>Toes</span>
                  <div className="text-lg">🦶</div>
                  <span>Heel</span>
                </div>

                <div className="flex-1 space-y-1.5">
                  <span className="text-[9px] uppercase font-bold text-neutral-400">Length (CM)</span>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.1"
                      value={footLengthCm}
                      onChange={(e) => setFootLengthCm(e.target.value)}
                      placeholder="e.g. 24.5"
                      className="w-full bg-white border border-neutral-150 rounded-lg py-1.5 px-2.5 text-xs pr-8 focus:outline-none"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-neutral-400">CM</span>
                  </div>
                </div>
              </div>

              {recommendedSize && (
                <div className="bg-[#EBFDF5] border border-[#A7F3D0] rounded-xl p-2 text-center">
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#047857]">Calculated Size Match</span>
                  <p className="text-xs font-black text-[#065F46] mt-0.5">{recommendedSize}</p>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                {recommendedSize && (
                  <button 
                    onClick={() => {
                      setSelectedSize(recommendedSize);
                      setPreferredSize(recommendedSize.replace("US ", ""));
                      localStorage.setItem("comfort_pref_size", recommendedSize.replace("US ", ""));
                      setIsSizeGuideOpen(false);
                    }}
                    className="flex-1 py-2 bg-black hover:bg-neutral-900 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Select Calculated Size
                  </button>
                )}
                <button 
                  onClick={() => setIsSizeGuideOpen(false)}
                  className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING BOT NAV BAR */}
      {screen !== "onboarding" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4">
          <div className="bg-white/90 backdrop-blur-md border border-neutral-100 rounded-[28px] px-6 py-3 shadow-xl flex justify-between items-center text-neutral-400">
            
            {/* Home Feed Button */}
            <button 
              onClick={() => { setScreen("dashboard"); setActiveTab("home"); setSelectedProduct(null); }}
              className={`relative p-2.5 transition flex flex-col items-center justify-center cursor-pointer ${activeTab === "home" && screen === "dashboard" && !selectedProduct ? "text-white scale-105" : "hover:text-black"}`}
              title="Home Feed"
            >
              {activeTab === "home" && screen === "dashboard" && !selectedProduct && (
                <motion.div layoutId="navActiveBg" className="absolute inset-0 bg-black rounded-full" transition={{ type: "spring", stiffness: 350, damping: 28 }} />
              )}
              <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </button>

            {/* Store Catalog Button */}
            <button 
              onClick={() => { setScreen("dashboard"); setActiveTab("store"); setSelectedProduct(null); }}
              className={`relative p-2.5 transition flex flex-col items-center justify-center cursor-pointer ${activeTab === "store" && screen === "dashboard" && !selectedProduct ? "text-white scale-105" : "hover:text-black"}`}
              title="Comfort Store"
            >
              {activeTab === "store" && screen === "dashboard" && !selectedProduct && (
                <motion.div layoutId="navActiveBg" className="absolute inset-0 bg-black rounded-full" transition={{ type: "spring", stiffness: 350, damping: 28 }} />
              )}
              <SlidersHorizontal size={18} className="relative z-10" />
            </button>

            {/* Wishlist Button */}
            <button 
              onClick={() => { setScreen("dashboard"); setActiveTab("wishlist"); setSelectedProduct(null); }}
              className={`relative p-2.5 transition flex flex-col items-center justify-center cursor-pointer ${activeTab === "wishlist" && screen === "dashboard" && !selectedProduct ? "text-white scale-105" : "hover:text-black"}`}
              title="My Wishlist"
            >
              {activeTab === "wishlist" && screen === "dashboard" && !selectedProduct && (
                <motion.div layoutId="navActiveBg" className="absolute inset-0 bg-black rounded-full" transition={{ type: "spring", stiffness: 350, damping: 28 }} />
              )}
              <Heart size={18} fill={favorites.length > 0 ? (activeTab === "wishlist" && screen === "dashboard" && !selectedProduct ? "#ffffff" : "#ef4444") : "none"} className={`relative z-10 ${favorites.length > 0 && activeTab !== "wishlist" ? "text-rose-500" : ""}`} />
            </button>

            {/* Profile Button */}
            <button 
              onClick={() => { setScreen("dashboard"); setActiveTab("profile"); setSelectedProduct(null); }}
              className={`relative p-2.5 transition flex flex-col items-center justify-center cursor-pointer ${activeTab === "profile" && screen === "dashboard" && !selectedProduct ? "text-white scale-105" : "hover:text-black"}`}
              title="My Profile"
            >
              {activeTab === "profile" && screen === "dashboard" && !selectedProduct && (
                <motion.div layoutId="navActiveBg" className="absolute inset-0 bg-black rounded-full" transition={{ type: "spring", stiffness: 350, damping: 28 }} />
              )}
              <User size={18} className="relative z-10" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
