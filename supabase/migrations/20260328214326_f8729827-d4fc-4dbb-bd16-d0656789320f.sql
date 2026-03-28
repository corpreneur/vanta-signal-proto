
-- Add 20 new realistic contacts as signals (3 signals each for variety)
-- Each contact gets signals across different types and sources for realistic strength scores

INSERT INTO signals (sender, summary, source_message, signal_type, priority, source, captured_at, status) VALUES
-- 1. Rachel Kim
('Rachel Kim', 'Product roadmap alignment discussion', 'Rachel: Can we sync on the Q3 product roadmap? I want to make sure our teams are aligned on priorities.', 'MEETING', 'high', 'recall', now() - interval '1 day', 'Captured'),
('Rachel Kim', 'Follow-up on partnership opportunity', 'Hey, following up on our conversation about the co-marketing initiative. Deck attached.', 'CONTEXT', 'medium', 'gmail', now() - interval '3 days', 'Captured'),
('Rachel Kim', 'Intro to head of growth at Figma', 'Connecting you with our Head of Growth — think there is strong synergy.', 'INTRO', 'high', 'linq', now() - interval '6 days', 'Captured'),

-- 2. Daniel Okafor
('Daniel Okafor', 'Series B term sheet review', 'Daniel: Reviewed the term sheet — a few things to flag before we sign.', 'INVESTMENT', 'high', 'linq', now() - interval '2 days', 'Captured'),
('Daniel Okafor', 'Board deck feedback', 'Good structure on the deck. Suggest adding a competitive moat slide.', 'CONTEXT', 'medium', 'gmail', now() - interval '5 days', 'Captured'),

-- 3. Lena Moss
('Lena Moss', 'Design review for onboarding flow', 'Lena walked through the new onboarding wireframes. Strong direction.', 'MEETING', 'medium', 'recall', now() - interval '1 day', 'Captured'),
('Lena Moss', 'Figma link for mobile redesign', 'Here is the updated Figma for the mobile nav redesign.', 'CONTEXT', 'low', 'linq', now() - interval '4 days', 'Captured'),
('Lena Moss', 'UX research findings shared', 'Sharing the usability test results from last week — 3 key insights.', 'INSIGHT', 'high', 'gmail', now() - interval '8 days', 'Captured'),

-- 4. Michael Tran
('Michael Tran', 'Infrastructure cost optimization', 'Michael: We can cut cloud spend 30% by switching to reserved instances.', 'DECISION', 'high', 'recall', now() - interval '2 days', 'Captured'),
('Michael Tran', 'Incident postmortem review', 'Postmortem from last Tuesday outage — root cause was DNS misconfiguration.', 'CONTEXT', 'medium', 'gmail', now() - interval '7 days', 'Captured'),

-- 5. Aisha Bello
('Aisha Bello', 'Customer success quarterly review', 'Aisha: NPS is up 12 points. Churn risk flagged for 3 enterprise accounts.', 'INSIGHT', 'high', 'recall', now() - interval '1 day', 'Captured'),
('Aisha Bello', 'Escalation on Meridian account', 'Heads up — Meridian is threatening to churn. Need exec intervention.', 'DECISION', 'high', 'linq', now() - interval '3 days', 'Captured'),
('Aisha Bello', 'New playbook for onboarding', 'Drafted a new onboarding playbook for mid-market customers.', 'CONTEXT', 'medium', 'gmail', now() - interval '10 days', 'Captured'),

-- 6. Chris Hensley
('Chris Hensley', 'Legal review of vendor agreement', 'Chris: Flagged 2 liability clauses in the new vendor MSA.', 'DECISION', 'high', 'gmail', now() - interval '2 days', 'Captured'),
('Chris Hensley', 'IP protection strategy update', 'Updated our IP filing strategy — 3 new provisional patents recommended.', 'INSIGHT', 'medium', 'linq', now() - interval '9 days', 'Captured'),

-- 7. Priya Sharma
('Priya Sharma', 'Hiring pipeline review', 'Priya: 4 candidates in final round for senior engineer role.', 'CONTEXT', 'medium', 'recall', now() - interval '1 day', 'Captured'),
('Priya Sharma', 'Culture survey results', 'Survey results are in — engagement score is 78, up from 71 last quarter.', 'INSIGHT', 'medium', 'gmail', now() - interval '5 days', 'Captured'),
('Priya Sharma', 'New equity compensation framework', 'Proposing a revised equity refresh program for senior ICs.', 'DECISION', 'high', 'linq', now() - interval '12 days', 'Captured'),

