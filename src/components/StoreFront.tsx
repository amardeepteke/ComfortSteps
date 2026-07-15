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
  Filter,
  ChevronRight,
  Cloud,
  Gem,
  Truck,
  RotateCcw,
  Headphones,
  Sparkles,
  Copy,
  Share2,
  Star,
  Clock
} from "lucide-react";
import { Product, CartItem, Order, UserProfile, BannerSlide } from "../types";
import { loginWithGoogle, logoutUser, auth, db, handleFirestoreError, OperationType } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, doc, setDoc, updateDoc, onSnapshot, query, where } from "firebase/firestore";
import ComfortStepsLogo from "./ComfortStepsLogo";
import { 
  LogOut, 
  Settings, 
  QrCode, 
  Edit, 
  Trash2, 
  Lock,
  Compass,
  MoreVertical
} from "lucide-react";

const AVAILABLE_COUPONS = [
  { code: "WELCOME200", discount: 200, type: "fixed", desc: "Flat ₹200 off on your first footwear order" },
  { code: "GOLDSTORE", discount: 15, type: "percent", desc: "15% off on our ultra-premium luxury collection" },
  { code: "COMFORT50", discount: 50, type: "percent", desc: "Enjoy 50% discount on standard footwear styles" },
  { code: "LUXURY500", discount: 500, type: "fixed", desc: "Flat ₹500 off on purchases above ₹4,000" }
];

interface StoreFrontProps {
  products: Product[];
  orders?: Order[];
  onAddOrder: (order: Order) => void;
  onUpdateOrder?: (orderId: string, updatedFields: Partial<Order>) => void;
  onUpdateProducts?: (products: Product[]) => void;
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

export default function StoreFront({ products, orders = [], onAddOrder, onUpdateOrder, onUpdateProducts }: StoreFrontProps) {
  // Screen size detection state
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // Main view state: onboarding, dashboard, detail, cart, register, my_orders, privacy_policy, refund_policy, terms_and_conditions, contact_us
  const [screen, setScreen] = useState<"onboarding" | "dashboard" | "detail" | "cart" | "register" | "my_orders" | "privacy_policy" | "refund_policy" | "terms_and_conditions" | "contact_us">("onboarding");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
  const [profileSubView, setProfileSubView] = useState<"main" | "personal_info" | "address_info" | null>(null);

  // Contact Us state variables
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isMessageSent, setIsMessageSent] = useState(false);

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

