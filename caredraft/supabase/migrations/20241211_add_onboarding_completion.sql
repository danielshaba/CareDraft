-- Migration: Add onboarding completion tracking
-- Description: Add onboarding completion status to users table and create helper functions
-- Date: 2024-12-11

-- Add onboarding completion fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS onboarding_steps_completed JSONB DEFAULT '[]'::jsonb;

-- Create index for onboarding queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed_at ON users(onboarding_completed_at);

-- Create function to check if all onboarding steps are completed
CREATE OR REPLACE FUNCTION check_onboarding_completion(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record users%ROWTYPE;
    completed_steps INTEGER[];
    required_steps INTEGER[] := ARRAY[1, 2, 3, 4, 5, 6]; -- All 6 onboarding steps
    step INTEGER;
BEGIN
    -- Get user record
    SELECT * INTO user_record
    FROM users 
    WHERE id = user_id;
    
    -- If user doesn't exist, return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- If already marked as completed, return true
    IF user_record.onboarding_completed = TRUE THEN
        RETURN TRUE;
    END IF;
    
    -- Extract completed steps from JSONB
    SELECT ARRAY(
        SELECT value::INTEGER 
        FROM jsonb_array_elements_text(user_record.onboarding_steps_completed)
    ) INTO completed_steps;
    
    -- Check if all required steps are completed
    FOREACH step IN ARRAY required_steps
    LOOP
        IF NOT (step = ANY(completed_steps)) THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    -- All steps completed - update user record
    UPDATE users 
    SET onboarding_completed = TRUE,
        onboarding_completed_at = NOW()
    WHERE id = user_id;
    
    RETURN TRUE;
END;
$$;

-- Create function to update onboarding step completion
CREATE OR REPLACE FUNCTION update_onboarding_step(user_id UUID, step_number INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_steps JSONB;
    steps_array INTEGER[];
BEGIN
    -- Get current completed steps
    SELECT onboarding_steps_completed INTO current_steps
    FROM users 
    WHERE id = user_id;
    
    -- If user doesn't exist, return false
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Convert JSONB to array
    SELECT ARRAY(
        SELECT value::INTEGER 
        FROM jsonb_array_elements_text(current_steps)
    ) INTO steps_array;
    
    -- Add step if not already present
    IF NOT (step_number = ANY(steps_array)) THEN
        steps_array := steps_array || step_number;
        
        -- Update user record
        UPDATE users 
        SET onboarding_steps_completed = array_to_json(steps_array)::jsonb,
            updated_at = NOW()
        WHERE id = user_id;
        
        -- Check if onboarding is now complete
        PERFORM check_onboarding_completion(user_id);
    END IF;
    
    RETURN TRUE;
END;
$$;

-- Create function to get onboarding status for a user
CREATE OR REPLACE FUNCTION get_onboarding_status(user_id UUID)
RETURNS TABLE (
    is_completed BOOLEAN,
    completed_at TIMESTAMPTZ,
    completed_steps INTEGER[],
    next_step INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record users%ROWTYPE;
    steps_array INTEGER[];
    required_steps INTEGER[] := ARRAY[1, 2, 3, 4, 5, 6];
    step INTEGER;
BEGIN
    -- Get user record
    SELECT * INTO user_record
    FROM users 
    WHERE id = user_id;
    
    -- If user doesn't exist, return default values
    IF NOT FOUND THEN
        is_completed := FALSE;
        completed_at := NULL;
        completed_steps := ARRAY[]::INTEGER[];
        next_step := 1;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Extract completed steps from JSONB
    SELECT ARRAY(
        SELECT value::INTEGER 
        FROM jsonb_array_elements_text(user_record.onboarding_steps_completed)
    ) INTO steps_array;
    
    -- Set return values
    is_completed := user_record.onboarding_completed;
    completed_at := user_record.onboarding_completed_at;
    completed_steps := COALESCE(steps_array, ARRAY[]::INTEGER[]);
    
    -- Find next incomplete step
    next_step := 1;
    FOREACH step IN ARRAY required_steps
    LOOP
        IF NOT (step = ANY(completed_steps)) THEN
            next_step := step;
            EXIT;
        END IF;
    END LOOP;
    
    -- If all steps completed, next step is 0 (indicating completion)
    IF array_length(completed_steps, 1) >= 6 THEN
        next_step := 0;
    END IF;
    
    RETURN NEXT;
END;
$$;

-- Update existing users to have empty onboarding steps array if NULL
UPDATE users 
SET onboarding_steps_completed = '[]'::jsonb 
WHERE onboarding_steps_completed IS NULL;

-- Add comment to document the onboarding steps
COMMENT ON COLUMN users.onboarding_steps_completed IS 'Array of completed onboarding step numbers: 1=Welcome/Setup, 2=Company Profile, 3=Knowledge Upload, 4=Team Setup, 5=Tutorial, 6=First Tender';
COMMENT ON COLUMN users.onboarding_completed IS 'TRUE when all 6 onboarding steps are completed';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when onboarding was completed'; 