const mongoose = require("mongoose");
const fs = require("fs");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/myDB";

mongoose.connect(MONGO_URI /*, { useNewUrlParser: true, useUnifiedTopology: true } */);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async () => {
    console.log("Connected to MongoDB");

    //schema definition for diagnosis
    //strict: false because we want to read all fields even if they are not defined in the schema
    const blogSchema = new mongoose.Schema({
        title: { type: String },
        excerpt: { type: String },
        publishedAt: { type: Date },
        views: { type: Number }
    }, { strict: false });


    const Blog = mongoose.model("Blog", blogSchema);


    try {
        const docs = await Blog.find({}).lean();
        const report = [];

        docs.forEach(doc => {
            const issues = [];
            const fixAction = { $set: {}, $unset: {} };

            // here I check all the required fields
            if (!doc.title) {
                issues.push("title missing");
                fixAction.$set.title = "Untitled Post";
            } else if (typeof doc.title !== "string") {
                issues.push("title wrong type");
                fixAction.$set.title = String(doc.title);
            }

            //views and publishedAt might not necessarily be present in the new documents, but if present it should be of correct type
            if (doc.views != null && isNaN(Number(doc.views))) {
                issues.push("views is not a valid number");
                fixAction.$set.views = 0;
            } else if (doc.views != null && typeof doc.views !== "number") {
                issues.push("views wrong type");
                // Convert string numbers to actual numbers
                fixAction.$set.views = Number(doc.views);
            }

            if (doc.publishedAt != null && !(doc.publishedAt instanceof Date)) {
                const dateVal = new Date(doc.publishedAt);

                if (isNaN(dateVal.getTime())) {
                    issues.push("publishedAt is invalid date");
                    // Fallback to now
                    fixAction.$set.publishedAt = new Date();
                } else {
                    issues.push("publishedAt wrong type (string instead of Date)");
                    fixAction.$set.publishedAt = dateVal;
                }
            }

            if (issues.length > 0) {
                report.push({
                    _id: doc._id,
                    issues,
                    suggestedFix: fixAction,
                    currentData: doc
                });
            }
        });

        //Save report
        fs.writeFileSync("schema_report.json", JSON.stringify(report, null, 2));
        console.log(`Report generated: ${report.length} problematic documents found`);

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
});