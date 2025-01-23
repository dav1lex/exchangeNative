# exchangeNative 

A mobile currency exchange app built with React Native that allows users to buy
and sell currencies using exchange rates from NBP.

## Features

- 👤 User Authentication
- 💰 Account Management
- 💱 Exchange Rates
- 📊 Transaction History
- 💵 Buy/Sell Currencies

## Tech Stack

- Frontend: React Native
- Backend: Node.js + Express
- Database: PostgreSQL
- Hosting:
  - Backend: Render
  - Database: Render
  - Frontend: Netlify

## API Integration

The app uses the NBP API to fetch current exchange rates, does not store in db:
- https://api.nbp.pl/

## Bugs

1. **UI/UX Issues:**
  - HomeScreen rates section does not scroll properly on overflow

## Live 
[Click here](davilex.netlify.app)

### Database:
```sql
-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    email text NOT NULL,
    password text NOT NULL,
    balance real DEFAULT 0,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

-- Holdings Table
CREATE TABLE IF NOT EXISTS public.holdings (
    userid integer NOT NULL,
    currency text NOT NULL,
    amount real,
    CONSTRAINT holdings_pkey PRIMARY KEY (userid, currency),
    CONSTRAINT holdings_userid_fkey FOREIGN KEY (userid)
        REFERENCES public.users (id)
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id integer NOT NULL DEFAULT nextval('transactions_id_seq'::regclass),
    userid integer,
    currency text,
    amount real,
    type text,
    timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    rate numeric,
    CONSTRAINT transactions_pkey PRIMARY KEY (id)
);