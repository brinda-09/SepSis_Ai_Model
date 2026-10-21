# GitHub sign-in setup

GitHub sign-in uses the backend OAuth flow. Keep the GitHub client secret on the
backend; never put it in frontend code or commit it to the repository.

1. Create a GitHub OAuth App under **Settings → Developer settings → OAuth Apps**.
2. Set its Authorization callback URL to:
   `http://127.0.0.1:8000/api/auth/github/callback`
3. Set these environment variables before starting the FastAPI backend:

   ```powershell
   $env:GITHUB_CLIENT_ID = "your-client-id"
   $env:GITHUB_CLIENT_SECRET = "your-client-secret"
   $env:GITHUB_CALLBACK_URL = "http://127.0.0.1:8000/api/auth/github/callback"
   $env:GITHUB_FRONTEND_URL = "http://localhost:5173"
   ```

   `GITHUB_CALLBACK_URL` and `GITHUB_FRONTEND_URL` default to the values above.
   If Vite is running on another port, set `GITHUB_FRONTEND_URL` to that origin.
4. Start the backend and frontend, then choose **Continue with GitHub** on the
   sign-in page.

GitHub accounts receive the standard Doctor application role. Administrator
access is never granted based on a GitHub profile.
