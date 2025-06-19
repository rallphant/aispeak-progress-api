// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../supabaseClient';

/**
 * Extends the base Express `Request` interface to include an optional `user` object.
 * This `user` object will be populated by the `protect` middleware upon successful
 * JWT authentication, making user information (like their ID) available to
 * subsequent route handlers.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    // You can extend this with other user properties from the JWT if needed,
    // for example:
    // email?: string;
    // role?: string;
  }
}

/**
 * Express middleware function to protect routes by verifying a JWT.
 * It expects the JWT to be provided in the `Authorization` header with the "Bearer" scheme.
 * 
 * If the token is valid:
 *  - It extracts user information (specifically the user ID) from the token.
 *  - It attaches this user information to `req.user`.
 *  - It calls `next()` to pass control to the next middleware or route handler.
 * 
 * If the token is missing, malformed, or invalid:
 *  - It sends a 401 Unauthorized response and does not call `next()`.
 * 
 * @param req - The Express request object, cast to `AuthenticatedRequest` to allow `req.user` assignment.
 * @param res - The Express response object.
 * @param next - The Express next middleware function.
 */
export const protect = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Not authorized, no token or malformed token' });
    return;
  }

  // Extract the token part from "Bearer <token>"
  const token = authHeader.split(' ')[1];

  // Check if the token itself is present after "Bearer "
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided after Bearer' });
    return;
  }

  try {
    // Use Supabase's `auth.getUser()` method to validate the token.
    // This method sends the token to the Supabase auth server for verification.
    const { data, error } = await supabase.auth.getUser(token);

    // If there's an error during verification or if no user is associated with the token
    if (error || !data.user) {
      console.error('Token verification error:', error?.message || 'User not found for token');
      res.status(401).json({ message: 'Not authorized, token failed verification' });
      return;
    }

    // If the token is valid, attach the user's ID to the `req.user` object.
    // This makes the authenticated user's ID accessible in subsequent route handlers.
    req.user = {
        id: data.user.id,
    };
    next(); // Token is valid, proceed to the next middleware or the route handler.
  } catch (err) {
    // Catch any unexpected errors during the token processing.
    console.error('Error in auth middleware:', err);
    res.status(401).json({ message: 'Not authorized, token processing error' });
  }
};
