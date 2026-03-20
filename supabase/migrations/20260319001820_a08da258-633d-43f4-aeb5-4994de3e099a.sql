
-- Bring overdue due_dates to today+1 or today+2
UPDATE signals SET due_date = CURRENT_DATE + 1 WHERE id = '6dc64800-ad78-4dea-bad1-be4f6973fb4e'; -- Stephen Chen was Mar 17, now tomorrow
UPDATE signals SET due_date = CURRENT_DATE + 2 WHERE id = '0ae29840-a852-426d-989a-8dc12a0ead51'; -- Mike Torres was Mar 20, now day after tomorrow
UPDATE signals SET due_date = CURRENT_DATE + 2 WHERE id = '9c239c67-2483-4c5d-b7db-5f6300321177'; -- David Kim was Mar 20, now day after tomorrow
UPDATE signals SET due_date = CURRENT_DATE WHERE id = 'ad6b1585-1187-47b7-8ef7-5ec1d8a1a304'; -- Elena Ruiz stays today

-- Insert fresh upcoming meetings
INSERT INTO upcoming_meetings (title, starts_at, ends_at, attendees, briefed) VALUES
  ('LP Update Review — Mike Torres', now() + interval '3 hours', now() + interval '4 hours', '[{"name":"Mike Torres","email":"mike@example.com"},{"name":"Elena Ruiz","email":"elena@example.com"}]'::jsonb, false),
  ('Product Strategy Sync', now() + interval '22 hours', now() + interval '23 hours', '[{"name":"Julian","email":"julian@example.com"},{"name":"Stephen Chen","email":"stephen@example.com"}]'::jsonb, false),
  ('Board Prep with David Kim', now() + interval '46 hours', now() + interval '47 hours', '[{"name":"David Kim","email":"david@example.com"},{"name":"Steve Stoute","email":"steve@example.com"}]'::jsonb, false);

-- Insert fresh cooling relationship alerts
INSERT INTO relationship_alerts (contact_name, alert_type, previous_strength, current_strength, dismissed) VALUES
  ('Priya Sharma', 'cooling', 78, 41, false),
  ('Leo Park', 'cooling', 65, 33, false),
  ('David Okafor', 'cooling', 82, 52, false);

-- Insert a few fresh signals to populate the timeline for today
INSERT INTO signals (sender, signal_type, source, priority, summary, source_message, status, captured_at, risk_level, due_date) VALUES
  ('Steve Stoute', 'INTRO', 'linq', 'high', 'Introduction to Kenji Nakamura, SVP Product at SoftBank Vision Fund. Steve positioned the intro as high priority for infrastructure partnership.', 'William meet Kenji. He runs product for SVF and is interested in what you guys are building on the intelligence layer.', 'Captured', now() - interval '45 minutes', null, null),
  ('John Greene', 'INSIGHT', 'linq', 'medium', 'Late-night thread on attention economics. Greene mapped Herbert Simon''s scarcity framework to the current AI noise landscape — direct implications for Signal filtering UX.', 'The wealth of information creates a poverty of attention. Simon said it in 1971 and we still haven''t solved it.', 'Captured', now() - interval '2 hours', null, null),
  ('Julian', 'DECISION', 'linq', 'high', 'Finalize GTM positioning for enterprise pilot. Julian flagged that the current pitch deck undersells the orchestration layer — needs reframe before Thursday partner call.', 'We need to decide: are we selling intelligence or infrastructure? The deck tries to do both and lands neither.', 'Captured', now() - interval '4 hours', 'high', CURRENT_DATE + 1),
  ('Elena Ruiz', 'INVESTMENT', 'linq', 'high', 'Series B term sheet comparison from Northstar vs. Foundry. Elena highlighted key differences in liquidation preferences and board composition that need legal review before Friday.', 'The Northstar sheet has a 2x participating preferred that differs from Foundry standard. Flagging for review.', 'Captured', now() - interval '6 hours', 'critical', CURRENT_DATE + 3),
  ('Marcus Webb', 'CONTEXT', 'linq', 'low', 'Background context on the Arcline Systems partnership discussion. Marcus shared internal org chart and decision-maker mapping for the infrastructure team.', 'Here is the Arcline org structure. The CTO reports to a new COO who joined from Palantir last quarter. That context matters.', 'Captured', now() - interval '8 hours', null, null);
