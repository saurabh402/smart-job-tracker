const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true
        },
        company: {
            type: String,
            required: [true, "Company name is required"],
            trim: true
        },
        role: {
            type: String,
            required: [true, "Job role is required"],
            trim: true
        },
        location: {
            type: String,
            default: "",
            trim: true
        },
        jobType: {
            type: String,
            default: "Full Time"
        },
        status: {
            type: String,
            enum: ["Applied", "Interview", "Selected", "Rejected", "On Hold"],
            default: "Applied"
        },
        salary: {
            type: String,
            default: "",
            trim: true
        },
        appliedDate: {
            type: String,
            default: () => new Date().toISOString().split("T")[0]
        },
        jobUrl: {
            type: String,
            default: "",
            trim: true
        },
        notes: {
            type: String,
            default: "",
            trim: true
        },
        interviewDate: {
            type: String,
            default: ""
        },
        interviewTime: {
            type: String,
            default: ""
        },
        interviewRound: {
            type: String,
            default: "",
            trim: true
        },
        interviewMode: {
            type: String,
            default: "",
            trim: true
        },
        interviewer: {
            type: String,
            default: "",
            trim: true
        },
        interviewNotes: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Application", applicationSchema);