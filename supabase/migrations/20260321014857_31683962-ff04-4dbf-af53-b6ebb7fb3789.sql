
-- Add column to store parsed ChatGPT conversation content per link
ALTER TABLE public.feedback_entries
ADD COLUMN parsed_chatgpt jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.feedback_entries.parsed_chatgpt IS 'Array of {url, title, content} objects with scraped ChatGPT conversation markdown';
