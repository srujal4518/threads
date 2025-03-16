// ✅ Import Required Modules
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const bcrypt = require("bcrypt");
const MongoStore = require("connect-mongo");
require("dotenv").config(); // ✅ Load environment variables

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Construct MongoDB Connection URI Dynamically
const MONGO_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

// ✅ MongoDB Connection
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Atlas Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ Session Configuration (Stored in MongoDB)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: MONGO_URI }), // Persistent session store
    cookie: { secure: false, httpOnly: true } // Improve security
}));

// ✅ Serve Static Files Correctly
app.use(express.static(__dirname));

// ✅ Define Schemas & Models
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    address: String,
    user_type: String
});
const User = mongoose.model("User", userSchema);

const messageSchema = new mongoose.Schema({
    name: String,
    email: String,
    subject: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model("Message", messageSchema);

const checkoutSchema = new mongoose.Schema({
    name: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
    payment: String
});
const Checkout = mongoose.model("Checkout", checkoutSchema);

const reviewSchema = new mongoose.Schema({
    rating: { type: Number, required: true },
    review: { type: String, required: true }
});
const Review = mongoose.model("Review", reviewSchema);

// ✅ Routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "final.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "form.html")));
app.get("/hello", (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Please login first!" });
    }
    res.sendFile(path.join(__dirname, "hello.html"));
});

// ✅ Handle Registration
app.post("/register", async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered!" });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            phone: req.body.phone,
            address: req.body.address,
            user_type: req.body.user_type
        });

        await newUser.save();
        res.status(201).json({ message: "Registration successful!", redirectUrl: "/index.html" });
    } catch (err) {
        res.status(500).json({ message: "Error registering user.", error: err.message });
    }
});

// ✅ Handle Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Please register first!" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid password!" });
        }

        req.session.user = { name: user.name, email: user.email, user_type: user.user_type };
        res.status(200).json({ message: "Login successful!", redirectUrl: "/index.html" });
    } catch (err) {
        res.status(500).json({ message: "Error logging in.", error: err.message });
    }
});

// ✅ Handle Profile Data Fetching
app.get("/profile", async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Please log in first!" });
    }

    try {
        const user = await User.findOne({ email: req.session.user.email }).select("-password"); // Exclude password
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user data", error: error.message });
    }
});

// ✅ Handle Logout
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: "Error logging out" });
        }
        res.json({ message: "Logged out successfully!", redirectUrl: "/" });
    });
});

// ✅ Handle Contact Form Submission
app.post("/api/messages", async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        const newMessage = new Message({ name, email, subject, message });
        await newMessage.save();
        res.json({ message: "Message sent successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error sending message", error: error.message });
    }
});

// ✅ Handle Checkout Form Submission
app.post("/submit-checkout", async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "No data received" });
        }

        const newOrder = new Checkout(req.body);
        await newOrder.save();
        res.redirect("/success.html");
    } catch (error) {
        res.status(500).json({ message: "Error processing checkout", error: error.message });
    }
});

// ✅ Handle Review Submission
app.post("/reviews", async (req, res) => {
    try {
        const { rating, review } = req.body;
        const newReview = new Review({ rating, review });
        await newReview.save();
        res.status(201).json({ message: "Review saved successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error saving review", error: error.message });
    }
});

// ✅ Fetch All Reviews
app.get("/reviews", async (req, res) => {
    try {
        const reviews = await Review.find();
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Error fetching reviews", error: error.message });
    }
});

// ✅ Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
