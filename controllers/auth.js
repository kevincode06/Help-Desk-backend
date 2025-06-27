const User = require('../models/User');
const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/ErrorResponse'); 


// Register user 
exports.register = async (req, res, next) => {
    const { name, email, password, role} = req.body;

    try {
        // create user 
        const user = await User.create({
            name,
            email,
            password,
            role,
        });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

// login user

exports.login = async (req, res, next) => {
    const { email, password } = req.body;


    // Validate email & password 
    if (!email || !password) {
        return res.status(400).json({
            success: false, 
            message: 'Please enter an email and password',
        });
    }

    try {
        // check for user 
        const user = await User.findOne({ email }).select('+password role name email');

        if(!user) {
            return res.status(400).json({
                success: false, 
                message: 'Invalid credentials',
            });
        }

        // debug logs

        console.log('=== BACKEND DEBUG ===');
        console.log('User found:', user);
        console.log('User role:', user.role);
        console.log('User name:', user.name);
        console.log('User email:', user.email);
        console.log('Raw user object:', user.toObject());
        console.log('====================');

        // check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({
                success: false, 
                message: 'Invalid credentials',
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

// get logged in user

exports.getMe = async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        data: user,
    });
};


// get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res)  => {
    // Create token 
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,  //Calculate cookie expiration time in milliseconds by adding JWT_COOKIE_EXPIRE days to the current time
        ),
        httpOnly: true,
    };

    if ( process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
};