import jwt from 'jsonwebtoken';
import config from 'config'; // For accessing jwtSecret

/**
 * Authentication middleware to verify JWT.
 * If token is valid, attaches user payload to req.user.
 * Otherwise, sends a 401 response.
 */
const authMiddleware = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const jwtSecret = config.get('jwtSecret');
    if (!jwtSecret) {
      console.error('FATAL ERROR: jwtSecret is not defined in config.');
      return res.status(500).send('Server configuration error.');
    }
    const decoded = jwt.verify(token, jwtSecret); // Decoded can be JwtPayload or your custom type
    
    // Check if token payload is flat (e.g., { id: '...', role: '...' })
    // OR nested (e.g., { user: { id: '...', role: '...' } })
    // Adjust based on how tokens are signed in usersController.js
    
    let userPayload;
    if (decoded.user && typeof decoded.user === 'object' && decoded.user.id) {
      // Nested: { user: { id: '...', ... } }
      userPayload = decoded.user;
    } else if (decoded.id) {
      // Flat: { id: '...', role: '...' }
      // Construct a user object for req.user consistent with what controllers expect
      userPayload = { id: decoded.id, role: decoded.role, /* other direct claims */ };
    }

    if (!userPayload || !userPayload.id) {
        console.error('Token payload is missing user ID after attempting to normalize.');
        return res.status(401).json({ msg: 'Token is not valid (malformed payload or missing ID)' });
    }

    req.user = userPayload; // Attach user object to request
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export default authMiddleware;