-- Removes the unused specialist validation flag from diagnosis records.
ALTER TABLE diagnosticos DROP COLUMN validated_by_specialist;
