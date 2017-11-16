CREATE TABLE mystreet2.sample_projects (
  resolution text,
  project_number text,
  project_name text,
  project_location text,
  new_project_type text,
  new_project_tags text,
  sponsor text,
  districts text,
  district1 integer,
  district2 integer,
  district3 integer,
  district4 integer,
  district5 integer,
  district6 integer,
  district7 integer,
  district8 integer,
  district9 integer,
  district10 integer,
  district11 integer,
  current_phase text,
  phase_expected_completion date,
  project_expected_completion date,
  description text,
  funding_sources text,
  project_details_page text,
  geometry text,
  prop_aa integer,
  prop_k integer,
  tfca integer,
  obag integer,
  reg_state_fed_funding integer,
  funding_source_codes integer,
  shape text,
  icon_name text,
  project_cost_estimate text,
  percent_complete text,
  status text);

--COPY mystreet2.sample_projects FROM 'test-projects.csv' DELIMITER ',' CSV HEADER;

ALTER TABLE mystreet2.sample_projects ADD COLUMN id SERIAL PRIMARY KEY;

-- View: api.mystreet2_sample ---------------------------------
-- DROP VIEW api.mystreet2_sample;

CREATE OR REPLACE VIEW api.mystreet2_sample AS
 SELECT *
   FROM mystreet2.sample_projects
  ORDER BY sample_projects.id;

ALTER TABLE api.mystreet2_sample
  OWNER TO postgres;
GRANT ALL ON TABLE api.mystreet2_sample TO postgres;
GRANT SELECT ON TABLE api.mystreet2_sample TO anon;
