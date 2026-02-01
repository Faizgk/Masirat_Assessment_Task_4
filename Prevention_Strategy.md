# Masirat_Assessment_Task_4

**PREVENTION STRATEGY**

1. Schema Validation at the Database Level
   we can enforce MongoDB JSON Schema Validation at the database level. This acts as a final firewall, rejecting any insert or update that doesn't meet our requirements.
   Benefit: Prevents dirty data from entering the DB via manual scripts or bypasses.

2. Defensive Code
   instead of Backend assuming the data is perfect, we add a defense code to check if the data is in the required format. save only if it is.
   Mongoose Schema Defaults: Define default values in the schema so that when retrieving old documents, Mongoose automatically populates missing fields with a fallback value before the data reaches the application logic

3. The "Two-Phase" Rollout (Expand & Contract)
   To avoid the "missing field" errors, we follow the below sequence:

- Phase 1 (Expand): Add the new field to the schema as optional and deploy the code that can handle both the old and new formats.
- Phase 2 (Migrate): Run a background script to populate the new field for all old records.
- Phase 3 (Contract): Once all records are updated, mark the field as required in the schema and remove the "old format" handling logic

4. Validation Middleware
   Use a library like Joi or Zod as middleware for every incoming request.
   The Layer sits between the Route and the Controller and validates the req.body structure. If a user tries to send an incorrect data type, the middleware rejects it with a 400 Bad Request.
