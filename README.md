# Aispeak User Progress Tracking API

This API allows Aispeak to track each user’s English learning progress. It provides endpoints to create, update, and retrieve user progress records.

## Features

*   Create, Read, and Update user progress.
*   Secure endpoints using JWT authentication (via Supabase Auth).
*   Users can only access and modify their own progress data.

## Technology Stack

*   Node.js
*   TypeScript
*   Express.js
*   PostgreSQL (via Supabase)
*   Supabase for database and authentication

## Prerequisites

*   Node.js (v16 or newer recommended)
*   npm (comes with Node.js)
*   A Supabase account and project.

## Setup and Installation

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <your-repository-url>
    cd aispeak-progress-api
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add your Supabase credentials and desired port:
    ```env
    PORT=3001
    SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
    SUPABASE_SERVICE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
    ```
    Replace `YOUR_SUPABASE_PROJECT_URL` and `YOUR_SUPABASE_SERVICE_ROLE_KEY` with your actual Supabase project URL and service role key.

4.  **Set up the Supabase Database:**
    *   The required `user_progress` table schema, along with the `moddatetime` trigger function for automatically updating `updated_at` timestamps, can be found in `database/schema.sql`. You can run this SQL in your Supabase SQL Editor to set up the table.
    *   Ensure you have users in your Supabase `auth.users` table. These users will be used to obtain JWTs for testing authenticated endpoints.

5.  **Enable Vector Support (for Similarity Search - Optional Bonus):**
    If you plan to use the similarity search feature (`/progress/similar/:userId`), you need to enable the `pgvector` extension and prepare your table. Run the following in your Supabase SQL Editor:
    ```sql
    -- 1. Enable the vector extension
    CREATE EXTENSION IF NOT EXISTS vector;

    -- 2. Add an embedding column to your user_progress table (example uses 3 dimensions for simulated embeddings)
    ALTER TABLE user_progress ADD COLUMN activity_embedding vector(3);

    -- 3. Create an index for efficient similarity searches (example uses L2 distance)
    CREATE INDEX ON user_progress USING ivfflat (activity_embedding vector_l2_ops) WITH (lists = 10);

    -- 4. Create the SQL function for matching (see full function definition in development notes or controller comments)
    CREATE OR REPLACE FUNCTION match_user_progress (
      query_embedding vector(3),
      match_threshold float,
      match_count int,
      exclude_user_id uuid
    )
    RETURNS TABLE (
      user_id uuid,
      current_level int,
      total_xp int,
      similarity float
    )
    LANGUAGE sql STABLE PARALLEL SAFE
    AS $$
      SELECT
        up.user_id,
        up.current_level,
        up.total_xp,
        up.activity_embedding <-> query_embedding AS similarity
      FROM
        user_progress AS up
      WHERE
        up.user_id != exclude_user_id AND up.activity_embedding IS NOT NULL
      ORDER BY
        similarity ASC
      LIMIT
        match_count;
    $$;
    ```


## Running the API

*   **Development mode (with auto-reloading):**
    ```bash
    npm run dev
    ```
    The API will typically be available at `http://localhost:3001` (or the port specified in your `.env` file).

*   **Build for production:**
    ```bash
    npm run build
    ```

*   **Run in production mode (after building):**
    ```bash
    npm run start
    ```

## Testing the API

You can use tools like Postman, Insomnia, or cURL to test the API endpoints.

**Authentication:**
Protected endpoints require a JWT Bearer token in the `Authorization` header. This token should be obtained from your Supabase authentication flow (e.g., after a user logs in via the mobile app).
For development and testing, you can use the `scripts/get-jwt.ts` script to obtain a token for a test user.
Make sure to configure the script with your Supabase URL, Anon Key, and test user credentials (see comments within the script).
**Example:** `Authorization: Bearer YOUR_SUPABASE_JWT`

### API Endpoints

All endpoints are prefixed with `/progress`.

*   **`POST /progress`**
    *   Description: Creates a new progress record for the authenticated user.
    *   Auth: Required.
*   **`GET /progress/`**
    *   Description: Retrieves the progress record for the authenticated user.
    *   Auth: Required. User can only retrieve their own progress.
*   **`PUT /progress/`**
    *   Description: Updates the progress record for the authenticated user.
    *   Auth: Required. User can only update their own progress.
    *   Body: `{ "level_xp": 50, "total_xp": 150, ... }` (fields from `UpdateUserProgressPayload`)
*   **`GET /progress/leaderboard`**
    *   Description: Retrieves a paginated list of users ordered by total experience points.
    *   Auth: Required.
    *   Query Parameters (Optional):
        *   `page` (number, default: 1): The page number for pagination.
        *   `limit` (number, default: 10, max: 100): The number of items per page.
*   **`GET /progress/similar/`**
    *   Description: Finds users with activity patterns similar to the authenticated user, based on simulated vector embeddings. Requires `pgvector` setup.
    *   Auth: Required.

---