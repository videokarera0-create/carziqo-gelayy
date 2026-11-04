/*
# Seed Recharge Wallet Payment Methods

1. Purpose
- Adds the requested GCash, Maya, Bank Transfer, and Crypto USDT payment choices to the Recharge Wallet screen.
- Uses the supplied QR images already present in the public payment assets folder.

2. Payment Methods
- GCash: uses the supplied bank-payment QR image.
- Maya: uses the supplied bank-payment QR image.
- Bank Transfer: uses the supplied bank-payment QR image.
- Crypto USDT: uses the supplied USDT QR image and lists BNB Smart Chain, opBNB, Ethereum ERC20, Ethereum Base, and WLD WorldCoin networks.

3. Data Safety
- Updates matching existing methods instead of creating duplicates.
- Inserts only missing methods.
- Does not remove or overwrite unrelated payment methods.

4. Security
- Grants authenticated users SELECT access to payment methods.
- Existing row-level security policies continue to control active methods for regular users and management access for administrators.
*/

GRANT SELECT ON public.payment_methods TO authenticated;

UPDATE public.payment_methods
SET qr_image_url = '/assets/payment/bank-payment_copy copy.jpg',
    instructions = 'Send your payment through GCash, Maya, or Bank Transfer using the QR code. Make sure the amount matches your recharge request, then upload a clear payment screenshot with the transaction reference.',
    is_active = true
WHERE lower(method_name) IN ('gcash', 'maya', 'paymaya', 'bank transfer');

UPDATE public.payment_methods
SET method_name = 'Crypto USDT',
    qr_image_url = '/assets/payment/usdt-payment_copy copy.jpg',
    instructions = 'Send USDT only through one supported network: BNB Smart Chain, opBNB, Ethereum ERC20, Ethereum Base, or WLD WorldCoin. Confirm the network before sending, then upload a clear payment screenshot with the transaction reference.',
    is_active = true
WHERE lower(method_name) IN ('crypto usdt', 'usdt', 'crypto');

INSERT INTO public.payment_methods (method_name, qr_image_url, instructions, is_active)
SELECT 'GCash', '/assets/payment/bank-payment_copy copy.jpg', 'Send your payment through GCash using the QR code. Make sure the amount matches your recharge request, then upload a clear payment screenshot with the transaction reference.', true
WHERE NOT EXISTS (SELECT 1 FROM public.payment_methods WHERE lower(method_name) = 'gcash');

INSERT INTO public.payment_methods (method_name, qr_image_url, instructions, is_active)
SELECT 'Maya', '/assets/payment/bank-payment_copy copy.jpg', 'Send your payment through Maya using the QR code. Make sure the amount matches your recharge request, then upload a clear payment screenshot with the transaction reference.', true
WHERE NOT EXISTS (SELECT 1 FROM public.payment_methods WHERE lower(method_name) IN ('maya', 'paymaya'));

INSERT INTO public.payment_methods (method_name, qr_image_url, instructions, is_active)
SELECT 'Bank Transfer', '/assets/payment/bank-payment_copy copy.jpg', 'Complete your bank transfer using the provided QR code or payment details. Make sure the amount matches your recharge request, then upload a clear payment screenshot with the transaction reference.', true
WHERE NOT EXISTS (SELECT 1 FROM public.payment_methods WHERE lower(method_name) = 'bank transfer');

INSERT INTO public.payment_methods (method_name, qr_image_url, instructions, is_active)
SELECT 'Crypto USDT', '/assets/payment/usdt-payment_copy copy.jpg', 'Send USDT only through one supported network: BNB Smart Chain, opBNB, Ethereum ERC20, Ethereum Base, or WLD WorldCoin. Confirm the network before sending, then upload a clear payment screenshot with the transaction reference.', true
WHERE NOT EXISTS (SELECT 1 FROM public.payment_methods WHERE lower(method_name) IN ('crypto usdt', 'usdt', 'crypto'));