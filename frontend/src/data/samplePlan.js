/**
 * Sample data matching the DashboardPayload schema from featherless_demo.py.
 * This serves as a fallback / demo until the backend API is connected.
 */
const samplePlan = {
  query: "Build me a 2-day push/pull workout and suggest meals for fat loss.",
  profile: {
    name: "User",
    age: 27,
    height_cm: 180,
    weight_kg: 82,
    activity_level: "moderately active",
    dietary_preferences: "non-vegetarian",
    session_time: "1 hr 30 mins",
    fitness_level: "beginner",
    bmi: 25.3,
  },
  summary: "A balanced 7-day push/pull/legs plan with a calorie-deficit nutrition plan for fat loss.",
  workout_plan: {
    days: [
      {
        day: 1,
        focus: "Push – Chest & Triceps",
        exercises: [
          { name: "Barbell Bench Press", id: "bench_press", sets: 4, reps: "8-10", rest: "90s", equipment: "barbell", primary_muscles: ["chest"], secondary_muscles: ["triceps", "shoulders"], image_urls: [], instructions: "Lie on bench, grip bar shoulder-width, lower to chest, press up.", difficulty: "intermediate", category: "strength" },
          { name: "Incline Dumbbell Press", id: "incline_db_press", sets: 3, reps: "10-12", rest: "60s", equipment: "dumbbell", primary_muscles: ["upper chest"], secondary_muscles: ["triceps"], image_urls: [], instructions: "Set bench to 30-45°, press dumbbells up from chest level.", difficulty: "intermediate", category: "strength" },
          { name: "Cable Flyes", id: "cable_flyes", sets: 3, reps: "12-15", rest: "60s", equipment: "cable", primary_muscles: ["chest"], secondary_muscles: ["shoulders"], image_urls: [], instructions: "Stand between cables, bring handles together in an arc.", difficulty: "beginner", category: "strength" },
          { name: "Tricep Rope Pushdown", id: "tricep_pushdown", sets: 3, reps: "12-15", rest: "45s", equipment: "cable", primary_muscles: ["triceps"], secondary_muscles: [], image_urls: [], instructions: "Grip rope attachment, push down extending elbows.", difficulty: "beginner", category: "strength" },
          { name: "Overhead Tricep Extension", id: "overhead_ext", sets: 3, reps: "10-12", rest: "45s", equipment: "dumbbell", primary_muscles: ["triceps"], secondary_muscles: [], image_urls: [], instructions: "Hold dumbbell overhead with both hands, lower behind head.", difficulty: "beginner", category: "strength" },
        ],
      },
      {
        day: 2,
        focus: "Pull – Back & Biceps",
        exercises: [
          { name: "Deadlift", id: "deadlift", sets: 4, reps: "5-6", rest: "120s", equipment: "barbell", primary_muscles: ["back", "hamstrings"], secondary_muscles: ["glutes", "forearms"], image_urls: [], instructions: "Hinge at hips, grip bar, drive through heels to stand.", difficulty: "intermediate", category: "strength" },
          { name: "Lat Pulldown", id: "lat_pulldown", sets: 3, reps: "10-12", rest: "60s", equipment: "cable", primary_muscles: ["lats"], secondary_muscles: ["biceps"], image_urls: [], instructions: "Pull bar to upper chest, squeeze shoulder blades.", difficulty: "beginner", category: "strength" },
          { name: "Seated Cable Row", id: "cable_row", sets: 3, reps: "10-12", rest: "60s", equipment: "cable", primary_muscles: ["mid-back"], secondary_muscles: ["biceps"], image_urls: [], instructions: "Pull handle to lower chest, keep torso upright.", difficulty: "beginner", category: "strength" },
          { name: "Barbell Curl", id: "barbell_curl", sets: 3, reps: "10-12", rest: "45s", equipment: "barbell", primary_muscles: ["biceps"], secondary_muscles: ["forearms"], image_urls: [], instructions: "Curl bar up keeping elbows pinned to sides.", difficulty: "beginner", category: "strength" },
        ],
      },
      {
        day: 3,
        focus: "Legs & Core",
        exercises: [
          { name: "Barbell Squat", id: "squat", sets: 4, reps: "8-10", rest: "120s", equipment: "barbell", primary_muscles: ["quadriceps"], secondary_muscles: ["glutes", "hamstrings"], image_urls: [], instructions: "Bar on upper back, squat to parallel, drive up.", difficulty: "intermediate", category: "strength" },
          { name: "Leg Press", id: "leg_press", sets: 3, reps: "12-15", rest: "90s", equipment: "machine", primary_muscles: ["quadriceps"], secondary_muscles: ["glutes"], image_urls: [], instructions: "Feet shoulder-width on platform, press away.", difficulty: "beginner", category: "strength" },
          { name: "Romanian Deadlift", id: "rdl", sets: 3, reps: "10-12", rest: "60s", equipment: "barbell", primary_muscles: ["hamstrings"], secondary_muscles: ["glutes", "lower back"], image_urls: [], instructions: "Hinge forward with slight knee bend, feel hamstring stretch.", difficulty: "intermediate", category: "strength" },
          { name: "Hanging Leg Raise", id: "leg_raise", sets: 3, reps: "12-15", rest: "45s", equipment: "body only", primary_muscles: ["abdominals"], secondary_muscles: ["hip flexors"], image_urls: [], instructions: "Hang from bar, raise legs to 90 degrees.", difficulty: "intermediate", category: "strength" },
        ],
      },
      {
        day: 4,
        focus: "Push – Shoulders & Chest",
        exercises: [
          { name: "Overhead Press", id: "ohp", sets: 4, reps: "8-10", rest: "90s", equipment: "barbell", primary_muscles: ["shoulders"], secondary_muscles: ["triceps"], image_urls: [], instructions: "Press barbell overhead from shoulder level.", difficulty: "intermediate", category: "strength" },
          { name: "Dumbbell Lateral Raise", id: "lat_raise", sets: 3, reps: "12-15", rest: "45s", equipment: "dumbbell", primary_muscles: ["shoulders"], secondary_muscles: [], image_urls: [], instructions: "Raise dumbbells to sides until arms are parallel to floor.", difficulty: "beginner", category: "strength" },
          { name: "Push-ups", id: "push_ups", sets: 3, reps: "15-20", rest: "45s", equipment: "body only", primary_muscles: ["chest"], secondary_muscles: ["triceps", "shoulders"], image_urls: [], instructions: "Standard push-up, full range of motion.", difficulty: "beginner", category: "strength" },
          { name: "Dips", id: "dips", sets: 3, reps: "8-12", rest: "60s", equipment: "body only", primary_muscles: ["triceps", "chest"], secondary_muscles: ["shoulders"], image_urls: [], instructions: "Lower body between parallel bars, press back up.", difficulty: "intermediate", category: "strength" },
        ],
      },
      {
        day: 5,
        focus: "Pull – Back & Arms",
        exercises: [
          { name: "Pull-ups", id: "pull_ups", sets: 4, reps: "6-10", rest: "90s", equipment: "body only", primary_muscles: ["lats"], secondary_muscles: ["biceps", "forearms"], image_urls: [], instructions: "Hang from bar, pull chin above bar.", difficulty: "intermediate", category: "strength" },
          { name: "Dumbbell Row", id: "db_row", sets: 3, reps: "10-12", rest: "60s", equipment: "dumbbell", primary_muscles: ["mid-back"], secondary_muscles: ["biceps"], image_urls: [], instructions: "One knee on bench, row dumbbell to hip.", difficulty: "beginner", category: "strength" },
          { name: "Face Pulls", id: "face_pulls", sets: 3, reps: "15-20", rest: "45s", equipment: "cable", primary_muscles: ["rear deltoids"], secondary_muscles: ["traps"], image_urls: [], instructions: "Pull rope to face, externally rotate shoulders.", difficulty: "beginner", category: "strength" },
          { name: "Hammer Curl", id: "hammer_curl", sets: 3, reps: "10-12", rest: "45s", equipment: "dumbbell", primary_muscles: ["biceps"], secondary_muscles: ["forearms"], image_urls: [], instructions: "Curl dumbbells with neutral grip.", difficulty: "beginner", category: "strength" },
        ],
      },
      {
        day: 6,
        focus: "Legs & Glutes",
        exercises: [
          { name: "Front Squat", id: "front_squat", sets: 4, reps: "8-10", rest: "90s", equipment: "barbell", primary_muscles: ["quadriceps"], secondary_muscles: ["core", "glutes"], image_urls: [], instructions: "Bar on front delts, squat deep with upright torso.", difficulty: "intermediate", category: "strength" },
          { name: "Walking Lunges", id: "lunges", sets: 3, reps: "12 each leg", rest: "60s", equipment: "dumbbell", primary_muscles: ["quadriceps", "glutes"], secondary_muscles: ["hamstrings"], image_urls: [], instructions: "Step forward into lunge, alternate legs.", difficulty: "beginner", category: "strength" },
          { name: "Leg Curl", id: "leg_curl", sets: 3, reps: "12-15", rest: "45s", equipment: "machine", primary_muscles: ["hamstrings"], secondary_muscles: [], image_urls: [], instructions: "Curl weight by bending knees on machine.", difficulty: "beginner", category: "strength" },
          { name: "Calf Raises", id: "calf_raises", sets: 4, reps: "15-20", rest: "30s", equipment: "machine", primary_muscles: ["calves"], secondary_muscles: [], image_urls: [], instructions: "Raise heels as high as possible, slow negative.", difficulty: "beginner", category: "strength" },
          { name: "Plank", id: "plank", sets: 3, reps: "45-60s hold", rest: "30s", equipment: "body only", primary_muscles: ["core"], secondary_muscles: ["shoulders"], image_urls: [], instructions: "Hold straight body on forearms and toes.", difficulty: "beginner", category: "strength" },
        ],
      },
      {
        day: 7,
        focus: "Active Recovery",
        exercises: [
          { name: "Light Walk / Jog", id: "light_cardio", sets: 1, reps: "20-30 mins", rest: "—", equipment: "body only", primary_muscles: ["cardiovascular"], secondary_muscles: [], image_urls: [], instructions: "Low intensity steady-state cardio.", difficulty: "beginner", category: "cardio" },
          { name: "Full Body Stretching", id: "stretching", sets: 1, reps: "15 mins", rest: "—", equipment: "body only", primary_muscles: ["flexibility"], secondary_muscles: [], image_urls: [], instructions: "Hold each stretch 30 seconds.", difficulty: "beginner", category: "stretching" },
          { name: "Foam Rolling", id: "foam_roll", sets: 1, reps: "10 mins", rest: "—", equipment: "foam roll", primary_muscles: ["recovery"], secondary_muscles: [], image_urls: [], instructions: "Roll major muscle groups slowly.", difficulty: "beginner", category: "stretching" },
        ],
      },
    ],
    notes: [
      "Warm up 5-10 minutes before each session.",
      "Progressive overload: increase weight when reps feel easy.",
      "Rest 48 hours before training the same muscle group.",
    ],
  },
  nutrition_plan: {
    daily_targets: { calories: 2100, protein_g: 160, carbs_g: 200, fat_g: 70 },
    meals: [
      {
        day: 1,
        name: "Monday Meals",
        items: [
          { name: "Breakfast – Oats & Eggs", type: "breakfast", foods: [{ name: "Rolled Oats", amount: "80g", calories: 300, protein_g: 10, carbs_g: 54, fat_g: 5, food_id: "oats_01" }, { name: "Boiled Eggs (2)", amount: "2 large", calories: 140, protein_g: 12, carbs_g: 1, fat_g: 10, food_id: "egg_01" }], total_calories: 440, total_protein_g: 22 },
          { name: "Lunch – Chicken & Rice", type: "lunch", foods: [{ name: "Grilled Chicken Breast", amount: "200g", calories: 330, protein_g: 62, carbs_g: 0, fat_g: 7, food_id: "chicken_01" }, { name: "Brown Rice", amount: "150g cooked", calories: 170, protein_g: 4, carbs_g: 36, fat_g: 1, food_id: "rice_01" }, { name: "Steamed Broccoli", amount: "100g", calories: 35, protein_g: 3, carbs_g: 7, fat_g: 0, food_id: "broccoli_01" }], total_calories: 535, total_protein_g: 69 },
          { name: "Snack – Greek Yogurt", type: "snack", foods: [{ name: "Greek Yogurt", amount: "200g", calories: 130, protein_g: 20, carbs_g: 8, fat_g: 0, food_id: "yogurt_01" }, { name: "Mixed Berries", amount: "80g", calories: 40, protein_g: 1, carbs_g: 10, fat_g: 0, food_id: "berries_01" }], total_calories: 170, total_protein_g: 21 },
          { name: "Dinner – Salmon & Veggies", type: "dinner", foods: [{ name: "Baked Salmon", amount: "180g", calories: 370, protein_g: 40, carbs_g: 0, fat_g: 22, food_id: "salmon_01" }, { name: "Sweet Potato", amount: "150g", calories: 130, protein_g: 2, carbs_g: 30, fat_g: 0, food_id: "sweet_potato_01" }, { name: "Mixed Salad", amount: "100g", calories: 20, protein_g: 1, carbs_g: 4, fat_g: 0, food_id: "salad_01" }], total_calories: 520, total_protein_g: 43 },
        ],
      },
      {
        day: 2,
        name: "Tuesday Meals",
        items: [
          { name: "Breakfast – Smoothie Bowl", type: "breakfast", foods: [{ name: "Protein Powder", amount: "30g", calories: 120, protein_g: 24, carbs_g: 3, fat_g: 1, food_id: "whey_01" }, { name: "Banana", amount: "1 medium", calories: 105, protein_g: 1, carbs_g: 27, fat_g: 0, food_id: "banana_01" }, { name: "Almond Milk", amount: "250ml", calories: 30, protein_g: 1, carbs_g: 1, fat_g: 2, food_id: "almond_milk_01" }], total_calories: 255, total_protein_g: 26 },
          { name: "Lunch – Turkey Wrap", type: "lunch", foods: [{ name: "Turkey Breast", amount: "150g", calories: 180, protein_g: 38, carbs_g: 0, fat_g: 2, food_id: "turkey_01" }, { name: "Whole Wheat Wrap", amount: "1 large", calories: 170, protein_g: 5, carbs_g: 30, fat_g: 4, food_id: "wrap_01" }, { name: "Avocado", amount: "50g", calories: 80, protein_g: 1, carbs_g: 4, fat_g: 7, food_id: "avocado_01" }], total_calories: 430, total_protein_g: 44 },
          { name: "Dinner – Stir-fry Tofu", type: "dinner", foods: [{ name: "Firm Tofu", amount: "200g", calories: 180, protein_g: 20, carbs_g: 4, fat_g: 10, food_id: "tofu_01" }, { name: "Mixed Vegetables", amount: "200g", calories: 80, protein_g: 4, carbs_g: 16, fat_g: 0, food_id: "mixed_veg_01" }, { name: "Jasmine Rice", amount: "150g cooked", calories: 200, protein_g: 4, carbs_g: 44, fat_g: 0, food_id: "jasmine_rice_01" }], total_calories: 460, total_protein_g: 28 },
        ],
      },
      {
        day: 3,
        name: "Wednesday Meals",
        items: [
          { name: "Breakfast – Egg White Omelette", type: "breakfast", foods: [{ name: "Egg Whites (4)", amount: "4 large", calories: 68, protein_g: 14, carbs_g: 1, fat_g: 0, food_id: "egg_white_01" }, { name: "Spinach", amount: "50g", calories: 12, protein_g: 1, carbs_g: 2, fat_g: 0, food_id: "spinach_01" }, { name: "Whole Wheat Toast", amount: "2 slices", calories: 160, protein_g: 6, carbs_g: 28, fat_g: 2, food_id: "ww_toast_01" }], total_calories: 240, total_protein_g: 21 },
          { name: "Lunch – Lentil Soup & Bread", type: "lunch", foods: [{ name: "Lentil Soup", amount: "300ml", calories: 250, protein_g: 18, carbs_g: 36, fat_g: 3, food_id: "lentil_soup_01" }, { name: "Sourdough Bread", amount: "1 slice", calories: 120, protein_g: 4, carbs_g: 24, fat_g: 1, food_id: "sourdough_01" }], total_calories: 370, total_protein_g: 22 },
          { name: "Snack – Protein Bar", type: "snack", foods: [{ name: "Protein Bar", amount: "1 bar", calories: 200, protein_g: 20, carbs_g: 22, fat_g: 8, food_id: "protein_bar_01" }], total_calories: 200, total_protein_g: 20 },
          { name: "Dinner – Grilled Fish & Quinoa", type: "dinner", foods: [{ name: "Grilled Tilapia", amount: "200g", calories: 220, protein_g: 46, carbs_g: 0, fat_g: 4, food_id: "tilapia_01" }, { name: "Quinoa", amount: "150g cooked", calories: 180, protein_g: 6, carbs_g: 32, fat_g: 3, food_id: "quinoa_01" }, { name: "Asparagus", amount: "100g", calories: 22, protein_g: 2, carbs_g: 4, fat_g: 0, food_id: "asparagus_01" }], total_calories: 422, total_protein_g: 54 },
        ],
      },
      {
        day: 4,
        name: "Thursday Meals",
        items: [
          { name: "Breakfast – Overnight Oats", type: "breakfast", foods: [{ name: "Rolled Oats", amount: "60g", calories: 225, protein_g: 8, carbs_g: 40, fat_g: 4, food_id: "oats_01" }, { name: "Chia Seeds", amount: "15g", calories: 73, protein_g: 2, carbs_g: 6, fat_g: 5, food_id: "chia_01" }, { name: "Almond Milk", amount: "200ml", calories: 24, protein_g: 1, carbs_g: 1, fat_g: 2, food_id: "almond_milk_01" }], total_calories: 322, total_protein_g: 11 },
          { name: "Lunch – Chicken Salad", type: "lunch", foods: [{ name: "Grilled Chicken", amount: "180g", calories: 297, protein_g: 56, carbs_g: 0, fat_g: 6, food_id: "chicken_01" }, { name: "Mixed Greens", amount: "150g", calories: 30, protein_g: 2, carbs_g: 5, fat_g: 0, food_id: "greens_01" }, { name: "Olive Oil Dressing", amount: "15ml", calories: 120, protein_g: 0, carbs_g: 0, fat_g: 14, food_id: "olive_oil_01" }], total_calories: 447, total_protein_g: 58 },
          { name: "Dinner – Beef Stir-fry", type: "dinner", foods: [{ name: "Lean Beef Strips", amount: "200g", calories: 340, protein_g: 52, carbs_g: 0, fat_g: 14, food_id: "beef_01" }, { name: "Bell Peppers & Onions", amount: "150g", calories: 45, protein_g: 2, carbs_g: 10, fat_g: 0, food_id: "peppers_01" }, { name: "Noodles", amount: "120g cooked", calories: 190, protein_g: 6, carbs_g: 38, fat_g: 1, food_id: "noodles_01" }], total_calories: 575, total_protein_g: 60 },
        ],
      },
      {
        day: 5,
        name: "Friday Meals",
        items: [
          { name: "Breakfast – Pancakes", type: "breakfast", foods: [{ name: "Protein Pancakes (3)", amount: "3 pancakes", calories: 280, protein_g: 24, carbs_g: 30, fat_g: 6, food_id: "pancakes_01" }, { name: "Maple Syrup", amount: "15ml", calories: 52, protein_g: 0, carbs_g: 13, fat_g: 0, food_id: "syrup_01" }], total_calories: 332, total_protein_g: 24 },
          { name: "Lunch – Tuna Salad", type: "lunch", foods: [{ name: "Canned Tuna", amount: "150g", calories: 165, protein_g: 36, carbs_g: 0, fat_g: 2, food_id: "tuna_01" }, { name: "Chickpeas", amount: "100g", calories: 164, protein_g: 9, carbs_g: 27, fat_g: 3, food_id: "chickpeas_01" }, { name: "Cucumber & Tomato", amount: "100g", calories: 22, protein_g: 1, carbs_g: 5, fat_g: 0, food_id: "cuc_tom_01" }], total_calories: 351, total_protein_g: 46 },
          { name: "Snack – Nuts & Fruit", type: "snack", foods: [{ name: "Almonds", amount: "30g", calories: 170, protein_g: 6, carbs_g: 6, fat_g: 15, food_id: "almonds_01" }, { name: "Apple", amount: "1 medium", calories: 95, protein_g: 0, carbs_g: 25, fat_g: 0, food_id: "apple_01" }], total_calories: 265, total_protein_g: 6 },
          { name: "Dinner – Pasta & Meatballs", type: "dinner", foods: [{ name: "Whole Wheat Pasta", amount: "100g dry", calories: 350, protein_g: 14, carbs_g: 72, fat_g: 2, food_id: "pasta_01" }, { name: "Turkey Meatballs (4)", amount: "4 meatballs", calories: 240, protein_g: 28, carbs_g: 8, fat_g: 10, food_id: "meatballs_01" }], total_calories: 590, total_protein_g: 42 },
        ],
      },
      {
        day: 6,
        name: "Saturday Meals",
        items: [
          { name: "Breakfast – Eggs & Avocado Toast", type: "breakfast", foods: [{ name: "Scrambled Eggs (2)", amount: "2 large", calories: 180, protein_g: 12, carbs_g: 2, fat_g: 14, food_id: "egg_01" }, { name: "Avocado Toast", amount: "1 slice", calories: 220, protein_g: 4, carbs_g: 24, fat_g: 12, food_id: "avo_toast_01" }], total_calories: 400, total_protein_g: 16 },
          { name: "Lunch – Burrito Bowl", type: "lunch", foods: [{ name: "Chicken Breast", amount: "180g", calories: 297, protein_g: 56, carbs_g: 0, fat_g: 6, food_id: "chicken_01" }, { name: "Black Beans", amount: "100g", calories: 130, protein_g: 9, carbs_g: 23, fat_g: 1, food_id: "black_beans_01" }, { name: "Brown Rice", amount: "120g cooked", calories: 140, protein_g: 3, carbs_g: 29, fat_g: 1, food_id: "rice_01" }], total_calories: 567, total_protein_g: 68 },
          { name: "Dinner – Shrimp & Veggies", type: "dinner", foods: [{ name: "Grilled Shrimp", amount: "200g", calories: 200, protein_g: 40, carbs_g: 2, fat_g: 3, food_id: "shrimp_01" }, { name: "Zucchini Noodles", amount: "200g", calories: 34, protein_g: 2, carbs_g: 6, fat_g: 0, food_id: "zoodles_01" }, { name: "Cherry Tomatoes", amount: "100g", calories: 18, protein_g: 1, carbs_g: 4, fat_g: 0, food_id: "tomatoes_01" }], total_calories: 252, total_protein_g: 43 },
        ],
      },
      {
        day: 7,
        name: "Sunday Meals",
        items: [
          { name: "Brunch – French Toast", type: "breakfast", foods: [{ name: "French Toast (2)", amount: "2 slices", calories: 300, protein_g: 10, carbs_g: 36, fat_g: 14, food_id: "french_toast_01" }, { name: "Berries", amount: "80g", calories: 40, protein_g: 1, carbs_g: 10, fat_g: 0, food_id: "berries_01" }], total_calories: 340, total_protein_g: 11 },
          { name: "Lunch – Grilled Chicken Wrap", type: "lunch", foods: [{ name: "Grilled Chicken", amount: "150g", calories: 248, protein_g: 47, carbs_g: 0, fat_g: 5, food_id: "chicken_01" }, { name: "Whole Wheat Wrap", amount: "1 large", calories: 170, protein_g: 5, carbs_g: 30, fat_g: 4, food_id: "wrap_01" }, { name: "Hummus", amount: "30g", calories: 50, protein_g: 2, carbs_g: 4, fat_g: 3, food_id: "hummus_01" }], total_calories: 468, total_protein_g: 54 },
          { name: "Dinner – Baked Cod & Potatoes", type: "dinner", foods: [{ name: "Baked Cod", amount: "200g", calories: 190, protein_g: 40, carbs_g: 0, fat_g: 2, food_id: "cod_01" }, { name: "Roasted Potatoes", amount: "200g", calories: 170, protein_g: 4, carbs_g: 38, fat_g: 0, food_id: "potato_01" }, { name: "Green Beans", amount: "100g", calories: 31, protein_g: 2, carbs_g: 7, fat_g: 0, food_id: "green_beans_01" }], total_calories: 391, total_protein_g: 46 },
        ],
      },
    ],
    notes: [
      "Drink at least 2.5L of water daily.",
      "Eat protein within 30 minutes post-workout.",
      "Adjust portion sizes based on hunger and energy levels.",
    ],
  },
  recommendations: [
    "Start with lighter weights and focus on form.",
    "Track your meals for the first 2 weeks to build awareness.",
    "Sleep 7-9 hours per night for optimal recovery.",
    "Consider adding a multivitamin supplement.",
  ],
  warnings: [
    "Consult a doctor before starting any new exercise program.",
    "Stop exercise immediately if you feel sharp pain or dizziness.",
  ],
}

export default samplePlan
