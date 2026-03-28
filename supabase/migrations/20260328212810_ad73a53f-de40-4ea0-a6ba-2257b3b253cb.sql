-- Delete signals older than 5 days
DELETE FROM signal_corrections WHERE signal_id IN (SELECT id FROM signals WHERE captured_at < now() - interval '5 days');
DELETE FROM meeting_speakers WHERE signal_id IN (SELECT id FROM signals WHERE captured_at < now() - interval '5 days');
DELETE FROM meeting_artifacts WHERE signal_id IN (SELECT id FROM signals WHERE captured_at < now() - interval '5 days');
DELETE FROM signals WHERE captured_at < now() - interval '5 days';

-- Delete contact_profiles for bot/service senders
DELETE FROM contact_profiles WHERE name IN (
  'Brain Dump', 'Calendar Bot', 'Slack Bot', 'Newsletter Bot', 'LinkedIn',
  'LinkedIn Notification', 'Industry Newsletter', 'Weekly Digest', 'Spam Filter',
  'Q2 Board Prep', 'Q2 Planning', 'Investor Sync', 'Board Meeting',
  'Portfolio Review', 'Team Standup'
);

-- Delete contact_tags for bot/service senders
DELETE FROM contact_tags WHERE contact_name IN (
  'Brain Dump', 'Calendar Bot', 'Slack Bot', 'Newsletter Bot', 'LinkedIn',
  'LinkedIn Notification', 'Industry Newsletter', 'Weekly Digest', 'Spam Filter',
  'Q2 Board Prep', 'Q2 Planning', 'Investor Sync', 'Board Meeting',
  'Portfolio Review', 'Team Standup'
);