export default async function handler(req, res) {
    try {
        // Add your task logic here
        console.log("Cron task executed at:", new Date().toISOString());

        // Example: Perform a database operation or API call
        // await someAsyncOperation();

        res.status(200).json({ message: "Cron task executed successfully!" });
    } catch (error) {
        console.error("Error executing cron task:", error);
        res.status(500).json({ error: "Cron task failed." });
    }
}
