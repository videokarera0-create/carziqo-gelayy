/*
  # Add car-images storage bucket

  Public bucket for admin-uploaded car listing images.
  Only admins can upload/update/delete; everyone can read.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('car-images', 'car-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "admin_upload_car_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'car-images'
    AND public.is_admin()
  );

CREATE POLICY "admin_update_car_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'car-images'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'car-images'
    AND public.is_admin()
  );

CREATE POLICY "admin_delete_car_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'car-images'
    AND public.is_admin()
  );

CREATE POLICY "public_read_car_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'car-images');