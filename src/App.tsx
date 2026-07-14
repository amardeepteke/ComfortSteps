/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import StoreFront from "./components/StoreFront";
import { Product, Order } from "./types";
import { INITIAL_PRODUCTS } from "./data";
import { db, initializeFirebase, handleFirestoreError, OperationType } from "./lib/firebase";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [firebaseActive, setFirebaseActive] = useState(false);

  // Fetch / Sync Data
  useEffect(() => {
    const services = initializeFirebase();
    const firestoreDb = services.db;

    if (firestoreDb) {
      setFirebaseActive(true);
      console.log("Firebase synced. Loading data from Firestore...");
      
      // Real-time Products Sync
      const unsubProducts = onSnapshot(collection(firestoreDb, "products"), (snapshot) => {
        const prodList: Product[] = [];
        snapshot.forEach((docSnap) => {
          prodList.push({ id: docSnap.id, ...docSnap.data() } as Product);
        });
        
        if (prodList.length > 0) {
          setProducts(prodList);
        } else {
          // If Firestore is empty, seed it with initial items for a gorgeous startup
          INITIAL_PRODUCTS.forEach(async (p) => {
            await setDoc(doc(collection(firestoreDb, "products"), p.id), p);
          });
          setProducts(INITIAL_PRODUCTS);
        }
      }, (error) => {
        console.error("Firestore products list error:", error);
        // Graceful fallback to initial local products
        setProducts(INITIAL_PRODUCTS);
        // Throw formatted error for platform diagnostics
        handleFirestoreError(error, OperationType.GET, "products");
      });

      // Real-time Orders Sync
      const unsubOrders = onSnapshot(collection(firestoreDb, "orders"), (snapshot) => {
        const orderList: Order[] = [];
        snapshot.forEach((docSnap) => {
          orderList.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        setOrders(orderList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }, (error) => {
        console.error("Firestore orders list error:", error);
        setOrders([]);
        // Throw formatted error for platform diagnostics
        handleFirestoreError(error, OperationType.GET, "orders");
      });

      return () => {
        unsubProducts();
        unsubOrders();
      };
    } else {
      setFirebaseActive(false);
      console.log("Firebase config not found. Falling back to Local Storage mode...");
      
      // Fallback to LocalStorage Products
      const localProds = localStorage.getItem("footwear_products");
      if (localProds) {
        try {
          setProducts(JSON.parse(localProds));
        } catch (e) {
          setProducts(INITIAL_PRODUCTS);
        }
      } else {
        setProducts(INITIAL_PRODUCTS);
        localStorage.setItem("footwear_products", JSON.stringify(INITIAL_PRODUCTS));
      }

      // Fallback to LocalStorage Orders
      const localOrders = localStorage.getItem("footwear_orders");
      if (localOrders) {
        try {
          setOrders(JSON.parse(localOrders));
        } catch (e) {
          setOrders([]);
        }
      } else {
        setOrders([]);
      }
    }
  }, []);

  // Order actions
  const handleAddOrder = async (order: Order) => {
    const updated = [order, ...orders];
    setOrders(updated);

    if (!firebaseActive) {
      localStorage.setItem("footwear_orders", JSON.stringify(updated));
    } else if (db) {
      try {
        await setDoc(doc(collection(db, "orders"), order.id), order);
      } catch (err) {
        console.error("Firestore order save error", err);
      }
    }
  };

  const handleUpdateOrder = async (orderId: string, updatedFields: Partial<Order>) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, ...updatedFields } : o);
    setOrders(updated);

    if (!firebaseActive) {
      localStorage.setItem("footwear_orders", JSON.stringify(updated));
    } else if (db) {
      try {
        // Since we import doc and collection from firebase, we can import updateDoc from firebase/firestore if not already imported or use setDoc with merge
        // Let's import updateDoc in App.tsx if needed, or we can use setDoc with merge: true which is already imported!
        await setDoc(doc(db, "orders", orderId), updatedFields, { merge: true });
      } catch (err) {
        console.error("Firestore order update error", err);
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50">
      <StoreFront 
        products={products}
        orders={orders}
        onAddOrder={handleAddOrder}
        onUpdateOrder={handleUpdateOrder}
        onUpdateProducts={setProducts}
      />
    </div>
  );
}

