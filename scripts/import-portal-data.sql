\set ON_ERROR_STOP true

-- 1) Do a dry run on a test table to make sure script can complete
DROP TABLE IF EXISTS mystreet2.test_import CASCADE;

CREATE TABLE mystreet2.test_import (
  resolution text,
  project_number text,
  project_name text,
  project_location text,
  project_type text,
  type_bicycle text,
  type_major_cap_projects text,
  type_ped_safety text,
  type_plans_studies text,
  type_signs_signals text,
  type_street_repair text,
  type_transit_enhance text,
  type_transit_rehab text,
  type_tdm text,
  sponsor text,
  districts text,
  district1 text,
  district2 text,
  district3 text,
  district4 text,
  district5 text,
  district6 text,
  district7 text,
  district8 text,
  district9 text,
  district10 text,
  district11 text,
  current_phase text,
  phase_expected_completion text,
  project_expected_completion text,
  description text,
  funding_sources text,
  project_details_page text,
  project_picture text,
  picture_caption text,
  geometry text,
  prop_aa text,
  prop_k text,
  tfca text,
  obag text,
  reg_state_fed_funding text,
  funding_source_codes text,
  prop_k_yn text,
  shape text,
  icon_name text,
  project_cost_estimate text,
  percent_complete text,
  status text,
  project_group text,
  project_tags text);

COPY mystreet2.test_import FROM '/tmp/portal-dump.csv' DELIMITER ',' CSV HEADER;

-- 2) If we got here, test import completed successfully

DROP TABLE IF EXISTS mystreet2.test_import CASCADE;
DROP TABLE IF EXISTS mystreet2.all_projects CASCADE;

CREATE TABLE mystreet2.all_projects (
  resolution text,
  project_number text,
  project_name text,
  project_location text,
  project_type text,
  type_bicycle text,
  type_major_cap_projects text,
  type_ped_safety text,
  type_plans_studies text,
  type_signs_signals text,
  type_street_repair text,
  type_transit_enhance text,
  type_transit_rehab text,
  type_tdm text,
  sponsor text,
  districts text,
  district1 text,
  district2 text,
  district3 text,
  district4 text,
  district5 text,
  district6 text,
  district7 text,
  district8 text,
  district9 text,
  district10 text,
  district11 text,
  current_phase text,
  phase_expected_completion text,
  project_expected_completion text,
  description text,
  funding_sources text,
  project_details_page text,
  project_picture text,
  picture_caption text,
  geometry text,
  prop_aa text,
  prop_k text,
  tfca text,
  obag text,
  reg_state_fed_funding text,
  funding_source_codes text,
  prop_k_yn text,
  shape text,
  icon_name text,
  project_cost_estimate text,
  percent_complete text,
  status text,
  project_group text,
  project_tags text);

COPY mystreet2.all_projects FROM '/tmp/portal-dump.csv' DELIMITER ',' CSV HEADER;

ALTER TABLE mystreet2.all_projects ADD COLUMN id SERIAL PRIMARY KEY;

-- View: api.mystreet2_sample ---------------------------------
DROP VIEW IF EXISTS api.mystreet2_all;

CREATE OR REPLACE VIEW api.mystreet2_all AS
 SELECT *
   FROM mystreet2.all_projects
  ORDER BY all_projects.id;

ALTER TABLE api.mystreet2_all
  OWNER TO postgres;
GRANT ALL ON TABLE api.mystreet2_all TO postgres;
GRANT SELECT ON TABLE api.mystreet2_all TO anon;

-- View: api.mystreet2_search ---------------------------------

-- usage: http://api.sfcta.org/api/mystreet2_search?select=id,name&terms=@@.{Bike,Bayshore}

SET SCHEMA 'mystreet2';

DROP MATERIALIZED VIEW IF EXISTS api.mystreet2_search CASCADE;

CREATE MATERIALIZED VIEW api.mystreet2_search AS
SELECT all_projects.project_number as id,
       all_projects.project_name as name,
       setweight(
         to_tsvector(all_projects.project_name),
         'A') ||
       setweight(
         to_tsvector(coalesce(all_projects.project_tags,'')),
         'B')  ||
       setweight(
         to_tsvector(all_projects.description),
         'C')  ||
       setweight(
         to_tsvector(all_projects.project_number),
         'A')
       as terms
FROM mystreet2.all_projects
GROUP BY id, name, all_projects.description, all_projects.project_tags;

CREATE INDEX idx_fts_search ON api.mystreet2_search USING gin(terms);

ALTER TABLE api.mystreet2_search OWNER TO postgres;
GRANT ALL ON TABLE api.mystreet2_search TO postgres;
GRANT SELECT ON TABLE api.mystreet2_search TO anon;
