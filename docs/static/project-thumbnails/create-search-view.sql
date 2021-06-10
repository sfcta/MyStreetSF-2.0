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