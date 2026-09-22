const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let loadPromise = null;

/** Loads Razorpay's Checkout script once, reusing the same promise on repeat calls. */
function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load the payment widget. Please check your connection.'));
    document.body.appendChild(script);
  });

  return loadPromise;
}

/** Opens Razorpay Checkout and resolves with the success payload, or rejects if cancelled/failed. */
export async function openRazorpayCheckout(options) {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...options,
      handler: (response) => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Payment cancelled.')),
      },
    });
    rzp.on('payment.failed', (resp) => {
      reject(new Error(resp.error?.description || 'Payment failed. Please try again.'));
    });
    rzp.open();
  });
}
