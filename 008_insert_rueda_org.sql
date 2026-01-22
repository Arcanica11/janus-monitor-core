-- Insertar Rueda la Rola en la tabla de organizaciones
INSERT INTO public.organizations (name, slug, is_internal)
VALUES ('Rueda la Rola', 'rueda-la-rola', false);

-- Verificar que ahora hay dos
SELECT * FROM public.organizations;
