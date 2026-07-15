import React, { useState, useEffect } from "react";
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
  CheckCircle2,
  Maximize2,
  X,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ArrowRight
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
  // Zoom on Hover Magnifier state
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0, show: false });
  
  // Full screen preview states
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [modalScale, setModalScale] = useState(1);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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

  // Keyboard navigation for Fullscreen Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreenOpen) return;
      if (e.key === "Escape") {
        setIsFullscreenOpen(false);
      } else if (e.key === "ArrowLeft") {
        setActiveImageIdx(prev => (prev === 0 ? displayImages.length - 1 : prev - 1));
        setModalScale(1);
        setDragOffset({ x: 0, y: 0 });
      } else if (e.key === "ArrowRight") {
        setActiveImageIdx(prev => (prev === displayImages.length - 1 ? 0 : prev + 1));
        setModalScale(1);
        setDragOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreenOpen, displayImages.length, setActiveImageIdx]);

  return (
    <div className="bg-white min-h-screen pb-32 md:pb-20 text-neutral-900 font-sans px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
      
      {/* 1. Breadcrumbs / Luxury Navigation Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 md:py-8 mb-10 border-b border-neutral-100 gap-4">
        <button 
          onClick={() => {
            setScreen("dashboard");
            setActiveImageIdx(0);
            setDetailQty(1);
          }}
          className="group flex items-center gap-3 text-xs font-black tracking-wider text-neutral-700 hover:text-black transition uppercase duration-300"
        >
          <span className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center bg-white group-hover:bg-neutral-900 group-hover:text-white group-hover:border-neutral-900 transition-all duration-300 shadow-sm">
            <ChevronLeft size={16} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
          </span>
          <span>Back to Collection</span>
        </button>
        <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-bold tracking-widest uppercase">
          <span>Luxury Catalog</span>
          <span>/</span>
          <span className="text-neutral-600 font-extrabold capitalize">{selectedProduct.category}</span>
          <span className="w-2 h-2 rounded-full bg-[#C9A34E] ml-1.5 animate-pulse" />
        </div>
      </div>

      {/* 2. Core Grid Layout: Gallery Left, Selection Info Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-start">
        
        {/* LEFT SIDE: PRODUCT GALLERY */}
        <div className="lg:col-span-7 space-y-8 lg:sticky lg:top-28">
          <div className="relative bg-[#FAFAFA] rounded-[32px] overflow-hidden border border-neutral-100 p-2 shadow-sm">
            
            {/* Gallery Main Stage with Zoom on Hover */}
            <div 
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setZoomPos(prev => ({ ...prev, show: false }))}
              onClick={() => {
                setModalScale(1);
                setDragOffset({ x: 0, y: 0 });
                setIsFullscreenOpen(true);
              }}
              className="h-[380px] sm:h-[500px] md:h-[580px] lg:h-[620px] w-full flex items-center justify-center p-8 sm:p-12 relative cursor-zoom-in overflow-hidden rounded-[28px] bg-gradient-to-b from-[#FAF9F6] to-[#F5F4F0]"
            >
              {/* Zoom overlay on Desktop Hover */}
              {zoomPos.show && (
                <div 
                  className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-200 hidden md:block"
                  style={{
                    backgroundImage: `url(${displayImages[activeImageIdx] || selectedProduct.images[0]})`,
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                    backgroundSize: "240%",
                    backgroundRepeat: "no-repeat",
                    backgroundColor: "#FAF9F6"
                  }}
                />
              )}

              {/* Smooth Animated Main Image */}
              <AnimatePresence mode="wait">
                <motion.img 
                  key={activeImageIdx}
                  src={displayImages[activeImageIdx] || selectedProduct.images[0]} 
                  alt={selectedProduct.name}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="max-h-full max-w-[85%] sm:max-w-[75%] object-contain mix-blend-multiply transition-transform duration-500 hover:scale-[1.03]"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Elegant Slider Arrows with Hover Actions */}
              {displayImages.length > 1 && (
                <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx(prev => (prev === 0 ? displayImages.length - 1 : prev - 1));
                    }}
                    className="pointer-events-auto w-12 h-12 bg-white/95 hover:bg-neutral-900 hover:text-white border border-neutral-100 rounded-full flex items-center justify-center shadow-lg text-neutral-800 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
                    title="Previous Image"
                  >
                    <ChevronLeft size={22} strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx(prev => (prev === displayImages.length - 1 ? 0 : prev + 1));
                    }}
                    className="pointer-events-auto w-12 h-12 bg-white/95 hover:bg-neutral-900 hover:text-white border border-neutral-100 rounded-full flex items-center justify-center shadow-lg text-neutral-800 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
                    title="Next Image"
                  >
                    <ChevronRight size={22} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {/* Brand & Sale Floating Badges */}
              <div className="absolute top-6 left-6 flex flex-col gap-2.5 z-20">
                <span className="bg-neutral-950 text-white text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full shadow-md border border-neutral-800">
                  {selectedProduct.brand}
                </span>
                {discountPercent > 0 && (
                  <span className="bg-[#C9A34E] text-white text-[10px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full shadow-md">
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
                className="absolute top-6 right-6 w-12 h-12 bg-white hover:bg-neutral-50 border border-neutral-100 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer z-20"
                title="Add to Wishlist"
              >
                <Heart 
                  size={20} 
                  fill={isFavorited ? "#ef4444" : "none"} 
                  className={isFavorited ? "text-rose-500 scale-110 transition-transform duration-300" : "text-neutral-400 hover:text-rose-500 transition-colors"} 
                />
              </button>

              {/* Click to Maximize Visual Prompt */}
              <div className="absolute bottom-4 right-6 flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-100 pointer-events-none shadow-xs">
                <Maximize2 size={11} className="text-neutral-500" />
                <span>Click for Fullscreen Preview</span>
              </div>
            </div>

            {/* Thumbnail Navigation - Enhanced Larger and Centered */}
            {displayImages.length > 1 && (
              <div className="flex gap-4 justify-center bg-neutral-50/50 py-5 px-8 border-t border-neutral-100 rounded-b-[24px]">
                <div className="flex gap-3 justify-center items-center overflow-x-auto scrollbar-none max-w-full">
                  {displayImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-2xl p-2 border-2 flex-shrink-0 flex items-center justify-center transition-all duration-300 cursor-pointer ${
                        activeImageIdx === idx 
                          ? "border-[#C9A34E] ring-4 ring-[#C9A34E]/10 scale-105 shadow-md" 
                          : "border-neutral-200/80 hover:border-neutral-400 hover:scale-102"
                      }`}
                    >
                      <img src={img} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: PRODUCT DETAILS AND LUXURIOUS CONTROLS */}
        <div className="lg:col-span-5 space-y-10 text-left pt-2 lg:pt-4">
          
          {/* Header Info Block */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#C9A34E] font-black">
                Comfort Steps Elite
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-250" />
              <span className="text-[11px] font-mono tracking-[0.15em] uppercase text-neutral-400 font-extrabold">
                100% Certified Authentic
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="font-serif lowercase text-4xl sm:text-5xl lg:text-[54px] font-black text-neutral-900 leading-none tracking-tight">
                {selectedProduct.name}
              </h1>
              
              <div className="flex items-baseline gap-4 pt-1">
                <span className="text-4xl font-extrabold text-neutral-950 tracking-tight">
                  ₹{displayPrice.toLocaleString("en-IN")}
                </span>
                {displayOriginalPrice > displayPrice && (
                  <div className="flex items-center gap-2.5">
                    <span className="text-base text-neutral-400 line-through font-bold">
                      ₹{displayOriginalPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] font-black text-[#C9A34E] bg-[#C9A34E]/10 px-2.5 py-1 rounded-md border border-[#C9A34E]/20 uppercase tracking-wider">
                      {discountPercent}% OFF
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Ratings Summary */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex gap-0.5 text-[#C9A34E]">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={14} 
                    fill={i < Math.floor(selectedProduct.rating) ? "currentColor" : "none"} 
                    className="text-[#C9A34E]"
                  />
                ))}
              </div>
              <span className="text-xs font-black text-neutral-800 tracking-wider uppercase">
                {selectedProduct.rating} Stars
              </span>
              <span className="text-xs text-neutral-400 font-bold">
                ({selectedProduct.reviewsCount} verified reviews)
              </span>
            </div>
          </div>

          {/* 3. Luxury Variant Selection */}
          {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
            <div className="border-t border-neutral-100 pt-8 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-neutral-400">
                  Select Color: <span className="text-neutral-900 font-black">{selectedColor || "Select"}</span>
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
                      className={`flex-shrink-0 snap-start w-28 bg-white border rounded-2xl p-2.5 text-left transition-all duration-300 cursor-pointer ${
                        isSelected 
                          ? "border-[#C9A34E] ring-2 ring-[#C9A34E]/20 scale-[1.02] shadow-md" 
                          : "border-neutral-200 hover:border-neutral-350 shadow-3xs"
                      }`}
                    >
                      <div className="h-16 w-full rounded-xl bg-neutral-50 flex items-center justify-center p-1.5 relative mb-2.5 overflow-hidden">
                        <img src={thumbnail} alt={vColor} className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                        <div 
                          className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border border-white shadow-md" 
                          style={{ backgroundColor: getColorHex(vColor) }} 
                        />
                      </div>
                      <p className="text-[10px] font-extrabold text-neutral-850 truncate leading-tight mb-0.5">{vColor}</p>
                      <p className="text-[11px] font-black text-[#C9A34E]">₹{vPrice.toLocaleString("en-IN")}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            selectedProduct.colors && selectedProduct.colors.length > 0 && (
              <div className="border-t border-neutral-100 pt-8 space-y-4">
                <span className="text-xs font-black uppercase tracking-widest text-neutral-400 block">Select Color</span>
                <div className="flex gap-3.5">
                  {selectedProduct.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChangeLocal(color)}
                      style={{ backgroundColor: getColorHex(color) }}
                      className={`w-10 h-10 rounded-full border-2 transition-all duration-200 relative cursor-pointer ${
                        selectedColor === color 
                          ? "border-[#C9A34E] scale-110 ring-4 ring-[#C9A34E]/15" 
                          : "border-transparent hover:scale-105 shadow-md"
                      }`}
                    >
                      {selectedColor === color && (
                        <span className="absolute inset-0 flex items-center justify-center text-white">
                          <Check size={16} strokeWidth={35} className="mix-blend-difference" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          {/* 4. Luxury Size Selection */}
          <div className="border-t border-neutral-100 pt-8 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-neutral-400">
                Select Size: <span className="text-neutral-900 font-black">{selectedSize || "Select a size"}</span>
              </span>
              <button 
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-xs text-[#C9A34E] hover:text-[#A68F5B] font-black flex items-center gap-2 transition duration-200 cursor-pointer uppercase tracking-wider"
              >
                <Ruler size={13} className="text-[#C9A34E]" />
                <span>Size Guide</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {displaySizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`py-3.5 text-center text-xs font-black rounded-2xl transition-all duration-300 border cursor-pointer ${
                    selectedSize === sz 
                      ? "bg-neutral-950 text-[#C9A34E] border-neutral-950 shadow-md scale-[1.02]" 
                      : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Luxury Quantity Selection */}
          <div className="border-t border-neutral-100 pt-8 flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-widest text-neutral-400 block">Select Quantity</span>
              <span className="text-[11px] text-neutral-400 font-bold block">Limit 5 pairs per order</span>
            </div>
            <div className="flex items-center gap-2 bg-[#FAFAFA] border border-neutral-200 rounded-2xl p-2 shadow-3xs">
              <button 
                onClick={() => setDetailQty(prev => Math.max(1, prev - 1))}
                className="w-9 h-9 hover:bg-neutral-200 rounded-xl flex items-center justify-center text-neutral-600 transition active:scale-95 cursor-pointer"
                title="Decrease"
              >
                <Minus size={14} strokeWidth={2.5} />
              </button>
              <span className="w-10 text-center text-xs font-black text-neutral-900">{detailQty}</span>
              <button 
                onClick={() => setDetailQty(prev => Math.min(5, prev + 1))}
                className="w-9 h-9 hover:bg-neutral-200 rounded-xl flex items-center justify-center text-neutral-600 transition active:scale-95 cursor-pointer"
                title="Increase"
              >
                <Plus size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* 6. Frequently Bought Together Bundle */}
          <div className="border-t border-neutral-100 pt-8">
            <div className="bg-gradient-to-br from-amber-50/15 to-neutral-50/30 border border-[#C9A34E]/20 rounded-[28px] p-6 space-y-4 shadow-3xs">
              <div className="flex items-start gap-4 justify-between">
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="bundle_check_redesign"
                    checked={bundleChecked}
                    onChange={(e) => setBundleChecked(e.target.checked)}
                    className="mt-1 accent-[#C9A34E] h-5 w-5 rounded border-neutral-300 focus:ring-[#C9A34E]"
                  />
                  <label htmlFor="bundle_check_redesign" className="cursor-pointer select-none space-y-1 block">
                    <span className="text-xs font-black text-neutral-900 uppercase tracking-wider block">Frequently Bought Together</span>
                    <p className="text-[11px] text-neutral-500 leading-normal font-medium">
                      Add Premium Cedar Shoe Trees & Professional Care Care Brush
                    </p>
                  </label>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-[#C9A34E] block">₹899</span>
                  <span className="line-through text-neutral-400 text-[10px] font-bold">₹1,199</span>
                </div>
              </div>

              <div className="flex items-center gap-4.5 bg-white/90 rounded-2xl p-3 border border-dashed border-[#C9A34E]/20">
                <div className="w-12 h-12 bg-neutral-100 rounded-xl p-1.5 flex items-center justify-center shrink-0">
                  <img src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=400&q=80" alt="" className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-black text-neutral-800 truncate">Premium Cedar Footwear Preserver Kit</h4>
                  <p className="text-[10px] text-neutral-400 font-bold leading-none">Recommended companion for luxury leather</p>
                </div>
              </div>

              {bundleChecked && (
                <div className="text-right text-[11px] font-bold text-neutral-500 border-t border-neutral-100/60 pt-3 flex justify-between items-center">
                  <span>Accessories Bundle Selected</span>
                  <span>
                    Combined Total: <span className="text-neutral-950 font-black text-sm">₹{combinedPrice.toLocaleString("en-IN")}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 7. PIN Code Delivery Checker */}
          <div className="border-t border-neutral-100 pt-8 space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-neutral-400 block">Check Delivery Information</span>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter 6-digit PIN code (e.g. 411001)"
                  className="w-full bg-[#FAFAFA] border border-neutral-200 focus:border-neutral-400 focus:bg-white rounded-2xl py-3.5 pl-11 pr-4 text-xs focus:outline-none placeholder:text-neutral-400 font-bold transition duration-200"
                />
              </div>
              <button 
                onClick={checkPincode}
                className="px-6 bg-neutral-950 hover:bg-black text-[#C9A34E] font-black text-xs rounded-2xl cursor-pointer transition duration-200 flex items-center justify-center shrink-0 active:scale-95 shadow-md border border-[#C9A34E]/20"
              >
                Check
              </button>
            </div>

            {pincodeError && (
              <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1.5 animate-fade-in">
                <AlertCircle size={13} /> {pincodeError}
              </p>
            )}

            {pincodeResult ? (
              <div className="bg-[#EBFDF5] border border-[#A7F3D0] rounded-2xl p-4 text-left animate-fade-in">
                <p className="text-[12px] font-black text-[#047857] flex items-center gap-2.5 leading-normal">
                  <Truck size={16} className="text-[#059669]" /> 
                  <span>{pincodeResult}</span>
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-[11px] text-[#A68F5B] bg-amber-50/30 p-4 rounded-2xl border border-amber-100/30">
                <Clock size={15} className="text-[#C9A34E] shrink-0 animate-pulse" />
                <span>
                  Dispatch Countdown: Place order within <strong className="font-black text-neutral-800">{countdownStr}</strong> for shipping today!
                </span>
              </div>
            )}
          </div>

          {/* 8. Call to Action Buttons (Desktop Panel Redesigned to be larger, identical height & premium gold) */}
          <div className="hidden md:grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
            <button 
              onClick={() => {
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
              className="h-16 border-2 border-neutral-950 rounded-2xl font-black text-xs text-neutral-900 bg-white hover:bg-neutral-50 transition-all duration-300 active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider"
            >
              <span>Buy Now</span>
              <ArrowRight size={14} className="text-[#C9A34E]" />
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
              className="h-16 bg-neutral-950 hover:bg-black text-[#C9A34E] border border-[#C9A34E]/30 rounded-2xl font-black text-xs transition-all duration-300 active:scale-95 cursor-pointer text-center flex items-center justify-center gap-2.5 shadow-lg uppercase tracking-wider"
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
                    <CheckCircle2 size={16} /> Added!
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingBag size={16} />
                    <span>Add to Cart</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* Secure Checkout Trust Badge */}
          <div className="flex justify-between items-center bg-neutral-50/80 rounded-2xl p-4 border border-neutral-150">
            <div className="flex items-center gap-2 text-[11px] font-black text-neutral-550 uppercase tracking-wider">
              <ShieldCheck size={16} className="text-[#C9A34E]" />
              <span>SSL Secure Encryption</span>
            </div>
            <div className="h-5 w-[1px] bg-neutral-250" />
            <span className="text-[10px] font-black text-[#C9A34E] uppercase tracking-widest">Comfort Steps Assured</span>
          </div>

          {/* Product Description Craftsmanship Details */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <span className="text-xs font-black uppercase tracking-widest text-neutral-400 block">Comfort Steps Craftsmanship</span>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
              {displayDescription || "An elite, bespoke design crafted using hand-selected premium materials. Embellished with fine details and equipped with specialized orthotic memory-pad technology to ensure you experience unmatched luxury and true all-day support with every step."}
            </p>
          </div>

          {/* Share Button Block */}
          <div className="flex justify-between items-center pt-2">
            <button 
              onClick={shareProduct}
              className="text-xs text-neutral-500 hover:text-black font-black flex items-center gap-2 cursor-pointer transition uppercase tracking-widest"
            >
              <Share2 size={14} className="text-neutral-400" /> 
              <span>Share Product Link</span>
            </button>
            {shareFeedback && (
              <span className="text-[11px] text-emerald-700 font-black bg-emerald-50 px-4 py-1.5 rounded-full shadow-3xs animate-fade-in border border-emerald-100">
                {shareFeedback}
              </span>
            )}
          </div>

        </div>
      </div>

      {/* 9. STICKY MOBILE BOTTOM BUY BAR (Scrolling) with premium sizing */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-neutral-100 shadow-[0_-12px_40px_rgba(0,0,0,0.08)] px-5 py-4 flex items-center justify-between gap-4 max-w-md mx-auto rounded-t-[32px]">
        <div className="flex flex-col text-left">
          <span className="text-xl font-black text-neutral-900 tracking-tight">₹{displayPrice.toLocaleString("en-IN")}</span>
          <span className="text-[9px] text-neutral-400 font-black tracking-widest uppercase">All Taxes Incl.</span>
        </div>
        <div className="flex-1 flex gap-2.5 justify-end">
          <button 
            onClick={() => {
              addToCart(undefined, detailQty);
              setIsCheckoutOpen(true);
              setScreen("cart");
              setCheckoutStep("address");
            }}
            className="px-5 h-12 border-2 border-neutral-950 rounded-full font-black text-xs text-neutral-900 bg-white hover:bg-neutral-50 transition active:scale-95 cursor-pointer text-center flex items-center justify-center uppercase tracking-wider"
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
            className="px-5 h-12 bg-neutral-950 hover:bg-black text-[#C9A34E] rounded-full font-black text-xs transition active:scale-95 cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md border border-[#C9A34E]/20"
          >
            {isAddingToCart ? (
              <span className="flex items-center gap-1 text-emerald-400 font-black text-[11px] uppercase tracking-wider">
                <CheckCircle2 size={13} /> Added
              </span>
            ) : (
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <ShoppingBag size={13} /> Add
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 10. PRODUCT SPECIFICATIONS SECTION - Airy bento grid */}
      <div className="bg-gradient-to-b from-neutral-50/50 to-white rounded-[36px] p-8 md:p-12 border border-neutral-150 mt-20 space-y-8">
        <div className="text-left space-y-1.5">
          <h3 className="font-serif text-2xl font-bold text-neutral-900 flex items-center gap-2.5">
            <span className="w-3 h-3 bg-[#C9A34E] rotate-45 shrink-0" />
            <span>Technical Specifications</span>
          </h3>
          <p className="text-xs text-neutral-400 font-medium">Engineered for luxury, tested for lifetime durability</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-3">
          {/* Spec Item 1 */}
          <div className="flex gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300">
            <div className="w-11 h-11 bg-[#FAFAFA] rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <Layers size={18} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Upper Leather</span>
              <span className="text-sm text-neutral-900 font-black block">Premium Hand-Cut Calfskin</span>
            </div>
          </div>

          {/* Spec Item 2 */}
          <div className="flex gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300">
            <div className="w-11 h-11 bg-[#FAFAFA] rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <HeartPulse size={18} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Insole Support</span>
              <span className="text-sm text-neutral-900 font-black block">Orthotic Cushion Memory Foam</span>
            </div>
          </div>

          {/* Spec Item 3 */}
          <div className="flex gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300">
            <div className="w-11 h-11 bg-[#FAFAFA] rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <ShieldCheck size={18} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Warranty</span>
              <span className="text-sm text-neutral-900 font-black block">Free 1-Year Shop Warranty</span>
            </div>
          </div>

          {/* Spec Item 4 */}
          <div className="flex gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300">
            <div className="w-11 h-11 bg-[#FAFAFA] rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <Sparkles size={18} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Sole Material</span>
              <span className="text-sm text-neutral-900 font-black block">Non-slip Hybrid Rubber</span>
            </div>
          </div>

          {/* Spec Item 5 */}
          <div className="flex gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300">
            <div className="w-11 h-11 bg-[#FAFAFA] rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <Globe size={18} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Lining Comfort</span>
              <span className="text-sm text-neutral-900 font-black block">Moisture-Wicking Cotton</span>
            </div>
          </div>

          {/* Spec Item 6 */}
          <div className="flex gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300">
            <div className="w-11 h-11 bg-[#FAFAFA] rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <RotateCcw size={18} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Easy Exchange</span>
              <span className="text-sm text-neutral-900 font-black block">30-Day Sizing Window</span>
            </div>
          </div>

          {/* Spec Item 7 */}
          <div className="flex gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300">
            <div className="w-11 h-11 bg-[#FAFAFA] rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <Award size={18} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Production</span>
              <span className="text-sm text-neutral-900 font-black block">Comfort Steps Luxury Lab</span>
            </div>
          </div>

          {/* Spec Item 8 */}
          <div className="flex gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300">
            <div className="w-11 h-11 bg-[#FAFAFA] rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <MapPin size={18} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Origin</span>
              <span className="text-sm text-neutral-900 font-black block">Made in India</span>
            </div>
          </div>

          {/* Spec Item 9 */}
          <div className="flex gap-4 bg-white p-5 rounded-2xl border border-neutral-100 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300">
            <div className="w-11 h-11 bg-[#FAFAFA] rounded-xl flex items-center justify-center text-[#C9A34E] shrink-0 border border-neutral-100">
              <Package size={18} />
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] text-neutral-400 font-extrabold uppercase tracking-widest block">Packaging</span>
              <span className="text-sm text-neutral-900 font-black block">Premium Wooden/Box Pack</span>
            </div>
          </div>
        </div>
      </div>

      {/* 11. CUSTOMER REVIEWS SECTION */}
      <div className="bg-white rounded-[36px] p-8 md:p-12 border border-neutral-150 mt-20 space-y-10 text-left">
        <div className="border-b border-neutral-100 pb-6">
          <h2 className="font-serif text-2xl font-bold text-neutral-900">Customer Reviews & Ratings</h2>
          <p className="text-xs sm:text-sm text-neutral-400">Authentic feedback shared directly by Comfort Steps members</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center pb-8 border-b border-neutral-100">
          
          {/* Average Rating Block */}
          <div className="md:col-span-4 text-center md:border-r md:border-neutral-100 md:pr-10 space-y-3">
            <h3 className="text-6xl font-black text-neutral-900 leading-none">
              {selectedProduct.rating}
            </h3>
            <div className="flex justify-center gap-1.5 text-[#C9A34E]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill={i < Math.floor(selectedProduct.rating) ? "currentColor" : "none"} />
              ))}
            </div>
            <p className="text-xs text-neutral-500 font-black uppercase tracking-wider">
              {selectedProduct.reviewsCount} Verified Reviews
            </p>
            <div className="bg-[#EBFDF5] text-[#047857] text-[11px] font-black px-4 py-1.5 rounded-full inline-block border border-[#A7F3D0]/30">
              ✓ 98% Recommend this product
            </div>
          </div>

          {/* Star Progress Bars */}
          <div className="md:col-span-8 space-y-3">
            {[
              { stars: 5, pct: "84%" },
              { stars: 4, pct: "11%" },
              { stars: 3, pct: "3%" },
              { stars: 2, pct: "1%" },
              { stars: 1, pct: "1%" }
            ].map((row, idx) => (
              <div key={idx} className="flex items-center gap-4 text-xs font-bold">
                <span className="w-14 text-neutral-550 text-right">{row.stars} Stars</span>
                <div className="flex-1 h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-950 rounded-full transition-all duration-500" style={{ width: row.pct }} />
                </div>
                <span className="w-12 text-neutral-400 text-left">{row.pct}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Highlighted Verified Review Cards with plenty of negative space */}
        <div className="space-y-6">
          <span className="text-xs font-black text-neutral-400 uppercase tracking-widest block">Top Member Feedbacks</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div key={i} className="bg-white border border-neutral-150 rounded-2xl p-6 space-y-4 flex flex-col justify-between hover:shadow-md hover:border-neutral-300 transition-all duration-300">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-0.5 text-[#C9A34E]">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={11} fill={idx < rev.stars ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                      ✓ Verified Buyer
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-neutral-900">{rev.title}</h4>
                  <p className="text-xs text-neutral-650 leading-relaxed font-medium">{rev.comment}</p>
                </div>

                <div className="flex justify-between items-center border-t border-neutral-100 pt-4 mt-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#C9A34E]/10 border border-[#C9A34E]/20 flex items-center justify-center text-[11px] font-black text-[#C9A34E]">
                      {rev.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-xs font-black text-neutral-800">{rev.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-bold">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 12. RELATED PRODUCTS ("YOU MAY ALSO LIKE") */}
      {similarItems.length > 0 && (
        <div className="mt-20 space-y-8 text-left pb-12">
          <div className="border-b border-neutral-150 pb-5 flex justify-between items-end">
            <div>
              <h2 className="font-serif text-2xl font-bold text-neutral-900">You May Also Like</h2>
              <p className="text-xs sm:text-sm text-neutral-400">Expand your style collection with these recommendations</p>
            </div>
            <span className="text-[11px] text-[#C9A34E] font-black tracking-widest uppercase hidden sm:inline">
              Match Style
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
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
                  className="bg-white rounded-3xl border border-neutral-150 hover:border-neutral-350 p-4 flex flex-col justify-between shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:shadow-lg transition-all duration-300 group cursor-pointer relative"
                >
                  <div className="h-36 sm:h-48 bg-[#FAFAFA] rounded-2xl flex items-center justify-center p-4 mb-4 relative overflow-hidden bg-gradient-to-b from-[#FCFCFB] to-[#F7F6F3]">
                    <img 
                      src={prod.images[0]} 
                      alt={prod.name} 
                      className="max-h-full max-w-[85%] object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute top-3 left-3 bg-neutral-950 text-white text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full shadow-sm">
                      {prod.brand}
                    </div>
                    {/* Related Wishlist heart */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prod.id);
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-full flex items-center justify-center shadow-sm z-10 transition hover:scale-110 active:scale-95"
                    >
                      <Heart 
                        size={14} 
                        fill={isSimilarFav ? "#ef4444" : "none"} 
                        className={isSimilarFav ? "text-rose-500 scale-110" : "text-neutral-400"} 
                      />
                    </button>
                  </div>
                  
                  <div className="space-y-1 px-1">
                    <h4 className="font-extrabold text-xs sm:text-sm text-neutral-850 group-hover:text-[#C9A34E] transition-colors truncate">
                      {prod.name}
                    </h4>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs sm:text-sm font-black text-neutral-950">
                        ₹{finalPrice.toLocaleString("en-IN")}
                      </span>
                      <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-150 px-2 py-0.5 rounded-lg">
                        <span className="text-[10px] font-black text-neutral-700">{prod.rating}</span>
                        <span className="text-[#C9A34E] text-[10px]">★</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FULLSCREEN ZOOM INTERACTIVE LIGHTBOX */}
      <AnimatePresence>
        {isFullscreenOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/98 z-[9999] flex flex-col justify-between select-none"
            onClick={() => setIsFullscreenOpen(false)}
          >
            {/* Top Bar Controls */}
            <div className="p-4 sm:p-6 flex justify-between items-center text-white z-50 bg-gradient-to-b from-black/80 to-transparent">
              <div className="text-left">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#C9A34E] font-black">Comfort Steps Preview</p>
                <h4 className="text-sm font-black tracking-wide truncate max-w-[200px] sm:max-w-md capitalize">{selectedProduct.name}</h4>
              </div>

              {/* Action Tools */}
              <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => setModalScale(prev => Math.max(1, prev - 0.5))}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-200 rounded-full flex items-center justify-center border border-white/10"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button 
                  onClick={() => setModalScale(prev => Math.min(4, prev + 0.5))}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-200 rounded-full flex items-center justify-center border border-white/10"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button 
                  onClick={() => {
                    setModalScale(1);
                    setDragOffset({ x: 0, y: 0 });
                  }}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 active:scale-95 transition-all duration-200 rounded-full flex items-center justify-center border border-white/10 text-neutral-300"
                  title="Reset Zoom"
                >
                  <RefreshCw size={14} />
                </button>
                <div className="w-[1px] h-6 bg-white/20 mx-1" />
                <button 
                  onClick={() => setIsFullscreenOpen(false)}
                  className="w-11 h-11 bg-white/10 hover:bg-[#ef4444] hover:text-white active:scale-95 transition-all duration-200 rounded-full flex items-center justify-center border border-white/10"
                  title="Close Preview (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Main Stage with Zooming / Dragging */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
              
              {/* Prev Button inside lightbox */}
              {displayImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx(prev => (prev === 0 ? displayImages.length - 1 : prev - 1));
                    setModalScale(1);
                    setDragOffset({ x: 0, y: 0 });
                  }}
                  className="absolute left-4 sm:left-8 w-14 h-14 bg-white/10 hover:bg-white text-white hover:text-neutral-900 border border-white/10 hover:border-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 z-50 hover:scale-105 active:scale-95"
                >
                  <ChevronLeft size={28} strokeWidth={2.5} />
                </button>
              )}

              {/* Draggable/Scalable interactive image */}
              <motion.div
                drag={modalScale > 1}
                dragConstraints={{
                  left: -300 * (modalScale - 1),
                  right: 300 * (modalScale - 1),
                  top: -200 * (modalScale - 1),
                  bottom: 200 * (modalScale - 1)
                }}
                animate={{ scale: modalScale }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="max-h-full max-w-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={displayImages[activeImageIdx] || selectedProduct.images[0]}
                  alt=""
                  className="max-h-[75vh] max-w-[85vw] object-contain select-none"
                  referrerPolicy="no-referrer"
                />
              </motion.div>

              {/* Next Button inside lightbox */}
              {displayImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx(prev => (prev === displayImages.length - 1 ? 0 : prev + 1));
                    setModalScale(1);
                    setDragOffset({ x: 0, y: 0 });
                  }}
                  className="absolute right-4 sm:right-8 w-14 h-14 bg-white/10 hover:bg-white text-white hover:text-neutral-900 border border-white/10 hover:border-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 z-50 hover:scale-105 active:scale-95"
                >
                  <ChevronRight size={28} strokeWidth={2.5} />
                </button>
              )}

              {/* Zoom Scale Indicator Toast */}
              {modalScale > 1 && (
                <div className="absolute bottom-24 bg-black/60 backdrop-blur-md text-white text-xs font-mono font-bold px-4 py-1.5 rounded-full border border-white/10 pointer-events-none">
                  Scale: {modalScale.toFixed(1)}x (Drag to pan)
                </div>
              )}
            </div>

            {/* Bottom Thumbnail Strip inside lightbox */}
            {displayImages.length > 1 && (
              <div 
                className="p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center z-50 overflow-x-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex gap-3 max-w-full overflow-x-auto scrollbar-none items-center">
                  {displayImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveImageIdx(idx);
                        setModalScale(1);
                        setDragOffset({ x: 0, y: 0 });
                      }}
                      className={`w-16 h-16 rounded-xl overflow-hidden p-1 bg-white flex items-center justify-center transition-all duration-300 ${
                        activeImageIdx === idx 
                          ? "ring-4 ring-[#C9A34E] scale-105" 
                          : "opacity-40 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="max-h-full max-w-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
