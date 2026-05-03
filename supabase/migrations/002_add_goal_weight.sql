-- Add goal_weight_kg column to profiles
alter table public.profiles
  add column if not exists goal_weight_kg numeric(5,2) default 85;