  const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
    {
      id: "premium-elegance",
      tagline: "PREMIUM WOMEN'S FOOTWEAR",
      scriptText: "Step Into",
      title: "COMFORT & ELEGANCE",
      subtext: "Premium Footwear Crafted for Every Step You Take",
      ctaText: "SHOP NOW",
      imageUrl: "https://lh3.googleusercontent.com/d/1pBh6vEJCwByC2_DD0c9rE42MDbwrd8u5", 
      badgeText: "NEW COLLECTION 2026",
      bgGradient: "linear-gradient(to bottom right, #FCFAF5, #F4EEE8, #ECE4DB)"
    },
    {
      id: "luxury-wedges",
      tagline: "COUTURE COLLECTION",
      scriptText: "Walk In",
      title: "LUXURY & STYLE",
      subtext: "Elevate your style with handcrafted lightweight wedge sandals",
      ctaText: "EXPLORE COLLECTION",
      imageUrl: "https://lh3.googleusercontent.com/d/1yhXKS2ODpODTdlfTmQhgjdmFnkyPIU9w", 
      badgeText: "TRENDING NOW",
      bgGradient: "linear-gradient(to bottom right, #FAF8F5, #F1ECE3, #E8DEC6)"
    },
    {
      id: "all-day-comfort",
      tagline: "DAILY COMFORT ESSENTIALS",
      scriptText: "Feel The",
      title: "CLOUD COMFORT",
      subtext: "Ergonomic designs and extra cushion footbeds for active days",
      ctaText: "VIEW DAILY WEAR",
      imageUrl: "https://lh3.googleusercontent.com/d/1As3HJoUjLOTUJ3OffwCc-0_xTI9sCh4J", 
      badgeText: "BEST SELLER 2026",
      bgGradient: "linear-gradient(to bottom right, #F9F8F6, #F2EDE9, #EBE3DC)"
    }
  ];

  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>(() => {
    const saved = localStorage.getItem("comfort_banner_slides");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_BANNER_SLIDES;
  });

  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

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

  const [settings, setSettings] = useState<any>({
    privacyPolicyText: "Your privacy is important to us. We collect and use your data only to process orders and improve your shopping experience.",
    termsConditionsText: "By using our website, you agree to our terms of service. All orders are subject to availability and acceptance.",
    refundPolicyText: "If you are not fully satisfied with your purchase, you can return or exchange the items within 30 days of delivery. The products must be unworn and in their original packaging.",
    aboutUsText: "Welcome to Comfort Steps, where luxury meets unmatched comfort. We curate the finest footwear for women, crafted with passion and premium materials."
  });

  const [fetchedOrders, setFetchedOrders] = useState<Order[]>([]);

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

    // 4. Subscribe to Admin Settings Document
    const settingsDocRef = doc(db, "config", "settings");
    const unsubSettings = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings((prev: any) => ({
          ...prev,
          ...data
        }));
        if (data.homepageBannerTitle) {
          setBannerConfig(prev => ({
            ...prev,
            title: data.homepageBannerTitle || prev.title,
            imageUrl: data.homepageBannerImageUrl || prev.imageUrl,
            bgGradient: data.homepageBannerBgGradient || prev.bgGradient,
            tagline: data.homepageBannerTagline || prev.tagline
          }));
        }
      }
    }, (error) => {
      console.error("Firestore settings sync error:", error);
    });

    // 5. Subscribe to Banner Slides Carousel Config
    const bannerSliderDocRef = doc(db, "config", "banner_slider");
    const unsubBannerSlider = onSnapshot(bannerSliderDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.slides)) {
          setBannerSlides(data.slides);
          localStorage.setItem("comfort_banner_slides", JSON.stringify(data.slides));
        }
      } else {
        // Seed initial default slides
        setDoc(bannerSliderDocRef, { slides: DEFAULT_BANNER_SLIDES })
          .then(() => {
            localStorage.setItem("comfort_banner_slides", JSON.stringify(DEFAULT_BANNER_SLIDES));
          })
          .catch(err => console.log("Failed to seed banner slides config:", err));
      }
    }, (error) => {
      console.error("Firestore banner slides sync error:", error);
    });

    return () => {
      unsubOnboarding();
      unsubMerchant();
      unsubBanner();
      unsubSettings();
      unsubBannerSlider();
    };
  }, [db]);

  // Slide Carousel Auto-Rotation Hook (7s interval)
  useEffect(() => {
    if (bannerSlides.length <= 1) return;
    const slideTimer = setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % bannerSlides.length);
    }, 7000);
    return () => clearInterval(slideTimer);
  }, [bannerSlides.length]);

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

  // --- PREMIUM UPGRADED CHECKOUT & PRODUCT FLOW STATES ---
  const [detailQty, setDetailQty] = useState<number>(1);
  const [checkoutStep, setCheckoutStep] = useState<"review" | "login" | "address" | "summary" | "payment" | "success">("review");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("addr-1");
  const [couponInput, setCouponInput] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: "percent" | "fixed" } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [pincodeInput, setPincodeInput] = useState<string>("");
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState<number>(3);
  const [countdownStr, setCountdownStr] = useState<string>("02h 45m 12s");
  const [bundleChecked, setBundleChecked] = useState<boolean>(true);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState<boolean>(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [paymentVerifying, setPaymentVerifying] = useState<boolean>(false);
  const [orderDetailsModalId, setOrderDetailsModalId] = useState<string | null>(null);
  const [returnReplaceModalId, setReturnReplaceModalId] = useState<string | null>(null);
  const [returnActionType, setReturnActionType] = useState<"return" | "replace">("return");
  const [returnReason, setReturnReason] = useState<string>("");
  const [returnFeedback, setReturnFeedback] = useState<string | null>(null);
  
  // Custom Reviews State for dynamic addition or display
  const [productReviews, setProductReviews] = useState<{ [prodId: string]: any[] }>({});
  
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [expandedTrackOrderId, setExpandedTrackOrderId] = useState<string | null>(null);
  
  // Extra states for payment and location detection flows
  const [isPaymentFailed, setIsPaymentFailed] = useState<boolean>(false);
  const [selectedUpiApp, setSelectedUpiApp] = useState<string | null>(null);
  const [otherUpiId, setOtherUpiId] = useState<string>("");
  const [upiInputError, setUpiInputError] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [locationDetectionError, setLocationDetectionError] = useState<string | null>(null);

  // Address form fields
  const [addrForm, setAddrForm] = useState({
    fullName: "",
    phone: "",
    flatHouse: "",
    buildingName: "",
    area: "",
    locality: "",
    landmark: "",
    city: "",
    state: "",
    pinCode: "",
    alternatePhone: "",
    addressType: "Home" as "Home" | "Work"
  });

  // Dynamic Addresses list
  const [addresses, setAddresses] = useState<any[]>(() => {
    const saved = localStorage.getItem("comfort_addresses");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: "addr-1",
        firstName: "Vanish",
        lastName: "Teke",
        phone: "9876543210",
        flatHouse: "Penthouse 101, Luxury Enclave",
        area: "Koregaon Park",
        landmark: "Near Osho Ashram",
        city: "Pune",
        state: "Maharashtra",
        pinCode: "411001",
        isDefault: true
      },
      {
        id: "addr-2",
        firstName: "Omkar",
        lastName: "Teke",
        phone: "9988776655",
        flatHouse: "Flat 4B, Gold Crest Apartments",
        area: "Bandra West",
        landmark: "Opposite Taj Lands End",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400050",
        isDefault: false
      }
    ];
  });

  // Estimated delivery countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const target = new Date();
      target.setHours(18, 0, 0, 0); // Shipments leave at 6 PM
      if (now.getTime() > target.getTime()) {
        target.setDate(target.getDate() + 1);
      }
      const diff = target.getTime() - now.getTime();
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdownStr(`${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync addresses to localStorage
  useEffect(() => {
    localStorage.setItem("comfort_addresses", JSON.stringify(addresses));
  }, [addresses]);

  // Geolocation detector with reverse geocoding via OpenStreetMap Nominatim
  const detectLocation = () => {
    setIsDetectingLocation(true);
    setLocationDetectionError(null);

    const fallbackToDemoAddress = () => {
      setAddrForm(prev => ({
        ...prev,
        state: "Maharashtra",
        city: "Mumbai",
        area: "Bandra West",
        locality: "Pali Hill",
        pinCode: "400050"
      }));
      setIsDetectingLocation(false);
    };

    if (!navigator.geolocation) {
      fallbackToDemoAddress();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Fetch reverse geocoding from free OpenStreetMap Nominatim API
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: {
              "Accept-Language": "en"
            }
          });
          if (res.ok) {
            const data = await res.json();
            const address = data.address || {};
            
            const state = address.state || "Maharashtra";
            const city = address.city || address.town || address.village || address.suburb || "Mumbai";
            const suburb = address.suburb || address.neighbourhood || address.county || "Bandra West";
            const road = address.road || address.residential || "Pali Hill";
            const postcode = address.postcode || "400050";

            setAddrForm(prev => ({
              ...prev,
              state,
              city,
              area: suburb,
              locality: road,
              pinCode: postcode.replace(/[^0-9]/g, "").slice(0, 6)
            }));
          } else {
            fallbackToDemoAddress();
          }
        } catch (e) {
          fallbackToDemoAddress();
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        // Fallback gracefully if permissions are denied or timed out
        fallbackToDemoAddress();
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Firebase / Auth Sync
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseActive, setFirebaseActive] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Mouse Position for Premium Zoom-on-Hover Magnifier
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, show: false });

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

  // Real-time listener for the logged-in user's real orders
  useEffect(() => {
    if (!firebaseActive || !db) {
      // LocalStorage mode fallback
      const localOrders = localStorage.getItem("footwear_orders");
      if (localOrders) {
        try {
          const parsed = JSON.parse(localOrders) as Order[];
          const email = currentUser?.email || profileEmail;
          if (email) {
            setFetchedOrders(parsed.filter((ord: any) => ord.customerEmail?.toLowerCase() === email.toLowerCase()));
          } else {
            setFetchedOrders([]);
          }
        } catch (e) {
          setFetchedOrders([]);
        }
      } else {
        setFetchedOrders([]);
      }
      return;
    }

    const email = currentUser?.email || profileEmail;
    if (!email) {
      setFetchedOrders([]);
      return;
    }

    // Fetch ONLY the logged-in user's real orders from the database
    const ordersQuery = query(
      collection(db, "orders"),
      where("customerEmail", "==", email.toLowerCase())
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const orderList: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        orderList.push({ id: docSnap.id, ...data } as Order);
      });
      // Sort orders by date descending
      setFetchedOrders(orderList.sort((a, b) => new Date(b.createdAt).getTime() - a.createdAt.localeCompare(b.createdAt)));
    }, (error) => {
      console.error("Error fetching user's real orders from database:", error);
    });

    return () => unsubscribe();
  }, [currentUser?.email, profileEmail, firebaseActive]);

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

  // Save basic profile settings
  const handleSaveBasicProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    
    localStorage.setItem("comfort_pref_name", profileName);
    localStorage.setItem("comfort_pref_email", profileEmail);
    localStorage.setItem("comfort_pref_size", preferredSize);

    setTimeout(() => {
      setIsSavingProfile(false);
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
      setProfileSubView("main");
      setActiveProfileSection(null);
    }, 800);
  };

  // Save address settings
  const handleSaveAddressProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    
    // Compose combined address string
    const composedAddr = `${addrFlatHouse}, ${addrArea}, ${addrLandmark ? addrLandmark + ', ' : ''}${addrCity} - ${addrPinCode}`;
    const composedName = `${addrFirstName} ${addrLastName}`;
    
    setProfileName(composedName);
    setProfilePhone(addrPhone);
    setProfileAddress(composedAddr);

    localStorage.setItem("comfort_pref_name", composedName);
    localStorage.setItem("comfort_pref_phone", addrPhone);
    localStorage.setItem("comfort_pref_addr", composedAddr);

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
      setProfileSubView("main");
      setActiveProfileSection(null);
    }, 800);
  };

  // Save profile settings
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileSubView === "personal_info" || activeProfileSection === "profile") {
      handleSaveBasicProfile(e);
    } else {
      handleSaveAddressProfile(e);
    }
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

  // Color Name to Hex Mapping
  const getColorHex = (colorName: string): string => {
    const mapping: { [key: string]: string } = {
      nude: "#E8C3A7",
      brown: "#8B5A2B",
      black: "#000000",
      white: "#FFFFFF",
      pink: "#FFC0CB",
      red: "#FF0000",
      blue: "#0000FF",
      green: "#008000",
      grey: "#808080",
      gray: "#808080",
      beige: "#F5F5DC",
      tan: "#D2B48C",
      yellow: "#FFFF00",
      navy: "#000080",
      gold: "#FFD700",
      silver: "#C0C0C0"
    };
    const normalized = colorName.trim().toLowerCase();
    if (normalized.startsWith("#")) return normalized;
    return mapping[normalized] || colorName;
  };

  // Helper to safely get the current default/representative price and image for a product
  const getProductDisplayProps = (prod: Product) => {
    if (prod.variants && prod.variants.length > 0) {
      const first = prod.variants[0];
      const thumbnail = first.colourThumbnail || (first.images && first.images.length > 0 ? first.images[0] : prod.images[0]);
      const price = first.sellingPrice !== undefined ? first.sellingPrice : (first.price !== undefined ? first.price : prod.price);
      const originalPrice = first.mrp !== undefined ? first.mrp : (first.originalPrice !== undefined ? first.originalPrice : prod.originalPrice);
      return {
        image: thumbnail,
        price,
        originalPrice
      };
    }
    return {
      image: prod.images[0],
      price: prod.price,
      originalPrice: prod.originalPrice
    };
  };

  // View Product Detail
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setActiveImageIdx(0);
    
    const initialColor = product.variants && product.variants.length > 0 
      ? (product.variants[0].colourName || product.variants[0].color || "") 
      : (product.colors && product.colors[0]) || "";
    
    setSelectedColor(initialColor);
    
    const initialVariant = product.variants?.find(
      v => (v.colourName || v.color || "").toLowerCase() === initialColor.toLowerCase()
    );
    const initialSizes = initialVariant?.sizes && initialVariant.sizes.length > 0
      ? initialVariant.sizes
      : product.sizes;
      
    setSelectedSize(initialSizes[0] || "");
    addToRecentViewed(product.id);
    setScreen("detail");
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setActiveImageIdx(0);
    
    if (selectedProduct) {
      const newVariant = selectedProduct.variants?.find(
        v => (v.colourName || v.color || "").toLowerCase() === color.toLowerCase()
      );
      const newSizes = newVariant?.sizes && newVariant.sizes.length > 0 
        ? newVariant.sizes 
        : selectedProduct.sizes || [];
        
      if (newSizes.length > 0) {
        if (!newSizes.includes(selectedSize)) {
          setSelectedSize(newSizes[0]);
        }
      } else {
        setSelectedSize("");
      }
    }
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
  const addToCart = (e?: React.MouseEvent<HTMLButtonElement>, customQty: number = 1) => {
    if (!selectedProduct) return;
    if (!checkAuthBeforeAction("detail")) return;

    const sizeToUse = selectedSize || selectedProduct.sizes[0] || "Standard";
    const colorToUse = selectedColor || selectedProduct.colors[0] || "Standard";

    // Find the active variant
    const activeVariant = selectedProduct.variants?.find(
      v => (v.colourName || v.color || "").toLowerCase() === colorToUse.toLowerCase()
    );

    // Dynamic variant values
    const displayImages = activeVariant?.images && activeVariant.images.length > 0 
      ? activeVariant.images 
      : selectedProduct.images;
    
    const displayPrice = activeVariant?.sellingPrice !== undefined 
      ? activeVariant.sellingPrice 
      : (activeVariant?.price !== undefined ? activeVariant.price : selectedProduct.price);

    const displayOriginalPrice = activeVariant?.mrp !== undefined 
      ? activeVariant.mrp 
      : (activeVariant?.originalPrice !== undefined ? activeVariant.originalPrice : selectedProduct.originalPrice);

    const displayDescription = activeVariant?.description 
      ? activeVariant.description 
      : selectedProduct.description;

    const displaySizes = activeVariant?.sizes && activeVariant.sizes.length > 0 
      ? activeVariant.sizes 
      : selectedProduct.sizes;

    // Trigger flying shoe animation using correct variant image
    if (e) {
      const buttonRect = e.currentTarget.getBoundingClientRect();
      const newItem: FlyingItem = {
        id: nextFlyingId,
        startX: buttonRect.left + buttonRect.width / 2,
        startY: buttonRect.top + buttonRect.height / 2,
        image: displayImages[0] || selectedProduct.images[0]
      };
      setFlyingItems(prev => [...prev, newItem]);
      setNextFlyingId(prev => prev + 1);

      setTimeout(() => {
        setFlyingItems(prev => prev.filter(item => item.id !== newItem.id));
        setCartWiggle(true);
        setTimeout(() => setCartWiggle(false), 500);
      }, 900);
    }

    const modifiedProduct: Product = {
      ...selectedProduct,
      price: displayPrice,
      originalPrice: displayOriginalPrice,
      description: displayDescription,
      images: displayImages,
      sizes: displaySizes,
    };

    const existingIdx = cart.findIndex(
      item => item.product.id === selectedProduct.id && 
              item.selectedSize === sizeToUse && 
              item.selectedColor === colorToUse
    );

    if (existingIdx > -1) {
      const updated = [...cart];
      updated[existingIdx].quantity += customQty;
      updated[existingIdx].product = modifiedProduct;
      setCart(updated);
    } else {
      setCart(prev => [
        ...prev,
        {
          product: modifiedProduct,
          quantity: customQty,
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
      customerEmail: (checkoutEmail || profileEmail || "vanish@ssense.com").trim().toLowerCase(),
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

    await reduceProductStock(cart.map(i => ({ product: i.product, quantity: i.quantity, selectedColor: i.selectedColor, selectedSize: i.selectedSize })));
    onAddOrder(newOrder);

    setPlacedOrderId(newOrder.id);
    setLastPlacedOrder(newOrder);
    setIsOrderSuccess(true);
    setCart([]);
    setIsCheckoutOpen(false);
  };

  // Reduce stock quantity after successful placement
  const reduceProductStock = async (items: any[]) => {
    const updatedProducts = products.map(prod => {
      const match = items.find(item => item.product.id === prod.id);
      if (match) {
        if (prod.variants && prod.variants.length > 0) {
          const updatedVariants = prod.variants.map(v => {
            const vColor = v.colourName || v.color || "";
            if (vColor.toLowerCase() === match.selectedColor.toLowerCase()) {
              if (v.sizeStocks && v.sizeStocks.length > 0) {
                const updatedSizeStocks = v.sizeStocks.map(sz => {
                  if (sz.size === match.selectedSize) {
                    return { ...sz, stock: Math.max(0, sz.stock - match.quantity) };
                  }
                  return sz;
                });
                return { ...v, sizeStocks: updatedSizeStocks, stockQuantity: Math.max(0, (v.stockQuantity || 0) - match.quantity) };
              } else {
                return { ...v, stockQuantity: Math.max(0, (v.stockQuantity || 0) - match.quantity) };
              }
            }
            return v;
          });
          return { ...prod, variants: updatedVariants };
        } else {
          if (prod.stockQuantity !== undefined) {
            return { ...prod, stockQuantity: Math.max(0, prod.stockQuantity - match.quantity) };
          }
        }
      }
      return prod;
    });

    if (onUpdateProducts) {
      onUpdateProducts(updatedProducts);
    }
    localStorage.setItem("footwear_products", JSON.stringify(updatedProducts));

    if (db) {
      for (const item of items) {
        try {
          const prodRef = doc(db, "products", item.product.id);
          const updatedP = updatedProducts.find(p => p.id === item.product.id);
          if (updatedP) {
            await setDoc(prodRef, updatedP, { merge: true });
          }
        } catch (err) {
          console.error("Failed to reduce stock in Firestore", err);
        }
      }
    }
  };

  // Reorder premium flow handler
  const handleReorder = (ord: Order) => {
    const updatedCart = [...cart];
    ord.items.forEach(item => {
      const existsIdx = updatedCart.findIndex(
        i => i.product.id === item.product.id && 
             i.selectedSize === item.selectedSize && 
             i.selectedColor === item.selectedColor
      );
      if (existsIdx > -1) {
        updatedCart[existsIdx].quantity += item.quantity;
      } else {
        updatedCart.push({
          product: item.product,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          quantity: item.quantity
        });
      }
    });
    setCart(updatedCart);
    setIsCheckoutOpen(true);
    setCheckoutStep("address");
    setScreen("cart");
    alert("Reorder Success: Footwear added back to your cart! Redirecting to secure checkout.");
  };

  // Place premium order using advanced multi-step checkout
  const handlePlacePremiumOrder = async (
    payMethod: "COD" | "UPI", 
    upiAppUsed?: string, 
    upiIdUsed?: string, 
    customPaymentId?: string
  ) => {
    if (cart.length === 0) return;

    const activeAddress = addresses.find(a => a.id === selectedAddressId) || addresses[0] || {
      fullName: profileName || "Vanish Teke",
      firstName: "Vanish",
      lastName: "Teke",
      phone: profilePhone || "9876543210",
      flatHouse: "Penthouse 101, Luxury Enclave",
      buildingName: "",
      area: "Koregaon Park",
      locality: "",
      landmark: "Near Osho Ashram",
      city: "Pune",
      state: "Maharashtra",
      pinCode: "411001",
      alternatePhone: "",
      addressType: "Home"
    };

    const name = activeAddress.fullName || `${activeAddress.firstName || ""} ${activeAddress.lastName || ""}`.trim();
    const bld = activeAddress.buildingName ? `, ${activeAddress.buildingName}` : "";
    const altP = activeAddress.alternatePhone ? `, Alt Phone: ${activeAddress.alternatePhone}` : "";
    const typeLabel = activeAddress.addressType ? ` [${activeAddress.addressType}]` : "";
    const loc = activeAddress.locality ? `, Locality: ${activeAddress.locality}` : "";
    const shippingAddrStr = `${name}, ${activeAddress.flatHouse}${bld}, ${activeAddress.area}${loc}, Landmark: ${activeAddress.landmark || "N/A"}, ${activeAddress.city}, ${activeAddress.state} - ${activeAddress.pinCode}${altP}${typeLabel}`;

    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    
    let couponDsc = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === "percent") {
        couponDsc = Math.round((subtotal * appliedCoupon.discount) / 100);
      } else {
        couponDsc = appliedCoupon.discount;
      }
    }

    const shipping = subtotal >= 2999 ? 0 : 150;
    // Add Protect Promise / Premium packaging fee
    const packagingFee = 49; 
    const codFee = payMethod === "COD" ? 50 : 0;
    const totalToPay = subtotal - couponDsc + shipping + packagingFee + codFee;

    // Set or sync guest user tracking email
    let trackingEmail = (currentUser?.email || profileEmail || "").trim();
    if (!trackingEmail) {
      const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const phoneDigits = activeAddress.phone.slice(-4);
      trackingEmail = `${sanitizedName}${phoneDigits}@comfortsteps.com`;
      setProfileEmail(trackingEmail);
      localStorage.setItem("comfort_pref_email", trackingEmail);
    }

    const generatedPaymentId = customPaymentId || (payMethod === "UPI" ? `PAY-CS-${Math.floor(100000 + Math.random() * 900000)}` : "");

    const newOrder: Order = {
      id: `CS-ORDER-${Math.floor(10000 + Math.random() * 90000)}`,
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
      totalAmount: totalToPay,
      customerName: name,
      customerEmail: trackingEmail.toLowerCase(),
      customerPhone: activeAddress.phone,
      shippingAddress: shippingAddrStr,
      status: "Pending",
      createdAt: new Date().toISOString(),
      paymentMethod: payMethod === "COD" ? "COD" : (upiAppUsed || "UPI"),
      paymentId: generatedPaymentId || undefined,
      paymentStatus: payMethod === "COD" ? "Pending" : "Paid",
      alternatePhone: activeAddress.alternatePhone || undefined,
      addressType: activeAddress.addressType as "Home" | "Work" || undefined
    };

    if (payMethod === "UPI") {
      setPaymentVerifying(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPaymentVerifying(false);
    }

    if (db) {
      try {
        await addDoc(collection(db, "orders"), newOrder);
      } catch (err) {
        console.error("Firestore premium order saving error", err);
      }
    }

    await reduceProductStock(cart);
    onAddOrder(newOrder);

    setPlacedOrderId(newOrder.id);
    setLastPlacedOrder(newOrder);
    setCheckoutStep("success");
    setCart([]);
    setAppliedCoupon(null);
    setCouponInput("");
  };

  const handleUpdateOrder = async (orderId: string, updatedFields: Partial<Order>) => {
    // 1. Instantly update local state for real-time responsiveness
    setFetchedOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updatedFields } : o));

    // 2. Propagate to parent state if available
    if (onUpdateOrder) {
      await onUpdateOrder(orderId, updatedFields);
    }
    
    // 3. Persist to database or localStorage
    if (db) {
      try {
        await updateDoc(doc(db, "orders", orderId), updatedFields);
      } catch (err) {
        console.error("Firestore order update error", err);
      }
    } else {
      const localOrders = localStorage.getItem("footwear_orders");
      if (localOrders) {
        try {
          const parsed = JSON.parse(localOrders) as Order[];
          const updated = parsed.map(o => o.id === orderId ? { ...o, ...updatedFields } : o);
          localStorage.setItem("footwear_orders", JSON.stringify(updated));
        } catch (e) {
          console.error("LocalStorage update order error", e);
        }
      }
    }
  };

  const downloadInvoice = (ord: Order) => {
    const subtotal = ord.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const estimatedDiscount = Math.max(0, subtotal - ord.totalAmount + (subtotal >= 2999 ? 0 : 150) + (ord.paymentMethod === "COD" ? 50 : 0));
    const shipping = subtotal >= 2999 ? 0 : 150;
    const gstAmount = Math.round(ord.totalAmount * 0.18);

    const invoiceContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice - ${ord.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap');
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 40px;
      background-color: #FAFAF9;
      color: #1C1917;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E7E5E4;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #E7E5E4;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .brand {
      text-align: left;
    }
    .brand h1 {
      font-family: 'Playfair Display', serif;
      font-size: 26px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.01em;
      color: #1C1917;
    }
    .brand p {
      font-size: 10px;
      font-weight: 700;
      color: #BC9D4E;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin: 4px 0 0 0;
    }
    .meta-info {
      text-align: right;
    }
    .meta-info h2 {
      font-size: 15px;
      font-weight: 800;
      margin: 0 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #1C1917;
    }
    .meta-info p {
      font-size: 11px;
      color: #78716C;
      margin: 3px 0;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
      text-align: left;
    }
    .section-title {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #A8A29E;
      margin-bottom: 8px;
      border-bottom: 1px solid #F5F5F4;
      padding-bottom: 4px;
    }
    .details-box p {
      font-size: 12px;
      line-height: 1.5;
      margin: 3px 0;
    }
    .details-box strong {
      color: #1C1917;
      font-weight: 600;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
      text-align: left;
    }
    .items-table th {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #78716C;
      background: #FAFAF9;
      padding: 10px 14px;
      border-bottom: 2px solid #E7E5E4;
    }
    .items-table td {
      padding: 14px;
      border-bottom: 1px solid #F5F5F4;
      font-size: 12px;
    }
    .item-desc h4 {
      margin: 0 0 3px 0;
      font-weight: 700;
      font-size: 13px;
      color: #1C1917;
    }
    .item-desc p {
      margin: 0;
      font-size: 10.5px;
      color: #78716C;
    }
    .totals-container {
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      width: 280px;
      font-size: 12px;
      border-top: 2px solid #E7E5E4;
      padding-top: 12px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .totals-row.grand-total {
      font-size: 14px;
      font-weight: 800;
      color: #1C1917;
      border-top: 1px solid #E7E5E4;
      padding-top: 10px;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      border-top: 1px solid #F5F5F4;
      padding-top: 20px;
      font-size: 10.5px;
      color: #78716C;
      line-height: 1.5;
    }
    @media print {
      body { background-color: #FFFFFF; padding: 0; }
      .invoice-card { border: none; padding: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="brand">
        <h1>Comfort Steps</h1>
        <p>Luxury Footwear Experience</p>
      </div>
      <div class="meta-info">
        <h2>Tax Invoice</h2>
        <p><strong>Invoice No:</strong> CS-INV-${ord.id.replace('CS-ORDER-', '')}</p>
        <p><strong>Date:</strong> ${new Date(ord.createdAt).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p><strong>Payment Status:</strong> Paid (via ${ord.paymentMethod === 'COD' ? 'Cash on Delivery' : 'UPI Instant'})</p>
      </div>
    </div>

    <div class="details-grid">
      <div class="details-box">
        <div class="section-title">Billed To</div>
        <p>
          <strong>${ord.customerName}</strong><br>
          ${ord.customerEmail}<br>
          Phone: ${ord.customerPhone}
        </p>
      </div>
      <div class="details-box">
        <div class="section-title">Delivery Details</div>
        <p>
          ${ord.shippingAddress}
        </p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 50%;">Product Details</th>
          <th style="width: 15%; text-align: right;">Price</th>
          <th style="width: 15%; text-align: center;">Qty</th>
          <th style="width: 20%; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${ord.items.map(item => `
          <tr>
            <td>
              <div class="item-desc">
                <h4>${item.product.name}</h4>
                <p>Brand: ${item.product.brand} | Size: ${item.selectedSize} | Color: ${item.selectedColor}</p>
              </div>
            </td>
            <td style="text-align: right;">₹${item.product.price}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right; font-weight: 600;">₹${item.product.price * item.quantity}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals-container">
      <div class="totals-box">
        <div class="totals-row">
          <span>Cart Subtotal</span>
          <span>₹${subtotal}</span>
        </div>
        ${estimatedDiscount > 0 ? `
          <div class="totals-row" style="color: #059669; font-weight: 600;">
            <span>Promotional Discount</span>
            <span>- ₹${estimatedDiscount}</span>
          </div>
        ` : ''}
        <div class="totals-row">
          <span>Shipping & Handling</span>
          <span style="color: ${shipping === 0 ? '#059669' : '#1C1917'}; font-weight: ${shipping === 0 ? '600' : '400'};">
            ${shipping === 0 ? 'FREE' : '₹' + shipping}
          </span>
        </div>
        <div class="totals-row">
          <span>Taxes (Estimated CGST/SGST 18%)</span>
          <span>₹${gstAmount}</span>
        </div>
        <div class="totals-row grand-total">
          <span>Grand Total Paid</span>
          <span>₹${ord.totalAmount}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p style="font-weight: 700; color: #1C1917; margin-bottom: 5px;">Thank you for your purchase!</p>
      <p>For support, contact care@comfortsteps.com. Experience luxury & step into comfort.</p>
      <p style="color: #BC9D4E; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 10px;">Comfort Steps • Handcrafted Luxury Footwear</p>
    </div>
  </div>
</body>
</html>`;

    const element = document.createElement("a");
    const file = new Blob([invoiceContent], { type: "text/html" });
    element.href = URL.createObjectURL(file);
    element.download = `Invoice_${ord.id}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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

  const myOrders = (orders && orders.length > 0 ? orders : fetchedOrders).filter(o => {
    const email = currentUser?.email || profileEmail;
    if (!email) return false;
    return o.customerEmail?.toLowerCase() === email.toLowerCase();
  });

  return (
    <div id="storefront-root" className={`min-h-screen bg-[#FBFBFA] text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white ${isDesktop ? "pb-12" : "pb-32"}`}>
      
      {/* PREMIUM DESKTOP & TABLET HEADER */}
      {screen !== "onboarding" && !isMobile && (
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-100 shadow-xs">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
            
            {/* Logo */}
            <div className="flex items-center gap-10">
              <button 
                onClick={() => {
                  setScreen("dashboard");
                  setActiveTab("home");
                  setSelectedProduct(null);
                }}
                className="cursor-pointer"
              >
                <ComfortStepsLogo size="sm" />
              </button>

              {/* Navigation Categories/Tabs */}
              <nav className="flex items-center gap-6">
                {[
                  { id: "home", label: "Home" },
                  { id: "store", label: "Store" },
                  { id: "wishlist", label: "Wishlist" },
                  { id: "orders", label: "Orders" },
                  { id: "profile", label: "Profile" }
                ].map((tab) => {
                  const isActive = (tab.id === "orders" && screen === "my_orders") || (tab.id !== "orders" && screen === "dashboard" && activeTab === tab.id && !selectedProduct);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        if (tab.id === "orders") {
                          setScreen("my_orders");
                          setSelectedProduct(null);
                        } else {
                          setScreen("dashboard");
                          setActiveTab(tab.id);
                          setSelectedProduct(null);
                        }
                      }}
                      className={`text-xs uppercase font-extrabold tracking-widest relative py-2 cursor-pointer transition ${
                        isActive ? "text-neutral-900" : "text-neutral-400 hover:text-black"
                      }`}
                    >
                      {tab.label}
                      {isActive && (
                        <motion.div 
                          layoutId="desktopNavUnderline" 
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                        />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Search input inside header */}
            <div className="flex-1 max-w-md relative hidden md:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={15} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setScreen("dashboard");
                  setActiveTab("store");
                  setSelectedProduct(null);
                }}
                placeholder="Search premium comfort footwear..."
                className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-black transition"
              />
            </div>

            {/* Actions: Wishlist, Cart, Profile */}
            <div className="flex items-center gap-4.5">
              {/* Wishlist Button */}
              <button 
                onClick={() => {
                  setScreen("dashboard");
                  setActiveTab("wishlist");
                  setSelectedProduct(null);
                }}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition relative cursor-pointer ${
                  screen === "dashboard" && activeTab === "wishlist"
                    ? "bg-black border-black text-white"
                    : "bg-white border-neutral-150 text-neutral-700 hover:bg-neutral-50"
                }`}
                title="Saved Items"
              >
                <Heart size={16} fill={favorites.length > 0 ? (screen === "dashboard" && activeTab === "wishlist" ? "#ffffff" : "#ef4444") : "none"} className={favorites.length > 0 && activeTab !== "wishlist" ? "text-rose-500" : ""} />
                {favorites.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#E2583E] text-white text-[8.5px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {favorites.length}
                  </span>
                )}
              </button>

              {/* Shopping Cart Button */}
              <button 
                onClick={() => {
                  setScreen("cart");
                  setSelectedProduct(null);
                }}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition relative cursor-pointer ${
                  screen === "cart"
                    ? "bg-black border-black text-white"
                    : "bg-white border-neutral-150 text-neutral-700 hover:bg-neutral-50"
                }`}
                title="My Cart"
              >
                <ShoppingBag size={16} />
                {cart.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-neutral-900 text-white text-[8.5px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>

              {/* Divider */}
              <div className="h-6 w-px bg-neutral-200" />

              {/* Profile Card Summary */}
              <button
                onClick={() => {
                  setScreen("dashboard");
                  setActiveTab("profile");
                  setSelectedProduct(null);
                }}
                className="flex items-center gap-2.5 text-left pl-1.5 cursor-pointer group"
              >
                <img 
                  src={profilePic} 
                  alt="" 
                  className="w-8 h-8 rounded-full border border-neutral-150 object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="hidden lg:block">
                  <p className="text-[10px] uppercase font-extrabold text-neutral-400 tracking-wider leading-none font-sans">Account</p>
                  <p className="text-xs font-black text-neutral-800 group-hover:text-black leading-tight mt-0.5 max-w-[100px] truncate">
                    {currentUser ? (profileName || "Buyer") : "Sign In"}
                  </p>
                </div>
              </button>
            </div>

          </div>
        </header>
      )}

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
            className="max-w-md md:max-w-3xl lg:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-12"
          >
            {/* Header: Three-dot Menu, Name, Bell and Cart */}
            <div id="dashboard-header" className="flex lg:hidden justify-between items-center mb-6 relative">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="w-11 h-11 rounded-full ring-4 ring-neutral-100 bg-white border border-neutral-150 flex items-center justify-center text-neutral-700 cursor-pointer hover:bg-neutral-50 transition duration-200"
                    title="Menu"
                  >
                    <MoreVertical size={18} />
                  </button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <>
                        {/* Overlay to close menu */}
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsMenuOpen(false)}
                        />
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 mt-2 w-56 bg-white border border-neutral-100 rounded-3xl shadow-2xl py-3 z-50 text-left overflow-hidden"
                        >
                          <div className="px-4 py-1.5 border-b border-neutral-50 mb-1.5">
                            <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-extrabold block">Navigation</span>
                          </div>

                          <button
                            onClick={() => {
                              setScreen("dashboard");
                              setActiveTab("home");
                              setSelectedProduct(null);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-xs font-bold transition flex items-center gap-3 ${
                              screen === "dashboard" && activeTab === "home" && !selectedProduct
                                ? "bg-neutral-900 text-white" 
                                : "text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                            </svg>
                            Home
                          </button>
                          
                          <button
                            onClick={() => {
                              setScreen("dashboard");
                              setActiveTab("store");
                              setSelectedProduct(null);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-xs font-bold transition flex items-center gap-3 ${
                              screen === "dashboard" && activeTab === "store" && !selectedProduct
                                ? "bg-neutral-900 text-white" 
                                : "text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            <SlidersHorizontal size={16} className="shrink-0 text-current" />
                            Categories
                          </button>
                          
                          <button
                            onClick={() => {
                              setScreen("my_orders");
                              setSelectedProduct(null);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-xs font-bold transition flex items-center gap-3 ${
                              screen === "my_orders"
                                ? "bg-neutral-900 text-white" 
                                : "text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            <Package size={16} className="shrink-0 text-current" />
                            My Orders
                          </button>

                          <button
                            onClick={() => {
                              setScreen("dashboard");
                              setActiveTab("wishlist");
                              setSelectedProduct(null);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-xs font-bold transition flex items-center gap-3 ${
                              screen === "dashboard" && activeTab === "wishlist" && !selectedProduct
                                ? "bg-neutral-900 text-white" 
                                : "text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            <Heart size={16} className="shrink-0 text-current" />
                            Wishlist
                          </button>

                          <button
                            onClick={() => {
                              setScreen("cart");
                              setIsMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-xs font-bold transition flex items-center gap-3 ${
                              screen === "cart"
                                ? "bg-neutral-900 text-white" 
                                : "text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            <ShoppingBag size={16} className="shrink-0 text-current" />
                            Cart
                          </button>

                          <div className="px-4 py-1.5 border-t border-neutral-50 my-1">
                            <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-extrabold block">Legal & Info</span>
                          </div>
                          
                          <button
                            onClick={() => {
                              setScreen("privacy_policy");
                              setSelectedProduct(null);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-xs font-bold transition flex items-center gap-3 ${
                              screen === "privacy_policy"
                                ? "bg-neutral-900 text-white" 
                                : "text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            <ShieldCheck size={16} className="shrink-0 text-current" />
                            Privacy Policy
                          </button>
                          
                          <button
                            onClick={() => {
                              setScreen("refund_policy");
                              setSelectedProduct(null);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-xs font-bold transition flex items-center gap-3 ${
                              screen === "refund_policy"
                                ? "bg-neutral-900 text-white" 
                                : "text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            <Sliders size={16} className="shrink-0 text-current" />
                            Refund Policy
                          </button>

                          <button
                            onClick={() => {
                              setScreen("terms_and_conditions");
                              setSelectedProduct(null);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-xs font-bold transition flex items-center gap-3 ${
                              screen === "terms_and_conditions"
                                ? "bg-neutral-900 text-white" 
                                : "text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            <svg className="w-4 h-4 shrink-0 text-current" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            Terms & Conditions
                          </button>

                          <button
                            onClick={() => {
                              setScreen("contact_us");
                              setSelectedProduct(null);
                              setIsMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-xs font-bold transition flex items-center gap-3 ${
                              screen === "contact_us"
                                ? "bg-neutral-900 text-white" 
                                : "text-neutral-700 hover:bg-neutral-50"
                            }`}
                          >
                            <Mail size={16} className="shrink-0 text-current" />
                            Contact Us
                          </button>

                          {currentUser && (
                            <>
                              <div className="border-t border-neutral-50 my-1" />
                              <button
                                onClick={() => {
                                  handleLogout();
                                  setIsMenuOpen(false);
                                  setScreen("dashboard");
                                  setActiveTab("home");
                                }}
                                className="w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-3"
                              >
                                <LogOut size={16} className="shrink-0 text-red-600" />
                                Logout
                              </button>
                            </>
                          )}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

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
                    <div className="relative md:hidden">
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

                    {/* PREMIUM LUXURY MULTI-BANNER SLIDER CAROUSEL */}
                    <div className="relative w-full rounded-[32px] overflow-hidden group shadow-xs">
                      <div className="relative min-h-[440px] md:min-h-[480px] lg:min-h-[520px] w-full flex items-center overflow-hidden">
                        <AnimatePresence mode="wait">
                          {bannerSlides.map((slide, sIdx) => {
                            if (sIdx !== activeSlideIdx) return null;
                            return (
                              <motion.div
                                key={slide.id || sIdx}
                                initial={{ opacity: 0, x: 45 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -45 }}
                                transition={{ type: "tween", ease: "easeInOut", duration: 0.45 }}
                                className="absolute inset-0 w-full h-full grid grid-cols-1 lg:grid-cols-12 items-center text-neutral-900 overflow-hidden"
                                style={{ background: slide.bgGradient || "linear-gradient(to bottom right, #FCFAF5, #F4EEE8, #ECE4DB)" }}
                              >
                                {/* Left Side: Branding, Typography, Action CTA */}
                                <div className="lg:col-span-6 flex flex-col justify-center text-left py-10 md:py-14 pl-6 md:pl-12 lg:pl-16 pr-6 z-10 select-none">
                                  {/* CS Monogram Logo Badge */}
                                  <div className="flex flex-col items-start mb-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-10 h-10 rounded-full border border-[#D4AF37] flex items-center justify-center bg-white/60 shadow-2xs">
                                        <span className="font-serif text-[11px] font-black tracking-normal text-[#BC9D4E]">CS</span>
                                      </div>
                                      <div className="flex flex-col items-start justify-center">
                                        <h3 className="font-serif text-[12px] font-black tracking-[0.2em] text-neutral-900 leading-tight">COMFORT STEPS</h3>
                                        <p className="text-[7.5px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Premium Women's Footwear</p>
                                      </div>
                                    </div>
                                    {/* Thin divider under branding */}
                                    <div className="flex items-center gap-2 w-full max-w-[220px] mt-2.5">
                                      <div className="h-[0.5px] bg-neutral-200 flex-1" />
                                      <span className="text-[7.5px] text-[#A68F5B] font-extrabold tracking-widest uppercase">EST. 2026</span>
                                      <div className="h-[0.5px] bg-neutral-200 flex-1" />
                                    </div>
                                  </div>

                                  {/* Headline with handwritten script pairing */}
                                  <div className="space-y-1.5 mt-2">
                                    <span className="font-script text-3xl md:text-4xl lg:text-[42px] text-[#BC9D4E] block font-normal tracking-wide capitalize leading-none mb-1">
                                      {slide.scriptText || "Step Into"}
                                    </span>
                                    <h2 className="font-display font-black text-2xl md:text-4xl lg:text-[46px] text-neutral-900 tracking-tight leading-[1.05] uppercase">
                                      {slide.title || "COMFORT & ELEGANCE"}
                                    </h2>
                                  </div>

                                  {/* Subtext description */}
                                  <p className="text-xs md:text-sm text-neutral-500 font-medium leading-relaxed max-w-sm mt-3">
                                    {slide.subtext || "Premium Footwear Crafted for Every Step You Take"}
                                  </p>

                                  {/* Horizontal Feature Badges */}
                                  <div className="flex flex-wrap items-center gap-2 mt-5">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-150/80 bg-white/65 text-neutral-800 text-[8.5px] font-extrabold tracking-wider shadow-3xs">
                                      <Cloud size={10.5} className="text-[#BC9D4E]" />
                                      <span>ALL DAY COMFORT</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-150/80 bg-white/65 text-neutral-800 text-[8.5px] font-extrabold tracking-wider shadow-3xs">
                                      <Gem size={10.5} className="text-[#BC9D4E]" />
                                      <span>PREMIUM QUALITY</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-150/80 bg-white/65 text-neutral-800 text-[8.5px] font-extrabold tracking-wider shadow-3xs">
                                      <ShieldCheck size={10.5} className="text-[#BC9D4E]" />
                                      <span>DURABLE & STYLISH</span>
                                    </div>
                                  </div>

                                  {/* CTA Action Button */}
                                  <button
                                    onClick={() => {
                                      setActiveTab("store");
                                      setSelectedCategory("All");
                                    }}
                                    className="bg-neutral-950 hover:bg-black text-white hover:text-[#D4AF37] font-sans font-extrabold text-[11px] uppercase tracking-wider px-7 py-3.5 rounded-full transition-all shadow-md cursor-pointer inline-flex items-center gap-2 mt-7 w-fit hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                                  >
                                    <span>{slide.ctaText || "SHOP NOW"}</span>
                                    <ArrowRight size={13} />
                                  </button>
                                </div>

                                {/* Right Side: Visual Devices Composition Mockup */}
                                <div className="lg:col-span-6 relative w-full h-[300px] sm:h-[350px] md:h-[400px] lg:h-full flex items-center justify-center p-6 lg:p-10 select-none overflow-visible">
                                  {/* Background Arch & Pedestal */}
                                  <div className="absolute inset-x-8 bottom-6 top-10 bg-[#EDE7DD] rounded-t-[120px] border border-white/50 shadow-inner opacity-85 flex items-end justify-center pb-4 overflow-hidden z-0">
                                    <div className="w-[88%] h-[88%] bg-[#FAF5F0] rounded-t-[100px] border border-white/30 flex items-end justify-center">
                                      <div className="w-52 h-10 bg-[#D2C5B6]/50 blur-lg rounded-full mb-2 animate-pulse" />
                                    </div>
                                  </div>

                                  {/* Dynamic Shoe Image Floating */}
                                  {slide.imageUrl && (
                                    <img
                                      src={slide.imageUrl}
                                      alt="Featured Shoe"
                                      referrerPolicy="no-referrer"
                                      className="absolute w-[45%] max-h-[55%] object-contain z-12 drop-shadow-[0_15px_15px_rgba(0,0,0,0.18)] animate-float top-[20%] left-[10%]"
                                    />
                                  )}

                                  {/* DEVICE 1: LAPTOP MOCKUP (Representing Desktop experience) */}
                                  <div className="absolute w-[68%] aspect-[1.6] bg-[#0A0A0A] rounded-[10px] p-[2%] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.25)] border border-neutral-800 z-10 scale-90 sm:scale-100 transition-all">
                                    <div className="bg-[#FAF7F3] w-full h-full rounded-[4px] overflow-hidden border border-neutral-900 flex flex-col relative select-none">
                                      {/* Bezel dot / webcam */}
                                      <div className="absolute top-[3%] left-1/2 -translate-x-1/2 w-1 h-1 bg-neutral-800 rounded-full z-20" />
                                      {/* Website Header inside laptop */}
                                      <div className="bg-white px-2 py-1 flex justify-between items-center text-[4px] font-sans border-b border-neutral-100 select-none scale-90 origin-left">
                                        <div className="flex items-center gap-0.5 font-bold">
                                          <span className="text-[5px] text-neutral-950">CS</span>
                                          <span className="text-[3.5px] tracking-tight">Comfort Steps</span>
                                        </div>
                                        <div className="flex gap-1 text-neutral-400 font-semibold">
                                          <span>HOME</span>
                                          <span>CATALOG</span>
                                          <span>BEST SELLERS</span>
                                        </div>
                                        <div className="w-2.5 h-1 bg-neutral-100 rounded-xs" />
                                      </div>
                                      {/* Content inside laptop */}
                                      <div className="p-1.5 flex-1 flex items-center relative overflow-hidden">
                                        <div className="w-1/2 text-left space-y-0.5 z-10">
                                          <span className="text-[3px] bg-amber-100 text-amber-800 px-0.5 rounded-full uppercase tracking-widest inline-block font-extrabold">NEW</span>
                                          <h4 className="font-serif text-[6px] font-black text-neutral-900 uppercase tracking-tight leading-none">Elegance Redefined</h4>
                                          <p className="text-[2.5px] text-neutral-400 font-medium leading-relaxed max-w-[50px]">The perfect blend of premium comfort & daily style.</p>
                                          <div className="text-[2.5px] bg-neutral-950 text-white px-1 py-0.5 rounded-xs w-fit font-bold cursor-pointer">Shop Now</div>
                                        </div>
                                        {/* Shoe display within laptop screen */}
                                        <div className="absolute right-1 bottom-1 top-2 w-1/2 bg-[#ECE5DB]/60 rounded-t-full border border-white/40 flex items-center justify-center p-0.5">
                                          <img
                                            src={slide.imageUrl || "https://lh3.googleusercontent.com/d/1pBh6vEJCwByC2_DD0c9rE42MDbwrd8u5"}
                                            alt="Showcase"
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-contain drop-shadow-sm select-none"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                    {/* Laptop Base Stand */}
                                    <div className="absolute -bottom-1 left-[10%] right-[10%] h-1 bg-neutral-300 rounded-b-xs shadow-xs z-15" />
                                  </div>

                                  {/* DEVICE 2: TABLET MOCKUP (Partially overlapping right) */}
                                  <div className="absolute right-2 sm:right-5 top-[22%] w-[32%] aspect-[0.72] bg-[#0E0E0E] rounded-md p-[1%] shadow-lg border border-neutral-800 z-15 hidden sm:block">
                                    <div className="bg-white w-full h-full rounded-sm overflow-hidden flex flex-col relative select-none">
                                      <div className="bg-neutral-50 px-1 py-0.5 border-b border-neutral-100 flex justify-between items-center text-[3px] font-bold">
                                        <span>Comfort Steps</span>
                                        <div className="w-1.5 h-1.5 bg-neutral-200 rounded-full" />
                                      </div>
                                      <div className="p-1 flex flex-col justify-between h-full relative">
                                        <div className="text-left leading-tight">
                                          <span className="text-[2.5px] text-neutral-400 block tracking-wider uppercase font-bold">COUTURE</span>
                                          <h5 className="text-[4px] font-extrabold text-neutral-900 tracking-tighter">WALK IN STYLE</h5>
                                        </div>
                                        <img
                                          src={slide.imageUrl || "https://lh3.googleusercontent.com/d/1yhXKS2ODpODTdlfTmQhgjdmFnkyPIU9w"}
                                          alt="Tablet Shoe"
                                          referrerPolicy="no-referrer"
                                          className="w-[85%] h-1/2 object-contain mx-auto drop-shadow-sm select-none"
                                        />
                                        <div className="bg-neutral-900 text-white text-[2.5px] font-black text-center py-0.5 rounded-full uppercase tracking-wider cursor-pointer mt-1">Explore</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* DEVICE 3: MOBILE SMARTPHONE MOCKUP (Overlapping center front) */}
                                  <div className="absolute right-5 sm:right-14 bottom-4 w-[25%] aspect-[0.5] bg-[#080808] rounded-[16px] p-[1.5%] shadow-2xl border border-neutral-900 z-20 hover:scale-105 transition-all">
                                    <div className="bg-white w-full h-full rounded-[13px] overflow-hidden flex flex-col relative select-none">
                                      {/* Top phone speaker notch */}
                                      <div className="absolute top-[2%] left-1/2 -translate-x-1/2 w-4 h-0.5 bg-neutral-800 rounded-full z-20" />
                                      <div className="p-1.5 pt-3 h-full flex flex-col justify-between">
                                        <div className="text-left space-y-0.5">
                                          <span className="text-[2px] bg-red-50 text-red-700 px-0.5 rounded-xs font-bold uppercase inline-block">HOT</span>
                                          <h6 className="text-[3.5px] font-black text-neutral-900 tracking-tighter uppercase leading-none">LIVE IN COMFORT</h6>
                                        </div>
                                        <img
                                          src={slide.imageUrl || "https://lh3.googleusercontent.com/d/1As3HJoUjLOTUJ3OffwCc-0_xTI9sCh4J"}
                                          alt="Mobile Shoe"
                                          referrerPolicy="no-referrer"
                                          className="w-[90%] h-1/2 object-contain mx-auto drop-shadow-xs select-none"
                                        />
                                        <div className="text-[2px] font-bold text-center text-[#BC9D4E] underline uppercase tracking-widest cursor-pointer leading-relaxed">Shop Heels</div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* GOLD EMBOSSED CIRCLE STAMP SEAL */}
                                  <div className="absolute top-[8%] right-2 md:right-[5%] w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#E2D1B3] via-[#BC9D4E] to-[#927835] rounded-full border border-white/50 shadow-lg flex flex-col items-center justify-center text-center text-white z-25 animate-float select-none font-sans">
                                    <div className="absolute inset-1 border border-dashed border-white/20 rounded-full" />
                                    {/* Tiny Crown Vector */}
                                    <svg className="w-3.5 h-3.5 text-white/90 mb-0.5" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M2 4l3 7 7-9 7 9 3-7-1 16H3L2 4z" />
                                    </svg>
                                    <span className="text-[5.5px] uppercase font-black tracking-widest text-amber-50">NEW COLLECTION</span>
                                    <span className="text-[8.5px] font-serif font-black tracking-tight mt-0.5 text-amber-100">{slide.badgeText || "2026"}</span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>

                      {/* Manual Slide Controls: Chevron Left & Right (Only visible on hover) */}
                      {bannerSlides.length > 1 && (
                        <>
                          <button
                            onClick={() => {
                              setActiveSlideIdx((prev) => (prev === 0 ? bannerSlides.length - 1 : prev - 1));
                            }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/70 hover:bg-white border border-neutral-150 shadow-xs flex items-center justify-center text-neutral-800 opacity-0 group-hover:opacity-100 transition cursor-pointer z-25"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setActiveSlideIdx((prev) => (prev === bannerSlides.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/70 hover:bg-white border border-neutral-150 shadow-xs flex items-center justify-center text-neutral-800 opacity-0 group-hover:opacity-100 transition cursor-pointer z-25"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </>
                      )}

                      {/* Bullet Page Slide Indicators */}
                      {bannerSlides.length > 1 && (
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-25">
                          {bannerSlides.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              onClick={() => setActiveSlideIdx(dotIdx)}
                              className={`h-2 rounded-full transition-all cursor-pointer ${
                                dotIdx === activeSlideIdx ? "w-6 bg-neutral-900" : "w-2 bg-neutral-400/50"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* PREMIUM TRUST FEATURE BAR (Directly matching bottom of reference image) */}
                    <div className="bg-neutral-950 rounded-[28px] py-5 px-6 shadow-xs border border-neutral-850 text-white select-none">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 divide-y lg:divide-y-0 lg:divide-x divide-neutral-850">
                        {/* Box 1 */}
                        <div className="flex items-center gap-3 pl-2 py-1.5 lg:py-0">
                          <div className="w-9 h-9 bg-neutral-900 rounded-full flex items-center justify-center text-[#BC9D4E] shrink-0 border border-neutral-800 shadow-3xs">
                            <Truck size={16} />
                          </div>
                          <div className="text-left leading-tight">
                            <h4 className="text-[9.5px] uppercase font-extrabold tracking-widest text-[#D4AF37]">FREE SHIPPING</h4>
                            <p className="text-[9.5px] text-neutral-400 font-bold mt-0.5">On All Orders</p>
                          </div>
                        </div>

                        {/* Box 2 */}
                        <div className="flex items-center gap-3 pl-2 lg:pl-6 py-1.5 lg:py-0 pt-3 lg:pt-0">
                          <div className="w-9 h-9 bg-neutral-900 rounded-full flex items-center justify-center text-[#BC9D4E] shrink-0 border border-neutral-800 shadow-3xs">
                            <RotateCcw size={16} />
                          </div>
                          <div className="text-left leading-tight">
                            <h4 className="text-[9.5px] uppercase font-extrabold tracking-widest text-[#D4AF37]">EASY RETURNS</h4>
                            <p className="text-[9.5px] text-neutral-400 font-bold mt-0.5">Hassle Free</p>
                          </div>
                        </div>

                        {/* Box 3 */}
                        <div className="flex items-center gap-3 pl-2 lg:pl-6 py-1.5 lg:py-0 pt-3 lg:pt-0">
                          <div className="w-9 h-9 bg-neutral-900 rounded-full flex items-center justify-center text-[#BC9D4E] shrink-0 border border-neutral-800 shadow-3xs">
                            <ShieldCheck size={16} />
                          </div>
                          <div className="text-left leading-tight">
                            <h4 className="text-[9.5px] uppercase font-extrabold tracking-widest text-[#D4AF37]">SECURE PAYMENTS</h4>
                            <p className="text-[9.5px] text-neutral-400 font-bold mt-0.5">100% Safe & Secure</p>
                          </div>
                        </div>

                        {/* Box 4 */}
                        <div className="flex items-center gap-3 pl-2 lg:pl-6 py-1.5 lg:py-0 pt-3 lg:pt-0">
                          <div className="w-9 h-9 bg-neutral-900 rounded-full flex items-center justify-center text-[#BC9D4E] shrink-0 border border-neutral-800 shadow-3xs">
                            <Headphones size={16} />
                          </div>
                          <div className="text-left leading-tight">
                            <h4 className="text-[9.5px] uppercase font-extrabold tracking-widest text-[#D4AF37]">24/7 SUPPORT</h4>
                            <p className="text-[9.5px] text-neutral-400 font-bold mt-0.5">We're Here For You</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Category Pill Tabs */}
                    <div className="flex gap-2.5 overflow-x-auto lg:overflow-visible lg:flex-wrap no-scrollbar py-1">
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

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                        {(isMobile ? featuredProducts.slice(0, 2) : featuredProducts.slice(0, 4)).map((prod) => {
                          const displayProps = getProductDisplayProps(prod);
                          return (
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
                                  src={displayProps.image} 
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
                                    <span className="text-xs font-black text-neutral-900">₹{displayProps.price}</span>
                                    <span className="text-[9px] text-neutral-400 line-through">₹{displayProps.originalPrice}</span>
                                  </div>
                                  <div className="w-6.5 h-6.5 bg-black hover:bg-neutral-800 text-white rounded-full flex items-center justify-center transition">
                                    <ArrowRight size={11} className="-rotate-45" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                        {(isMobile ? featuredProducts.slice(2, 4) : featuredProducts.slice(0, 4)).map((prod) => {
                          const displayProps = getProductDisplayProps(prod);
                          return (
                            <div
                              key={prod.id}
                              onClick={() => handleViewProduct(prod)}
                              className="bg-white rounded-[24px] p-3 border border-neutral-100 shadow-xs cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between"
                            >
                              <div className="relative bg-[#F5F5F4] rounded-[18px] h-[130px] overflow-hidden flex items-center justify-center p-2">
                                <img 
                                  src={displayProps.image} 
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
                                    <span className="text-xs font-black text-neutral-900">₹{displayProps.price}</span>
                                    <span className="text-[9px] text-neutral-400 line-through">₹{displayProps.originalPrice}</span>
                                  </div>
                                  <div className="w-6.5 h-6.5 bg-black hover:bg-neutral-800 text-white rounded-full flex items-center justify-center transition">
                                    <ArrowRight size={11} className="-rotate-45" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                        {filteredProducts.map((prod) => {
                          const displayProps = getProductDisplayProps(prod);
                          return (
                            <div
                              key={prod.id}
                              onClick={() => handleViewProduct(prod)}
                              className="bg-white rounded-[24px] p-3 border border-neutral-100 shadow-xs cursor-pointer hover:shadow-md transition-all group flex flex-col justify-between"
                            >
                              <div className="relative bg-[#F5F5F4] rounded-[18px] h-[130px] overflow-hidden flex items-center justify-center p-2">
                                <img 
                                  src={displayProps.image} 
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
                                    <span className="text-xs font-black text-neutral-900">₹{displayProps.price}</span>
                                    <span className="text-[9px] text-neutral-400 line-through">₹{displayProps.originalPrice}</span>
                                  </div>
                                  <div className="w-6.5 h-6.5 bg-black hover:bg-neutral-800 text-white rounded-full flex items-center justify-center transition">
                                    <ArrowRight size={11} className="-rotate-45" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      <div className={`grid grid-cols-1 ${(profileSubView === "main" || !profileSubView) ? "lg:grid-cols-3 lg:items-start gap-6" : ""} w-full`}>
                        {/* 1. Main visual header with interactive Avatar & Photo Selector */}
                        <div className={`bg-white rounded-[28px] p-5 border border-neutral-100 shadow-xs space-y-4 ${(profileSubView === "main" || !profileSubView) ? "lg:col-span-1" : ""}`}>
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img 
                                src={profilePic} 
                                alt="Profile" 
                                className="w-16 h-16 rounded-full object-cover border border-neutral-150 ring-4 ring-neutral-50"
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
                            <div className="space-y-0.5 text-left">
                              <h3 className="font-display font-black text-base text-neutral-900 tracking-tight">{profileName || "Comfort Steps Buyer"}</h3>
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
                              className="p-3 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2 text-left"
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

                        {/* SUBVIEWS CONDITIONAL RENDERING */}
                        
                        {/* SUBVIEW A: PERSONAL INFORMATION EDITING */}
                        {profileSubView === "personal_info" && (
                          <motion.div
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            className="space-y-5"
                          >
                            <div className="bg-white rounded-[28px] p-6 border border-neutral-100 shadow-sm space-y-4 text-left">
                              <div className="flex justify-between items-center pb-2 border-b border-neutral-50">
                                <h4 className="font-display font-black text-sm text-neutral-900 uppercase tracking-wider">Personal Information</h4>
                                <button 
                                  onClick={() => setProfileSubView("main")}
                                  className="text-[10px] text-neutral-400 hover:text-black font-extrabold"
                                >
                                  Back
                                </button>
                              </div>

                              <form onSubmit={handleSaveBasicProfile} className="space-y-4">
                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">Full Name</label>
                                  <input 
                                    type="text" 
                                    required
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    placeholder="Full name"
                                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">Email Address</label>
                                  <input 
                                    type="email" 
                                    required
                                    value={profileEmail}
                                    onChange={(e) => setProfileEmail(e.target.value)}
                                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">Preferred Footwear Size</label>
                                  <select 
                                    value={preferredSize} 
                                    onChange={(e) => {
                                      setPreferredSize(e.target.value);
                                      localStorage.setItem("comfort_pref_size", e.target.value);
                                    }}
                                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-black cursor-pointer"
                                  >
                                    <option value="">Select Size</option>
                                    {["5", "6", "7", "8", "9", "10", "11", "12"].map(s => (
                                      <option key={s} value={s}>US {s}</option>
                                    ))}
                                  </select>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <button 
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="flex-1 py-3 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-2xl transition cursor-pointer disabled:opacity-55"
                                  >
                                    {isSavingProfile ? "Saving..." : "Save Settings"}
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => setProfileSubView("main")}
                                    className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-2xl transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            </div>
                          </motion.div>
                        )}

                        {/* SUBVIEW B: SHIPPING ADDRESS EDITING */}
                        {profileSubView === "address_info" && (
                          <motion.div
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            className="space-y-5"
                          >
                            <div className="bg-white rounded-[28px] p-6 border border-neutral-100 shadow-sm space-y-4 text-left">
                              <div className="flex justify-between items-center pb-2 border-b border-neutral-50">
                                <h4 className="font-display font-black text-sm text-neutral-900 uppercase tracking-wider">Shipping Address</h4>
                                <button 
                                  onClick={() => setProfileSubView("main")}
                                  className="text-[10px] text-neutral-400 hover:text-black font-extrabold"
                                >
                                  Back
                                </button>
                              </div>

                              <form onSubmit={handleSaveAddressProfile} className="space-y-3.5">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">First Name</label>
                                    <input 
                                      type="text" 
                                      required
                                      value={addrFirstName}
                                      onChange={(e) => setAddrFirstName(e.target.value)}
                                      placeholder="First name"
                                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">Last Name</label>
                                    <input 
                                      type="text" 
                                      required
                                      value={addrLastName}
                                      onChange={(e) => setAddrLastName(e.target.value)}
                                      placeholder="Last name"
                                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">Phone Number</label>
                                  <input 
                                    type="tel" 
                                    required
                                    value={addrPhone}
                                    onChange={(e) => setAddrPhone(e.target.value)}
                                    placeholder="Contact phone number"
                                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-black"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">Flat / House Number</label>
                                  <input 
                                    type="text"
                                    required
                                    value={addrFlatHouse}
                                    onChange={(e) => setAddrFlatHouse(e.target.value)}
                                    placeholder="e.g. Apartment 12B, Luxury Plaza"
                                    className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-black"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">Area / Locality</label>
                                    <input 
                                      type="text"
                                      required
                                      value={addrArea}
                                      onChange={(e) => setAddrArea(e.target.value)}
                                      placeholder="e.g. Soho"
                                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">Landmark</label>
                                    <input 
                                      type="text"
                                      value={addrLandmark}
                                      onChange={(e) => setAddrLandmark(e.target.value)}
                                      placeholder="e.g. Near Central Park"
                                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">City</label>
                                    <input 
                                      type="text"
                                      required
                                      value={addrCity}
                                      onChange={(e) => setAddrCity(e.target.value)}
                                      placeholder="e.g. New York"
                                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">PIN Code / ZIP</label>
                                    <input 
                                      type="text"
                                      required
                                      value={addrPinCode}
                                      onChange={(e) => setAddrPinCode(e.target.value)}
                                      placeholder="e.g. 10012"
                                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black"
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <button 
                                    type="submit"
                                    disabled={isSavingProfile}
                                    className="flex-1 py-3 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-2xl transition cursor-pointer disabled:opacity-55"
                                  >
                                    {isSavingProfile ? "Saving..." : "Save Address"}
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={() => setProfileSubView("main")}
                                    className="px-5 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-2xl transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            </div>
                          </motion.div>
                        )}



                        {/* SUBVIEW C: MAIN PROFILE DASHBOARD SYSTEM */}
                        {(profileSubView === "main" || !profileSubView) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-5 text-left lg:col-span-2"
                          >
                            {/* Profile Submenus */}
                            <div className="bg-white rounded-[28px] border border-neutral-100 overflow-hidden divide-y divide-neutral-50 shadow-xs">
                              
                              <button
                                onClick={() => setProfileSubView("personal_info")}
                                className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-800">
                                    <User size={16} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-neutral-950">Personal Details</h4>
                                    <p className="text-[10px] text-neutral-400 mt-0.5">
                                      {profileName ? profileName : "Not set"} {preferredSize ? `• US ${preferredSize}` : ""}
                                    </p>
                                  </div>
                                </div>
                                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                              </button>

                              <button
                                onClick={() => setProfileSubView("address_info")}
                                className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-800">
                                    <MapPin size={16} />
                                  </div>
                                  <div className="max-w-[70%]">
                                    <h4 className="text-xs font-bold text-neutral-950">Shipping Address</h4>
                                    <p className="text-[10px] text-neutral-400 mt-0.5 truncate">
                                      {profileAddress ? profileAddress : "No address specified"}
                                    </p>
                                  </div>
                                </div>
                                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                              </button>

                              <button
                                onClick={() => { setScreen("my_orders"); setSelectedProduct(null); }}
                                className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition text-left cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-800">
                                    <Package size={16} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-neutral-950">My Orders</h4>
                                    <p className="text-[10px] text-neutral-400 mt-0.5">
                                      View status of your {myOrders.length} order{myOrders.length !== 1 ? "s" : ""}
                                    </p>
                                  </div>
                                </div>
                                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                              </button>
                            </div>

                            {/* LIVE ORDER HISTORY LISTING IN COMPACT */}
                            <div className="space-y-2.5">
                              <h4 className="text-[9px] uppercase font-extrabold tracking-widest text-neutral-400">
                                Recent Orders ({myOrders.length})
                              </h4>

                              {myOrders.length === 0 ? (
                                <div className="bg-white rounded-2xl p-6 border border-neutral-100 text-center space-y-2">
                                  <div className="w-9 h-9 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-300">
                                    <History size={14} />
                                  </div>
                                  <h5 className="font-bold text-xs text-neutral-800">No past purchases</h5>
                                  <p className="text-[10px] text-[#8E8E8A] leading-relaxed max-w-[240px] mx-auto">
                                    Place an order to test the history logs!
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {myOrders.slice(0, 3).map((ord) => (
                                    <div key={ord.id} className="bg-white border border-neutral-100 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                                      <div className="flex justify-between items-center text-[10px]">
                                        <span className="font-extrabold text-neutral-800">{ord.id}</span>
                                        <span className="bg-neutral-900 text-white px-2 py-0.5 rounded-full font-bold">
                                          ● {ord.status}
                                        </span>
                                      </div>

                                      <div className="space-y-1 text-left">
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
                                          {new Date(ord.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                        <span className="font-extrabold text-neutral-900">₹{ord.totalAmount}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Account Security & Action (Logout) */}
                            <div className="bg-white rounded-[28px] p-5 border border-neutral-100 shadow-xs flex justify-between items-center">
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest block font-sans">Account Security</span>
                                <span className="text-xs font-bold text-neutral-700">Logged in via Google Secure</span>
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
                                }}
                                className="text-[10px] bg-neutral-900 hover:bg-black text-white font-extrabold px-3 py-2 rounded-xl transition cursor-pointer"
                              >
                                Logout Account
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </div>
                )}

              {/* PREMIUM RESPONSIVE DESKTOP FOOTER */}
              <footer className="hidden md:block mt-16 border-t border-neutral-100 bg-neutral-50/30 rounded-t-[32px] pt-12 pb-8 px-6 md:px-12 text-left">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                  {/* Brand column */}
                  <div className="space-y-3.5 col-span-1 md:col-span-2">
                    <h3 className="font-display font-black text-lg text-neutral-900 tracking-tight">Comfort Steps</h3>
                    <p className="text-xs text-neutral-400 font-normal leading-relaxed max-w-sm">
                      Step into premium luxury. Crafted with bespoke cushion footbed technology and high-grade breathable materials for ultimate daily comfort.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-50 border border-emerald-100 text-[#059669] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full">
                        ✓ 100% Original Comfort
                      </span>
                    </div>
                  </div>

                  {/* Discover Column */}
                  <div className="space-y-3">
                    <span className="text-[9.5px] uppercase font-extrabold tracking-widest text-neutral-400 block font-sans">Discover</span>
                    <ul className="space-y-2 text-xs font-bold">
                      <li>
                        <button onClick={() => { setActiveTab("home"); setSelectedProduct(null); }} className="text-neutral-500 hover:text-black transition cursor-pointer">
                          Premium Showcase
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setActiveTab("store"); setSelectedProduct(null); }} className="text-neutral-500 hover:text-black transition cursor-pointer">
                          Footwear Catalog
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setActiveTab("wishlist"); setSelectedProduct(null); }} className="text-neutral-500 hover:text-black transition cursor-pointer">
                          My Wishlist
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Customer Column */}
                  <div className="space-y-3">
                    <span className="text-[9.5px] uppercase font-extrabold tracking-widest text-neutral-400 block font-sans">Support & Legal</span>
                    <ul className="space-y-2 text-xs font-bold">
                      <li>
                        <button onClick={() => { setScreen("privacy_policy"); }} className="text-neutral-500 hover:text-black transition cursor-pointer font-sans">
                          Privacy Policy
                        </button>
                      </li>
                      <li>
                        <button onClick={() => { setScreen("my_orders"); }} className="text-neutral-500 hover:text-black transition cursor-pointer font-sans">
                          Track My Order
                        </button>
                      </li>
                      <li>
                        <span className="text-neutral-500 font-normal">Care: info@comfortsteps.com</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="max-w-7xl mx-auto border-t border-neutral-100 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-neutral-400 font-bold">
                  <span>© 2026 Comfort Steps Luxury. Handcrafted with pride.</span>
                  <div className="flex items-center gap-4">
                    <span>Verified Comfort Guaranteed</span>
                    <span>•</span>
                    <span>Secure Encrypted Checkouts</span>
                  </div>
                </div>
              </footer>

              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    )}

        {/* VIEW 3: DETAILED FOOTWEAR PRODUCT PAGE */}
        {screen === "detail" && selectedProduct && (() => {
          const activeVariant = selectedProduct.variants?.find(
            v => (v.colourName || v.color || "").toLowerCase() === selectedColor.toLowerCase()
          );

          const displayImages = activeVariant?.images && activeVariant.images.length > 0 
            ? activeVariant.images 
            : selectedProduct.images;
          
          const displayPrice = activeVariant?.sellingPrice !== undefined 
            ? activeVariant.sellingPrice 
            : (activeVariant?.price !== undefined ? activeVariant.price : selectedProduct.price);

          const displayOriginalPrice = activeVariant?.mrp !== undefined 
            ? activeVariant.mrp 
            : (activeVariant?.originalPrice !== undefined ? activeVariant.originalPrice : selectedProduct.originalPrice);

          const displayDescription = activeVariant?.description 
            ? activeVariant.description 
            : selectedProduct.description;

          const displaySizes = activeVariant?.sizes && activeVariant.sizes.length > 0 
            ? activeVariant.sizes 
            : selectedProduct.sizes;

          const discountPercent = displayOriginalPrice > displayPrice 
            ? Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100) 
            : 0;

          // Mouse Position for Premium Zoom-on-Hover Magnifier
          const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
            const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - left) / width) * 100;
            const y = ((e.clientY - top) / height) * 100;
            setZoomPos({ x, y, show: true });
          };

          // Similar products
          const similarItems = products
            .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
            .slice(0, 4);

          // Accessories Bundle Info
          const accessoryPrice = 899;
          const accessoryMrp = 1199;
          const combinedPrice = displayPrice + (bundleChecked ? accessoryPrice : 0);

          const checkPincode = () => {
            setPincodeError(null);
            setPincodeResult(null);
            if (!/^[1-9][0-9]{5}$/.test(pincodeInput)) {
              setPincodeError("Please enter a valid 6-digit PIN code.");
              return;
            }
            const premiumPincodes = ["110001", "400001", "411001", "560001", "600001", "700001"];
            const isPremium = premiumPincodes.includes(pincodeInput) || pincodeInput.startsWith("411") || pincodeInput.startsWith("110") || pincodeInput.startsWith("400");
            if (isPremium) {
              setPincodeResult("🚀 Express Delivery: Guaranteed by Tomorrow Evening! (Free Shipping)");
              setEstimatedDeliveryDays(1);
            } else {
              setPincodeResult("📦 Standard Delivery: Estimated within 2-3 Business Days. (Free Shipping)");
              setEstimatedDeliveryDays(3);
            }
          };

          const shareProduct = () => {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
              setShareFeedback("Luxury link copied! Share the Comfort Steps experience.");
              setTimeout(() => setShareFeedback(null), 3000);
            }).catch(() => {
              setShareFeedback("Comfort Steps Luxury Footwear - Shared!");
              setTimeout(() => setShareFeedback(null), 3000);
            });
          };

          return (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12"
            >
              {/* Back breadcrumb bar */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-100">
                <button 
                  onClick={() => {
                    setScreen("dashboard");
                    setActiveImageIdx(0);
                    setDetailQty(1);
                  }}
                  className="px-4 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl flex items-center gap-1.5 text-xs text-neutral-800 font-extrabold transition cursor-pointer"
                >
                  <ChevronLeft size={14} strokeWidth={2.5} /> Back to Collection
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 font-bold tracking-widest uppercase">Luxury Footwear / {selectedProduct.category}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-[#BC9D4E]" />
                </div>
              </div>

              {/* Core Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                
                {/* LEFT SIDE: MULTI-IMAGE GALLERY COLUMN */}
                <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-24">
                  <div className="bg-white rounded-[32px] p-6 border border-neutral-100 shadow-xs relative">
                    
                    {/* Active Main Stage with Pointer Magnifier */}
                    <div 
                      onMouseMove={handleMouseMove}
                      onMouseLeave={() => setZoomPos(prev => ({ ...prev, show: false }))}
                      className="h-[320px] sm:h-[400px] w-full flex items-center justify-center rounded-2xl bg-[#F5F5F4] overflow-hidden p-6 relative cursor-zoom-in"
                    >
                      {/* Zoomed Background overlay */}
                      {zoomPos.show && (
                        <div 
                          className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-150"
                          style={{
                            backgroundImage: `url(${displayImages[activeImageIdx] || selectedProduct.images[0]})`,
                            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                            backgroundSize: "200%",
                            backgroundRepeat: "no-repeat",
                            backgroundColor: "#F5F5F4"
                          }}
                        />
                      )}

                      {/* Main Image */}
                      <img 
                        src={displayImages[activeImageIdx] || selectedProduct.images[0]} 
                        alt={selectedProduct.name}
                        className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />

                      {/* Gallery Left/Right Swipers */}
                      {displayImages.length > 1 && (
                        <>
                          <button
                            onClick={() => {
                              setActiveImageIdx(prev => (prev === 0 ? displayImages.length - 1 : prev - 1));
                            }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white border border-neutral-150 rounded-full flex items-center justify-center shadow-xs text-neutral-700 transition cursor-pointer z-20"
                          >
                            <ChevronLeft size={16} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => {
                              setActiveImageIdx(prev => (prev === displayImages.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white border border-neutral-150 rounded-full flex items-center justify-center shadow-xs text-neutral-700 transition cursor-pointer z-20"
                          >
                            <ChevronRight size={16} strokeWidth={2.5} />
                          </button>
                        </>
                      )}

                      {/* Floating badging */}
                      <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                        <span className="bg-black text-white text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full shadow-2xs">
                          {selectedProduct.brand}
                        </span>
                        {discountPercent > 0 && (
                          <span className="bg-[#BC9D4E] text-white text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full shadow-2xs">
                            {discountPercent}% SAVINGS
                          </span>
                        )}
                      </div>

                      {/* Heart Toggle */}
                      <button 
                        onClick={() => toggleFavorite(selectedProduct.id)}
                        className="absolute top-4 right-4 w-9 h-9 bg-white hover:bg-neutral-50 border border-neutral-150 rounded-full shadow-xs flex items-center justify-center transition cursor-pointer z-20"
                      >
                        <Heart 
                          size={16} 
                          fill={favorites.includes(selectedProduct.id) ? "#ef4444" : "none"} 
                          className={favorites.includes(selectedProduct.id) ? "text-rose-500 scale-110" : "text-neutral-400"} 
                        />
                      </button>
                    </div>

                    {/* Thumbnails list with click interaction */}
                    {displayImages.length > 1 && (
                      <div className="flex gap-2.5 justify-center mt-4 overflow-x-auto py-1.5 scrollbar-none">
                        {displayImages.map((img, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveImageIdx(idx)}
                            className={`w-14 h-14 bg-neutral-50 rounded-xl p-1 border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                              activeImageIdx === idx 
                                ? "border-[#BC9D4E] ring-2 ring-[#BC9D4E]/20 scale-102 bg-white" 
                                : "border-neutral-200 hover:border-neutral-350"
                            }`}
                          >
                            <img src={img} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SPECIFICATION CARD GRID */}
                  <div className="bg-white rounded-[32px] p-6 border border-neutral-100 shadow-3xs space-y-4">
                    <h3 className="font-display font-black text-xs uppercase tracking-widest text-[#BC9D4E] flex items-center gap-1.5">
                      <Gem size={13} /> Technical Specifications
                    </h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[11px] border-t border-neutral-100 pt-3">
                      <div className="flex justify-between py-1.5 border-b border-neutral-50">
                        <span className="text-neutral-400 font-medium">Upper Leather</span>
                        <span className="text-neutral-900 font-bold">Premium Hand-Cut Calfskin</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-neutral-50">
                        <span className="text-neutral-400 font-medium">Insole Support</span>
                        <span className="text-neutral-900 font-bold">Orthotic Cushion Memory Foam</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-neutral-50">
                        <span className="text-neutral-400 font-medium">Sole Material</span>
                        <span className="text-neutral-900 font-bold">Non-slip Hybrid Rubber</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-neutral-50">
                        <span className="text-neutral-400 font-medium">Lining Comfort</span>
                        <span className="text-neutral-900 font-bold">Moisture-Wicking Organic Cotton</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-neutral-400 font-medium">Production</span>
                        <span className="text-[#BC9D4E] font-black uppercase tracking-wider">Comfort Steps Luxury Lab</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-neutral-400 font-medium">Origin</span>
                        <span className="text-neutral-900 font-bold">Made in India</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: CUSTOM OPTION ACTIONS & BUYER PANEL */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* MAIN SELLER CONTAINER */}
                  <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-neutral-100 shadow-xs space-y-5">
                    
                    {/* Header Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#BC9D4E] font-black uppercase tracking-widest block">{selectedProduct.brand}</span>
                        <div className="w-1 h-1 rounded-full bg-neutral-300" />
                        <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wide">100% Authentic Product</span>
                      </div>
                      
                      <div className="flex justify-between items-start gap-4">
                        <h1 className="font-display font-black text-xl md:text-2xl text-neutral-900 leading-tight">{selectedProduct.name}</h1>
                        <div className="text-right shrink-0">
                          <span className="text-2xl font-black text-neutral-900 block">₹{displayPrice}</span>
                          {displayOriginalPrice > displayPrice && (
                            <div className="flex items-center gap-1.5 justify-end mt-0.5">
                              <span className="text-xs text-neutral-400 line-through">₹{displayOriginalPrice}</span>
                              <span className="text-[9px] text-[#BC9D4E] font-extrabold bg-amber-50 px-1.5 py-0.5 rounded-md">
                                {discountPercent}% OFF
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ratings stars review block */}
                      <div className="flex items-center gap-1 bg-neutral-50 px-3 py-1.5 rounded-xl w-fit">
                        <div className="flex gap-0.5 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={11} fill={i < Math.floor(selectedProduct.rating) ? "currentColor" : "none"} />
                          ))}
                        </div>
                        <span className="text-[11px] font-black text-neutral-850 ml-1">{selectedProduct.rating} Rating</span>
                        <span className="text-[10px] text-neutral-400 font-semibold">({selectedProduct.reviewsCount} verified buyers)</span>
                      </div>
                    </div>

                    {/* COLOR SWATCHES */}
                    {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                      <div className="border-t border-neutral-100 pt-4">
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">
                            Luxury Variant Color: <span className="text-neutral-900 font-black">{selectedColor || "Select"}</span>
                          </span>
                        </div>
                        
                        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x">
                          {selectedProduct.variants.map((v) => {
                            const vColor = v.colourName || v.color || "";
                            const isSelected = selectedColor.toLowerCase() === vColor.toLowerCase();
                            const thumbnail = v.colourThumbnail || (v.images && v.images.length > 0 ? v.images[0] : selectedProduct.images[0]);
                            const vPrice = v.sellingPrice !== undefined ? v.sellingPrice : (v.price !== undefined ? v.price : selectedProduct.price);
                            const vMrp = v.mrp !== undefined ? v.mrp : (v.originalPrice !== undefined ? v.originalPrice : selectedProduct.originalPrice);
                            const vDiscount = vMrp > vPrice ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;
                              
                            return (
                              <button
                                key={vColor}
                                type="button"
                                onClick={() => {
                                  handleColorChange(vColor);
                                  setActiveImageIdx(0);
                                }}
                                className={`flex-shrink-0 snap-start w-22 bg-white border rounded-2xl p-1.5 text-left transition-all cursor-pointer ${
                                  isSelected 
                                    ? "border-[#BC9D4E] ring-2 ring-[#BC9D4E]/15 scale-[1.02] shadow-xs" 
                                    : "border-neutral-100 hover:border-neutral-250 shadow-3xs"
                                }`}
                              >
                                <div className="h-12 w-full rounded-xl bg-neutral-50 flex items-center justify-center p-1.5 relative mb-1 overflow-hidden">
                                  <img src={thumbnail} alt={vColor} className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                                  <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-white shadow-2xs" style={{ backgroundColor: getColorHex(vColor) }} />
                                </div>
                                <p className="text-[9px] font-black text-neutral-800 truncate leading-tight">{vColor}</p>
                                <p className="text-[9px] font-extrabold text-[#BC9D4E]">₹{vPrice}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      selectedProduct.colors && selectedProduct.colors.length > 0 && (
                        <div className="border-t border-neutral-100 pt-4">
                          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block mb-2">Select Luxury Color</span>
                          <div className="flex gap-2">
                            {selectedProduct.colors.map((color) => (
                              <button
                                key={color}
                                onClick={() => handleColorChange(color)}
                                style={{ backgroundColor: getColorHex(color) }}
                                className={`w-8 h-8 rounded-full border-2 transition-transform relative cursor-pointer ${
                                  selectedColor === color 
                                    ? "border-[#BC9D4E] scale-110 ring-2 ring-[#BC9D4E]/25" 
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
                      )
                    )}

                    {/* SIZING CONTAINER */}
                    <div className="border-t border-neutral-100 pt-4">
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">
                          Select Foot Size: <span className="text-neutral-900 font-black">{selectedSize || "Select size"}</span>
                        </span>
                        <button 
                          onClick={() => setIsSizeGuideOpen(true)}
                          className="text-[11px] text-[#BC9D4E] hover:text-[#A68F5B] font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Ruler size={11} /> Sizing & Chart Calculator
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {displaySizes.map((sz) => (
                          <button
                            key={sz}
                            onClick={() => setSelectedSize(sz)}
                            className={`py-2 text-center text-xs font-bold rounded-xl transition border cursor-pointer ${
                              selectedSize === sz 
                                ? "bg-black text-white border-black" 
                                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-350"
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* QUANTITY CHANGER */}
                    <div className="border-t border-neutral-100 pt-4 flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Select Quantity</span>
                        <span className="text-[9px] text-neutral-400 font-bold block">Limit 5 pairs per customer</span>
                      </div>
                      <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-150 rounded-xl p-1">
                        <button 
                          onClick={() => setDetailQty(prev => Math.max(1, prev - 1))}
                          className="w-7 h-7 hover:bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600 transition cursor-pointer"
                        >
                          <Minus size={11} strokeWidth={2.5} />
                        </button>
                        <span className="w-8 text-center text-xs font-extrabold text-neutral-900">{detailQty}</span>
                        <button 
                          onClick={() => setDetailQty(prev => Math.min(5, prev + 1))}
                          className="w-7 h-7 hover:bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600 transition cursor-pointer"
                        >
                          <Plus size={11} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* FREQUENTLY BOUGHT TOGETHER - INCREMENTAL REVENUE BUNDLE */}
                    <div className="border-t border-neutral-100 pt-4">
                      <div className="bg-amber-50/45 border border-[#D4AF37]/25 rounded-2xl p-4 space-y-3">
                        <div className="flex items-start gap-3 justify-between">
                          <div className="flex items-start gap-2.5">
                            <input 
                              type="checkbox" 
                              id="bundle_check"
                              checked={bundleChecked}
                              onChange={(e) => setBundleChecked(e.target.checked)}
                              className="mt-1 accent-black h-4 w-4 rounded-md border-neutral-300 focus:ring-black"
                            />
                            <label htmlFor="bundle_check" className="cursor-pointer select-none space-y-1 block">
                              <span className="text-[11px] font-black text-neutral-900 uppercase tracking-wide block">Frequently Bought Together</span>
                              <p className="text-[10px] text-neutral-500 leading-normal">
                                Add Comfort Steps Premium Cedar Shoe Trees & Care Brush
                              </p>
                            </label>
                          </div>
                          <span className="text-[11px] font-black text-[#BC9D4E] shrink-0">₹899 <span className="line-through text-neutral-400 text-[10px] font-semibold">₹1,199</span></span>
                        </div>

                        <div className="flex items-center gap-2 bg-white/70 rounded-xl p-2.5 border border-dashed border-[#D4AF37]/20">
                          <div className="w-10 h-10 bg-[#F5F5F4] rounded-lg p-1 flex items-center justify-center shrink-0">
                            <img src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=400&q=80" alt="" className="max-h-full max-w-full object-contain" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[10px] font-extrabold text-neutral-800 truncate">Premium Cedar Footwear Preserver Kit</h4>
                            <p className="text-[9px] text-neutral-400 font-bold">Recommended accessories for luxury leather shoes</p>
                          </div>
                        </div>

                        {bundleChecked && (
                          <div className="text-right text-[10px] font-bold text-neutral-500 border-t border-neutral-100/60 pt-2.5">
                            Combined Total: <span className="text-neutral-900 font-black text-xs">₹{combinedPrice}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DYNAMIC DELIVERY ESTIMATE BASED ON PINCODE */}
                    <div className="border-t border-neutral-100 pt-4 space-y-2.5">
                      <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block">Estimated Delivery Estimate</span>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input 
                            type="text" 
                            maxLength={6}
                            value={pincodeInput}
                            onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                            placeholder="Enter 6-digit PIN code (e.g. 411001)"
                            className="w-full bg-[#F5F5F4] border border-transparent focus:border-neutral-250 focus:bg-white rounded-xl py-2 pl-8 pr-3 text-xs focus:outline-none placeholder:text-neutral-400 font-bold"
                          />
                        </div>
                        <button 
                          onClick={checkPincode}
                          className="px-4 bg-black hover:bg-neutral-900 text-white font-extrabold text-xs rounded-xl cursor-pointer transition flex items-center justify-center shrink-0"
                        >
                          Check Delivery
                        </button>
                      </div>

                      {pincodeError && (
                        <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle size={10} /> {pincodeError}
                        </p>
                      )}

                      {pincodeResult ? (
                        <div className="bg-[#EBFDF5] border border-[#A7F3D0] rounded-xl p-2.5 text-left">
                          <p className="text-[10.5px] font-black text-[#047857] flex items-center gap-1.5 leading-normal">
                            <Truck size={12} className="text-[#059669]" /> {pincodeResult}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] text-[#A68F5B] bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50">
                          <Clock size={11} className="text-[#BC9D4E] shrink-0" />
                          <span>
                            Dispatch Countdown: Place order within <strong className="font-black text-neutral-800">{countdownStr}</strong> for shipping today!
                          </span>
                        </div>
                      )}
                    </div>

                    {/* MAIN CTA CALL-TO-ACTIONS */}
                    <div className="grid grid-cols-2 gap-3.5 pt-2">
                      <button 
                        onClick={() => {
                          const sizeToUse = selectedSize || selectedProduct.sizes[0] || "Standard";
                          const colorToUse = selectedColor || selectedProduct.colors[0] || "Standard";
                          
                          // 1. Add matching cedar accessory if checked
                          if (bundleChecked) {
                            const tempAcc = {
                              id: "acc-" + selectedProduct.id,
                              name: "Cedar Wood Shoe Trees & Premium Care Polish Brush",
                              brand: "Comfort Steps Care",
                              price: 899,
                              originalPrice: 1199,
                              description: "Keeps your premium footwear in pristine shape.",
                              images: ["https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=400&q=80"],
                              colors: ["Natural"],
                              sizes: ["Standard"],
                              category: "Care",
                              rating: 4.8,
                              reviewsCount: 120
                            };
                            setCart(prev => {
                              const exists = prev.findIndex(item => item.product.id === tempAcc.id);
                              if (exists > -1) {
                                const u = [...prev];
                                u[exists].quantity += 1;
                                return u;
                              } else {
                                return [...prev, { product: tempAcc, quantity: 1, selectedSize: "Standard", selectedColor: "Natural" }];
                              }
                            });
                          }

                          // 2. Add shoe
                          addToCart(undefined, detailQty);

                          // 3. Initiate checkout mode
                          setIsCheckoutOpen(true);
                          setScreen("cart");
                          setCheckoutStep("address");
                        }}
                        className="py-3.5 border border-black rounded-2xl font-bold text-xs text-neutral-900 bg-white hover:bg-neutral-50 transition cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        Buy Now
                      </button>
                      <button 
                        onClick={(e) => {
                          // 1. Add shoe
                          addToCart(e, detailQty);

                          // 2. Add bundle accessory if checked
                          if (bundleChecked) {
                            const tempAcc = {
                              id: "acc-" + selectedProduct.id,
                              name: "Cedar Wood Shoe Trees & Premium Care Polish Brush",
                              brand: "Comfort Steps Care",
                              price: 899,
                              originalPrice: 1199,
                              description: "Keeps your premium footwear in pristine shape.",
                              images: ["https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=400&q=80"],
                              colors: ["Natural"],
                              sizes: ["Standard"],
                              category: "Care",
                              rating: 4.8,
                              reviewsCount: 120
                            };
                            setCart(prev => {
                              const exists = prev.findIndex(item => item.product.id === tempAcc.id);
                              if (exists > -1) {
                                const u = [...prev];
                                u[exists].quantity += 1;
                                return u;
                              } else {
                                return [...prev, { product: tempAcc, quantity: 1, selectedSize: "Standard", selectedColor: "Natural" }];
                              }
                            });
                          }

                          setIsAddingToCart(true);
                          setTimeout(() => setIsAddingToCart(false), 1500);
                        }}
                        disabled={isAddingToCart}
                        className="py-3.5 bg-black hover:bg-neutral-900 rounded-2xl font-bold text-xs text-white transition cursor-pointer text-center flex items-center justify-center gap-1.5 min-h-[46px] shadow-sm"
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
                              <CheckCircle size={14} /> Added!
                            </motion.span>
                          ) : (
                            <motion.span
                              key="add"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-1"
                            >
                              <ShoppingBag size={13} /> Add to Cart
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>

                    {/* SECURE PURCHASE TRUST SYMBOLS */}
                    <div className="flex justify-between items-center bg-[#F9F9FB] rounded-2xl p-3 border border-neutral-150/60 mt-3.5">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-neutral-500">
                        <ShieldCheck size={12.5} className="text-[#BC9D4E]" />
                        <span>SSL Encrypted Checkout</span>
                      </div>
                      <div className="h-3 w-[1px] bg-neutral-250" />
                      <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest">Comfort Steps Assured</span>
                    </div>

                    {/* SHARE BAR CONTROLS */}
                    <div className="flex justify-between items-center pt-2.5">
                      <button 
                        onClick={shareProduct}
                        className="text-[11px] text-neutral-500 hover:text-black font-extrabold flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Share2 size={12} /> Share Product details
                      </button>
                      {shareFeedback && (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-xl shadow-3xs animate-fade-in">
                          {shareFeedback}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* DESCRIPTION / DETAILS SHEETS */}
                  <div className="bg-white rounded-[32px] p-6 border border-neutral-100 shadow-3xs space-y-3 text-left">
                    <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block mb-1">Comfort Steps Craftsmanship</span>
                    <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                      {displayDescription || "An elite, bespoke design crafted using hand-selected premium materials. Embellished with fine details and equipped with specialized orthotic memory-pad technology to ensure you experience unmatched luxury and true all-day support with every step."}
                    </p>
                    <div className="border-t border-neutral-100 pt-3 mt-2">
                      <h4 className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block mb-1.5">Free Premium Care Benefits</h4>
                      <ul className="text-[11px] text-neutral-500 space-y-1 font-semibold">
                        <li className="flex items-center gap-1.5">🌟 Free 1-Year Comfort Steps Warranty Included</li>
                        <li className="flex items-center gap-1.5">🔄 30-Day Hassle-Free Sizing Exchanges</li>
                        <li className="flex items-center gap-1.5">📦 Premium Luxury Box Packaging & Branded Carry Sleeve</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: RATINGS AND REVIEWS SUMMARY WITH GRAPH */}
              <div className="bg-white rounded-[32px] p-6 md:p-8 border border-neutral-100 shadow-3xs mt-12 space-y-6 text-left">
                <div className="border-b border-neutral-100 pb-4">
                  <h2 className="font-display font-black text-lg text-neutral-900 uppercase tracking-wide">Customer Reviews & Ratings</h2>
                  <p className="text-[11px] text-neutral-400">Authentic feedbacks shared directly by Comfort Steps premium members</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  {/* Rating Numbers summary */}
                  <div className="md:col-span-4 text-center md:border-r md:border-neutral-100 md:pr-8 space-y-2">
                    <h3 className="text-5xl font-black text-neutral-900">{selectedProduct.rating}</h3>
                    <div className="flex justify-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} fill={i < Math.floor(selectedProduct.rating) ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">{selectedProduct.reviewsCount} Verified Reviews</p>
                    <div className="bg-[#EBFDF5] text-[#047857] text-[10px] font-extrabold px-3 py-1.5 rounded-full inline-block">
                      ✓ 98% Recommend this product
                    </div>
                  </div>

                  {/* Rating breakdown progress lines */}
                  <div className="md:col-span-8 space-y-2.5">
                    {[
                      { stars: 5, pct: "84%" },
                      { stars: 4, pct: "11%" },
                      { stars: 3, pct: "3%" },
                      { stars: 2, pct: "1%" },
                      { stars: 1, pct: "1%" }
                    ].map((row, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <span className="w-12 font-bold text-neutral-600 text-right">{row.stars} Stars</span>
                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div className="h-full bg-black transition-all" style={{ width: row.pct }} />
                        </div>
                        <span className="w-10 text-neutral-400 font-bold">{row.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews List */}
                <div className="border-t border-neutral-100 pt-6 space-y-4">
                  <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">Top Member Feedbacks</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        name: "Vanisha Teke",
                        stars: 5,
                        date: "July 11, 2026",
                        comment: "Absolutely outstanding. Feels incredibly soft and lightweight, yet provides solid arch support. The packaging was so premium!",
                        title: "Unmatched Luxury & Foot Comfort!"
                      },
                      {
                        name: "Pooja Patil",
                        stars: 5,
                        date: "July 08, 2026",
                        comment: "Extremely elegant shoe with superb build quality. True to size. Fits perfectly and looks great on both casual and evening dresses.",
                        title: "Fabulous build quality!"
                      },
                      {
                        name: "Meera Deshmukh",
                        stars: 4,
                        date: "June 28, 2026",
                        comment: "Perfect heels with proper memory cushion pad that takes off pressure. Will surely recommend. Ordered another shade already.",
                        title: "Excellent Cushioning"
                      }
                    ].map((rev, i) => (
                      <div key={i} className="bg-[#FCFCFD] border border-neutral-150/60 rounded-2xl p-4 space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-0.5 text-amber-500">
                              {[...Array(5)].map((_, idx) => (
                                <Star key={idx} size={9} fill={idx < rev.stars ? "currentColor" : "none"} />
                              ))}
                            </div>
                            <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest flex items-center gap-1 bg-emerald-50/50 px-2 py-0.5 rounded-md border border-emerald-100/30">
                              ✓ Verified Buyer
                            </span>
                          </div>
                          <h4 className="font-extrabold text-xs text-neutral-900">{rev.title}</h4>
                          <p className="text-[11px] text-neutral-500 leading-normal">{rev.comment}</p>
                        </div>

                        <div className="flex justify-between items-center border-t border-neutral-100/60 pt-2.5 mt-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-[#BC9D4E]/10 border border-[#BC9D4E]/30 flex items-center justify-center text-[9px] font-black text-[#BC9D4E]">
                              {rev.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <span className="text-[10px] font-black text-neutral-800">{rev.name}</span>
                          </div>
                          <span className="text-[9px] text-neutral-400 font-bold">{rev.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION: SIMILAR PRODUCTS GRID */}
              {similarItems.length > 0 && (
                <div className="mt-12 space-y-6 text-left">
                  <div className="border-b border-neutral-100 pb-4 flex justify-between items-end">
                    <div>
                      <h2 className="font-display font-black text-lg text-neutral-900 uppercase tracking-wide">Customers Also Viewed</h2>
                      <p className="text-[11px] text-neutral-400">Expand your style collection with these recommendations</p>
                    </div>
                    <span className="text-[10px] text-[#BC9D4E] font-black tracking-widest uppercase">Match Style / {selectedProduct.category}</span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {similarItems.map((prod) => {
                      const finalPrice = prod.variants && prod.variants.length > 0 ? (prod.variants[0].sellingPrice || prod.variants[0].price || prod.price) : prod.price;
                      return (
                        <div 
                          key={prod.id}
                          onClick={() => {
                            handleViewProduct(prod);
                            setActiveImageIdx(0);
                            setDetailQty(1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="bg-white rounded-2xl border border-neutral-100 hover:border-neutral-250 p-3 flex flex-col justify-between shadow-3xs hover:shadow-2xs transition-all duration-300 group cursor-pointer"
                        >
                          <div className="h-32 sm:h-40 bg-[#F5F5F4] rounded-xl flex items-center justify-center p-2 mb-3 relative overflow-hidden">
                            <img src={prod.images[0]} alt={prod.name} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                            <div className="absolute top-2 left-2 bg-black text-white text-[7.5px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full shadow-2xs">
                              {prod.brand}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-black text-xs text-neutral-900 group-hover:text-[#BC9D4E] transition-colors truncate">{prod.name}</h4>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-neutral-900">₹{finalPrice}</span>
                              <div className="flex items-center gap-0.5 bg-neutral-50 px-1.5 py-0.5 rounded-md">
                                <span className="text-[10px] font-bold text-neutral-700">{prod.rating}</span>
                                <span className="text-amber-500 text-[8px]">★</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* VIEW 4: DELIVERY SHOPPING BAG & CHECKOUT */}
        {screen === "cart" && (
          <motion.div
            key="cart"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="max-w-md md:max-w-3xl lg:max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-12"
          >
            {/* Header */}
            <div className="flex lg:hidden justify-between items-center mb-6">
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
              /* PREMIUM SUCCESS SCREEN (STEP 7) */
              <div className="bg-white rounded-[32px] p-8 border border-neutral-100 shadow-xl space-y-6 text-left max-w-xl mx-auto relative overflow-hidden animate-fade-in">
                {/* Green Ripple & Success Animation */}
                <div className="text-center space-y-2 pb-6 border-b border-neutral-100 relative">
                  <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                      className="absolute inset-0 bg-emerald-100 rounded-full"
                    />
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white relative z-10 shadow-md">
                      <CheckCircle size={32} />
                    </div>
                  </div>
                  <h2 className="font-display font-black text-2xl text-neutral-900 tracking-tight">Order Placed Successfully!</h2>
                  <p className="text-[11px] text-[#BC9D4E] font-black uppercase tracking-widest">
                    Receipt Ref: {lastPlacedOrder.id}
                  </p>
                </div>

                {/* Items Purchased */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Purchased Footwear</span>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {lastPlacedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 bg-neutral-50 p-2.5 rounded-2xl border border-neutral-100/60">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 border border-neutral-100 overflow-hidden shrink-0">
                          <img src={item.product.images[0]} alt="" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <h4 className="font-bold text-[11px] text-neutral-800 truncate leading-tight">{item.product.name}</h4>
                          <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 font-bold">
                            <span>Size: {item.selectedSize}</span>
                            <span>•</span>
                            <span>Color: {item.selectedColor}</span>
                            <span>•</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                          <span className="text-[10.5px] font-black text-neutral-900">₹{item.product.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping details */}
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 text-[11.5px] space-y-3">
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Delivery Information</span>
                  
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-neutral-200/55">
                    <div>
                      <span className="text-[8px] uppercase text-neutral-400 font-black block">Receiver Name</span>
                      <span className="font-bold text-neutral-800">{lastPlacedOrder.customerName}</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase text-neutral-400 font-black block">Contact Phone</span>
                      <span className="font-bold text-neutral-800">{lastPlacedOrder.customerPhone}</span>
                    </div>
                  </div>

                  <div className="pb-3 border-b border-neutral-200/55">
                    <span className="text-[8px] uppercase text-neutral-400 font-black block">Email Receipt Sent To</span>
                    <span className="font-bold text-neutral-800 break-all">{lastPlacedOrder.customerEmail}</span>
                  </div>

                  <div>
                    <span className="text-[8px] uppercase text-neutral-400 font-black block">Shipping Destination</span>
                    <p className="font-bold text-neutral-800 leading-normal text-[11px] mt-0.5">
                      {lastPlacedOrder.shippingAddress}
                    </p>
                  </div>
                </div>

                {/* Payment Breakdown & Info */}
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 space-y-3">
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Payment Information</span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500 font-medium">Method Selected</span>
                    <span className="font-black text-neutral-800 flex items-center gap-1.5">
                      {lastPlacedOrder.paymentMethod === "UPI" ? "⚡ Instant UPI QR" : "💵 Cash on Delivery"}
                    </span>
                  </div>

                  {lastPlacedOrder.paymentMethod === "UPI" && (
                    <div className="pt-3 border-t border-neutral-200/55 space-y-3 text-center">
                      <p className="text-[10px] text-purple-700 leading-relaxed font-bold">
                        Please finish transfer of <span className="text-black font-black">₹{lastPlacedOrder.totalAmount}</span> to store UPI ID:
                      </p>
                      <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-purple-100 text-[10.5px] font-mono font-bold">
                        <span>{adminUpiId}</span>
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(adminUpiId);
                            alert("Store UPI ID copied!");
                          }}
                          className="text-[9px] bg-neutral-100 hover:bg-neutral-200 px-2 py-0.5 rounded transition cursor-pointer font-bold border border-neutral-150"
                        >
                          Copy ID
                        </button>
                      </div>
                      <div className="border border-dashed border-purple-200 rounded-2xl p-3 bg-white inline-flex flex-col items-center justify-center mx-auto">
                        <QrCode size={50} className="text-purple-600 mb-1" />
                        <span className="text-[8px] font-black text-neutral-400 uppercase tracking-wider">Comfort Steps Scan</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs pt-3 border-t border-neutral-200/55">
                    <span className="text-neutral-500 font-bold">Total Settled</span>
                    <span className="font-black text-sm text-neutral-900">₹{lastPlacedOrder.totalAmount}</span>
                  </div>
                </div>

                {/* Call to Actions */}
                <div className="space-y-2.5 pt-3">
                  <button 
                    onClick={() => {
                      setIsOrderSuccess(false);
                      setScreen("my_orders");
                    }}
                    className="w-full py-3 bg-black hover:bg-neutral-900 text-white font-bold text-xs rounded-xl tracking-wider uppercase transition cursor-pointer text-center block"
                  >
                    Track Shipment Timeline
                  </button>
                  <button 
                    onClick={() => downloadInvoice(lastPlacedOrder)}
                    className="w-full py-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 font-bold text-xs rounded-xl border border-neutral-200 transition cursor-pointer text-center block"
                  >
                    Download Luxury PDF Invoice
                  </button>
                  <button 
                    onClick={() => {
                      setIsOrderSuccess(false);
                      setScreen("dashboard");
                      setActiveTab("store");
                    }}
                    className="w-full py-2 bg-white hover:bg-neutral-50 text-neutral-400 font-bold text-[10px] tracking-wider uppercase transition cursor-pointer text-center block"
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
            ) : isCheckoutOpen ? (
              /* --- EXTREMELY PREMIUM MULTI-STEP CHECKOUT (STEPS 1 TO 6) --- */
              <div className="space-y-8 text-left max-w-5xl mx-auto">
                {/* Steps Horizontal Progress Bar */}
                <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-3xs flex justify-between items-center max-w-xl mx-auto">
                  {[
                    { step: "address", label: "Address", num: 1 },
                    { step: "summary", label: "Order Summary", num: 2 },
                    { step: "payment", label: "Payment", num: 3 },
                  ].map((item, idx) => {
                    const isCompleted = 
                      (item.step === "address" && (checkoutStep === "summary" || checkoutStep === "payment" || checkoutStep === "success")) ||
                      (item.step === "summary" && (checkoutStep === "payment" || checkoutStep === "success"));
                    const isActive = checkoutStep === item.step;

                    return (
                      <div key={item.step} className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${
                          isCompleted ? "bg-[#BC9D4E] text-white" :
                          isActive ? "bg-black text-white ring-4 ring-neutral-100" :
                          "bg-neutral-100 text-neutral-400"
                        }`}>
                          {isCompleted ? "✓" : item.num}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          isActive ? "text-neutral-900 font-black" : "text-neutral-400"
                        }`}>
                          {item.label}
                        </span>
                        {idx < 2 && <span className="text-neutral-200 text-[10px] font-bold px-0.5">/</span>}
                      </div>
                    );
                  })}
                </div>

                {/* STEP 1: LOGIN WIZARD */}
                {checkoutStep === "login" && (
                  <div className="text-center py-12 bg-white rounded-3xl border border-neutral-100 max-w-md mx-auto space-y-4">
                    <div className="w-8 h-8 border-4 border-[#BC9D4E] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-bold text-neutral-500">Initializing Secure Address Selection...</p>
                    {(() => {
                      setTimeout(() => setCheckoutStep("address"), 100);
                      return null;
                    })()}
                  </div>
                )}

                {/* STEP 2: ADDRESS MANAGEMENT */}
                {checkoutStep === "address" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Saved Addresses and Create/Edit Address Form */}
                    <div className="lg:col-span-8 space-y-6">
                      <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                        <h3 className="font-display font-black text-sm uppercase tracking-widest text-[#BC9D4E]">
                          {isAddressFormOpen ? "Address Details" : "Choose a Delivery Address"}
                        </h3>
                        {!isAddressFormOpen && (
                          <button
                            onClick={() => {
                              setEditingAddressId(null);
                              setAddrForm({
                                fullName: "",
                                phone: "",
                                flatHouse: "",
                                buildingName: "",
                                area: "",
                                locality: "",
                                landmark: "",
                                city: "",
                                state: "",
                                pinCode: "",
                                alternatePhone: "",
                                addressType: "Home"
                              });
                              setIsAddressFormOpen(true);
                            }}
                            className="bg-black border border-[#BC9D4E]/50 text-[#BC9D4E] text-[9px] font-black tracking-widest uppercase px-4 py-2 rounded hover:bg-neutral-900 transition flex items-center gap-1.5"
                          >
                            + Add New Address
                          </button>
                        )}
                      </div>

                      {isAddressFormOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white border border-neutral-200 rounded-3xl p-6 space-y-5 shadow-sm text-left"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                            <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider">
                              {editingAddressId ? "Modify Shipping Destination" : "Add Premium Delivery Address"}
                            </h4>
                            
                            {/* GPS Button */}
                            <button
                              type="button"
                              onClick={detectLocation}
                              disabled={isDetectingLocation}
                              className="px-3 py-1.5 bg-[#BC9D4E]/10 hover:bg-[#BC9D4E]/20 text-[#BC9D4E] rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition"
                            >
                              {isDetectingLocation ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-[#BC9D4E] border-t-transparent rounded-full animate-spin" />
                                  Detecting GPS...
                                </>
                              ) : (
                                "📍 Auto-Detect Location"
                              )}
                            </button>
                          </div>

                          {locationDetectionError && (
                            <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 p-2 rounded-xl font-bold">
                              ⚠️ GPS auto-fill hint: {locationDetectionError}
                            </p>
                          )}

                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (!/^\d{10}$/.test(addrForm.phone)) {
                                alert("Validation Fail: Phone number must be exactly 10 digits.");
                                return;
                              }
                              if (addrForm.alternatePhone && !/^\d{10}$/.test(addrForm.alternatePhone)) {
                                alert("Validation Fail: Alternate phone number must be exactly 10 digits.");
                                return;
                              }
                              if (!/^\d{6}$/.test(addrForm.pinCode)) {
                                alert("Validation Fail: PIN Code must be exactly 6 digits.");
                                return;
                              }

                              const newAddressId = editingAddressId || `addr-${Date.now()}`;
                              const freshAddr = {
                                ...addrForm,
                                id: newAddressId,
                                isDefault: addresses.length === 0
                              };

                              if (editingAddressId) {
                                setAddresses(prev => prev.map(a => a.id === editingAddressId ? freshAddr : a));
                                setEditingAddressId(null);
                              } else {
                                setAddresses(prev => [...prev, freshAddr]);
                              }

                              // Auto-select the newly saved address
                              setSelectedAddressId(newAddressId);
                              setIsAddressFormOpen(false);
                            }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block mb-1">Full Name *</label>
                                <input required type="text" value={addrForm.fullName} onChange={(e) => setAddrForm(p => ({ ...p, fullName: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white" placeholder="Vanish Teke" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block mb-1">Contact Phone (10-digit) *</label>
                                <input required type="tel" pattern="[0-9]{10}" maxLength={10} value={addrForm.phone} onChange={(e) => setAddrForm(p => ({ ...p, phone: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white" placeholder="9876543210" />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block mb-1">Alternate Phone (Optional)</label>
                                <input type="tel" pattern="[0-9]{10}" maxLength={10} value={addrForm.alternatePhone} onChange={(e) => setAddrForm(p => ({ ...p, alternatePhone: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white" placeholder="Alternate Mobile Number" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block mb-1">Address Type *</label>
                                <div className="flex gap-2.5">
                                  {(["Home", "Work"] as const).map((type) => (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() => setAddrForm(p => ({ ...p, addressType: type }))}
                                      className={`flex-1 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider transition ${
                                        addrForm.addressType === type
                                          ? "bg-black text-[#BC9D4E] border-[#BC9D4E]"
                                          : "bg-neutral-50 text-neutral-500 border-neutral-200 hover:bg-neutral-100"
                                      }`}
                                    >
                                      {type}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block mb-1">Flat / House No. *</label>
                                <input required type="text" value={addrForm.flatHouse} onChange={(e) => setAddrForm(p => ({ ...p, flatHouse: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white" placeholder="e.g. Apartment 405" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block mb-1">Building / Apartment Name *</label>
                                <input required type="text" value={addrForm.buildingName} onChange={(e) => setAddrForm(p => ({ ...p, buildingName: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white" placeholder="e.g. Royal Gold Residency" />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block mb-1">Area / Street *</label>
                                <input required type="text" value={addrForm.area} onChange={(e) => setAddrForm(p => ({ ...p, area: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white" placeholder="e.g. Koregaon Park Street 5" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block mb-1">Locality / Town *</label>
                                <input required type="text" value={addrForm.locality} onChange={(e) => setAddrForm(p => ({ ...p, locality: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white" placeholder="e.g. Ghorpadi" />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block mb-1">Landmark (Optional)</label>
                                <input type="text" value={addrForm.landmark} onChange={(e) => setAddrForm(p => ({ ...p, landmark: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white" placeholder="e.g. Near Westin Hotel" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block mb-1">City / District *</label>
                                <input required type="text" value={addrForm.city} onChange={(e) => setAddrForm(p => ({ ...p, city: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white" placeholder="e.g. Pune" />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block mb-1">State *</label>
                                <input required type="text" value={addrForm.state} onChange={(e) => setAddrForm(p => ({ ...p, state: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white" placeholder="e.g. Maharashtra" />
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block mb-1">PIN Code (6-digit) *</label>
                              <input required type="tel" pattern="[0-9]{6}" maxLength={6} value={addrForm.pinCode} onChange={(e) => setAddrForm(p => ({ ...p, pinCode: e.target.value }))} className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white" placeholder="411001" />
                            </div>

                            <div className="flex gap-3 pt-3">
                              <button type="submit" className="flex-1 py-2.5 bg-black hover:bg-neutral-900 text-[#BC9D4E] font-bold text-xs rounded-xl tracking-wider uppercase border border-[#BC9D4E]/30 transition">
                                Save Address
                              </button>
                              <button type="button" onClick={() => setIsAddressFormOpen(false)} className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs rounded-xl transition">
                                Cancel
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      )}

                      {/* Saved Addresses List */}
                      {!isAddressFormOpen && (
                        <div className="space-y-3.5">
                          {addresses.length === 0 ? (
                            <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-3xl p-8 text-center space-y-3">
                              <MapPin size={32} className="text-neutral-300 mx-auto" />
                              <p className="text-xs text-neutral-500 font-medium">No shipping addresses saved yet.</p>
                              <button
                                onClick={() => setIsAddressFormOpen(true)}
                                className="bg-black text-[#BC9D4E] border border-[#BC9D4E]/30 text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-lg"
                              >
                                + Add First Address
                              </button>
                            </div>
                          ) : (
                            addresses.map((addr) => {
                              const isSelected = selectedAddressId === addr.id;
                              return (
                                <div 
                                  key={addr.id}
                                  onClick={() => setSelectedAddressId(addr.id)}
                                  className={`bg-white rounded-2xl p-4.5 border transition-all cursor-pointer text-left relative ${
                                    isSelected 
                                      ? "border-black ring-2 ring-[#BC9D4E]/40 shadow-sm bg-neutral-50/20" 
                                      : "border-neutral-150 hover:border-neutral-300"
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex gap-3.5">
                                      <input 
                                        type="radio" 
                                        name="deliveryAddress" 
                                        checked={isSelected}
                                        onChange={() => setSelectedAddressId(addr.id)}
                                        className="mt-1 accent-black cursor-pointer scale-105"
                                      />
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-neutral-900 text-xs">
                                            {addr.fullName}
                                          </span>
                                          <span className="bg-neutral-100 text-neutral-500 text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-md">
                                            {addr.addressType || "Home"}
                                          </span>
                                          {addr.isDefault && (
                                            <span className="bg-[#BC9D4E]/10 text-[#BC9D4E] text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded">
                                              Default
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-neutral-600 leading-normal font-medium">
                                          {addr.flatHouse}, {addr.buildingName}, {addr.area}, {addr.locality}, Landmark: {addr.landmark || "N/A"}, {addr.city}, {addr.state} - <span className="font-bold text-neutral-900">{addr.pinCode}</span>
                                        </p>
                                        <div className="text-[10px] text-neutral-500 font-bold flex flex-col gap-0.5">
                                          <span>Phone: {addr.phone}</span>
                                          {addr.alternatePhone && <span>Alternate Phone: {addr.alternatePhone}</span>}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <button 
                                        onClick={() => {
                                          setEditingAddressId(addr.id);
                                          setAddrForm({ ...addr });
                                          setIsAddressFormOpen(true);
                                        }}
                                        className="text-neutral-500 hover:text-black p-1.5 hover:bg-neutral-50 rounded-lg transition"
                                      >
                                        <Edit size={13} />
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setAddresses(prev => prev.filter(a => a.id !== addr.id));
                                          if (selectedAddressId === addr.id) setSelectedAddressId("");
                                        }}
                                        className="text-neutral-400 hover:text-rose-500 p-1.5 hover:bg-neutral-50 rounded-lg transition"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>

                                  {!addr.isDefault && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addr.id })));
                                      }}
                                      className="text-[9px] text-[#BC9D4E] hover:underline font-extrabold tracking-wider uppercase mt-3.5 block ml-7"
                                    >
                                      Set as Default Shipping Address
                                    </button>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Left/Right Column: Sticky checkout status summary */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-md space-y-4 text-left">
                        <h4 className="font-display font-bold text-[10px] uppercase tracking-widest text-neutral-400 border-b border-neutral-50 pb-2">
                          Price Details
                        </h4>
                        <div className="space-y-1.5 text-xs text-neutral-500">
                          <div className="flex justify-between">
                            <span>Bag Items Subtotal</span>
                            <span className="font-bold text-neutral-800">₹{totalCartPrice}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Shipping & Handover</span>
                            <span className="text-emerald-600 font-bold">FREE</span>
                          </div>
                          <div className="border-t border-neutral-50 pt-2.5 mt-2.5 flex justify-between font-black text-neutral-900 text-sm">
                            <span>Total Payable</span>
                            <span>₹{totalCartPrice}</span>
                          </div>
                        </div>

                        <button
                          disabled={!selectedAddressId}
                          onClick={() => setCheckoutStep("summary")}
                          className={`w-full py-3.5 text-white font-bold text-xs rounded-xl tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            selectedAddressId 
                              ? "bg-black hover:bg-neutral-900 text-[#BC9D4E] border border-[#BC9D4E]/25" 
                              : "bg-neutral-200 text-neutral-400 cursor-not-allowed border-neutral-200"
                          }`}
                        >
                          Confirm & Continue <ChevronRight size={14} />
                        </button>
                        
                        {!selectedAddressId && (
                          <p className="text-[10px] text-amber-600 font-bold text-center">
                            Please select/add a delivery address to proceed.
                          </p>
                        )}
                      </div>

                      <button onClick={() => setIsCheckoutOpen(false)} className="text-xs text-neutral-400 hover:text-black font-extrabold flex items-center gap-1.5 mx-auto">
                        <ChevronLeft size={14} /> Back to Bag
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: ORDER SUMMARY & OFFERS */}
                {checkoutStep === "summary" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-6">
                      {/* Active address summary widget */}
                      <div className="bg-white rounded-3xl p-5 border border-[#BC9D4E]/30 shadow-sm text-left space-y-3">
                        <div className="flex justify-between items-center border-b border-neutral-100 pb-2">
                          <span className="text-[10px] font-black text-[#BC9D4E] uppercase tracking-widest block">Deliver to this Address</span>
                          <button onClick={() => setCheckoutStep("address")} className="text-[10px] text-black hover:text-[#BC9D4E] font-black uppercase tracking-widest flex items-center gap-1 transition">
                            Edit / Change Address
                          </button>
                        </div>
                        {(() => {
                          const active = addresses.find(a => a.id === selectedAddressId) || addresses[0];
                          if (!active) {
                            return (
                              <p className="text-xs text-amber-600 font-bold">No shipping address selected. Please go back to Step 1.</p>
                            );
                          }
                          return (
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-neutral-900">{active.fullName}</span>
                                <span className="bg-neutral-100 text-neutral-500 text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-md">
                                  {active.addressType || "Home"}
                                </span>
                              </div>
                              <p className="text-neutral-600 leading-relaxed font-medium">
                                {active.flatHouse}, {active.buildingName}, {active.area}, {active.locality}, {active.landmark ? `Landmark: ${active.landmark}, ` : ""}{active.city}, {active.state} - <span className="font-bold text-neutral-900">{active.pinCode}</span>
                              </p>
                              <div className="text-[11px] text-neutral-500 font-bold flex gap-3 mt-1">
                                <span>📞 {active.phone}</span>
                                {active.alternatePhone && <span>📞 Alt: {active.alternatePhone}</span>}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Items Reviewed summary */}
                      <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-sm space-y-4 text-left">
                        <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-2 flex justify-between items-center">
                          <span>Items Reviewed</span>
                          <span className="text-[#BC9D4E]">{cart.reduce((sum, i) => sum + i.quantity, 0)} Items</span>
                        </h4>

                        <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
                          {cart.map((item, idx) => (
                            <div key={idx} className="flex gap-4 p-3 bg-neutral-50/60 rounded-2xl border border-neutral-100 transition hover:border-neutral-200">
                              <div className="w-16 h-16 bg-white rounded-xl border border-neutral-150 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                                <img src={item.product.images[0]} alt="" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                <h4 className="font-bold text-xs text-neutral-900 truncate leading-tight">{item.product.name}</h4>
                                <div className="flex items-center gap-1.5 text-[9.5px] text-neutral-500 font-bold">
                                  <span>Color: {item.selectedColor}</span>
                                  <span>•</span>
                                  <span>Size: {item.selectedSize}</span>
                                  <span>•</span>
                                  <span>Qty: {item.quantity}</span>
                                </div>
                                <span className="text-xs font-black text-neutral-950">₹{item.product.price}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Dispatch timer notification banner */}
                        <div className="bg-[#BC9D4E]/5 border border-[#BC9D4E]/25 rounded-2xl p-4 flex items-center gap-3">
                          <div className="text-xl">⏳</div>
                          <div className="space-y-0.5">
                            <span className="text-[9.5px] font-black text-[#BC9D4E] uppercase tracking-wider block">Est. Dispatch Deadline</span>
                            <p className="text-[11px] text-neutral-600 font-medium">
                              Order within <span className="font-black text-black">{countdownStr}</span> to unlock guaranteed <span className="font-bold text-neutral-900">Express Next-Day Ship handover</span>!
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Offers coupon selection wizard */}
                      <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-sm space-y-4 text-left">
                        <h4 className="text-xs font-black text-neutral-900 uppercase tracking-wider border-b border-neutral-100 pb-2">
                          Promo Offer Code
                        </h4>
                        <div className="flex gap-3">
                          <input 
                            type="text" 
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value);
                              setCouponError(null);
                            }}
                            placeholder="PROMO CODE"
                            className="flex-1 bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white uppercase font-bold"
                          />
                          <button 
                            onClick={() => {
                              const upper = couponInput.toUpperCase().trim();
                              const match = AVAILABLE_COUPONS.find(c => c.code === upper);
                              if (match) {
                                setAppliedCoupon({ code: match.code, discount: match.discount, type: match.type as any });
                                setCouponError(null);
                              } else {
                                setCouponError("Invalid promo code. Try WELCOME200 or GOLDSTORE.");
                              }
                            }}
                            className="px-5 py-2 bg-black text-[#BC9D4E] border border-[#BC9D4E]/30 text-xs font-bold rounded-xl hover:bg-neutral-900 transition"
                          >
                            Apply
                          </button>
                        </div>

                        {couponError && (
                          <p className="text-[10px] text-rose-500 font-bold">{couponError}</p>
                        )}

                        {appliedCoupon && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex justify-between items-center">
                            <div className="space-y-0.5 text-left">
                              <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-700">Active Coupon Code</span>
                              <p className="text-xs font-black text-emerald-800">{appliedCoupon.code} Saved ₹{
                                appliedCoupon.type === "percent" ? Math.round((totalCartPrice * appliedCoupon.discount) / 100) : appliedCoupon.discount
                              }!</p>
                            </div>
                            <button 
                              onClick={() => setAppliedCoupon(null)}
                              className="text-[10px] text-rose-600 hover:underline font-extrabold uppercase tracking-widest"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {/* List of Available coupons */}
                        <div className="space-y-3 pt-2">
                          <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Available Premium Offers</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {AVAILABLE_COUPONS.map(cp => (
                              <div key={cp.code} className="border border-neutral-150 rounded-xl p-3 bg-neutral-50/20 flex justify-between items-center text-left hover:border-neutral-250 transition animate-fade-in">
                                <div>
                                  <span className="font-mono font-black text-[11px] text-neutral-900 bg-white border border-neutral-200 px-2 py-0.5 rounded shadow-3xs uppercase">{cp.code}</span>
                                  <p className="text-[10px] text-[#8E8E8A] font-medium mt-1 leading-normal">{cp.desc}</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    setAppliedCoupon({ code: cp.code, discount: cp.discount, type: cp.type as any });
                                    setCouponInput(cp.code);
                                    setCouponError(null);
                                  }}
                                  className="text-[10px] text-[#BC9D4E] hover:text-black font-black uppercase tracking-wider shrink-0 ml-2"
                                >
                                  Apply
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Sticky right panel */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="bg-white rounded-3xl p-5 border border-neutral-200 shadow-md space-y-4 text-left">
                        <h4 className="font-display font-bold text-[10px] uppercase tracking-widest text-neutral-400 border-b border-neutral-100 pb-2">
                          Price Details
                        </h4>

                        {(() => {
                          const subtotal = totalCartPrice;
                          let couponDsc = 0;
                          if (appliedCoupon) {
                            if (appliedCoupon.type === "percent") {
                              couponDsc = Math.round((subtotal * appliedCoupon.discount) / 100);
                            } else {
                              couponDsc = appliedCoupon.discount;
                            }
                          }
                          const gstTax = Math.round((subtotal - couponDsc) * 0.18); // 18% included GST
                          const shipping = subtotal >= 2999 ? 0 : 150;
                          const totalToPay = subtotal - couponDsc + shipping;

                          return (
                            <div className="space-y-2 text-xs text-neutral-500">
                              <div className="flex justify-between">
                                <span>Bag Items Total</span>
                                <span className="font-bold text-neutral-800">₹{subtotal}</span>
                              </div>
                              {couponDsc > 0 && (
                                <div className="flex justify-between text-emerald-600 font-bold">
                                  <span>Promo Discount ({appliedCoupon?.code})</span>
                                  <span>-₹{couponDsc}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>GST (18% Included)</span>
                                <span className="font-bold text-neutral-700">₹{gstTax}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Premium Shipping</span>
                                <span className={shipping === 0 ? "text-emerald-600 font-bold" : "font-bold text-neutral-800"}>
                                  {shipping === 0 ? "FREE" : `₹${shipping}`}
                                </span>
                              </div>
                              <div className="border-t border-neutral-100 pt-2.5 mt-2.5 flex justify-between font-black text-neutral-900 text-sm">
                                <span>Final Payable Total</span>
                                <span>₹{totalToPay}</span>
                              </div>
                            </div>
                          );
                        })()}

                        <button
                          onClick={() => setCheckoutStep("payment")}
                          className="w-full py-3.5 bg-black hover:bg-neutral-900 text-[#BC9D4E] border border-[#BC9D4E]/25 font-bold text-xs rounded-xl tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          Proceed to Payment <ChevronRight size={14} />
                        </button>
                      </div>

                      <button onClick={() => setCheckoutStep("address")} className="text-xs text-neutral-400 hover:text-black font-extrabold flex items-center gap-1.5 mx-auto">
                        <ChevronLeft size={14} /> Back to Shipping Address
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: PAYMENT SELECTION */}
                {checkoutStep === "payment" && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-5">
                      <div className="border-b border-neutral-100 pb-3 flex justify-between items-center">
                        <h3 className="font-display font-black text-sm uppercase tracking-widest text-[#BC9D4E]">
                          Choose Payment Option
                        </h3>
                        {/* Simulation Toggle */}
                        <button
                          type="button"
                          onClick={() => setIsPaymentFailed(prev => !prev)}
                          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition ${
                            isPaymentFailed 
                              ? "bg-rose-100 text-rose-700 border border-rose-200" 
                              : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 border border-neutral-200"
                          }`}
                        >
                          {isPaymentFailed ? "🔴 Simulate Failed State Active" : "🟢 Set Simulated Failure (Off)"}
                        </button>
                      </div>

                      {isPaymentFailed && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-rose-50 border border-rose-200 rounded-3xl p-5 text-left space-y-2.5"
                        >
                          <div className="flex items-center gap-2 text-rose-600">
                            <span className="text-lg">❌</span>
                            <span className="font-extrabold text-xs uppercase tracking-wider">Payment Transaction Failure simulated</span>
                          </div>
                          <p className="text-[11px] text-rose-800 leading-relaxed font-medium">
                            Your transaction could not be completed because the simulated checkout flag is active. Please toggle the simulation flag off above or try a different payment mode to proceed.
                          </p>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-2 gap-3.5">
                        {([
                          { key: "UPI", label: "Instant UPI Transfer", icon: "⚡" },
                          { key: "COD", label: "Cash on Delivery (COD)", icon: "💵" }
                        ] as const).map(pm => {
                          const isSelected = paymentMethod === pm.key;
                          return (
                            <button
                              key={pm.key}
                              type="button"
                              onClick={() => {
                                setPaymentMethod(pm.key);
                                if (pm.key === "COD") {
                                  setSelectedUpiApp(null);
                                } else {
                                  setSelectedUpiApp("GPay");
                                }
                              }}
                              className={`p-4 rounded-2xl border text-left transition flex flex-col gap-1.5 ${
                                isSelected ? "border-black bg-neutral-50/20 shadow-xs" : "border-neutral-100 hover:bg-neutral-50"
                              }`}
                            >
                              <span className="text-xl">{pm.icon}</span>
                              <span className="font-black text-xs text-neutral-900">{pm.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {paymentMethod === "UPI" && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-3xs text-center space-y-5"
                        >
                          <div className="space-y-1.5 text-center">
                            <span className="text-[9px] font-black text-[#BC9D4E] uppercase tracking-widest block">Authorized Payment Gateway</span>
                            <h4 className="font-display font-black text-xs text-neutral-900 uppercase tracking-wider">Select Preferred UPI Application</h4>
                          </div>

                          {/* App choices */}
                          <div className="grid grid-cols-5 gap-2">
                            {([
                              { name: "GPay", label: "Google Pay", icon: "💎" },
                              { name: "PhonePe", label: "PhonePe", icon: "🔮" },
                              { name: "Paytm", label: "Paytm", icon: "🏦" },
                              { name: "AmazonPay", label: "Amazon Pay", icon: "📦" },
                              { name: "Other", label: "Other UPI", icon: "✨" }
                            ]).map((app) => {
                              const isAppSel = selectedUpiApp === app.name;
                              return (
                                <button
                                  key={app.name}
                                  type="button"
                                  onClick={() => {
                                    setSelectedUpiApp(app.name);
                                    setUpiInputError(null);
                                  }}
                                  className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                                    isAppSel 
                                      ? "bg-black text-[#BC9D4E] border-[#BC9D4E]" 
                                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                                  }`}
                                >
                                  <span className="text-sm">{app.icon}</span>
                                  <span className="text-[9px] font-black uppercase tracking-wider">{app.name}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Custom fields for Other UPI app */}
                          {selectedUpiApp === "Other" && (
                            <div className="text-left space-y-2 max-w-sm mx-auto">
                              <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block">Enter Your VPA / UPI ID *</label>
                              <input 
                                required
                                type="text" 
                                value={otherUpiId}
                                onChange={(e) => setOtherUpiId(e.target.value)}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white font-mono"
                                placeholder="username@upi"
                              />
                              {upiInputError && (
                                <p className="text-[10px] text-rose-500 font-bold">{upiInputError}</p>
                              )}
                            </div>
                          )}

                          <div className="relative border border-dashed border-neutral-200 rounded-2xl p-4 bg-neutral-50 inline-flex flex-col items-center justify-center mx-auto">
                            <QrCode size={130} className="text-black" />
                            <span className="text-[8px] font-extrabold text-neutral-400 uppercase mt-2 tracking-widest">Comfort Steps Verified Merchant</span>
                            {paymentVerifying && (
                              <div className="absolute inset-0 bg-white/90 rounded-2xl flex flex-col items-center justify-center space-y-3 p-4">
                                <div className="w-8 h-8 border-4 border-[#BC9D4E] border-t-transparent rounded-full animate-spin" />
                                <p className="text-[10px] font-black text-neutral-700">Checking Bank Settlement Log... Please wait</p>
                              </div>
                            )}
                          </div>

                          <div className="max-w-xs mx-auto space-y-3.5">
                            <div className="flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-xl border border-neutral-100 text-xs font-bold text-neutral-800">
                              <span className="font-mono">{adminUpiId}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(adminUpiId);
                                  alert("Store UPI ID copied!");
                                }}
                                className="text-[9.5px] text-black bg-white hover:bg-neutral-100 border border-neutral-200 px-2 py-1 rounded-md transition font-black flex items-center gap-1 cursor-pointer"
                              >
                                <Copy size={10} /> Copy ID
                              </button>
                            </div>
                            <p className="text-[10.5px] text-neutral-400 leading-relaxed font-medium">
                              Submit settlement to our authorized store UPI ID. Click checkout below to instantly verify payment and confirm.
                            </p>

                            <div className="text-left space-y-1 max-w-sm mx-auto">
                              <label className="text-[9px] uppercase tracking-wider font-extrabold text-[#8E8E8A] block">Transaction Reference ID (12-digit, optional)</label>
                              <input 
                                type="text"
                                maxLength={12}
                                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white font-mono"
                                placeholder="e.g. 123456789012"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {paymentMethod === "COD" && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-amber-50/40 rounded-3xl p-5 border border-amber-200/50 space-y-3 text-left"
                        >
                          <div className="text-xl">⚠️</div>
                          <h4 className="font-extrabold text-xs text-amber-900 uppercase tracking-wide">Cash on Delivery Shipment policy</h4>
                          <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                            We charge an additional convenience fee of <span className="font-black text-black">₹50</span> to cover the shipping carrier's cash handling logs. Enjoy FREE next-day dispatch and skip the fee by paying via UPI!
                          </p>
                        </motion.div>
                      )}
                    </div>

                    {/* Breakdown Sticky Right column */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-md space-y-4 text-left">
                        <h4 className="font-display font-bold text-[10px] uppercase tracking-widest text-neutral-400 border-b border-[#F5F5F4] pb-2">
                          Amount Settled
                        </h4>

                        {(() => {
                          const subtotal = totalCartPrice;
                          let couponDsc = 0;
                          if (appliedCoupon) {
                            if (appliedCoupon.type === "percent") {
                              couponDsc = Math.round((subtotal * appliedCoupon.discount) / 100);
                            } else {
                              couponDsc = appliedCoupon.discount;
                            }
                          }
                          const shipping = subtotal >= 2999 ? 0 : 150;
                          const codFee = paymentMethod === "COD" ? 50 : 0;
                          const totalToPay = subtotal - couponDsc + shipping + codFee;

                          return (
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between text-neutral-500">
                                <span>Footwear Purchase</span>
                                <span className="font-bold text-neutral-800">₹{subtotal - couponDsc}</span>
                              </div>
                              {codFee > 0 && (
                                <div className="flex justify-between text-neutral-500">
                                  <span>COD convenience Charge</span>
                                  <span className="font-bold text-neutral-800">₹{codFee}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-neutral-500">
                                <span>Premium Shipping</span>
                                <span className="font-bold text-neutral-800">₹{shipping}</span>
                              </div>
                              <div className="border-t border-neutral-50 pt-2.5 mt-2.5 flex justify-between font-black text-neutral-900 text-sm">
                                <span>Amount Payable</span>
                                <span>₹{totalToPay}</span>
                              </div>

                              <button
                                disabled={paymentVerifying}
                                onClick={async () => {
                                  if (isPaymentFailed) {
                                    alert("Simulated Transaction Error: Payment Failed! Please check your credentials or switch payment modes.");
                                    return;
                                  }
                                  
                                  if (paymentMethod === "UPI" && selectedUpiApp === "Other" && !otherUpiId.includes("@")) {
                                    setUpiInputError("Validation Fail: Please enter a valid UPI ID (e.g. username@upi)");
                                    return;
                                  }

                                  handlePlacePremiumOrder(paymentMethod as any, selectedUpiApp || undefined);
                                }}
                                className="w-full mt-4 py-3 bg-black hover:bg-neutral-900 text-white font-bold text-xs rounded-xl tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                {paymentVerifying ? (
                                  <>Verifying Settlement...</>
                                ) : (
                                  <>{paymentMethod === "UPI" ? `Verify & Place Order (₹${totalToPay})` : `Confirm & Place Order (₹${totalToPay})`}</>
                                )}
                              </button>
                            </div>
                          );
                        })()}
                      </div>

                      <button onClick={() => setCheckoutStep("summary")} className="text-xs text-neutral-400 hover:text-black font-extrabold flex items-center gap-1.5 mx-auto">
                        <ChevronLeft size={14} /> Back to Summary
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* --- EXTREMELY PREMIUM SHOPPING BAG VIEW WITH PROGRESS BAR --- */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
                {/* Left Column: Cart Items List */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Free shipping progress progressbar */}
                  {(() => {
                    const freeShippingThreshold = 2999;
                    const isFree = totalCartPrice >= freeShippingThreshold;
                    const diff = freeShippingThreshold - totalCartPrice;
                    const percent = Math.min(100, (totalCartPrice / freeShippingThreshold) * 100);

                    return (
                      <div className="bg-white rounded-2xl p-4 border border-neutral-100 shadow-3xs space-y-2.5 text-left">
                        <div className="flex justify-between text-[11px] font-bold">
                          {isFree ? (
                            <span className="text-emerald-600 font-extrabold">🎉 Congratulations! You have unlocked FREE Express Delivery!</span>
                          ) : (
                            <span className="text-neutral-500">Add <span className="text-black font-black">₹{diff}</span> more to unlock <span className="font-extrabold text-neutral-900">FREE Luxury Express Delivery</span></span>
                          )}
                          <span className="text-[#BC9D4E] font-black">{Math.round(percent)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-black rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${percent}%`,
                              backgroundColor: isFree ? "#10b981" : "#BC9D4E"
                            }} 
                          />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-3">
                    {cart.map((item, idx) => (
                      <div 
                        key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
                        className="bg-white rounded-[24px] p-4 border border-neutral-100/60 flex gap-4 shadow-3xs hover:border-neutral-200 transition duration-300"
                      >
                        {/* Image stage (Click to go to details) */}
                        <div 
                          onClick={() => {
                            handleViewProduct(item.product);
                            setActiveImageIdx(0);
                            setDetailQty(1);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-20 h-20 bg-[#F5F5F4] rounded-2xl overflow-hidden flex items-center justify-center p-1.5 shrink-0 cursor-pointer hover:scale-105 transition"
                        >
                          <img src={item.product.images[0]} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <h3 
                                onClick={() => {
                                  handleViewProduct(item.product);
                                  setActiveImageIdx(0);
                                  setDetailQty(1);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="font-black text-xs text-neutral-900 truncate leading-tight cursor-pointer hover:text-[#BC9D4E] transition"
                              >
                                {item.product.name}
                              </h3>
                              <button 
                                onClick={() => updateCartQty(idx, -item.quantity)}
                                className="text-neutral-400 hover:text-black p-0.5 transition"
                              >
                                <X size={13} />
                              </button>
                            </div>
                            <span className="text-[9px] text-[#BC9D4E] font-black uppercase tracking-widest block mt-0.5">{item.product.brand}</span>
                            
                            {/* Editable size and color inline select selectors */}
                            <div className="flex items-center gap-2.5 mt-2">
                              {/* Editable Size selection dropdown */}
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] text-neutral-400 font-bold uppercase">Size:</span>
                                <select
                                  value={item.selectedSize}
                                  onChange={(e) => {
                                    const updated = [...cart];
                                    updated[idx].selectedSize = e.target.value;
                                    setCart(updated);
                                  }}
                                  className="text-[9px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-1.5 py-0.5 rounded font-black text-neutral-800 focus:outline-none cursor-pointer"
                                >
                                  {item.product.sizes.map(sz => (
                                    <option key={sz} value={sz}>{sz}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Editable Color selection dropdown */}
                              <div className="flex items-center gap-1">
                                <span className="text-[8px] text-neutral-400 font-bold uppercase">Color:</span>
                                <select
                                  value={item.selectedColor}
                                  onChange={(e) => {
                                    const updated = [...cart];
                                    updated[idx].selectedColor = e.target.value;
                                    setCart(updated);
                                  }}
                                  className="text-[9px] bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 px-1.5 py-0.5 rounded font-extrabold text-neutral-800 focus:outline-none cursor-pointer"
                                >
                                  {(item.product.colors && item.product.colors.length > 0 ? item.product.colors : ["Natural"]).map(cl => (
                                    <option key={cl} value={cl}>{cl}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-3">
                            <span className="text-xs font-black text-neutral-900">₹{item.product.price}</span>
                            
                            <div className="flex items-center gap-2.5">
                              {/* Move to Wishlist button */}
                              <button
                                onClick={() => {
                                  if (!favorites.includes(item.product.id)) {
                                    toggleFavorite(item.product.id);
                                  }
                                  updateCartQty(idx, -item.quantity);
                                  alert("Item moved to your Wishlist!");
                                }}
                                className="text-[10px] text-neutral-400 hover:text-[#BC9D4E] font-extrabold cursor-pointer transition"
                              >
                                Move to Wishlist
                              </button>

                              <div className="flex items-center gap-2 bg-neutral-50 rounded-lg p-0.5 border border-neutral-150">
                                <button onClick={() => updateCartQty(idx, -1)} className="p-1 hover:bg-white rounded text-neutral-600 transition cursor-pointer">
                                  <Minus size={9} />
                                </button>
                                <span className="text-xs font-black px-1 text-neutral-800">{item.quantity}</span>
                                <button onClick={() => updateCartQty(idx, 1)} className="p-1 hover:bg-white rounded text-neutral-600 transition cursor-pointer">
                                  <Plus size={9} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: Order Summary Card */}
                <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
                  <div className="bg-white rounded-3xl p-5 border border-neutral-100 shadow-md space-y-4">
                    <h4 className="font-display font-bold text-[10px] uppercase tracking-widest text-neutral-400 border-b border-[#F5F5F4] pb-2">
                      Order Summary
                    </h4>

                    <div className="space-y-1.5 text-xs text-neutral-500">
                      <div className="flex justify-between">
                        <span>Bag Items Subtotal</span>
                        <span className="font-bold text-neutral-800">₹{totalCartPrice}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Premium Delivery</span>
                        <span className="text-[#059669] font-bold">FREE</span>
                      </div>
                      <div className="border-t border-neutral-50 my-2.5" />
                      <div className="flex justify-between text-sm font-black text-neutral-900">
                        <span>Grand Total Payable</span>
                        <span>₹{totalCartPrice}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setIsCheckoutOpen(true);
                        setCheckoutStep("address");
                      }}
                      className="w-full py-3 bg-black hover:bg-neutral-900 text-white font-bold text-xs rounded-xl tracking-wider uppercase transition cursor-pointer text-center block shadow-sm"
                    >
                      Proceed to Secure Checkout
                    </button>
                  </div>
                </div>
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

        {/* VIEW 6: MY ORDERS SCREEN */}
        {screen === "my_orders" && (
          <motion.div
            key="my_orders"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-6 lg:py-12 pb-28 space-y-6"
          >
            {/* Header */}
            <div className="flex lg:hidden justify-between items-center">
              <button 
                onClick={() => setScreen("dashboard")}
                className="w-10 h-10 bg-white border border-neutral-100 rounded-full flex items-center justify-center text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-display font-black text-sm text-neutral-900 uppercase tracking-widest">My Orders{currentUser ? ` (${myOrders.length})` : ""}</h2>
              <div className="w-10 h-10" />
            </div>

            {/* Orders List */}
            {!currentUser ? (
              <div className="bg-white rounded-[26px] p-8 border border-neutral-100 shadow-xs text-center space-y-4">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-300">
                  <Lock size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-black text-base text-neutral-900">Login Required</h3>
                  <p className="text-xs text-[#8E8E8A] leading-relaxed max-w-xs mx-auto">
                    Please log in to your account to view, track, and manage your luxury footwear orders.
                  </p>
                </div>
                <button
                  onClick={() => { setScreen("dashboard"); setActiveTab("profile"); }}
                  className="px-5 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:scale-105 transition"
                >
                  Log In Now
                </button>
              </div>
            ) : myOrders.length === 0 ? (
              <div className="bg-white rounded-[26px] p-8 border border-neutral-100 shadow-xs text-center space-y-4">
                <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-300">
                  <Package size={32} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-black text-base text-neutral-900">No Orders Found</h3>
                  <p className="text-xs text-[#8E8E8A] leading-relaxed max-w-xs mx-auto">
                    You haven't placed any footwear orders yet. Explore our luxury collection to make your first purchase!
                  </p>
                </div>
                <button
                  onClick={() => { setScreen("dashboard"); setActiveTab("store"); }}
                  className="px-5 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:scale-105 transition"
                >
                  Shop Collection
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {myOrders.map((ord) => {
                  const isCancellable = ord.status === "Pending" || ord.status === "Processing";
                  const isAddressEditable = ord.status === "Pending" || ord.status === "Processing";
                  const isPaymentEditable = ord.status === "Pending" || ord.status === "Processing";
                  
                  return (
                    <div key={ord.id} className="bg-white border border-neutral-150 rounded-[24px] p-4 shadow-sm space-y-4 text-left">
                      {/* Top Bar with ID, Status badge and Date */}
                      <div className="flex justify-between items-start border-b border-neutral-100 pb-3">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-neutral-900 text-xs">{ord.id}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ord.id);
                              }}
                              className="text-neutral-400 hover:text-black transition"
                              title="Copy ID"
                            >
                              <Copy size={11} />
                            </button>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-medium block mt-0.5">
                            Placed on {new Date(ord.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          ord.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          ord.status === "Processing" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          ord.status === "Shipped" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                          ord.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          ord.status === "Cancelled" ? "bg-rose-50 text-rose-700 border-rose-200" :
                          "bg-neutral-50 text-neutral-700 border-neutral-200"
                        }`}>
                          ● {ord.status}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex gap-3">
                            <div className="w-16 h-16 bg-[#F5F5F4] rounded-xl flex items-center justify-center p-1 border border-neutral-100 overflow-hidden shrink-0">
                              <img src={item.product.images[0]} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                              <div>
                                <h4 className="font-bold text-xs text-neutral-900 truncate leading-tight">{item.product.name}</h4>
                                <p className="text-[10px] text-[#8E8E8A] mt-0.5">
                                  Color: <span className="font-semibold text-neutral-700">{item.selectedColor}</span> • Size: <span className="font-semibold text-neutral-700">{item.selectedSize}</span>
                                </p>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className="text-[10px] text-neutral-400">Qty: {item.quantity}</span>
                                <span className="text-xs font-black text-neutral-900">₹{item.product.price}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total Amount, Payment details, Shipping Address */}
                      <div className="bg-neutral-50 rounded-2xl p-3 space-y-2.5 text-xs border border-neutral-100">
                        {/* Total Amount */}
                        <div className="flex justify-between items-center font-bold">
                          <span className="text-[#8E8E8A]">Total Amount:</span>
                          <span className="text-neutral-900 text-sm font-black">₹{ord.totalAmount}</span>
                        </div>

                        {/* Payment Method section */}
                        <div className="border-t border-neutral-200/50 pt-2.5 space-y-1">
                          <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider block">Payment Method</span>
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                              <CreditCard size={12} className="text-neutral-500" />
                              {ord.paymentMethod === "COD" ? "Cash on Delivery" : ord.paymentMethod}
                            </span>
                            
                            {isPaymentEditable && (
                              <select
                                value={ord.paymentMethod}
                                onChange={(e) => handleUpdateOrder(ord.id, { paymentMethod: e.target.value })}
                                className="bg-white border border-neutral-200 text-[10px] font-bold text-neutral-700 px-2 py-1 rounded-lg focus:outline-none"
                              >
                                <option value="COD">Cash on Delivery</option>
                                <option value="UPI">UPI</option>
                                <option value="GooglePay">Google Pay</option>
                                <option value="Card">Card</option>
                              </select>
                            )}
                          </div>
                        </div>

                        {/* Shipping Address section */}
                        <div className="border-t border-neutral-200/50 pt-2.5 space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider">Delivery Address</span>
                            {isAddressEditable && (
                              <button
                                onClick={() => {
                                  const newAddr = prompt("Enter new shipping address:", ord.shippingAddress);
                                  if (newAddr !== null && newAddr.trim() !== "") {
                                    handleUpdateOrder(ord.id, { shippingAddress: newAddr.trim() });
                                  }
                                }}
                                className="text-[9px] text-[#E2583E] hover:underline font-extrabold"
                              >
                                Edit Address
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-600 font-medium leading-relaxed">
                            {ord.shippingAddress}
                          </p>
                          <p className="text-[10px] text-[#8E8E8A] font-bold">
                            Phone: {ord.customerPhone}
                          </p>
                        </div>
                      </div>

                      {/* Live Tracking Progress bar */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-wider block">Order Progress</span>
                        {ord.status === "Cancelled" ? (
                          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-2.5 text-red-700 text-xs font-bold">
                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                            <span>This order has been cancelled.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-1 text-center relative pt-1">
                            {/* Track bar progress */}
                            <div className="absolute top-3 left-[12%] right-[12%] h-[3px] bg-neutral-100 -z-10">
                              <div 
                                className="h-full bg-black transition-all duration-500" 
                                style={{ 
                                  width: ord.status === "Pending" ? "0%" :
                                         ord.status === "Processing" ? "33%" :
                                         ord.status === "Shipped" ? "66%" : "100%"
                                }} 
                              />
                            </div>
                            
                            {[
                              { label: "Pending", val: "Pending" },
                              { label: "Processing", val: "Processing" },
                              { label: "Shipped", val: "Shipped" },
                              { label: "Delivered", val: "Delivered" }
                            ].map((step, idx) => {
                              const steps = ["Pending", "Processing", "Shipped", "Delivered"];
                              const ordIdx = steps.indexOf(ord.status);
                              const stepIdx = steps.indexOf(step.val);
                              const isActive = stepIdx <= ordIdx;
                              
                              return (
                                <div key={idx} className="flex flex-col items-center">
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${
                                    isActive ? "bg-black text-white" : "bg-neutral-200 text-neutral-500"
                                  }`}>
                                    {isActive ? "✓" : idx + 1}
                                  </div>
                                  <span className={`text-[8px] mt-1 font-extrabold uppercase tracking-wide ${
                                    isActive ? "text-neutral-900" : "text-neutral-400"
                                  }`}>
                                    {step.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Order Actions */}
                      <div className="border-t border-neutral-100 pt-3 flex gap-2">
                        <button
                          onClick={() => downloadInvoice(ord)}
                          className="flex-1 py-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-150 text-neutral-700 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Download Invoice
                        </button>

                        {isCancellable && (
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
                                handleUpdateOrder(ord.id, { status: "Cancelled" });
                              }
                            }}
                            className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-extrabold text-xs rounded-xl transition cursor-pointer"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 7: PRIVACY POLICY */}
        {screen === "privacy_policy" && (
          <motion.div
            key="privacy_policy"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="max-w-md mx-auto px-4 py-6 pb-28 space-y-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setScreen("dashboard")}
                className="w-10 h-10 bg-white border border-neutral-100 rounded-full flex items-center justify-center text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-display font-black text-sm text-neutral-900 uppercase tracking-widest">Privacy Policy</h2>
              <div className="w-10 h-10" />
            </div>

            {/* Content card */}
            <div className="bg-white border border-neutral-100 rounded-[28px] p-6 shadow-sm space-y-4 text-left">
              <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-800">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-display font-black text-base text-neutral-900">Privacy & Data Security</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium whitespace-pre-wrap">
                {settings.privacyPolicyText || "Your privacy is important to us. We collect and use your data only to process orders and improve your shopping experience."}
              </p>
            </div>
          </motion.div>
        )}

        {/* VIEW 8: REFUND POLICY */}
        {screen === "refund_policy" && (
          <motion.div
            key="refund_policy"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="max-w-md mx-auto px-4 py-6 pb-28 space-y-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setScreen("dashboard")}
                className="w-10 h-10 bg-white border border-neutral-100 rounded-full flex items-center justify-center text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-display font-black text-sm text-neutral-900 uppercase tracking-widest">Refund Policy</h2>
              <div className="w-10 h-10" />
            </div>

            {/* Content card */}
            <div className="bg-white border border-neutral-100 rounded-[28px] p-6 shadow-sm space-y-4 text-left">
              <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-800">
                <Sliders size={24} />
              </div>
              <h3 className="font-display font-black text-base text-neutral-900">Refunds & Returns</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium whitespace-pre-wrap">
                {settings.refundPolicyText || "If you are not fully satisfied with your purchase, you can return or exchange the items within 30 days of delivery. The products must be unworn and in their original packaging."}
              </p>
            </div>
          </motion.div>
        )}

        {/* VIEW 9: TERMS & CONDITIONS */}
        {screen === "terms_and_conditions" && (
          <motion.div
            key="terms_and_conditions"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="max-w-md mx-auto px-4 py-6 pb-28 space-y-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setScreen("dashboard")}
                className="w-10 h-10 bg-white border border-neutral-100 rounded-full flex items-center justify-center text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-display font-black text-sm text-neutral-900 uppercase tracking-widest">Terms of Service</h2>
              <div className="w-10 h-10" />
            </div>

            {/* Content card */}
            <div className="bg-white border border-neutral-100 rounded-[28px] p-6 shadow-sm space-y-4 text-left">
              <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-800">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <h3 className="font-display font-black text-base text-neutral-900">Terms & Conditions</h3>
              <p className="text-xs text-neutral-600 leading-relaxed font-medium whitespace-pre-wrap font-sans">
                {settings.termsConditionsText || "By using our website, you agree to our terms of service. All orders are subject to availability and acceptance."}
              </p>
            </div>
          </motion.div>
        )}

        {/* VIEW 10: CONTACT US */}
        {screen === "contact_us" && (
          <motion.div
            key="contact_us"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            className="max-w-md mx-auto px-4 py-6 pb-28 space-y-6"
          >
            {/* Header */}
            <div className="flex justify-between items-center">
              <button 
                onClick={() => setScreen("dashboard")}
                className="w-10 h-10 bg-white border border-neutral-100 rounded-full flex items-center justify-center text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-display font-black text-sm text-neutral-900 uppercase tracking-widest">Contact Us</h2>
              <div className="w-10 h-10" />
            </div>

            {/* Content card */}
            <div className="bg-white border border-neutral-100 rounded-[28px] p-6 shadow-sm space-y-5 text-left">
              <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-800">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-neutral-900">Get in Touch</h3>
                <p className="text-xs text-neutral-400 mt-1">We'd love to hear from you. We respond within 24 hours.</p>
              </div>

              {isMessageSent ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center space-y-2"
                >
                  <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto text-sm font-bold">✓</div>
                  <h4 className="text-xs font-black text-emerald-900">Message Sent Successfully</h4>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">
                    Thank you for contacting Comfort Steps. Our customer experience specialists will get back to you shortly.
                  </p>
                  <button
                    onClick={() => {
                      setIsMessageSent(false);
                      setContactMessage("");
                    }}
                    className="mt-2 text-[10px] font-extrabold text-emerald-800 hover:underline"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsSendingMessage(true);
                    setTimeout(() => {
                      setIsSendingMessage(false);
                      setIsMessageSent(true);
                    }, 1000);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={contactName || profileName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={contactEmail || profileEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. jane@example.com"
                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider font-extrabold text-neutral-400 block">Your Message</label>
                    <textarea 
                      required
                      rows={4}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="How can we help you with your Comfort Steps purchase?"
                      className="w-full bg-neutral-50 border border-neutral-150 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-black resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSendingMessage}
                    className="w-full py-3 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                  >
                    {isSendingMessage ? "Sending message..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>

            {/* Official Coordinates Card */}
            <div className="bg-neutral-900 text-neutral-100 rounded-[28px] p-6 text-left space-y-4 shadow-xl">
              <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-extrabold block">Luxury Office Coordinates</span>
              
              <div className="space-y-3.5">
                <div className="flex gap-3 items-start">
                  <MapPin size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Milan Headquarters</h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">Comfort Steps SpA, Via della Spiga 12, 20121 Milano, Italy</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <Phone size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Consierge Line</h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">+1 (800) COMFORT-S (266-3678)</p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <Mail size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Direct Email</h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-relaxed">concierge@comfortsteps.com</p>
                  </div>
                </div>
              </div>
            </div>
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
      {screen !== "onboarding" && !isDesktop && (
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

            {/* Orders Button */}
            <button 
              onClick={() => { setScreen("my_orders"); setSelectedProduct(null); }}
              className={`relative p-2.5 transition flex flex-col items-center justify-center cursor-pointer ${screen === "my_orders" && !selectedProduct ? "text-white scale-105" : "hover:text-black"}`}
              title="My Orders"
            >
              {screen === "my_orders" && !selectedProduct && (
                <motion.div layoutId="navActiveBg" className="absolute inset-0 bg-black rounded-full" transition={{ type: "spring", stiffness: 350, damping: 28 }} />
              )}
              <Package size={18} className="relative z-10" />
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
