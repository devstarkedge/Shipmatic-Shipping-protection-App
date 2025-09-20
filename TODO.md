# Fix Request Solution Filter in Claims Page

## Issues Identified:
1. Solution filter uses wrong state variable (selectedStatuses instead of separate solution state)
2. Filter logic checks claim.status instead of claim.method for solution type
3. Solution filter counts are incorrectly calculated using status counts
4. Missing separate state management for solution filters

## Steps to Fix:

### Step 1: Add separate state for solution filtering
- Add `selectedSolutions` state variable
- Add `solutionPopoverActive` state (already exists)

### Step 2: Fix solution filter count calculation
- Create separate logic to count claims by solution type (refund/reorder)
- Update `solutionFilterOptions` to use correct counts

### Step 3: Update filtering logic
- Modify `filteredClaims` function to check `claim.method` for solution filtering
- Use `selectedSolutions` instead of `selectedStatuses` for solution filter

### Step 4: Update solution filter handlers
- Create separate handlers for solution filter changes
- Update the solution popover to use correct state and handlers

### Step 5: Test the functionality
- Verify that solution filter works correctly
- Check that status and solution filters work independently
