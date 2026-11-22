-- Supabase > SQL Editor এ পুরোটা Run করুন
create extension if not exists pgcrypto;
create table polls(id uuid primary key default gen_random_uuid(),title text not null,description text,closes_at timestamptz,active boolean default true,created_at timestamptz default now());
create table options(id uuid primary key default gen_random_uuid(),poll_id uuid references polls on delete cascade,name text not null,subtitle text,image_url text,sort int default 0);
create table votes(id bigserial primary key,poll_id uuid references polls on delete cascade,option_id uuid references options on delete cascade,voter text not null,created_at timestamptz default now(),unique(poll_id,voter));
alter table polls enable row level security; alter table options enable row level security; alter table votes enable row level security;
create policy "read polls" on polls for select using (active);
create policy "read options" on options for select using (true);
create function cast_vote(p_poll uuid,p_option uuid,p_voter text) returns void language plpgsql security definer as $$
begin
 if length(p_voter)<8 then raise exception 'bad voter'; end if;
 if not exists(select 1 from polls where id=p_poll and active and (closes_at is null or closes_at>now())) then raise exception 'closed'; end if;
 if not exists(select 1 from options where id=p_option and poll_id=p_poll) then raise exception 'bad option'; end if;
 insert into votes(poll_id,option_id,voter) values(p_poll,p_option,p_voter) on conflict do nothing;
end $$;
create function get_results(p_poll uuid) returns table(option_id uuid,total bigint) language sql security definer as $$
 select option_id,count(*) from votes where poll_id=p_poll group by option_id $$;
grant execute on function cast_vote(uuid,uuid,text), get_results(uuid) to anon;
-- নমুনা জরিপ
with p as (insert into polls(title,description,closes_at) values('কোন বিষয়ে দ্রুত বিচার চান?','একটি অপশন বেছে নিন।',now()+interval '7 days') returning id)
insert into options(poll_id,name,subtitle) select id,n,s from p,(values('দুর্নীতি দমন','প্রশাসনিক স্বচ্ছতা'),('নারী ও শিশু নির্যাতন','দ্রুত বিচার'),('ভূমি দখল','ভূমি বিরোধ')) v(n,s);
