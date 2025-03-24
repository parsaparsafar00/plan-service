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

// POST request to handle form submission
fastify.post("/api/create_user", async (request, reply) => {
    try {
        const formData = request.body;
        console.log("Received form data:", formData);

        // Extract and process data
        const gender = formData.gender
        const firstName = formData.first_name;
        const lastName = formData.last_name;
        const age = parseInt(formData.age);
        const height = parseInt(formData.height);
        const weight = parseInt(formData.weight);
        const level = formData.level;

        // Convert injuries and equipment fields to JSON strings
        const injuries = processArrayField(formData["injuries"]);
        const equipments = processArrayField(formData["equipment"]);

        // Insert into database
        let query = `
            INSERT INTO trainees
            (first_name, last_name, gender, age, height, weight, level, injuries, equipments)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id;
        `;
        const values = [
            firstName, lastName, gender, age, height, weight, level, injuries, equipments
        ];

        const result = await client.query(query, values);
        reply.send({success: true, message: "Trainee added successfully!", traineeId: result.rows[0].id});

    } catch (error) {
        console.error("Error inserting trainee:", error);
        reply.status(500).send({success: false, message: "Server error", error: error.message});
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
