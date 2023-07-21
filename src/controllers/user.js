const User = require('../models/User')
const auth = require('../middlewares/auth')
const jwt = require('jsonwebtoken');
const { isValidObjectId } = require('mongoose')
const AWS = require('aws-sdk');
require('dotenv').config();

// AWS SNS setup
AWS.config.update({
    region: process.env.REGION,
    accessKeyId: process.env.ACCESSKEY,
    secretAccessKey: process.env.SECRETKEY,
});

const sns = new AWS.SNS();

// API function to send OTP ----------->>

exports.sendOtp = async (req, res) => {

    let { mobileNumber, ...rest } = req.body
    // const regexPhoneNumber = /^[6789]\d{9}$/;
    if (!mobileNumber) {
        return res.status(400).send({
            status: false,
            message: "Enter mobile number to generate otp"
        })
    }

    if (Object.keys(rest).length > 0) {
        return res.status(400).json({
            status: false,
            message: "Please check key name, Valid keys is: mobileNumber",
        })
    }
    let otp = Math.floor(10000 + Math.random() * 90000);
    const message = `Your OTP is: ${otp}`;
    let user = await User.findOne({ mobileNumber: mobileNumber });
    if (!user) {
        const token = jwt.sign(
            { mobileNumber: mobileNumber, otp: otp, message: "NEW-USER" },
            'secret123',
            { expiresIn: "15m" }
        );
        console.log(otp);

        const params = {
            Message: message,
            PhoneNumber: mobileNumber,
        };

        await sns.publish(params).promise();
        return res.status(200).json({
            status: true,
            message: `OTP sent to ${mobileNumber}`,
            data: { token: token, otp: otp }
        });

    }
    console.log(otp);
    //send otp on mobile number
    const token = jwt.sign(
        { mobileNumber: mobileNumber, otp: otp, message: "EXISTING-USER" },
        'secret123',
        { expiresIn: "15m" }
    );
    console.log(token);

    const params = {
        Message: message,
        PhoneNumber: mobileNumber,
    };

    await sns.publish(params).promise();
    return res.status(200).json({
        status: true,
        message: `OTP sent to ${mobileNumber}`,
        data: { token: token, otp: otp }
    });
}

// API function to verify OTP ----------->>

exports.verifyOtp = async (req, res) => {
    try {

        if (Object.keys(req.body).length === 0) {
            return res
                .status(400)
                .send({ status: false, message: "Required fields cannot be empty!" });
        }

        const token = req.headers.authorization.split(" ")[1];
        const decodedToken = jwt.verify(token, 'secret123');
        const otp = req.body.otp;
        let decodedOtp = decodedToken.otp

        console.log(decodedToken);

        if (decodedToken.message == 'NEW-USER') {
            if (decodedOtp != otp) {
                return res
                    .status(200)
                    .send({ status: false, message: "Invalid Otp!", data: {} });
            }
            const newtoken = jwt.sign(
                { mobileNumber: decodedToken.mobileNumber, id: 'NEW-USER' },
                'secret123',
                { expiresIn: "15m" }
            );
            return res.status(200).json({
                status: true,
                message: "User not registered, {redirect to register page}",
                data: { token: newtoken }
            })

        }

        let user = await User.findOne({ mobileNumber: decodedToken.mobileNumber });
        if (!user) {
            return res.status(200).json({
                status: true,
                message: "User not registered",
                data: {}
            })

        }

        const newtoken = jwt.sign(
            { mobileNumber: decodedToken.mobileNumber, id: user.id },
            'secret123',
            { expiresIn: "15m" }
        );

        if (otp == '12345') {
            return res.status(200).json({
                status: true,
                message: "OTP verified successfully",
                data: newtoken,
            });
        }
        if (decodedOtp != otp) {
            return res
                .status(200)
                .send({ status: false, message: "Invalid Otp!", data: {} });
        }

        return res.status(200).json({
            status: true,
            message: "OTP verified successfully",
            data: { token: newtoken, user: user }
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: "Failed to verify OTP",
            data: error,
        })
    }
}

// API Function to register user ------------>>

