class RepCounter:
    """
    Tracks exercise state transitions over time to count reps 
    and provide dynamic user feedback.
    """
    def __init__(self, target_reps: int = 15):
        self.target_reps = target_reps
        self.reps_completed = 0
        self.current_state = "Standing"
        self.message = "Let's go!"
        
    def update(self, detected_status: str) -> dict:
        """
        Takes the current frame's status and updates the rep count.
        Returns a dictionary with the current count and UI message.
        """
        # Transition: Standing -> Squatting
        if self.current_state == "Standing" and detected_status == "Squatting":
            self.current_state = "Squatting"
            
        # Transition: Squatting -> Standing (Rep Completed!)
        elif self.current_state == "Squatting" and detected_status == "Standing":
            self.current_state = "Standing"
            self.reps_completed += 1
            self._update_message()
            
        return {
            "reps": self.reps_completed,
            "message": self.message
        }
        
    def _update_message(self):
        """Updates the motivational text based on progress."""
        if self.reps_completed == 0:
            self.message = "Let's go!"
        elif self.reps_completed == self.target_reps:
            self.message = "SUCCESS!! Target Reached!"
        elif self.target_reps - self.reps_completed <= 3:
            self.message = "Almost there! Push!"
        elif self.reps_completed == self.target_reps // 2:
            self.message = "Halfway done! Keep it up!"
        elif self.reps_completed > self.target_reps:
            self.message = "Bonus reps! You're a beast!"
        else:
            self.message = "Good form, keep going."