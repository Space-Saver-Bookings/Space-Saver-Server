const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: false,
        unique: false,
    },
    last_name: {
        type: String,
        required: false,
        unique: false,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        unique: false,
    },
    post_code: {
        type: String,
        required: false,
        unique: false,
    },
    country: {
        type: String,
        required: false,
        unique: false,
    },
    position: {
        type: String,
        required: false,
        unique: false,
    },
});

// Use instance.save() when modifying a user's password
// to trigger this pre-hook
UserSchema.pre("save", async function (next) {
    const user = this;
    // If password wasn't changed to plaintext, skip to next function.
    if (!user.isModified("password")) return next();
    // If password was changed, assume it was changed to plaintext and hash it.
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    next();
});

// Exclude password from JSON responses
UserSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        return ret;
    }
});

const User = mongoose.model("User", UserSchema);

module.exports = { User };
