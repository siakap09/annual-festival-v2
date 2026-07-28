-- AOne (the external system this org pulls student data from) only ever
-- exports a student's name -- never parent/guardian contact info. That
-- made these columns' NOT NULL constraints incompatible with bulk-importing
-- that data at all. Parent details can now be added later, per student,
-- from the Student List once they're available -- see completeParticipantDetails
-- in app/actions/registration.ts. The manual "Register Student" form still
-- collects all four fields upfront; only bulk-imported rows can start out
-- incomplete.

alter table participants alter column parent_name drop not null;
alter table participants alter column parent_email drop not null;
alter table participants alter column parent_phone drop not null;
