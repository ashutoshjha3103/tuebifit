class RepCounter:
    """
    Tracks exercise state transitions over time to count reps
    and provide dynamic user feedback.

    Uses asymmetric hysteresis to reject noisy per-frame detections:
      - entry_frames: consecutive *active* frames needed to confirm entry
      - exit_frames:  consecutive *rest* frames needed to confirm rep completion

    State names are configurable so the same counter works for any exercise
    (squats, pull-ups, push-ups, etc.).

    At 30 fps the defaults (entry=3, exit=15) correspond to ~100 ms and ~500 ms.
    """

    def __init__(self, target_reps: int = 15,
                 rest_state: str = "Standing", active_state: str = "Squatting",
                 entry_frames: int = 3, exit_frames: int = 15):
        self.target_reps = target_reps
        self.rest_state = rest_state
        self.active_state = active_state
        self._valid_states = {rest_state, active_state}
        self.entry_frames = entry_frames
        self.exit_frames = exit_frames

        self.reps_completed = 0
        self.confirmed_state = rest_state
        self.message = "Let's go!"

        self._pending_state: str | None = None
        self._pending_count = 0

    def update(self, detected_status: str) -> dict:
        """
        Feed in this frame's raw detector status.
        Returns {"reps": int, "message": str, "confirmed_state": str}.
        """
        if detected_status not in self._valid_states:
            return self._result()

        if detected_status != self.confirmed_state:
            if detected_status == self._pending_state:
                self._pending_count += 1
            else:
                self._pending_state = detected_status
                self._pending_count = 1

            threshold = (self.entry_frames
                         if self.confirmed_state == self.rest_state
                         else self.exit_frames)

            if self._pending_count >= threshold:
                old = self.confirmed_state
                self.confirmed_state = detected_status
                self._pending_state = None
                self._pending_count = 0

                if old == self.active_state and self.confirmed_state == self.rest_state:
                    self.reps_completed += 1
                    self._update_message()
        else:
            self._pending_state = None
            self._pending_count = 0

        return self._result()

    def _result(self) -> dict:
        return {
            "reps": self.reps_completed,
            "message": self.message,
            "confirmed_state": self.confirmed_state,
        }

    def _update_message(self):
        if self.reps_completed == self.target_reps:
            self.message = "SUCCESS!! Target Reached!"
        elif self.reps_completed > self.target_reps:
            self.message = "Bonus reps! You're a beast!"
        elif self.target_reps - self.reps_completed <= 3:
            self.message = "Almost there! Push!"
        elif self.reps_completed == self.target_reps // 2:
            self.message = "Halfway done! Keep it up!"
        else:
            self.message = "Good form, keep going."