-- 8. Jordan Blake
('Jordan Blake', 'Content strategy for product launch', 'Jordan: Here is the content calendar for the June launch. 14 pieces planned.', 'CONTEXT', 'medium', 'gmail', now() - interval '2 days', 'Captured'),
('Jordan Blake', 'Brand refresh concepts', 'Sharing 3 brand refresh directions — leaning toward option B.', 'INSIGHT', 'medium', 'linq', now() - interval '6 days', 'Captured'),

-- 9. Elena Ruiz
('Elena Ruiz', 'Revenue forecast update', 'Elena: Q3 pipeline is tracking 15% above plan. Two enterprise deals closing this month.', 'INVESTMENT', 'high', 'recall', now() - interval '1 day', 'Captured'),
('Elena Ruiz', 'Pricing tier restructure proposal', 'Recommending we add a growth tier between starter and enterprise.', 'DECISION', 'high', 'gmail', now() - interval '4 days', 'Captured'),
('Elena Ruiz', 'Competitive intel on Notion launch', 'Notion just announced a CRM feature — here is my analysis of the impact.', 'INSIGHT', 'medium', 'linq', now() - interval '11 days', 'Captured'),

-- 10. Sam Nguyen
('Sam Nguyen', 'API integration with Salesforce', 'Sam: Salesforce integration is live in staging. Ready for QA.', 'CONTEXT', 'medium', 'linq', now() - interval '3 days', 'Captured'),
('Sam Nguyen', 'Performance benchmarks shared', 'p99 latency down to 180ms after the caching layer changes.', 'INSIGHT', 'low', 'gmail', now() - interval '8 days', 'Captured'),

-- 11. Marta Cline
('Marta Cline', 'Board meeting preparation call', 'Marta: Let us run through the board narrative before Thursday.', 'MEETING', 'high', 'phone', now() - interval '1 day', 'Captured'),
('Marta Cline', 'Investor update draft review', 'Investor update looks solid. Minor edits on the financial summary.', 'INVESTMENT', 'medium', 'gmail', now() - interval '5 days', 'Captured'),
('Marta Cline', 'Strategic advisory session', 'Discussed go-to-market expansion into APAC. Strong opportunity.', 'INSIGHT', 'high', 'recall', now() - interval '14 days', 'Captured'),

-- 12. Ethan Weiss
('Ethan Weiss', 'Security audit findings', 'Ethan: SOC 2 audit complete — 2 minor findings, both remediated.', 'DECISION', 'high', 'gmail', now() - interval '2 days', 'Captured'),
('Ethan Weiss', 'Data retention policy update', 'Updated data retention policies to comply with GDPR amendments.', 'CONTEXT', 'medium', 'linq', now() - interval '7 days', 'Captured'),

-- 13. Olivia Park
('Olivia Park', 'Product analytics deep dive', 'Olivia: Feature adoption is 34% for the new dashboard. Need to improve discoverability.', 'INSIGHT', 'high', 'recall', now() - interval '1 day', 'Captured'),
('Olivia Park', 'A/B test results for checkout flow', 'Variant B increased conversion by 8.2%. Recommending full rollout.', 'DECISION', 'high', 'gmail', now() - interval '4 days', 'Captured'),
('Olivia Park', 'User research summary shared', 'Key finding: users want better search and faster page loads.', 'INSIGHT', 'medium', 'linq', now() - interval '9 days', 'Captured'),

-- 14. Ryan Foster
('Ryan Foster', 'Call about partnership terms', 'Ryan: Can we hop on a call to finalize the rev share structure?', 'PHONE_CALL', 'medium', 'phone', now() - interval '3 days', 'Captured'),
('Ryan Foster', 'Partnership MOU draft', 'Attached the MOU draft for review. Happy to discuss any redlines.', 'CONTEXT', 'medium', 'gmail', now() - interval '8 days', 'Captured'),

-- 15. Nadia Volkov
('Nadia Volkov', 'Market expansion research', 'Nadia: European market entry analysis complete. Germany and UK are top targets.', 'INSIGHT', 'high', 'recall', now() - interval '2 days', 'Captured'),
('Nadia Volkov', 'Competitor pricing analysis', 'Full pricing comparison across 8 competitors. We are positioned well in mid-market.', 'INVESTMENT', 'medium', 'gmail', now() - interval '6 days', 'Captured'),
('Nadia Volkov', 'Strategic planning offsite notes', 'Notes from the offsite — 3 strategic priorities for H2 identified.', 'CONTEXT', 'medium', 'linq', now() - interval '13 days', 'Captured'),

-- 16. Ben Calloway
('Ben Calloway', 'Sales enablement materials', 'Ben: New battle cards and one-pagers are ready for the sales team.', 'CONTEXT', 'medium', 'gmail', now() - interval '2 days', 'Captured'),
('Ben Calloway', 'Enterprise deal strategy call', 'Discussed approach for the Fortune 500 prospect. Champion identified.', 'MEETING', 'high', 'recall', now() - interval '5 days', 'Captured'),

