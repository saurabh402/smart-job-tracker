const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const Application = require("./models/Application");
const User = require("./models/User");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "smart_job_tracker_fallback_secret_key";

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart_job_tracker";
mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("✅ MongoDB connected successfully:", MONGODB_URI);
    })
    .catch((error) => {
        console.error("❌ MongoDB connection error:", error.message);
    });

// Optional / Permissive Auth Middleware (supports both authenticated user and guest mode)
const authenticateOptional = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        } catch {
            // Invalid token, proceed as unauthenticated
            req.user = null;
        }
    }
    next();
};

// Required Auth Middleware
const authenticateRequired = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization token required" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

/* ========================================================
   AUTH API ROUTES
   ======================================================== */

// Register new user
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please provide name, email, and password." });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        const user = new User({
            name: name.trim(),
            email: normalizedEmail,
            password
        });
        await user.save();

        const token = jwt.sign(
            { id: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ message: "Failed to register user", error: error.message });
    }
});

// Login existing user
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide both email and password." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Failed to log in", error: error.message });
    }
});

// Current user profile
app.get("/api/auth/me", authenticateRequired, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch user profile", error: error.message });
    }
});

/* ========================================================
   APPLICATIONS API ROUTES (Full CRUD)
   ======================================================== */

// Get applications (scoped to logged in user if token provided, or all/shared if guest)
app.get("/api/applications", authenticateOptional, async (req, res) => {
    try {
        const filter = req.user ? { user: req.user.id } : {};
        const applications = await Application.find(filter).sort({ createdAt: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch applications",
            error: error.message
        });
    }
});

// Get single application
app.get("/api/applications/:id", authenticateOptional, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }
        res.json(application);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch application",
            error: error.message
        });
    }
});

// Create new application
app.post("/api/applications", authenticateOptional, async (req, res) => {
    try {
        const {
            company,
            role,
            location,
            jobType,
            status,
            salary,
            appliedDate,
            jobUrl,
            notes,
            interviewDate,
            interviewTime,
            interviewRound,
            interviewMode,
            interviewer,
            interviewNotes
        } = req.body;

        if (!company || !role) {
            return res.status(400).json({ message: "Company and Role are required." });
        }

        const application = new Application({
            user: req.user ? req.user.id : null,
            company: company.trim(),
            role: role.trim(),
            location: location ? location.trim() : "",
            jobType: jobType || "Full Time",
            status: status || "Applied",
            salary: salary ? salary.trim() : "",
            appliedDate: appliedDate || new Date().toISOString().split("T")[0],
            jobUrl: jobUrl ? jobUrl.trim() : "",
            notes: notes ? notes.trim() : "",
            interviewDate: interviewDate || "",
            interviewTime: interviewTime || "",
            interviewRound: interviewRound ? interviewRound.trim() : "",
            interviewMode: interviewMode ? interviewMode.trim() : "",
            interviewer: interviewer ? interviewer.trim() : "",
            interviewNotes: interviewNotes ? interviewNotes.trim() : ""
        });

        const savedApplication = await application.save();
        res.status(201).json(savedApplication);
    } catch (error) {
        res.status(500).json({
            message: "Failed to save application",
            error: error.message
        });
    }
});

// Update application
app.put("/api/applications/:id", authenticateOptional, async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        if (req.user) {
            // Ensure user owns this application or application is unassigned
            filter.$or = [{ user: req.user.id }, { user: null }];
        }

        const updateData = { ...req.body };
        // Delete immutable _id from update body
        delete updateData._id;

        const updatedApplication = await Application.findOneAndUpdate(
            filter,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedApplication) {
            return res.status(404).json({ message: "Application not found or unauthorized to edit" });
        }

        res.json(updatedApplication);
    } catch (error) {
        res.status(500).json({
            message: "Failed to update application",
            error: error.message
        });
    }
});

// Delete application
app.delete("/api/applications/:id", authenticateOptional, async (req, res) => {
    try {
        const filter = { _id: req.params.id };
        if (req.user) {
            filter.$or = [{ user: req.user.id }, { user: null }];
        }

        const deleted = await Application.findOneAndDelete(filter);
        if (!deleted) {
            return res.status(404).json({ message: "Application not found or unauthorized to delete" });
        }

        res.json({
            message: "Application deleted successfully",
            id: req.params.id
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete application",
            error: error.message
        });
    }
});

/* ========================================================
   FRONTEND ROUTE FALLBACKS
   ======================================================== */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Catch-all 404 for API
app.use("/api", (req, res) => {
    res.status(404).json({ message: "API endpoint not found" });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Smart Job Tracker server running at http://localhost:${PORT}`);
});