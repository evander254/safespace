-- Add completed_sessions_count to therapists
ALTER TABLE public.therapists 
ADD COLUMN IF NOT EXISTS completed_sessions_count INT NOT NULL DEFAULT 0;

-- Function to update completed sessions count
CREATE OR REPLACE FUNCTION public.update_therapist_completed_sessions()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF (OLD.status != 'completed' AND NEW.status = 'completed') THEN
      UPDATE public.therapists 
      SET completed_sessions_count = completed_sessions_count + 1
      WHERE id = NEW.therapist_id;
    ELSIF (OLD.status = 'completed' AND NEW.status != 'completed') THEN
      UPDATE public.therapists 
      SET completed_sessions_count = completed_sessions_count - 1
      WHERE id = NEW.therapist_id;
    END IF;
  ELSIF (TG_OP = 'DELETE' AND OLD.status = 'completed') THEN
    UPDATE public.therapists 
    SET completed_sessions_count = completed_sessions_count - 1
    WHERE id = OLD.therapist_id;
  ELSIF (TG_OP = 'INSERT' AND NEW.status = 'completed') THEN
    UPDATE public.therapists 
    SET completed_sessions_count = completed_sessions_count + 1
    WHERE id = NEW.therapist_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for completed sessions count
DROP TRIGGER IF EXISTS trg_update_completed_sessions ON public.bookings;
CREATE TRIGGER trg_update_completed_sessions
AFTER INSERT OR UPDATE OR DELETE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_therapist_completed_sessions();

-- Backfill existing completed sessions
UPDATE public.therapists t
SET completed_sessions_count = (
  SELECT count(*) 
  FROM public.bookings b 
  WHERE b.therapist_id = t.id AND b.status = 'completed'
);
