const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    mongoose.set("strictPopulate", false);
    await mongoose.connect('mongodb+srv://Lucifer:lucifer123@hyp.cmbnemy.mongodb.net/userauth?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      
    });

    console.log("MongoDB Connected");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
