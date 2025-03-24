const Fastify = require("fastify");
const {Client} = require("pg");
const fastify = Fastify({logger: true});

// Enable CORS
fastify.register(require("@fastify/cors"), {
    origin: "*",
});

// Enable parsing of application/x-www-form-urlencoded data
fastify.register(require("@fastify/formbody"));

// PostgreSQL connection setup
const client = new Client({
    connectionString: process.env.POSTGRES_CONNECTION_URL || 'postgresql://root:ZmB7HuWnOzpqIHL6mSKv9Y8K@elbrus.liara.cloud:31800/fitadmin',
});

client.connect()
    .then(() => {
        console.log("Connected to PostgreSQL database");
    })
    .catch(err => {
        console.error("Database connection error", err.stack);
    });


// Helper function to safely process array fields
const processArrayField = (field) => {
    if (field === null || field === undefined) {
        return null;
    }
    if (Array.isArray(field)) {
        return field.length === 0 ? null : field;
    }
    return [field];
};

// Function to fetch trainee information
const getTraineeInfo = async (studentId) => {
    let query = `
        SELECT weight,
               equipments,
               injuries,
               level,
               age,
               gender
        FROM trainees
        WHERE id = $1;
    `;
    const values = [studentId];
    try {
        const result = await client.query(query, values);
        return result.rows.length > 0 ? result.rows[0] : null; // Return the trainee data or null if not found
    } catch (error) {
        console.error("Error fetching trainee data:", error);
        throw new Error("Database query failed"); // Rethrow the error for handling in the calling function
    }
};

// POST request to handle form submission
fastify.post("/api/personal_workout_plan", async (request, reply) => {

    const formData = request.body;
    console.log("Received form data:", formData);

    // Extract studentId from the form data
    const studentId = parseInt(formData.studentId);

    try {
        // Fetch trainee information
        const traineeInfo = await getTraineeInfo(studentId);

        // Check if the user exists
        if (!traineeInfo) return reply.status(404).send({message: "User not found"});

        const {level, age, weight, gender} = traineeInfo;
        const {target, weeks} = formData;
        const exerciseResults = [];

        global.level = level;
        global.age = age;
        global.weight = weight;
        global.gender = gender;
        global.target = target;
        const workout_plan_info = require('./plan_instructions');
        const { loadIncrement, deload } = workout_plan_info;

        const levels = ['novice', 'beginner', 'intermediate', 'advanced', 'expert'];
        const workoutPlan = [];

        for (const [weekIndex, week] of weeks.entries()) {
            const { sessions } = week;
            const weekData = {
                index: weekIndex + 1,
                ...workout_plan_info,
                sessions: []
            };

            for (const [sessionIndex, session] of sessions.entries()) {
                const { segmentation, targetMuscles: sessionTargetMuscles } = session;
                const muscleValues = sessionTargetMuscles.filter(muscle => muscle.trim() !== "");
                global.target_muscle_groups = muscleValues
                // Load session instruction data
                const session_info = require('./session_instructions');
                const { recoveryTime, number_of_exercises_per_muscle, sessionDuration, cooldownActivities, warmupActivities, cooldownDuration_ground, cooldownDuration_ceiling, warmupDuration_ground, warmupDuration_ceiling } = session_info;

                // Generate query conditions
                const levelIndex = levels.indexOf(level);
                const difficultyCondition = `AND difficulty_level IN (${levels.slice(0, levelIndex + 1).map(lvl => `'${lvl}'`).join(", ")})`;
                let muscleCondition = "";
                if (muscleValues.length > 0) {
                    muscleCondition = `AND (target_muscle_group IN (${muscleValues.map(muscle => `'${muscle}'`).join(", ")}) OR target_muscle_group IS NULL)`;
                }

                let query = `
                    SELECT id, name, short_youtube_demonstration, in_depth_youtube_explanation,
                        difficulty_level, primary_equipment, body_region, mechanics
                    FROM exercises
                    WHERE (age_ground <= $1 AND age_ceiling >= $1)
                    AND (weight_ground <= $2 AND weight_ceiling >= $2)
                    AND (gender = $3 OR gender IS NULL)
                    AND (target = $4 OR target IS NULL)
                    ${difficultyCondition}
                    ${muscleCondition}
                    ORDER BY RANDOM()
                    LIMIT ${muscleValues.length * number_of_exercises_per_muscle}
                `;

                let values = [age, weight, gender, target];
                let result = await client.query(query, values);

                const sessionData = {
                    index: sessionIndex + 1,
                    split: segmentation,
                    targetMuscles: muscleValues,
                    cooldownActivities: cooldownActivities,
                    warmupActivities: warmupActivities,
                    cooldownDuration_ground: cooldownDuration_ground,
                    cooldownDuration_ceiling: cooldownDuration_ceiling,
                    warmupDuration_ground: warmupDuration_ground,
                    recoveryTime: recoveryTime,
                    warmupDuration_ceiling: warmupDuration_ceiling,
                    sessionDuration: sessionDuration,
                    exercises: []
                };

                for (const exercise of result.rows) {
                    // Load exercise instruction data
                    const exercise_info = require('./exercise_instructions');
                    const { restBetweenSets, exercise_weight, number_of_sets, repsPerSet } = exercise_info;

                    sessionData.exercises.push({
                        ...exercise,
                        restBetweenSets,
                        exercise_weight,
                        number_of_sets,
                        repsPerSet
                    });
                }

                weekData.sessions.push(sessionData);
            }

            workoutPlan.push(weekData);
        }

        const workoutPlan_json = JSON.stringify(workoutPlan, null, 2)
        console.log(workoutPlan_json)
        if (!studentId || !weight || !level || !target || !workoutPlan  || !age) {
            return reply.status(400).send({ success: false, message: "Missing required fields" });
        }

        // Insert the plan into workout_plans table
        let query = `
            INSERT INTO workout_plans (trainee_id, weight, level, target, age, workout_plan)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;
        `;

        const values = [studentId, weight, level, target, age, workoutPlan_json];
        const result = await client.query(query, values);
        
        return { success: true, message: "Workout plan added successfully!", planId: result.rows[0].id , workoutPlan_json:workoutPlan_json};


    } catch (error) {
        console.error("Error generating workout plan:", error);
        return reply.status(500).send({message: "Internal server error"});
    }
});


// Start the server
const start = async () => {
    try {
        await fastify.listen({port: 5000});
        console.log("Fastify server running on http://localhost:5000");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
