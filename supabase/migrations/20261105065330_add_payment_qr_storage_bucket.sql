/*
  # Add payment-qr-codes storage bucket

  Creates a public storage bucket for admin-uploaded payment QR codes.
  Only admins can upload/update; everyone can read (QR codes must be
  visible to users during recharge).
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qr-codes', 'payment-qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Admin-only upload to payment-qr-codes
CREATE POLICY "admin_upload_payment_qr"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-qr-codes'
    AND public.is_admin()
  );

-- Admin-only update/delete
CREATE POLICY "admin_update_payment_qr"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'payment-qr-codes'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'payment-qr-codes'
    AND public.is_admin()
  );

CREATE POLICY "admin_delete_payment_qr"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'payment-qr-codes'
    AND public.is_admin()
  );

-- Public read (users need to see QR codes during recharge)
CREATE POLICY "public_read_payment_qr"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'payment-qr-codes');