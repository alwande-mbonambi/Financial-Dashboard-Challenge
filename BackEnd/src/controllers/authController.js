const authService = require('../services/authService');
const { ApiError } = require('../utils/ApiError');

const authController = {
  async register(req, res,next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ApiError(400, 'Email and password are required.', 'VALIDATION_ERROR');
      }
      

      const user = await authService.register(email, password);
      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ApiError(400, 'Email and password are required.', 'VALIDATION_ERROR');
      }
      

      const data = await authService.login(email, password);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
   }
    
  },
};

module.exports = authController;