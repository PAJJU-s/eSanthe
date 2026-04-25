import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Package, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { placeOrderFromCart } from '../services/orders';
import { publishFarmerNewOrder } from '../services/realtime';

export default function Cart() {
  const { items, updateQty, removeFromCart, total, clearCart } = useCart();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' or 'orders'
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const generateInvoice = (orderItems, orderTotal, rawOrderId) => {
    try {
      // Safely handle orderId whether it's an object, number, or string
      const safeOrderId = typeof rawOrderId === 'object' && rawOrderId !== null 
        ? (rawOrderId.id || 'UNKNOWN') 
        : String(rawOrderId || 'UNKNOWN');
      const shortOrderId = safeOrderId.substring(0, 8);

      const invoiceHTML = `
        <html>
          <head>
            <title>Invoice - ${safeOrderId}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto; line-height: 1.6; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2D6A4F; padding-bottom: 20px; margin-bottom: 30px; }
              .header-brand h1 { color: #1B4332; margin: 0; font-size: 2.5em; }
              .header-brand p { color: #52B788; margin: 5px 0 0 0; font-weight: 500; }
              .header-meta { text-align: right; color: #666; }
              .details { margin-bottom: 40px; display: flex; justify-content: space-between; background: #f8fcf9; padding: 20px; border-radius: 8px; border: 1px solid #D1FAE5; }
              .details div p { margin: 5px 0; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
              th, td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
              th { background-color: #2D6A4F; color: white; font-weight: 600; text-transform: uppercase; font-size: 0.9em; }
              tr:nth-child(even) { background-color: #fafafa; }
              .total-section { display: flex; justify-content: flex-end; margin-top: 30px; }
              .total-box { background: #f8fcf9; padding: 20px; border-radius: 8px; border: 1px solid #D1FAE5; width: 300px; }
              .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; color: #555; }
              .total-row.grand-total { font-size: 1.3em; font-weight: bold; color: #1B4332; border-top: 2px solid #D1FAE5; padding-top: 10px; margin-top: 10px; }
              .footer { text-align: center; margin-top: 50px; color: #888; font-size: 0.9em; border-top: 1px solid #eee; padding-top: 20px; }
              @media print {
                body { padding: 0; }
                .header { border-bottom-color: #000; }
                th { background-color: #f0f0f0; color: #000; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-brand">
                <h1>eSanthe</h1>
                <p>Fresh Produce Direct from Farmers</p>
              </div>
              <div class="header-meta">
                <h2>INVOICE</h2>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div class="details">
              <div>
                <p style="color: #666; font-size: 0.9em; text-transform: uppercase; font-weight: bold;">Billed To:</p>
                <p><strong>${user?.user_metadata?.full_name || user?.email || 'Customer'}</strong></p>
                <p>${user?.email || ''}</p>
              </div>
              <div style="text-align: right;">
                <p style="color: #666; font-size: 0.9em; text-transform: uppercase; font-weight: bold;">Order Details:</p>
                <p><strong>Order ID:</strong> #${shortOrderId}</p>
                <p><strong>Status:</strong> Paid</p>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Farmer</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${orderItems.map(item => `
                  <tr>
                    <td><strong>${item.name}</strong></td>
                    <td>${item.farmerName}</td>
                    <td>₹${item.price}</td>
                    <td>${item.quantity} kg</td>
                    <td>₹${item.price * item.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total-section">
              <div class="total-box">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>₹${orderTotal}</span>
                </div>
                <div class="total-row">
                  <span>Delivery:</span>
                  <span style="color: #2D6A4F;">Free</span>
                </div>
                <div class="total-row grand-total">
                  <span>Total Paid:</span>
                  <span>₹${orderTotal}</span>
                </div>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for supporting local farmers! This is a computer generated invoice.</p>
              <p style="margin-top: 10px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #2D6A4F; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1em;">Print / Save as PDF</button>
              </p>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([invoiceHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eSanthe_Invoice_${shortOrderId}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Invoice generation failed:', err);
      toast.error('Payment succeeded, but invoice generation failed.');
    }
  };

  const processPaymentAndOrder = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      // Simulate payment delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const orderId = await placeOrderFromCart({ customerId: user.id, items });
      const farmerIds = [...new Set(items.map((item) => item.farmerId).filter(Boolean))];
      await Promise.all(
        farmerIds.map((farmerId) =>
          publishFarmerNewOrder({
            farmerId,
            orderId,
            summary: { total, itemCount: items.length },
          })
        )
      );
      
      toast.success('Payment successful! Order placed.');
      
      // Generate and download invoice
      generateInvoice(items, total, orderId);
      
      clearCart();
      setShowPayment(false);
      setIsProcessing(false);
      setActiveTab('success');
    } catch (error) {
      setIsProcessing(false);
      toast.error(error.message || 'Payment or order placement failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1B4332] font-display">Your Cart & Orders</h1>
      </div>

      {/* Tabs */}
      {activeTab !== 'success' && (
        <div className="flex space-x-4 border-b border-gray-200 mb-8">
          <button
            onClick={() => setActiveTab('cart')}
            className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'cart'
                ? 'border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Cart
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-4 font-semibold text-sm border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-[#2D6A4F] text-[#2D6A4F]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Track Orders
          </button>
        </div>
      )}

      {activeTab === 'cart' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-[#D1FAE5] shadow-sm">
                <ShoppingBag className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-[#1B4332] mb-2">Your cart is empty</h3>
                <p className="text-gray-500 mb-6">Looks like you haven't added any fresh produce yet.</p>
                <Link
                  to="/marketplace"
                  className="inline-flex justify-center items-center px-6 py-2.5 font-semibold bg-[#2D6A4F] text-white rounded-full hover:bg-[#52B788] transition"
                >
                  Browse Marketplace
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="flex flex-col sm:flex-row items-start sm:items-center p-4 bg-white rounded-2xl border border-[#D1FAE5] shadow-sm relative transition-all hover:shadow-md">
                  {/* Image */}
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-xl bg-gray-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-3xl">
                      🌿
                    </div>
                  )}
                  
                  {/* Details */}
                  <div className="flex-grow mt-4 sm:mt-0 sm:ml-4">
                    <h3 className="text-lg font-semibold text-[#1B4332]">{item.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{item.farmerName} · {item.farmerLocation}</p>
                    <div className="font-bold text-[#2D6A4F]">₹{item.price} / kg</div>
                  </div>

                  {/* Right side Actions */}
                  <div className="mt-4 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto h-full">
                    {/* Stepper */}
                    <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-3 py-1 border border-gray-200">
                      <button
                        onClick={() => updateQty(item.productId, item.quantity - 1)}
                        className="p-1 hover:text-[#2D6A4F] transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-medium text-gray-800 min-w-[2ch] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                        className="p-1 hover:text-[#2D6A4F] transition"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="flex items-center space-x-4 sm:mt-4">
                      <span className="font-semibold text-gray-900 hidden sm:inline-block">₹{item.price * item.quantity}</span>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-400 hover:text-red-600 transition"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Summary */}
          {items.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#D1FAE5] shadow-sm p-6 h-fit sticky top-24">
              <h2 className="text-xl font-bold text-[#1B4332] mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                  <span className="font-medium">₹{total}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Estimate</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mb-6">
                <div className="flex justify-between items-center text-lg font-bold text-[#1B4332]">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Taxes included if applicable.</p>
              </div>

              <button
                onClick={() => setShowPayment(true)}
                className="w-full flex justify-center items-center px-6 py-3.5 font-bold bg-[#2D6A4F] text-white rounded-xl hover:bg-[#1B4332] transition shadow-md hover:shadow-lg text-lg"
              >
                Proceed to Payment <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-[#D1FAE5] flex flex-col p-8 items-center text-center shadow-sm">
           <Package className="h-16 w-16 text-[#52B788] mb-4" />
           <h3 className="text-2xl font-bold text-[#1B4332] mb-2 font-display">Track Your Orders</h3>
           <p className="text-gray-500 mb-8 max-w-md font-medium">To see your complete order history, including invoice downloads for past orders, please visit the specific Orders page.</p>
           <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
             <button
               onClick={() => navigate('/orders')}
               className="px-8 py-3 bg-[#2D6A4F] text-white rounded-full font-bold hover:bg-[#1B4332] transition shadow-md hover:shadow-lg"
             >
               Go to My Orders
             </button>
             <button
               onClick={() => setActiveTab('cart')}
               className="px-8 py-3 bg-gray-100 border border-gray-200 rounded-full font-bold text-gray-700 hover:bg-gray-200 transition"
             >
               Back to Cart
             </button>
           </div>
        </div>
      )}

      {activeTab === 'success' && (
        <div className="bg-white rounded-3xl border border-[#D1FAE5] flex flex-col p-12 items-center text-center shadow-lg max-w-2xl mx-auto mt-8 animate-fade-in-up">
           <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
             <svg className="w-12 h-12 text-[#2D6A4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
             </svg>
           </div>
           <h2 className="text-4xl font-bold text-[#1B4332] mb-4 font-display">Payment Successful!</h2>
           <p className="text-gray-500 mb-8 text-lg font-medium max-w-md">
             Thank you for your purchase. Your order has been placed and your invoice has been automatically downloaded.
           </p>
           <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
             <button
               onClick={() => navigate('/orders')}
               className="px-8 py-3 bg-[#2D6A4F] text-white rounded-full font-bold hover:bg-[#1B4332] transition shadow-md hover:shadow-lg"
             >
               Track Your Order
             </button>
             <button
               onClick={() => navigate('/marketplace')}
               className="px-8 py-3 bg-gray-100 border border-gray-200 rounded-full font-bold text-gray-700 hover:bg-gray-200 transition"
             >
               Continue Shopping
             </button>
           </div>
        </div>
      )}

      {showPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1B4332] font-display flex items-center">
                <CreditCard className="mr-2 h-6 w-6 text-[#2D6A4F]"/> Secure Payment
              </h2>
            </div>
            <div className="mb-6 bg-[#f8fcf9] p-4 rounded-xl border border-[#D1FAE5] flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Amount</span>
                <span className="text-2xl font-bold text-[#2D6A4F]">₹{total}</span>
            </div>
            
            <form onSubmit={processPaymentAndOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number (Dummy)</label>
                <input 
                  type="text" 
                  required 
                  placeholder="1234 5678 9012 3456" 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#2D6A4F] focus:border-[#2D6A4F] transition shadow-sm font-mono tracking-widest text-sm"
                  pattern="[0-9]{16}"
                  maxLength="16"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="MM/YY" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#2D6A4F] focus:border-[#2D6A4F] transition shadow-sm font-mono text-center"
                    pattern="(0[1-9]|1[0-2])\/[0-9]{2}"
                    maxLength="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="***" 
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-[#2D6A4F] focus:border-[#2D6A4F] transition shadow-sm font-mono text-center tracking-widest"
                    pattern="[0-9]{3,4}"
                    maxLength="4"
                  />
                </div>
              </div>
              
              <div className="pt-6 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPayment(false)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 bg-[#2D6A4F] text-white rounded-xl font-bold hover:bg-[#1B4332] transition shadow-md hover:shadow-lg disabled:opacity-50 flex justify-center items-center"
                >
                  {isProcessing ? (
                    <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    `Pay ₹${total}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
