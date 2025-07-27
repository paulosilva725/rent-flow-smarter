-- Fix security warnings by configuring auth settings properly
-- Enable stronger password requirements
INSERT INTO auth.config (parameter, value) 
VALUES ('password_min_length', '8')
ON CONFLICT (parameter) DO UPDATE SET value = '8';

-- Reduce OTP expiry to recommended time (10 minutes = 600 seconds)
INSERT INTO auth.config (parameter, value) 
VALUES ('otp_exp', '600')
ON CONFLICT (parameter) DO UPDATE SET value = '600';