PRAGMA foreign_keys = ON;

-- Only known demo sources and UUID-based accounts created by the external-analysis tests.
DELETE FROM diagnosticos
WHERE source IN ('test_seed_diagnostico', 'mock')
   OR user_id IN (
     SELECT id FROM usuarios
     WHERE substr(email, -12) = '@example.com'
       AND (
         (substr(email, 1, 9) = 'externas-' AND length(email) = 57)
         OR (substr(email, 1, 10) = 'visitante-' AND length(email) = 58)
       )
   );
