import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique: true,
        lowercase: true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique: true,
        lowercase: true,
        trim:true,
    },
    fullName:{
        type:String,
        required:true,
        trim:true,
        index:true
    },
    phone:{
        type:String,
        required:true,
        unique: true,
        trim:true,
        index:true
    },
    password:{
        type:String,
        required:[true, 'Password is required!']
    },
    profilePicture:{
        type: String,   
    },
    wardrobe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DigitalWardrobe'
    },
    userBodyInfo : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserBodyInfo'
    },
    savedImages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SavedImage'
    }],
    events:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    }],
    refreshToken:{
        type:String
    }
},{timestamps:true})

userSchema.pre("save", async function (next) {          // pre is a mongoose hook
    if(!this.isModified("password")) return next();     // only if password field is modified then only pass to next

    this.password = await bcrypt.hash(this.password, 10)
    next()
})


userSchema.methods.isPasswordCorrect = async function(password){        // custom method from mongoose
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function() {
    return  jwt.sign(             // jwt is a bearer token(like a chabhi, whoever bears it, we return data to them)
            {                               //----\
            _id:this._id,                   //----\
            email:this.email,               //------>   payload (can't use arrow function since are using this)
            username:this.username,         //----/
            fullName:this.fullName          //----/
        },
        process.env.JWT_ACCESS_SECRET,
        {
            expiresIn:process.env.JWT_ACCESS_EXPIRES_IN
        }   
    )
}
// user is validated based on its access token(short lived)


userSchema.methods.generateRefreshToken = function() {
    return  jwt.sign(
        {
            _id:this._id,
        },
        process.env.JWT_REFRESH_SECRET, 
        {
            expiresIn:process.env.JWT_REFRESH_EXPIRES_IN
        }

    )
}
// refresh token is saved on database as well as sent to user. when access token is expired we match tuhe refresh token from databse and user and keep him/her authenticated(they dont have to put their password all the time)


export const User = mongoose.model('User', userSchema)