-- 17. Tessa Linehan
('Tessa Linehan', 'Customer feedback synthesis', 'Tessa: Synthesized 200+ feedback entries. Top 3 themes attached.', 'INSIGHT', 'high', 'linq', now() - interval '1 day', 'Captured'),
('Tessa Linehan', 'Feature prioritization framework', 'Proposing RICE scoring for next quarter feature prioritization.', 'DECISION', 'medium', 'gmail', now() - interval '6 days', 'Captured'),
('Tessa Linehan', 'User interview highlights', 'Key quote: "This saves me 2 hours every week." Sharing the full transcript.', 'CONTEXT', 'low', 'recall', now() - interval '11 days', 'Captured'),

-- 18. Andre Leclaire
('Andre Leclaire', 'International payments integration', 'Andre: Stripe international is live. Supporting 14 currencies now.', 'CONTEXT', 'medium', 'linq', now() - interval '3 days', 'Captured'),
('Andre Leclaire', 'Finance team sync on burn rate', 'Current burn rate gives us 18 months runway. Recommend reducing cloud spend.', 'INVESTMENT', 'high', 'recall', now() - interval '7 days', 'Captured'),

-- 19. Katie Yoon
('Katie Yoon', 'PR strategy for funding announcement', 'Katie: Drafted the press release and media list. Embargo date TBD.', 'CONTEXT', 'high', 'gmail', now() - interval '1 day', 'Captured'),
('Katie Yoon', 'Social media campaign results', 'LinkedIn campaign drove 12K impressions and 340 signups.', 'INSIGHT', 'medium', 'linq', now() - interval '5 days', 'Captured'),
('Katie Yoon', 'Podcast interview opportunity', 'Secured a spot on the SaaS Insider podcast for next month.', 'INTRO', 'medium', 'gmail', now() - interval '10 days', 'Captured'),

-- 20. Leo Marchetti
('Leo Marchetti', 'Technical architecture review', 'Leo: Reviewed the microservices migration plan. Phased approach recommended.', 'DECISION', 'high', 'recall', now() - interval '2 days', 'Captured'),
('Leo Marchetti', 'Database scaling strategy', 'Proposing read replicas and connection pooling to handle 10x traffic.', 'INSIGHT', 'medium', 'linq', now() - interval '6 days', 'Captured');

-- Add contact_profiles for the new contacts
INSERT INTO contact_profiles (name, title, company, relationship_type, source_tag) VALUES
('Rachel Kim', 'VP Product', 'Acme Corp', 'collaborator', 'linkedin'),
('Daniel Okafor', 'Managing Partner', 'Horizon Ventures', 'investor', 'linkedin'),
('Lena Moss', 'Lead Designer', 'Internal', 'collaborator', 'linkedin'),
('Michael Tran', 'VP Engineering', 'Internal', 'collaborator', 'linkedin'),
('Aisha Bello', 'Head of Customer Success', 'Internal', 'collaborator', 'linkedin'),
('Chris Hensley', 'General Counsel', 'Barker & Lane LLP', 'advisor', 'linkedin'),
('Priya Sharma', 'Chief People Officer', 'Internal', 'collaborator', 'linkedin'),
('Jordan Blake', 'Content Director', 'Internal', 'collaborator', 'linkedin'),
('Elena Ruiz', 'CRO', 'Internal', 'collaborator', 'linkedin'),
('Sam Nguyen', 'Senior Engineer', 'Internal', 'collaborator', 'linkedin'),
('Marta Cline', 'Board Advisor', 'Cline Capital', 'investor', 'linkedin'),
('Ethan Weiss', 'CISO', 'Internal', 'collaborator', 'linkedin'),
('Olivia Park', 'Product Analytics Lead', 'Internal', 'collaborator', 'linkedin'),
('Ryan Foster', 'Head of Partnerships', 'Relay Inc', 'collaborator', 'linkedin'),
('Nadia Volkov', 'Strategy Director', 'Internal', 'collaborator', 'linkedin'),
('Ben Calloway', 'Sales Director', 'Internal', 'collaborator', 'linkedin'),
('Tessa Linehan', 'Product Manager', 'Internal', 'collaborator', 'linkedin'),
('Andre Leclaire', 'CFO', 'Internal', 'collaborator', 'linkedin'),
('Katie Yoon', 'Head of Comms', 'Internal', 'collaborator', 'linkedin'),
('Leo Marchetti', 'Principal Architect', 'Internal', 'collaborator', 'linkedin')
ON CONFLICT DO NOTHING;
