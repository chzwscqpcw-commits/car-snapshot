-- Remove plain-text registrations from site_events, stored by events that sent
-- the plate as `reg` (pdf_download, pdf_download_error, vehicle_saved) before
-- 30 Oct 2026. /api/event only hashed `vrm`. Run ONCE in the Supabase SQL
-- editor. Drops the key; each row's ip_hash and other metadata stay.
-- Run each statement separately if one times out.

update site_events set metadata = metadata - 'reg'
where event_type = 'pdf_download' and metadata ? 'reg';

update site_events set metadata = metadata - 'reg'
where event_type = 'pdf_download_error' and metadata ? 'reg';

update site_events set metadata = metadata - 'reg'
where event_type = 'vehicle_saved' and metadata ? 'reg';

-- Check: should return 0.
select count(*) from site_events
where event_type in ('pdf_download', 'pdf_download_error', 'vehicle_saved') and metadata ? 'reg';
