-- Trigger to notify therapist of new booking
CREATE OR REPLACE FUNCTION public.notify_therapist_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  client_name TEXT;
BEGIN
  SELECT full_name INTO client_name FROM public.profiles WHERE id = NEW.client_id;
  
  INSERT INTO public.notifications (user_id, title, content, link)
  VALUES (
    NEW.therapist_id,
    'New Booking Request',
    client_name || ' has requested a session on ' || NEW.session_date || ' at ' || NEW.session_time,
    '/therapist/bookings'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_therapist_on_booking ON public.bookings;
CREATE TRIGGER trg_notify_therapist_on_booking
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_therapist_on_booking();

-- Trigger to notify client on booking status change
CREATE OR REPLACE FUNCTION public.notify_client_on_booking_update()
RETURNS TRIGGER AS $$
DECLARE
  therapist_name TEXT;
BEGIN
  IF (OLD.status != NEW.status) THEN
    SELECT full_name INTO therapist_name FROM public.therapists WHERE id = NEW.therapist_id;
    
    INSERT INTO public.notifications (user_id, title, content, link)
    VALUES (
      NEW.client_id,
      'Booking ' || NEW.status,
      'Your session with ' || therapist_name || ' on ' || NEW.session_date || ' has been ' || NEW.status,
      '/bookings'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_client_on_booking_update ON public.bookings;
CREATE TRIGGER trg_notify_client_on_booking_update
AFTER UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.notify_client_on_booking_update();