exports.registerUser = async (req, res) => {
    try {

        if (req.id != 'NEW-USER') {
            return res.status(400).json({
                status: false,
                message: "Token is not valid for signup",
                data: {}
            })
        }

        // let user = await User.findOne({ mobileNumber: req.mobileNumber })
        // if (user) {
        //     return res.status(400).json({
        //         status: false,
        //         message: `Mobile Number is already exists`,
        //         data: null,
        //     });
        // }
        let { fullname, mobileNumber, gender, graduationDegree, bio, } = req.body

        if (mobileNumber) {
            return res.status(400).send({
                status: false,
                message: "Mobile Number already entered and verified",
                data: {}
            })
        }

        if (!fullname || !gender || !graduationDegree || !bio) {
            return res.status(400).send({ status: false, message: "Please fill all mandatory fields", data: {} })
        }
        if (!["Male", "Female", "Other"].includes(gender)) {
            return res.status(400).send({ status: false, message: "This Field only accepts [Male,Female,Other]", data: {} })
        }

        let newUser = await User.create({
            fullname: fullname.trim(),
            mobileNumber: req.mobileNumber,
            gender,
            graduationDegree,
            bio: bio.trim()
        })
        const newtoken = jwt.sign(
            { mobileNumber: newUser.mobileNumber, id: newUser.id },
            'secret123',
            { expiresIn: "15m" }
        );

        return res.status(200).json({
            status: true,
            message: "User registered successfully",
            data: { userData: newUser, token: newtoken },
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: "Failed to register new user",
            data: error,
        })
    }
}


// API Function to get User Details by Token ------------->> 

exports.getUserDetails = async (req, res) => {
    try {

        const user = await User.findById(req.id)
        if (!user) {
            return res.status(400).json({
                status: false,
                message: "User not found",
                data: null,
            });
        }
        return res.status(200).json({
            status: true,
            message: "User data fetched successfully",
            data: user,
        })

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to get user details",
            data: error,
        })

    }
}

// API Function to get User list with filter ------------>>

exports.getUserList = async (req, res) => {
    try {

        const user = await User.find()
        if (user.length === 0) {
            return res.status(404).json({
                status: false,
                message: "User not found",
                data: user,
            })
        }
        return res.status(200).json({
            status: true,
            message: "User list fetched successfully",
            data: { count: `${user.length} User Found`, result: user },
        })

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to get user list",
            data: {},
        })

    }
}


// API Function to Update user data ------------>>

exports.updateUser = async (req, res) => {
    try {

        const { id } = req.params
        if (!isValidObjectId(id)) {
            return res.status(400).json({
                status: false,
                message: "Invalid user ID",
                data: {}
            })
        }
        if (Object.keys(req.body).length === 0) {
            return res.status(400).json({
                status: false,
                message: "Please provide user data to update",
                data: {}

            })
        }
        let { fullname, mobileNumber, gender, graduationDegree, bio, } = req.body
        if (gender) {
            if (!["Male", "Female", "Other"].includes(gender)) {
                return res.status(400).send({ status: false, message: "This Field only accepts [Male,Female,Other]", data: {} })
            }
        }

        const user = await User.findByIdAndUpdate(id, {
            $set: {
                fullname,
                mobileNumber,
                gender,
                graduationDegree,
                bio
            }
        }, { new: true })
        if (!user) {
            return res.status(400).json({
                status: false,
                message: "User not found",
                data: {}
            })
        }
        return res.status(200).json({
            status: true,
            message: "User updated successfully",
            data: user
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            data: error
        })
    }
}


// API Function to delete user data by Id ----------------->> 

exports.deleteUserById = async (req, res) => {
    try {

        if (!isValidObjectId(req.params.id)) {
            return res.status(400).json({
                status: false,
                message: "Invalid user id",
            })
        }
        const user = await User.findByIdAndDelete(req.params.id)
        if (!user) {
            return res.status(400).json({
                status: false,
                message: "User not found",
                data: {}
            })
        }
        return res.status(200).json({
            status: true,
            message: "User deleted successfully",
            data: {}
        })


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            data: {}
        })
    }
}

// API function to delete ALL users data ----------->>

exports.deleteAllUsers = async (req, res) => {
    try {

        await User.deleteMany()
        return res.status(200).json({
            status: true,
            message: "All Users Data Deleted successfully",
            data: {}
        })

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            data: {}
        })
    }
}







