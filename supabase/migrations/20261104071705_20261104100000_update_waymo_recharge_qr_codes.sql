/*
# Update WAYMO Recharge QR Codes

1. Purpose
- Points the shared Philippine payment option to the newest supplied QR image.
- Points the shared Crypto USDT option to the newest supplied QR image.

2. Payment Routing
- GCash, Maya, and Bank Transfer use one shared scannable code: `bank-payment_copy copy 2.jpg`.
- Crypto USDT uses one shared scannable code: `usdt-payment_copy copy 2.jpg`.
- Existing instructions and supported networks remain unchanged.

3. Data Safety
- Updates only the QR image URL for the named payment methods.
- Does not remove methods or alter recharge records.

4. Security
- Existing authenticated read policies and administrator management policies remain unchanged.
*/

UPDATE public.payment_methods
SET qr_image_url = '/assets/payment/bank-payment_copy copy 2.jpg'
WHERE lower(method_name) IN ('gcash', 'maya', 'paymaya', 'bank transfer');

UPDATE public.payment_methods
SET qr_image_url = '/assets/payment/usdt-payment_copy copy 2.jpg'
WHERE lower(method_name) IN ('crypto usdt', 'usdt', 'crypto');