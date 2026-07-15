import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Star, 
  Ruler, 
  Minus, 
  Plus, 
  Check, 
  Truck, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  MapPin, 
  Share2, 
  ShoppingBag,
  Award,
  RotateCcw,
  Package,
  Sparkles,
  Layers,
  HeartPulse,
  Globe,
  CheckCircle2
} from "lucide-react";
import { Product } from "../types";

interface ProductDetailsRedesignProps {
  selectedProduct: Product;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedSize: string;
  setSelectedSize: (size: string) => void;
  detailQty: number;
  setDetailQty: React.Dispatch<React.SetStateAction<number>>;
  bundleChecked: boolean;
  setBundleChecked: (checked: boolean) => void;
  pincodeInput: string;
  setPincodeInput: (pincode: string) => void;
  checkPincode: () => void;
  pincodeError: string | null;
  pincodeResult: string | null;
  countdownStr: string;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  shareProduct: () => void;
  shareFeedback: string | null;
  isAddingToCart: boolean;
  setIsAddingToCart: (adding: boolean) => void;
  addToCart: (e?: React.MouseEvent<HTMLButtonElement>, customQty?: number) => void;
  setIsCheckoutOpen: (open: boolean) => void;
  setScreen: (screen: string) => void;
  setCheckoutStep: (step: string) => void;
  setIsSizeGuideOpen: (open: boolean) => void;
  products: Product[];
  handleViewProduct: (prod: Product) => void;
  activeImageIdx: number;
  setActiveImageIdx: React.Dispatch<React.SetStateAction<number>>;
  getColorHex: (colorName: string) => string;
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function ProductDetailsRedesign({
  selectedProduct,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  detailQty,
  setDetailQty,
  bundleChecked,
  setBundleChecked,
  pincodeInput,
  setPincodeInput,
  checkPincode,
  pincodeError,
  pincodeResult,
  countdownStr,
  favorites,
  toggleFavorite,
  shareProduct,
  shareFeedback,
  isAddingToCart,
  setIsAddingToCart,
  addToCart,
  setIsCheckoutOpen,
  setScreen,
  setCheckoutStep,
  setIsSizeGuideOpen,
  products,
  handleViewProduct,
  activeImageIdx,
  setActiveImageIdx,
  getColorHex,
  setCart
}: ProductDetailsRedesignProps) {
  // Zoom on Hover Magnifier position state
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, show: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y, show: true });
  };

  // Find active variant by selectedColor
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

  // Similar products
  const similarItems = products
    .filter(p => p.category === selectedProduct.category && p.id !== selectedProduct.id)
    .slice(0, 4);

  // Accessories bundle
  const accessoryPrice = 899;
  const accessoryMrp = 1199;
  const combinedPrice = displayPrice + (bundleChecked ? accessoryPrice : 0);

  const handleColorChangeLocal = (color: string) => {
    setSelectedColor(color);
    setActiveImageIdx(0);
    
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
  };

  const isFavorited = favorites.includes(selectedProduct.id);

  return (
    <div className="bg-white min-h-screen pb-24 md:pb-12 text-neutral-900 font-sans">
      {/* 1. Breadcrumbs / Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 pb-4 border-b border-neutral-150 gap-4">
        <button 
          onClick={() => {
            setScreen("dashboard");
            setActiveImageIdx(0);
            setDetailQty(1);
          }}
          className="group flex items-center gap-2 text-xs font-bold text-neutral-800 hover:text-black transition"
        >
          <span className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center bg-neutral-50 group-hover:bg-neutral-100 transition duration-200">
            <ChevronLeft size={14} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </span>
          <span>Back to Collection</span>
        </button>
        <div className="flex items-center gap-2 text-xs text-neutral-400 font-semibold tracking-wider">
          <span>Luxury Footwear</span>
          <span>/</span>
          <span className="text-neutral-500 font-bold capitalize">{selectedProduct.category}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A34E] ml-1" />
        </div>
      </div>

      {/* 2. Core Grid: Gallery + Selection Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
        
        {/* LEFT SIDE: PRODUCT GALLERY */}
        <div className="lg:col-span-7 space-y-5 lg:sticky lg:top-24">
          <div className="relative bg-[#FAFAFA] rounded-3xl overflow-hidden border border-neutral-100">
            {/* Gallery Main Stage with Zoom on Hover */}
            <div 
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setZoomPos(prev => ({ ...prev, show: false }))}
              className="h-[360px] sm:h-[450px] w-full flex items-center justify-center p-6 relative cursor-zoom-in overflow-hidden"
            >
              {/* Zoom overlay */}
              {zoomPos.show && (
                <div 
                  className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-150"
                  style={{
                    backgroundImage: `url(${displayImages[activeImageIdx] || selectedProduct.images[0]})`,
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    backgroundSize: "220%",
                    backgroundRepeat: "no-repeat",
                    backgroundColor: "#FAFAFA"
                  }}
                />
              )}

              {/* Main Image */}
              <img 
                src={displayImages[activeImageIdx] || selectedProduct.images[0]} 
                alt={selectedProduct.name}
                className="max-h-full max-w-full object-contain mix-blend-multiply transition-all duration-300 transform hover:scale-105"
                referrerPolicy="no-referrer"
              />

              {/* Slider Arrows */}
              {displayImages.length > 1 && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx(prev => (prev === 0 ? displayImages.length - 1 : prev - 1));
                    }}
                    className="pointer-events-auto w-10 h-10 bg-white/95 hover:bg-white border border-neutral-200 rounded-full flex items-center justify-center shadow-md text-neutral-800 hover:scale-105 transition active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft size={18} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx(prev => (prev === displayImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="pointer-events-auto w-10 h-10 bg-white/95 hover:bg-white border border-neutral-200 rounded-full flex items-center justify-center shadow-md text-neutral-800 hover:scale-105 transition active:scale-95 cursor-pointer"
                  >
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {/* Brand & Sale Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                <span className="bg-black text-white text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-sm">
                  {selectedProduct.brand}
                </span>
                {discountPercent > 0 && (
                  <span className="bg-[#C9A34E] text-white text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Wishlist Heart Toggle */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(selectedProduct.id);
                }}
                className="absolute top-4 right-4 w-10 h-10 bg-white hover:bg-neutral-50 border border-neutral-150 rounded-full shadow-md flex items-center justify-center transition hover:scale-110 active:scale-95 cursor-pointer z-20"
              >
                <Heart 
                  size={18} 
                  fill={isFavorited ? "#ef4444" : "none"} 
                  className={isFavorited ? "text-rose-500 scale-110 transition-transform duration-300" : "text-neutral-400 hover:text-rose-500 transition-colors"} 
                />
              </button>
            </div>

            {/* Thumbnail Navigation */}
            {displayImages.length > 1 && (
              <div className="flex gap-3 justify-center bg-neutral-50/50 py-4 px-6 border-t border-neutral-100 overflow-x-auto scrollbar-none">
                {displayImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-16 h-16 bg-white rounded-xl p-1.5 border flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                      activeImageIdx === idx 
                        ? "border-[#C9A34E] ring-4 ring-[#C9A34E]/10 scale-105" 
                        : "border-neutral-200 hover:border-neutral-350 hover:scale-102"
                    }`}
                  >
                    <img src={img} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: PRODUCT DETAILS AND ACTIONS */}
        <div className="lg:col-span-5 space-y-7 text-left">
          {/* Header Info Block */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#C9A34E] font-bold">
                Comfort Steps
              </span>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 font-bold">
                100% Authentic Product
              </span>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <h1 className="font-serif lowercase text-3xl md:text-4xl font-black text-neutral-900 leading-none tracking-tight">
                {selectedProduct.name}
              </h1>
              <div className="shrink-0 md:text-right">
                <span className="text-3xl font-black text-neutral-950 block tracking-tight">
                  ₹{displayPrice.toLocaleString("en-IN")}
                </span>
                {displayOriginalPrice > displayPrice && (
                  <div className="flex items-center gap-2 md:justify-end mt-1">
                    <span className="text-sm text-neutral-400 line-through">
                      ₹{displayOriginalPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[9px] font-black text-[#C9A34E] bg-amber-50 px-2 py-0.5 rounded border border-[#C9A34E]/15">
                      {discountPercent}% OFF
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={13} 
                    fill={i < Math.floor(selectedProduct.rating) ? "currentColor" : "none"} 
                    className="text-[#C9A34E]"
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-neutral-800">
                {selectedProduct.rating} Rating
              </span>
              <span className="text-xs text-neutral-400">
                ({selectedProduct.reviewsCount} verified buyers)
              </span>
            </div>
          </div>

          {/* 3. Luxury Variant Selection */}
          {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
            <div className="border-t border-neutral-100 pt-5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Select Color: <span className="text-neutral-900 font-extrabold">{selectedColor || "Select"}</span>
                </span>
              </div>
              
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
                {selectedProduct.variants.map((v) => {
                  const vColor = v.colourName || v.color || "";
                  const isSelected = selectedColor.toLowerCase() === vColor.toLowerCase();
                  const thumbnail = v.colourThumbnail || (v.images && v.images.length > 0 ? v.images[0] : selectedProduct.images[0]);
                  const vPrice = v.sellingPrice !== undefined ? v.sellingPrice : (v.price !== undefined ? v.price : selectedProduct.price);
                    
                  return (
                    <button
                      key={vColor}
                      type="button"
                      onClick={() => handleColorChangeLocal(vColor)}
                      className={`flex-shrink-0 snap-start w-24 bg-white border rounded-2xl p-2 text-left transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? "border-[#C9A34E] ring-2 ring-[#C9A34E]/20 scale-102 shadow-md" 
                          : "border-neutral-200 hover:border-neutral-350 shadow-3xs"
                      }`}
                    >
                      <div className="h-14 w-full rounded-xl bg-neutral-50 flex items-center justify-center p-1 relative mb-2 overflow-hidden">
                        <img src={thumbnail} alt={vColor} className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                        <div 
                          className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-white shadow-md" 
                          style={{ backgroundColor: getColorHex(vColor) }} 
                        />
                      </div>
                      <p className="text-[10px] font-black text-neutral-800 truncate leading-tight mb-0.5">{vColor}</p>
                      <p className="text-[10px] font-black text-[#C9A34E]">₹{vPrice.toLocaleString("en-IN")}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            selectedProduct.colors && selectedProduct.colors.length > 0 && (
              <div className="border-t border-neutral-100 pt-5 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Select Color</span>
                <div className="flex gap-3">
                  {selectedProduct.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChangeLocal(color)}
                      style={{ backgroundColor: getColorHex(color) }}
                      className={`w-9 h-9 rounded-full border-2 transition-transform relative cursor-pointer ${
                        selectedColor === color 
                          ? "border-[#C9A34E] scale-110 ring-4 ring-[#C9A34E]/15" 
                          : "border-transparent hover:scale-105 shadow-md"
                      }`}
                    >
                      {selectedColor === color && (
                        <span className="absolute inset-0 flex items-center justify-center text-white">
                          <Check size={14} strokeWidth={3} className="mix-blend-difference" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          {/* 4. Luxury Size Selection */}
          <div className="border-t border-neutral-100 pt-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Select Size: <span className="text-neutral-900 font-extrabold">{selectedSize || "Select a size"}</span>
              </span>
              <button 
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-[11px] text-[#C9A34E] hover:text-[#A68F5B] font-extrabold flex items-center gap-1.5 transition duration-200 cursor-pointer"
              >
                <Ruler size={12} className="text-[#C9A34E]" />
                <span>Size Guide</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
              {displaySizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`py-2.5 text-center text-xs font-black rounded-xl transition duration-200 border cursor-pointer ${
                    selectedSize === sz 
                      ? "bg-black text-white border-black shadow-md scale-102" 
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-350 hover:bg-neutral-50"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Luxury Quantity Selection */}
          <div className="border-t border-neutral-100 pt-5 flex justify-between items-center">
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Select Quantity</span>
              <span className="text-[10px] text-neutral-400 font-bold block">Limit 5 pairs per customer</span>
            </div>
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-xl p-1.5 shadow-3xs">
              <button 
                onClick={() => setDetailQty(prev => Math.max(1, prev - 1))}
                className="w-8 h-8 hover:bg-neutral-150 rounded-lg flex items-center justify-center text-neutral-600 transition active:scale-95 cursor-pointer"
              >
                <Minus size={13} strokeWidth={2.5} />
              </button>
              <span className="w-8 text-center text-xs font-extrabold text-neutral-900">{detailQty}</span>
              <button 
                onClick={() => setDetailQty(prev => Math.min(5, prev + 1))}
                className="w-8 h-8 hover:bg-neutral-150 rounded-lg flex items-center justify-center text-neutral-600 transition active:scale-95 cursor-pointer"
              >
                <Plus size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* 6. Frequently Bought Together Bundle */}
          <div className="border-t border-neutral-100 pt-5">
            <div className="bg-amber-50/30 border border-[#C9A34E]/20 rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3 justify-between">
                <div className="flex items-start gap-2.5">
                  <input 
                    type="checkbox" 
                    id="bundle_check_redesign"
                    checked={bundleChecked}
                    onChange={(e) => setBundleChecked(e.target.checked)}
                    className="mt-1 accent-[#C9A34E] h-4.5 w-4.5 rounded border-neutral-300 focus:ring-[#C9A34E]"
                  />
                  <label htmlFor="bundle_check_redesign" className="cursor-pointer select-none space-y-0.5 block">
                    <span className="text-[11px] font-black text-neutral-900 uppercase tracking-wide block">Frequently Bought Together</span>
                    <p className="text-[10px] text-neutral-500 leading-normal">
                      Add Premium Cedar Shoe Trees & Professional Care Care Brush
                    </p>
                  </label>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-black text-[#C9A34E] block">₹899</span>
                  <span className="line-through text-neutral-400 text-[10px] font-bold">₹1,199</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white/80 rounded-xl p-2 border border-dashed border-[#C9A34E]/15">
                <div className="w-10 h-10 bg-neutral-100 rounded-lg p-1 flex items-center justify-center shrink-0">
                  <img src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=400&q=80" alt="" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[10px] font-black text-neutral-800 truncate">Premium Cedar Footwear Preserver Kit</h4>
                  <p className="text-[9px] text-neutral-400 font-bold">Recommended accessories for luxury leather shoes</p>
                </div>
              </div>

              {bundleChecked && (
                <div className="text-right text-[10px] font-bold text-neutral-500 border-t border-neutral-100/60 pt-2.5">
                  Combined Total: <span className="text-neutral-900 font-black text-xs">₹{combinedPrice.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>
          </div>

          {/* 7. PIN Code Delivery Checker */}
          <div className="border-t border-neutral-100 pt-5 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Check Delivery Information</span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit PIN code (e.g. 411001)"
                  className="w-full bg-[#FAFAFA] border border-neutral-200 focus:border-neutral-350 focus:bg-white rounded-xl py-2.5 pl-9 pr-3 text-xs focus:outline-none placeholder:text-neutral-400 font-bold transition duration-200"
                />
              </div>
              <button 
                onClick={checkPincode}
                className="px-5 bg-black hover:bg-neutral-900 text-white font-extrabold text-xs rounded-xl cursor-pointer transition duration-200 flex items-center justify-center shrink-0 active:scale-95 shadow-sm"
              >
                Check
              </button>
            </div>

            {pincodeError && (
              <p className="text-[10px] text-rose-600 font-bold flex items-center gap-1 animate-fade-in">
                <AlertCircle size={11} /> {pincodeError}
              </p>
            )}

            {pincodeResult ? (
              <div className="bg-[#EBFDF5] border border-[#A7F3D0] rounded-xl p-3 text-left animate-fade-in">
                <p className="text-[11.5px] font-black text-[#047857] flex items-center gap-2 leading-normal">
                  <Truck size={14} className="text-[#059669]" /> 
                  <span>{pincodeResult}</span>
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[10.5px] text-[#A68F5B] bg-amber-50/40 p-3 rounded-xl border border-amber-100/40">
                <Clock size={13} className="text-[#C9A34E] shrink-0 animate-pulse" />
                <span>
                  Dispatch Countdown: Place order within <strong className="font-black text-neutral-800">{countdownStr}</strong> for shipping today!
                </span>
              </div>
            )}
          </div>

          {/* 8. Call to Action Buttons (Desktop Panel) */}
          <div className="hidden md:grid grid-cols-2 gap-4 pt-2">
            <button 
              onClick={() => {
                const sizeToUse = selectedSize || selectedProduct.sizes[0] || "Standard";
                const colorToUse = selectedColor || selectedProduct.colors[0] || "Standard";
                
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

                addToCart(undefined, detailQty);
                setIsCheckoutOpen(true);
                setScreen("cart");
                setCheckoutStep("address");
              }}
              className="py-3.5 border border-black rounded-full font-bold text-xs text-neutral-900 bg-white hover:bg-neutral-50 transition active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2 shadow-sm"
            >
              Buy Now
            </button>
            <button 
              onClick={(e) => {
                addToCart(e, detailQty);

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
              className="py-3.5 bg-black hover:bg-neutral-900 rounded-full font-bold text-xs text-white transition active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2 shadow-md min-h-[46px]"
            >
              <AnimatePresence mode="wait">
                {isAddingToCart ? (
                  <motion.span
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 text-emerald-400 font-extrabold"
                  >
                    <CheckCircle2 size={14} /> Added!
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingBag size={14} /> Add to Cart
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* Secure Checkout Trust Badge */}
          <div className="flex justify-between items-center bg-neutral-50 rounded-2xl p-3 border border-neutral-200 mt-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500">
              <ShieldCheck size={14} className="text-[#C9A34E]" />
              <span>SSL Encrypted Checkout</span>
            </div>
            <div className="h-4 w-[1px] bg-neutral-300" />
            <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest">Comfort Steps Assured</span>
          </div>

          {/* Product Description Craftsmanship Details */}
          <div className="space-y-3.5 pt-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">Comfort Steps Craftsmanship</span>
            <p className="text-xs text-neutral-600 leading-relaxed font-normal">
              {displayDescription || "An elite, bespoke design crafted using hand-selected premium materials. Embellished with fine details and equipped with specialized orthotic memory-pad technology to ensure you experience unmatched luxury and true all-day support with every step."}
            </p>
          </div>

          {/* Share Button Block */}
          <div className="flex justify-between items-center pt-2">
            <button 
              onClick={shareProduct}
              className="text-xs text-neutral-500 hover:text-black font-extrabold flex items-center gap-2 cursor-pointer transition"
            >
              <Share2 size={13} className="text-neutral-400" /> 
              <span>Share Product Link</span>
            </button>
            {shareFeedback && (
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-xl shadow-3xs animate-fade-in border border-emerald-100">
                {shareFeedback}
              </span>
            )}
          </div>

        </div>
      </div>

      {/* 9. STICKY MOBILE BOTTOM BUY BAR (Scrolling) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-neutral-100 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] px-4 py-3.5 flex items-center justify-between gap-3 max-w-md mx-auto rounded-t-3xl">
        <div className="flex flex-col text-left">
          <span className="text-lg font-black text-neutral-900 tracking-tight">₹{displayPrice.toLocaleString("en-IN")}</span>
          <span className="text-[8px] text-neutral-400 font-semibold tracking-wide uppercase">Incl. all taxes</span>
        </div>
        <div className="flex-1 flex gap-2 justify-end">
          <button 
            onClick={() => {
              addToCart(undefined, detailQty);
              setIsCheckoutOpen(true);
              setScreen("cart");
              setCheckoutStep("address");
            }}
            className="px-4 py-2.5 border border-black rounded-full font-bold text-xs text-neutral-900 bg-white hover:bg-neutral-50 transition active:scale-95 cursor-pointer text-center flex items-center justify-center shadow-2xs"
          >
            Buy Now
          </button>
          <button 
            onClick={(e) => {
              addToCart(e, detailQty);
              setIsAddingToCart(true);
              setTimeout(() => setIsAddingToCart(false), 1500);
            }}
            disabled={isAddingToCart}
            className="px-4 py-2.5 bg-black hover:bg-neutral-900 rounded-full font-bold text-xs text-white transition active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1 shadow-sm min-h-[38px]"
          >
            {isAddingToCart ? (
              <span className="flex items-center gap-1 text-emerald-400 font-extrabold text-[11px]">
                <CheckCircle2 size={12} /> Added
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ShoppingBag size={12} /> Add
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 10. PRODUCT SPECIFICATIONS SECTION */}
      <div className="bg-neutral-50/50 rounded-3xl p-6 md:p-8 border border-neutral-150 mt-14 space-y-6">
        <h3 className="font-serif text-lg font-bold text-neutral-900 flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#C9A34E] rotate-45" />
          <span>Technical Specifications</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {/* Spec Item 1 */}
          <div className="flex gap-3 bg-white p-4 rounded-2xl border border-neutral-100 shadow-3xs">
            <div className="w-9 h-9 bg-neutral-50 rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <Layers size={16} />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Upper Leather</span>
              <span className="text-xs text-neutral-900 font-extrabold mt-0.5 block">Premium Hand-Cut Calfskin</span>
            </div>
          </div>

          {/* Spec Item 2 */}
          <div className="flex gap-3 bg-white p-4 rounded-2xl border border-neutral-100 shadow-3xs">
            <div className="w-9 h-9 bg-neutral-50 rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <HeartPulse size={16} />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Insole Support</span>
              <span className="text-xs text-neutral-900 font-extrabold mt-0.5 block">Orthotic Cushion Memory Foam</span>
            </div>
          </div>

          {/* Spec Item 3 */}
          <div className="flex gap-3 bg-white p-4 rounded-2xl border border-neutral-100 shadow-3xs">
            <div className="w-9 h-9 bg-neutral-50 rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <ShieldCheck size={16} />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Warranty</span>
              <span className="text-xs text-neutral-900 font-extrabold mt-0.5 block">Free 1-Year Shop Warranty</span>
            </div>
          </div>

          {/* Spec Item 4 */}
          <div className="flex gap-3 bg-white p-4 rounded-2xl border border-neutral-100 shadow-3xs">
            <div className="w-9 h-9 bg-neutral-50 rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <Sparkles size={16} />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Sole Material</span>
              <span className="text-xs text-neutral-900 font-extrabold mt-0.5 block">Non-slip Hybrid Rubber</span>
            </div>
          </div>

          {/* Spec Item 5 */}
          <div className="flex gap-3 bg-white p-4 rounded-2xl border border-neutral-100 shadow-3xs">
            <div className="w-9 h-9 bg-neutral-50 rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <Globe size={16} />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Lining Comfort</span>
              <span className="text-xs text-neutral-900 font-extrabold mt-0.5 block">Moisture-Wicking Cotton</span>
            </div>
          </div>

          {/* Spec Item 6 */}
          <div className="flex gap-3 bg-white p-4 rounded-2xl border border-neutral-100 shadow-3xs">
            <div className="w-9 h-9 bg-neutral-50 rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <RotateCcw size={16} />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Easy Exchange</span>
              <span className="text-xs text-neutral-900 font-extrabold mt-0.5 block">30-Day Sizing Window</span>
            </div>
          </div>

          {/* Spec Item 7 */}
          <div className="flex gap-3 bg-white p-4 rounded-2xl border border-neutral-100 shadow-3xs">
            <div className="w-9 h-9 bg-neutral-50 rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <Award size={16} />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Production</span>
              <span className="text-xs text-neutral-900 font-extrabold mt-0.5 block">Comfort Steps Luxury Lab</span>
            </div>
          </div>

          {/* Spec Item 8 */}
          <div className="flex gap-3 bg-white p-4 rounded-2xl border border-neutral-100 shadow-3xs">
            <div className="w-9 h-9 bg-neutral-50 rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <MapPin size={16} />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Origin</span>
              <span className="text-xs text-neutral-900 font-extrabold mt-0.5 block">Made in India</span>
            </div>
          </div>

          {/* Spec Item 9 */}
          <div className="flex gap-3 bg-white p-4 rounded-2xl border border-neutral-100 shadow-3xs">
            <div className="w-9 h-9 bg-neutral-50 rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <Package size={16} />
            </div>
            <div className="text-left">
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Packaging</span>
              <span className="text-xs text-neutral-900 font-extrabold mt-0.5 block">Premium Wooden/Box Pack</span>
            </div>
          </div>
        </div>
      </div>

      {/* 11. CUSTOMER REVIEWS SECTION */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-neutral-150 mt-14 space-y-7 text-left">
        <div className="border-b border-neutral-100 pb-4">
          <h2 className="font-serif text-lg font-bold text-neutral-900">Customer Reviews & Ratings</h2>
          <p className="text-xs text-neutral-400">Authentic feedbacks shared directly by Comfort Steps premium members</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pb-6">
          
          {/* Average Rating Block */}
          <div className="md:col-span-4 text-center md:border-r md:border-neutral-100 md:pr-8 space-y-2">
            <h3 className="text-5xl font-black text-neutral-900 leading-none">
              {selectedProduct.rating}
            </h3>
            <div className="flex justify-center gap-1 text-[#C9A34E]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={15} fill={i < Math.floor(selectedProduct.rating) ? "currentColor" : "none"} />
              ))}
            </div>
            <p className="text-xs text-neutral-500 font-bold uppercase tracking-wider">
              {selectedProduct.reviewsCount} Verified Reviews
            </p>
            <div className="bg-[#EBFDF5] text-[#047857] text-[10px] font-extrabold px-3 py-1 rounded-full inline-block">
              ✓ 98% Recommend this product
            </div>
          </div>

          {/* Star Progress Bars */}
          <div className="md:col-span-8 space-y-2.5">
            {[
              { stars: 5, pct: "84%" },
              { stars: 4, pct: "11%" },
              { stars: 3, pct: "3%" },
              { stars: 2, pct: "1%" },
              { stars: 1, pct: "1%" }
            ].map((row, idx) => (
              <div key={idx} className="flex items-center gap-3 text-xs">
                <span className="w-12 font-bold text-neutral-500 text-right">{row.stars} Stars</span>
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-black transition-all" style={{ width: row.pct }} />
                </div>
                <span className="w-10 text-neutral-400 font-bold text-left">{row.pct}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highlighted Verified Review Cards */}
        <div className="border-t border-neutral-100 pt-6 space-y-4">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Top Member Feedbacks</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
              <div key={i} className="bg-neutral-50/30 border border-neutral-200 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:shadow-2xs transition duration-300">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-0.5 text-[#C9A34E]">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={10} fill={idx < rev.stars ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span className="text-[9px] text-emerald-600 font-extrabold uppercase tracking-widest flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                      ✓ Verified Buyer
                    </span>
                  </div>
                  <h4 className="font-black text-xs text-neutral-900">{rev.title}</h4>
                  <p className="text-[11.5px] text-neutral-600 leading-relaxed">{rev.comment}</p>
                </div>

                <div className="flex justify-between items-center border-t border-neutral-100 pt-3 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded-full bg-[#C9A34E]/10 border border-[#C9A34E]/30 flex items-center justify-center text-[10px] font-black text-[#C9A34E]">
                      {rev.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-[11px] font-extrabold text-neutral-800">{rev.name}</span>
                  </div>
                  <span className="text-[9px] text-neutral-400 font-bold">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 12. RELATED PRODUCTS ("YOU MAY ALSO LIKE") */}
      {similarItems.length > 0 && (
        <div className="mt-14 space-y-6 text-left">
          <div className="border-b border-neutral-150 pb-4 flex justify-between items-end">
            <div>
              <h2 className="font-serif text-lg font-bold text-neutral-900">You May Also Like</h2>
              <p className="text-xs text-neutral-400">Expand your style collection with these recommendations</p>
            </div>
            <span className="text-[10px] text-[#C9A34E] font-black tracking-widest uppercase">
              Match Style
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {similarItems.map((prod) => {
              const finalPrice = prod.variants && prod.variants.length > 0 
                ? (prod.variants[0].sellingPrice || prod.variants[0].price || prod.price) 
                : prod.price;
              
              const isSimilarFav = favorites.includes(prod.id);
              
              return (
                <div 
                  key={prod.id}
                  onClick={() => {
                    handleViewProduct(prod);
                    setActiveImageIdx(0);
                    setDetailQty(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white rounded-2xl border border-neutral-150 hover:border-neutral-350 p-3 flex flex-col justify-between shadow-3xs hover:shadow-2xs transition-all duration-300 group cursor-pointer relative"
                >
                  <div className="h-32 sm:h-44 bg-[#FAFAFA] rounded-xl flex items-center justify-center p-3 mb-3 relative overflow-hidden">
                    <img 
                      src={prod.images[0]} 
                      alt={prod.name} 
                      className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute top-2 left-2 bg-black text-white text-[7.5px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full shadow-sm">
                      {prod.brand}
                    </div>
                    {/* Related Wishlist heart */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prod.id);
                      }}
                      className="absolute top-2 right-2 w-7 h-7 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-full flex items-center justify-center shadow-sm z-10 transition hover:scale-105"
                    >
                      <Heart 
                        size={12} 
                        fill={isSimilarFav ? "#ef4444" : "none"} 
                        className={isSimilarFav ? "text-rose-500 scale-110" : "text-neutral-400"} 
                      />
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-xs text-neutral-800 group-hover:text-[#C9A34E] transition-colors truncate">
                      {prod.name}
                    </h4>
                    <div className="flex justify-between items-center pt-0.5">
                      <span className="text-xs font-black text-neutral-900">
                        ₹{finalPrice.toLocaleString("en-IN")}
                      </span>
                      <div className="flex items-center gap-0.5 bg-neutral-100 px-1.5 py-0.5 rounded-md">
                        <span className="text-[10px] font-extrabold text-neutral-700">{prod.rating}</span>
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

    </div>
  );
}
