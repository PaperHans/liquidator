-- fxn
CREATE OR REPLACE FUNCTION public.notify_testevent()
  RETURNS trigger AS $$ DECLARE
    BEGIN
      PERFORM pg_notify('new_testevent', row_to_json(NEW)::text);
      RETURN new;
    END;
  $$
  LANGUAGE plpgsql;

-- trigger
CREATE TRIGGER test_trigger
AFTER INSERT OR UPDATE ON public.accounts
FOR EACH ROW
  WHEN ( CAST( new.health_factor AS BIGINT ) < 1000000000000000000 )
  EXECUTE PROCEDURE public.notify_testevent();
