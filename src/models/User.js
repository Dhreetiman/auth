const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullname: {
        type: String,
        requied: true,
        trim: true
    },
    mobileNumber: {
        type: String,
        required: true,
        unique: true
    },
    gender: {
        type: String,
        required: true,
        enum : ["Male","Female","Other"]
    },
    graduationDegree: {
        type: String,
        required: true,
        trim: true
    },
    bio: {
        type: String,
        required: true,
        trim: true
    }

}, { timestamps: true })


module.exports = mongoose.model("User", userSchema);