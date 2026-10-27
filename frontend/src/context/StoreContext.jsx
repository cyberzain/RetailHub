import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [cart, setCart] = useState([]);
  const [heldCarts, setHeldCarts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [activeBranch, setActiveBranch] = useState("Main Flagship Store (Downtown)");
  const [backendOnline, setBackendOnline] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast notifier
  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Initial load
  const reloadData = async () => {
    try {
      const [p, c, s, h] = await Promise.all([
        api.getProducts(),
        api.getCustomers(),
        api.getSales(),
        api.getHeldCarts()
      ]);
      setProducts(p || []);
      setCustomers(c || []);
      setSales(s || []);
      setHeldCarts(h || []);
    } catch (e) {
      console.error("Error loading store data", e);
    }
  };

  // Periodic backend health check
  useEffect(() => {
    reloadData();
    const check = async () => {
      const res = await api.checkBackend();
      setBackendOnline(res.online);
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // Cart operations
  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, qty: item.qty + qty }
            : item
        );
      } else {
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            cost: Number(product.cost || 0),
            taxRate: Number(product.taxRate || 18),
            qty: qty,
            discount: 0,
            note: ""
          }
        ];
      }
    });
    showToast(`Added ${product.name} to cart`, "success");
  };

  const updateCartQty = (productId, newQty) => {
    const q = Number(newQty);
    if (q <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, qty: q } : item))
      );
    }
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const applyItemDiscount = (productId, discount) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, discount: Math.max(0, Number(discount) || 0) } : item
      )
    );
  };

  const applyItemNote = (productId, note) => {
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, note } : item))
    );
  };

  // Cart totals calculation
  const subtotal = cart.reduce(
    (sum, item) => sum + (item.price * item.qty - (item.discount || 0)),
    0
  );
  const totalDiscount = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  const tax = Math.round(subtotal * 0.18);
  const grandTotal = Math.max(0, subtotal + tax);
  const totalItemCount = cart.length;
  const totalUnitCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Hold Sale
  const holdCurrentSale = (note = "") => {
    if (cart.length === 0) {
      showToast("Cart is empty. Nothing to hold.", "warning");
      return;
    }
    const held = api.saveHeldCart({
      customer: selectedCustomer?.name || "Walk-in Customer",
      items: [...cart],
      note,
      total: grandTotal
    });
    setHeldCarts(api.getHeldCarts());
    clearCart();
    setSelectedCustomer(null);
    showToast("Sale placed on hold", "info");
    return held;
  };

  const resumeHeldSale = (heldId) => {
    const list = api.getHeldCarts();
    const found = list.find((h) => h.id === heldId);
    if (found) {
      setCart(found.items || []);
      api.deleteHeldCart(heldId);
      setHeldCarts(api.getHeldCarts());
      showToast("Resumed saved cart", "success");
    }
  };

  const deleteHeldSale = (heldId) => {
    api.deleteHeldCart(heldId);
    setHeldCarts(api.getHeldCarts());
    showToast("Held cart removed", "info");
  };

  // Complete checkout sale
  const completeSale = async (paymentMethod, paymentDetails = {}) => {
    if (cart.length === 0) return null;

    const salePayload = {
      customer: selectedCustomer?.name || "Walk-in Customer",
      customerId: selectedCustomer?.id || null,
      items: cart.map((i) => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
        cost: i.cost,
        discount: i.discount || 0,
        tax: Math.round(i.price * i.qty * 0.18),
        subtotal: i.price * i.qty - (i.discount || 0)
      })),
      subtotal,
      tax,
      discount: totalDiscount,
      total: grandTotal,
      costTotal: cart.reduce((sum, i) => sum + i.cost * i.qty, 0),
      paymentMethod,
      paymentDetails,
      cashier: api.getCurrentUser().name,
      branch: activeBranch
    };

    const saved = await api.createSale(salePayload);
    await reloadData();
    clearCart();
    setSelectedCustomer(null);
    showToast(`Sale recorded successfully! (${saved.id})`, "success");
    return saved;
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        customers,
        sales,
        cart,
        heldCarts,
        selectedCustomer,
        setSelectedCustomer,
        activeBranch,
        setActiveBranch,
        backendOnline,
        toasts,
        showToast,
        reloadData,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        applyItemDiscount,
        applyItemNote,
        holdCurrentSale,
        resumeHeldSale,
        deleteHeldSale,
        completeSale,
        subtotal,
        tax,
        totalDiscount,
        grandTotal,
        totalItemCount,
        totalUnitCount
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
}
