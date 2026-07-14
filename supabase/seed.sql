-- Local development seed only. All people and institutions are fictional.
insert into public.faculty (id,name,university,department,country,official_profile_url,research_areas,status) values
('10000000-0000-4000-8000-000000000001','Mira Solace','Aurora Plains University','Robotics and Intelligent Systems','United States','https://example.edu/faculty/mira-solace',array['Robot learning','Human-robot interaction'],'approved'),
('10000000-0000-4000-8000-000000000002','Rowan Vale','Maple Harbor Institute','Autonomous Systems','Canada','https://example.edu/faculty/rowan-vale',array['Field robotics','Motion planning'],'approved');
