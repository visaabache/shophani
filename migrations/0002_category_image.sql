-- A photo for each category (shown as an arch on the home page and as the banner of the category page).
ALTER TABLE categories ADD COLUMN image TEXT NOT NULL DEFAULT '';
